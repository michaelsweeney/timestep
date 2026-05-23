import fs from 'fs';
import type { Engine } from './types';

// Type-only reference; the runtime module is injected by the caller.
// sqlite3 lives in app/node_modules under the electron-react-boilerplate
// two-package-json pattern, so packages/core can't resolve it on its
// own at runtime (works in webpack-bundled prod, breaks in
// @babel/register-loaded dev).
type Sqlite3Module = typeof import('sqlite3');
type Database = InstanceType<Sqlite3Module['Database']>;

// Caches one read-only Database handle per file path so repeated queries
// against the same .sql don't reopen the file. Handles live for the
// process lifetime — fine for the current "open file, view it, quit"
// usage; revisit if/when we add a Close button.
export class Sqlite3Engine implements Engine {
  private dbs = new Map<string, Database>();

  constructor(private readonly sqlite3: Sqlite3Module) {}

  private getDb(file: string): Database {
    let db = this.dbs.get(file);
    if (!db) {
      db = new this.sqlite3.Database(file, this.sqlite3.OPEN_READONLY);
      this.dbs.set(file, db);
    }
    return db;
  }

  allRows(file: string, sql: string): Promise<unknown[]> {
    return new Promise((resolve, reject) => {
      this.getDb(file).all(sql, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  readText(path: string): Promise<string> {
    return fs.promises.readFile(path, 'utf8');
  }

  async fileExists(path: string): Promise<boolean> {
    try {
      await fs.promises.access(path);
      return true;
    } catch {
      return false;
    }
  }
}
