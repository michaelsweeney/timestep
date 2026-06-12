// Materializes a parsed .eso into a SQLite database using the same schema
// EnergyPlus writes natively (the subset the query layer touches: Time,
// ReportDataDictionary, ReportData, Simulations), so every existing query
// works unchanged against ESO-sourced files.
//
// The sqlite3 module is *injected*, and the only runtime import here is the
// pure `parseEso` (the sqlite3 import below is type-only, erased at compile).
// So this module is environment-neutral at load time: the Node path injects
// node-sqlite3 (via the cached `convertEsoCached` wrapper, behind the
// `@timestep/core/eso-cache` subpath), and a browser build injects a
// sql.js-backed adapter against this same conversion logic.

import { parseEso, type ParsedEso } from './parseeso';

type Sqlite3Module = typeof import('sqlite3');
type Database = InstanceType<Sqlite3Module['Database']>;

const SCHEMA = `
CREATE TABLE Time (
  TimeIndex INTEGER PRIMARY KEY, Year INTEGER, Month INTEGER, Day INTEGER,
  Hour INTEGER, Minute INTEGER, Dst INTEGER, Interval INTEGER,
  IntervalType INTEGER, SimulationDays INTEGER, DayType TEXT,
  EnvironmentPeriodIndex INTEGER, WarmupFlag INTEGER);
CREATE TABLE ReportDataDictionary (
  ReportDataDictionaryIndex INTEGER PRIMARY KEY, IsMeter INTEGER, Type TEXT,
  IndexGroup TEXT, TimestepType TEXT, KeyValue TEXT, Name TEXT,
  ReportingFrequency TEXT, ScheduleName TEXT, Units TEXT);
CREATE TABLE ReportData (
  ReportDataIndex INTEGER PRIMARY KEY, TimeIndex INTEGER,
  ReportDataDictionaryIndex INTEGER, Value REAL);
CREATE TABLE Simulations (
  SimulationIndex INTEGER PRIMARY KEY, EnergyPlusVersion TEXT,
  TimeStamp TEXT, NumTimestepsPerHour INTEGER, Completed INTEGER,
  CompletedSuccessfully INTEGER);
`;

function promisify(db: Database) {
  return {
    exec: (sql: string) =>
      new Promise<void>((resolve, reject) =>
        db.exec(sql, err => (err ? reject(err) : resolve()))
      ),
    close: () =>
      new Promise<void>((resolve, reject) =>
        db.close(err => (err ? reject(err) : resolve()))
      )
  };
}

function insertAll(
  db: Database,
  sql: string,
  rows: unknown[][]
): Promise<void> {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(sql, err => {
      if (err) return reject(err);
      for (const row of rows) stmt.run(row);
      stmt.finalize(ferr => (ferr ? reject(ferr) : resolve()));
    });
  });
}

// ReportData is the hot table (~8M rows for a large annual ESO). Multi-row
// inserts (333 rows × 3 columns stays under SQLite's 999-variable cap),
// awaited per chunk so node-sqlite3's call queue stays bounded instead of
// buffering millions of pending statement runs.
async function insertReportData(
  db: Database,
  data: import('./parseeso').EsoData
): Promise<void> {
  const ROWS_PER_CHUNK = 333;
  const prepare = (rows: number) =>
    new Promise<ReturnType<Database['prepare']>>((resolve, reject) => {
      const sql =
        'INSERT INTO ReportData (TimeIndex, ReportDataDictionaryIndex, Value) VALUES ' +
        Array(rows).fill('(?,?,?)').join(',');
      const stmt = db.prepare(sql, err => (err ? reject(err) : resolve(stmt)));
    });
  const runStmt = (stmt: ReturnType<Database['prepare']>, params: unknown[]) =>
    new Promise<void>((resolve, reject) =>
      stmt.run(params, err => (err ? reject(err) : resolve()))
    );
  const finalize = (stmt: ReturnType<Database['prepare']>) =>
    new Promise<void>((resolve, reject) =>
      stmt.finalize(err => (err ? reject(err) : resolve()))
    );

  const fullChunks = Math.floor(data.length / ROWS_PER_CHUNK);
  if (fullChunks > 0) {
    const stmt = await prepare(ROWS_PER_CHUNK);
    const params = new Array(ROWS_PER_CHUNK * 3);
    for (let c = 0; c < fullChunks; c++) {
      const base = c * ROWS_PER_CHUNK;
      for (let i = 0; i < ROWS_PER_CHUNK; i++) {
        params[i * 3] = data.timeIndexes[base + i];
        params[i * 3 + 1] = data.dictIds[base + i];
        params[i * 3 + 2] = data.values[base + i];
      }
      await runStmt(stmt, params);
    }
    await finalize(stmt);
  }

  const rest = data.length - fullChunks * ROWS_PER_CHUNK;
  if (rest > 0) {
    const stmt = await prepare(rest);
    const params = new Array(rest * 3);
    const base = fullChunks * ROWS_PER_CHUNK;
    for (let i = 0; i < rest; i++) {
      params[i * 3] = data.timeIndexes[base + i];
      params[i * 3 + 1] = data.dictIds[base + i];
      params[i * 3 + 2] = data.values[base + i];
    }
    await runStmt(stmt, params);
    await finalize(stmt);
  }
}

function simulationsRow(parsed: ParsedEso): unknown[] {
  // Header: "Program Version,EnergyPlus, Version X.Y.Z-hash, YMD=..."
  const header = parsed.version.replace(/^Program Version\s*,\s*/i, '');
  const ymd = header.match(/YMD=(.*)$/)?.[1]?.trim() ?? '';
  const timestepIntervals = parsed.time
    .filter(t => t.intervalType === -1)
    .map(t => t.interval);
  const minInterval = timestepIntervals.length
    ? Math.min(...timestepIntervals)
    : 60;
  return [1, header, ymd, Math.round(60 / minInterval), 1, 1];
}

export async function esoToSqlite(
  esoText: string,
  dbPath: string,
  sqlite3: Sqlite3Module
): Promise<void> {
  const parsed = parseEso(esoText);
  const db = new sqlite3.Database(dbPath);
  const { exec, close } = promisify(db);

  try {
    // Fresh build artifact: durability pragmas off for insert speed.
    await exec('PRAGMA journal_mode = OFF; PRAGMA synchronous = OFF;');
    await exec(`${SCHEMA}BEGIN;`);
    // IsMeter and KeyValue track the parsed entry so meters land as the native
    // E+ .sql writes them (IsMeter = 1, KeyValue = NULL); variables keep their
    // key. (Type/IndexGroup/TimestepType/ScheduleName aren't recoverable from
    // the .eso and stay empty — see DESIGN-variable-model.md F2.)
    await insertAll(
      db,
      'INSERT INTO ReportDataDictionary VALUES (?,?,?,?,?,?,?,?,?,?)',
      parsed.dictionary.map(d => [
        d.id, d.isMeter ? 1 : 0, '', '', '', d.keyValue, d.name,
        d.reportingFrequency, '', d.units
      ])
    );
    await insertAll(
      db,
      'INSERT INTO Time VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
      parsed.time.map(t => [
        t.timeIndex, t.year, t.month, t.day, t.hour, t.minute, t.dst,
        t.interval, t.intervalType, t.simulationDays, t.dayType,
        t.environmentPeriodIndex, t.warmupFlag
      ])
    );
    await insertReportData(db, parsed.data);
    await insertAll(db, 'INSERT INTO Simulations VALUES (?,?,?,?,?,?)', [
      simulationsRow(parsed)
    ]);
    await exec('COMMIT;');
  } finally {
    await close();
  }
}
