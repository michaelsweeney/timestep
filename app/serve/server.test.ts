import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { createServer, type ServeDeps } from './server.ts';
import { Sqlite3Engine } from '@timestep/core/sqlite3';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const sqlite3 = require(path.join(ROOT, 'node_modules', 'sqlite3'));

let server: http.Server;
let port: number;
let dbPath: string;
const TOKEN = 'test-token-123';

function build(deps: Partial<ServeDeps> = {}): ServeDeps {
  return {
    engine: new Sqlite3Engine(sqlite3),
    convertEso: async (p: string) => p.replace(/\.eso$/, '.sql'),
    openDialog: async () => ({ canceled: true, filePaths: [] }),
    saveDialog: async () => ({ canceled: true }),
    staticDir: os.tmpdir(),
    token: TOKEN,
    ...deps
  };
}

// Build a trivial real SQLite DB so the db endpoint exercises native sqlite3.
function makeDb(): Promise<string> {
  const p = path.join(os.tmpdir(), `serve-test-${process.pid}.sqlite`);
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(p);
    db.serialize(() => {
      db.run('CREATE TABLE t (x INTEGER)');
      db.run('INSERT INTO t VALUES (7)');
      db.close((e: unknown) => (e ? reject(e) : resolve(p)));
    });
  });
}

function req(opts: http.RequestOptions, body?: string): Promise<{ status: number; body: string; headers: http.IncomingHttpHeaders }> {
  return new Promise((resolve, reject) => {
    const r = http.request({ host: '127.0.0.1', port, ...opts }, res => {
      let data = '';
      res.on('data', c => (data += c));
      res.on('end', () => resolve({ status: res.statusCode!, body: data, headers: res.headers }));
    });
    r.on('error', reject);
    if (body) r.write(body);
    r.end();
  });
}

function apiHeaders(extra: Record<string, string> = {}) {
  return { 'content-type': 'application/json', 'x-timestep-token': TOKEN, host: `127.0.0.1:${port}`, ...extra };
}

before(async () => {
  dbPath = await makeDb();
  server = createServer(build());
  await new Promise<void>(r => server.listen(0, '127.0.0.1', r));
  port = (server.address() as import('net').AddressInfo).port;
});

after(() => { server.close(); try { fs.unlinkSync(dbPath); } catch {} });

test('db/allRows returns rows from native sqlite3', async () => {
  const res = await req(
    { method: 'POST', path: '/api/db/allRows', headers: apiHeaders() },
    JSON.stringify({ file: dbPath, sql: 'SELECT x FROM t' })
  );
  assert.equal(res.status, 200);
  assert.deepEqual(JSON.parse(res.body), [{ x: 7 }]);
});

test('missing token -> 403', async () => {
  const h = apiHeaders();
  delete (h as Record<string, string>)['x-timestep-token'];
  const res = await req({ method: 'POST', path: '/api/db/allRows', headers: h }, '{}');
  assert.equal(res.status, 403);
});

test('wrong Host -> 403', async () => {
  const res = await req({ method: 'POST', path: '/api/db/allRows', headers: apiHeaders({ host: 'localhost.evil.test' }) }, '{}');
  assert.equal(res.status, 403);
});

test('cross Origin -> 403', async () => {
  const res = await req({ method: 'POST', path: '/api/db/allRows', headers: apiHeaders({ origin: 'http://evil.test' }) }, '{}');
  assert.equal(res.status, 403);
});

test('no permissive CORS header on any response', async () => {
  const res = await req({ method: 'POST', path: '/api/db/allRows', headers: apiHeaders() }, JSON.stringify({ file: dbPath, sql: 'SELECT 1 AS y' }));
  assert.equal(res.headers['access-control-allow-origin'], undefined);
});

test('upgrade header is rejected by the in-handler guard (400)', async () => {
  // Sending only `upgrade` (no `connection: upgrade`) keeps Node from emitting
  // the server 'upgrade' event, so the request reaches the handler and hits the
  // `req.headers.upgrade` guard deterministically. A *real* upgrade (with
  // `connection: upgrade`) is destroyed by `server.on('upgrade')` — that path
  // closes the socket (no HTTP response), so it's verified by code inspection.
  const res = await req({ method: 'GET', path: '/api/db/allRows', headers: apiHeaders({ upgrade: 'websocket' }) });
  assert.equal(res.status, 400);
});

test('a real websocket upgrade destroys the socket (no response)', async () => {
  await assert.rejects(
    req({ method: 'GET', path: '/api/db/allRows', headers: apiHeaders({ connection: 'Upgrade', upgrade: 'websocket' }) })
  );
});

test('fs/exists true/false', async () => {
  const yes = await req({ method: 'POST', path: '/api/fs/exists', headers: apiHeaders() }, JSON.stringify({ path: dbPath }));
  assert.equal(JSON.parse(yes.body), true);
  const no = await req({ method: 'POST', path: '/api/fs/exists', headers: apiHeaders() }, JSON.stringify({ path: '/no/such/file' }));
  assert.equal(JSON.parse(no.body), false);
});

test('index.html is served with the token injected at response time', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'serve-static-'));
  fs.writeFileSync(path.join(dir, 'index.html'), '<meta name="timestep-token" content="__TIMESTEP_TOKEN__">');
  const s = createServer(build({ staticDir: dir }));
  await new Promise<void>(r => s.listen(0, '127.0.0.1', r));
  const p2 = (s.address() as import('net').AddressInfo).port;
  const got: string = await new Promise((resolve, reject) => {
    http.get({ host: '127.0.0.1', port: p2, path: '/' }, res => {
      let d = ''; res.on('data', c => (d += c)); res.on('end', () => resolve(d));
    }).on('error', reject);
  });
  s.close();
  assert.ok(got.includes(`content="${TOKEN}"`));
  assert.ok(!got.includes('__TIMESTEP_TOKEN__'));
});

test('eso/convert routes through the injected converter', async () => {
  const calls: string[] = [];
  const s = createServer(build({ convertEso: async (p3: string) => { calls.push(p3); return '/out.sql'; } }));
  await new Promise<void>(r => s.listen(0, '127.0.0.1', r));
  const p2 = (s.address() as import('net').AddressInfo).port;
  const out: string = await new Promise((resolve, reject) => {
    const r = http.request({ host: '127.0.0.1', port: p2, method: 'POST', path: '/api/eso/convert', headers: { 'content-type': 'application/json', 'x-timestep-token': TOKEN, host: `127.0.0.1:${p2}` } }, res => {
      let d = ''; res.on('data', c => (d += c)); res.on('end', () => resolve(d));
    });
    r.on('error', reject); r.end(JSON.stringify({ path: '/in.eso' }));
  });
  s.close();
  assert.equal(JSON.parse(out), '/out.sql');
  assert.deepEqual(calls, ['/in.eso']);
});
