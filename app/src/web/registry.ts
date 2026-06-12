// Browser data layer for the web build. Holds the same role the Electron
// main process holds in the desktop app: it owns the loaded files and runs
// the SQL. The desktop app reaches a native sqlite3 over IPC; here every
// query runs against an in-tab SQLite compiled to WebAssembly (sql.js).
//
// Identity model: the renderer threads a *string* (a file "path") through
// every query and never inspects it as a real path, so in the browser that
// string is just the dropped File's name. Two maps keep the wiring:
//   files: name -> the dropped File (bytes read lazily)
//   dbs:   name -> the built sql.js Database
// A `.sql` is opened straight from its bytes; an `.eso` is parsed and
// materialized to a sql.js Database via the *same* core conversion logic the
// desktop build uses (esoToSqlite), driven through a node-sqlite3-shaped
// adapter below — so ESO-sourced and native-.sql files answer queries
// identically, exactly as on the desktop.

import initSqlJs, {
  type SqlJsStatic,
  type SqlJsDatabase
} from 'sql.js';
// Pair with the *browser* glue webpack resolves under target:web (the `.`
// export's `browser` condition -> sql-wasm-browser.js, whose locateFile
// default is sql-wasm-browser.wasm).
import wasmUrl from 'sql.js/dist/sql-wasm-browser.wasm';
import { parseEso } from '@timestep/core';
import { esoToSqlite } from '@timestep/core/eso-sqlite';

const files = new Map<string, File>();
const dbs = new Map<string, SqlJsDatabase>();

let sqlPromise: Promise<SqlJsStatic> | null = null;
function getSql(): Promise<SqlJsStatic> {
  if (!sqlPromise) sqlPromise = initSqlJs({ locateFile: () => wasmUrl });
  return sqlPromise;
}

// --- File registry (the "path" surface) ---------------------------------

export function registerFile(file: File): string {
  files.set(file.name, file);
  return file.name;
}

export function hasFile(key: string): boolean {
  return files.has(key);
}

export async function readFileText(key: string): Promise<string> {
  const f = files.get(key);
  if (!f) throw new Error(`file not registered: ${key}`);
  return f.text();
}

// --- node-sqlite3-shaped adapter over a synchronous sql.js Database -------
// Just enough surface for esoToSqlite to drive it: a Database with
// exec/prepare/close and statements with run/finalize. sql.js is
// synchronous, so each injected callback fires inline. The created Database
// is handed back through `sink` because esoToSqlite returns void (it writes
// to a "path") — we keep the live DB instead of a file.

function makeSqlite3Adapter(SQL: SqlJsStatic, sink: { db?: SqlJsDatabase }) {
  type Cb = (err: unknown) => void;

  class Stmt {
    constructor(private s: ReturnType<SqlJsDatabase['prepare']>) {}
    // insertAll calls run(row); insertReportData calls run(params, cb).
    run(params?: unknown[] | Cb, cb?: Cb) {
      const callback = typeof params === 'function' ? params : cb;
      const values = typeof params === 'function' ? undefined : params;
      try {
        this.s.run(values ?? []);
        callback && callback(null);
      } catch (e) {
        if (callback) callback(e);
        else throw e;
      }
    }
    finalize(cb?: Cb) {
      try {
        this.s.free();
        cb && cb(null);
      } catch (e) {
        if (cb) cb(e);
        else throw e;
      }
    }
  }

  class Database {
    db: SqlJsDatabase;
    constructor(_path: string) {
      this.db = new SQL.Database();
      sink.db = this.db;
    }
    // exec() runs multi-statement SQL (schema + BEGIN, COMMIT). sql.js's
    // exec handles multiple statements in one string; we ignore its result.
    exec(sql: string, cb?: Cb) {
      try {
        this.db.exec(sql);
        cb && cb(null);
      } catch (e) {
        if (cb) cb(e);
        else throw e;
      }
    }
    prepare(sql: string, cb?: Cb): Stmt | null {
      let s;
      try {
        s = this.db.prepare(sql);
      } catch (e) {
        if (cb) cb(e);
        return null;
      }
      cb && cb(null);
      return new Stmt(s);
    }
    // Keep the DB alive for queries — closing would free it.
    close(cb?: Cb) {
      cb && cb(null);
    }
  }

  // Shape matches the `typeof import('sqlite3')` esoToSqlite expects.
  return { Database } as unknown as typeof import('sqlite3');
}

// --- public engine surface ----------------------------------------------

// Parse a registered .eso and materialize it to an in-tab SQLite, returning
// the logical `.sql` key the renderer then treats like any native .sql. The
// key is derived from the .eso name so the sibling-.bnd lookup
// (`key.replace('.sql', '.bnd')`) still resolves a co-dropped .bnd.
export async function convertEso(key: string): Promise<string> {
  const file = files.get(key);
  if (!file) throw new Error(`eso file not registered: ${key}`);
  const SQL = await getSql();
  const esoText = await file.text();
  // Surface a parse error early with the same shape the renderer logs.
  parseEso(esoText); // throws on a malformed header before we build anything
  const sink: { db?: SqlJsDatabase } = {};
  await esoToSqlite(esoText, key, makeSqlite3Adapter(SQL, sink));
  if (!sink.db) throw new Error('eso conversion produced no database');
  const sqlKey = key.replace(/\.eso$/i, '.sql');
  dbs.set(sqlKey, sink.db);
  return sqlKey;
}

async function getDb(key: string): Promise<SqlJsDatabase> {
  const existing = dbs.get(key);
  if (existing) return existing;
  // Lazy-open a native .sql straight from the dropped File's bytes.
  const file = files.get(key);
  if (!file) throw new Error(`no database available for: ${key}`);
  const SQL = await getSql();
  const db = new SQL.Database(new Uint8Array(await file.arrayBuffer()));
  dbs.set(key, db);
  return db;
}

// Mirrors node-sqlite3 `.all()`: an array of column-keyed row objects.
export async function allRows(key: string, sql: string): Promise<unknown[]> {
  const db = await getDb(key);
  const stmt = db.prepare(sql);
  const rows: Record<string, unknown>[] = [];
  try {
    while (stmt.step()) rows.push(stmt.getAsObject());
  } finally {
    stmt.free();
  }
  return rows;
}
