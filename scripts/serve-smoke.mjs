// Headless cross-platform smoke for `timestep serve`. No GUI required — the
// dialog is bypassed; this proves native sqlite3 builds/loads and the server
// transport works on the host OS. Run over Tailscale SSH on mac/windows.
//   yarn smoke-serve        (== node --import tsx scripts/serve-smoke.mjs)
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { createServer } from '../app/serve/server.ts';
import { Sqlite3Engine } from '@timestep/core/sqlite3';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sqlite3 = require(path.join(ROOT, 'node_modules', 'sqlite3'));

const TOKEN = 'smoke';
const dbPath = path.join(os.tmpdir(), `serve-smoke-${process.pid}.sqlite`);

function fail(msg) {
  console.error(`FAIL serve-smoke on ${os.platform()} ${os.arch()}: ${msg}`);
  process.exit(1);
}

// Build a trivial real SQLite DB (the server's job is transport; query
// correctness is covered by @timestep/core's own tests).
await new Promise((res, rej) => {
  const db = new sqlite3.Database(dbPath);
  db.serialize(() => {
    db.run('CREATE TABLE t (x INTEGER)');
    db.run('INSERT INTO t VALUES (99)');
    db.close(e => (e ? rej(e) : res()));
  });
});

const server = createServer({
  engine: new Sqlite3Engine(sqlite3),
  convertEso: async p => p,
  openDialog: async () => ({ canceled: true, filePaths: [] }),
  saveDialog: async () => ({ canceled: true }),
  staticDir: os.tmpdir(),
  token: TOKEN
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const port = server.address().port;

function query() {
  return new Promise((resolve, reject) => {
    const r = http.request(
      {
        host: '127.0.0.1',
        port,
        method: 'POST',
        path: '/api/db/allRows',
        headers: { 'content-type': 'application/json', 'x-timestep-token': TOKEN, host: `127.0.0.1:${port}` }
      },
      res => {
        let d = '';
        res.on('data', c => (d += c));
        res.on('end', () => resolve({ status: res.statusCode, body: d }));
      }
    );
    r.on('error', reject);
    r.end(JSON.stringify({ file: dbPath, sql: 'SELECT x FROM t' }));
  });
}

try {
  const res = await query();
  if (res.status !== 200) fail(`status ${res.status}`);
  const rows = JSON.parse(res.body);
  if (!(Array.isArray(rows) && rows.length === 1 && rows[0].x === 99)) fail(`unexpected rows ${res.body}`);
  console.log(`PASS serve-smoke on ${os.platform()} ${os.arch()} — native sqlite3 query over HTTP returned [{x:99}]`);
} finally {
  server.close();
  // Best-effort temp cleanup. On Windows the cached read-only sqlite3 handle
  // (Sqlite3Engine keeps it open for the process lifetime) keeps a lock on the
  // file, so rm throws EPERM — harmless, the OS reclaims the temp dir.
  try {
    fs.rmSync(dbPath, { force: true });
  } catch {
    /* file still locked by the engine handle; ignore */
  }
}
