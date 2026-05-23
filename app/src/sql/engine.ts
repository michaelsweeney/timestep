import type { Engine } from '@timestep/core';

// Renderer-side Engine impl: delegates to the IPC bridge exposed by
// app/preload.js. The actual sqlite3 work happens in main (Sqlite3Engine).
export const ipcEngine: Engine = {
  allRows: (file, sql) => window.api.db.allRows(file, sql),
  readText: path => window.api.fs.readText(path)
};
