// An Engine abstracts the I/O that queries need: SQL execution against an
// EnergyPlus .sql output, and reading sibling text files (.bnd today; .eso
// in a later phase). Multiple impls plug in: Sqlite3Engine (main process,
// native sqlite3), an IPC-bridged engine on the renderer side, a sql.js
// engine for a future browser build.
export interface Engine {
  allRows(file: string, sql: string): Promise<unknown[]>;
  readText(path: string): Promise<string>;
}
