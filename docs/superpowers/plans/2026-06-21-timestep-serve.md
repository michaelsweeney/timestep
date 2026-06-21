# timestep serve Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `timestep serve` runtime — a loopback HTTP server using native sqlite3 to back the unchanged React renderer, so real-sized EnergyPlus `.sql`/`.eso` files are read by path off disk instead of loaded whole into browser memory.

**Architecture:** Re-host the Electron main process over `127.0.0.1` HTTP. A new server (`app/serve/*.ts`, run via `tsx`) re-implements the seven IPC handlers from `app/ipc-handlers.ts` as `/api/*` endpoints, backed by the same `@timestep/core` `Sqlite3Engine` + `convertEsoCached`. A new renderer shim (`app/src/serve/http-api.ts`) installs `window.api` by `fetch`-ing those endpoints — the parallel of the existing `app/src/web/web-api.ts`. Native OS file dialogs (shelled out from the server) return real paths, so the renderer is unchanged for the button/dialog flow.

**Tech Stack:** Node 24 + `node:http`, `tsx` (run TS server without a separate build), native `sqlite3` (Node ABI), webpack 5 (client bundle), `node:test` (server tests) + jest/jsdom (renderer-shim test), playwright-core (smoke).

## Global Constraints

Every task implicitly includes these (verbatim from `docs/superpowers/specs/2026-06-21-timestep-serve-design.md`):

- **Bind `127.0.0.1` only**, never `0.0.0.0`. Listen on an **ephemeral free port**; print the URL and open the browser.
- **Per-startup random token** (`crypto.randomBytes`), injected into the served HTML `<meta name="timestep-token">` **at response time** (not build time, not the URL). The shim sends it as the `X-Timestep-Token` header.
- The server **rejects any `/api/*` request** that: lacks/mismatches the token; has `Host` ≠ `127.0.0.1:<port>` (exact, not suffix); has an `Origin` header ≠ `http://127.0.0.1:<port>`; or is a WebSocket `upgrade`. The server **never emits** `Access-Control-Allow-Origin`.
- **Trust model:** a valid token is a bearer capability with the same filesystem authority the Electron renderer already has (paths also arrive from saved `.tss` JSON, not only dialogs). Accepted as in-scope for v0; no path allowlist.
- **Renderer is unchanged** for the button/dialog flow. `window.api.getPathForFile` is a **throwing stub** (`throw new Error('Drag-and-drop is not available in serve mode — use the Load Files button.')`) — it is called only in `onDrop` (`app/src/components/filehandler.tsx:113`, `app/src/components/loadsession.tsx:104`), so the page loads fine and only a drop errors. **Drag-and-drop is deferred.**
- **sqlite3 ABI split:** the desktop `postinstall` rebuilds `app/node_modules/sqlite3` for Electron's ABI. `serve` runs under plain Node, so it loads a **Node-ABI `sqlite3` from the repo-root `node_modules`** (added as a root dep; `start.ts` resolves it explicitly via `createRequire`). The two installs never collide.
- **No new query/parse logic.** `serve` only adds a transport over existing `@timestep/core` engine code.
- **npm/`bin` distribution is phase 2.** v0 runs locally via `yarn serve`.

## File Structure

| File | Responsibility |
|---|---|
| `app/serve/esoconvert.ts` | Per-path serializer/deduper wrapping the eso conversion (fixes the `esocache.ts` `.building` race under concurrency). Pure logic. |
| `app/serve/server.ts` | `createServer(deps)` → `http.Server`. Routing, security middleware, `/api/*` handlers, static serving + token injection. Imports nothing native (everything injected). |
| `app/serve/dialog.ts` | `makeDialogs(run?)` → `{ openDialog, saveDialog }`. Native OS dialog shell-out (kdialog/zenity/osascript/PowerShell), arg-array spawn, output sanitization, structured no-tool error. |
| `app/serve/start.ts` | Entry (run via `tsx`). Loads Node-ABI root `sqlite3`, wires real deps, generates token, finds an ephemeral port, listens, opens the browser. |
| `app/src/serve/http-api.ts` | `installHttpApi()` — installs `window.api` backed by `fetch` to `/api/*`, reading the token from the `<meta>` tag. `getPathForFile` is the throwing stub. |
| `app/src/serve/index.tsx` | Renderer entry: `installHttpApi()` then render `<App/>` (parallel of `app/src/web/index.tsx`). |
| `app/serve.html` | HTML shell with the `__TIMESTEP_TOKEN__` placeholder (parallel of `app/web.html`). |
| `configs/webpack.config.serve.prod.js` | Client bundle config (mirrors web config, **no sql.js**, excludes Node-only core modules). |
| `scripts/serve-smoke.mjs` | Headless cross-platform smoke (boots serve, queries native sqlite3 — runnable over Tailscale SSH). |
| `scripts/serve-dialog-check.mjs` | Manual one-click dialog check (run in a graphical session). |
| `package.json` | Add `tsx` + root `sqlite3` deps; `build-serve`, `serve`, `test-serve`, `smoke-serve` scripts. |
| `README.md` | Short "run locally with native performance" note. |

---

### Task 1: Scaffold tooling + Node-ABI sqlite3

Establishes that `serve` can run TS under `tsx` and load a **Node-ABI** `sqlite3` from root `node_modules`, independent of the Electron-ABI build in `app/node_modules`. This de-risks the whole plan.

**Files:**
- Modify: `package.json` (root deps + a probe script)
- Create: `app/serve/abi-probe.test.ts`

**Interfaces:**
- Produces: a working `tsx` runner and a root `node_modules/sqlite3` loadable under plain Node.

- [ ] **Step 1: Add `tsx` and root `sqlite3`, plus the `test-serve` script**

In `package.json`, add to `devDependencies`: `"tsx": "^4.19.0"`. Add to `dependencies`: `"sqlite3": "^5.1.7"` (root, Node-ABI — distinct from `app/`'s Electron-ABI copy). Add to `scripts`:

```json
"test-serve": "node --import tsx --test \"app/serve/**/*.test.ts\"",
```

- [ ] **Step 2: Install**

Run: `yarn install`
Expected: completes; `node_modules/sqlite3` present and built for the Node ABI (root install does not run `electron-builder install-app-deps` against root deps).

- [ ] **Step 3: Write the failing probe test**

Create `app/serve/abi-probe.test.ts`:

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

// serve must load the Node-ABI sqlite3 from ROOT node_modules, not app/'s
// Electron-ABI copy. Resolve from the repo root explicitly.
const require = createRequire(import.meta.url);

test('root sqlite3 loads under plain Node and runs a query', async () => {
  const sqlite3 = require('sqlite3'); // resolves repo-root node_modules
  await new Promise<void>((resolve, reject) => {
    const db = new sqlite3.Database(':memory:');
    db.serialize(() => {
      db.run('CREATE TABLE t (x INTEGER)');
      db.run('INSERT INTO t VALUES (42)');
      db.all('SELECT x FROM t', (err: unknown, rows: { x: number }[]) => {
        if (err) return reject(err);
        try {
          assert.deepEqual(rows, [{ x: 42 }]);
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    });
  });
});
```

- [ ] **Step 4: Run it**

Run: `yarn test-serve`
Expected: PASS. (If it fails with `NODE_MODULE_VERSION` mismatch, root `sqlite3` was rebuilt for Electron — reinstall root deps without `electron-builder install-app-deps` touching them, or `npm rebuild sqlite3 --build-from-source` at root.)

- [ ] **Step 5: Commit**

```bash
git add package.json yarn.lock app/serve/abi-probe.test.ts
git commit -m "serve: scaffold tsx runner + Node-ABI sqlite3 probe"
```

---

### Task 2: eso conversion serializer

Fixes the `convertEsoCached` `.building` race (`packages/core/src/eso/esocache.ts:50-61`) by deduping concurrent conversions of the same file path.

**Files:**
- Create: `app/serve/esoconvert.ts`
- Test: `app/serve/esoconvert.test.ts`

**Interfaces:**
- Produces: `makeEsoConverter(convertFn: (esoPath: string) => Promise<string>): (esoPath: string) => Promise<string>` — concurrent calls with the same resolved path share one in-flight promise; different paths run concurrently.

- [ ] **Step 1: Write the failing test**

Create `app/serve/esoconvert.test.ts`:

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeEsoConverter } from './esoconvert.ts';

test('concurrent converts of the same path dedupe to one call', async () => {
  let calls = 0;
  const convert = makeEsoConverter(async (p: string) => {
    calls++;
    await new Promise(r => setTimeout(r, 20));
    return p.replace(/\.eso$/, '.sql');
  });
  const [a, b] = await Promise.all([
    convert('/x/eplusout.eso'),
    convert('/x/eplusout.eso')
  ]);
  assert.equal(a, '/x/eplusout.sql');
  assert.equal(b, '/x/eplusout.sql');
  assert.equal(calls, 1); // deduped
});

test('different paths run independently', async () => {
  let calls = 0;
  const convert = makeEsoConverter(async (p: string) => {
    calls++;
    return p.replace(/\.eso$/, '.sql');
  });
  await Promise.all([convert('/a.eso'), convert('/b.eso')]);
  assert.equal(calls, 2);
});

test('a failed conversion clears so a retry re-runs', async () => {
  let calls = 0;
  const convert = makeEsoConverter(async () => {
    calls++;
    if (calls === 1) throw new Error('boom');
    return '/ok.sql';
  });
  await assert.rejects(convert('/a.eso'));
  assert.equal(await convert('/a.eso'), '/ok.sql');
  assert.equal(calls, 2);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `yarn test-serve`
Expected: FAIL — `Cannot find module './esoconvert.ts'`.

- [ ] **Step 3: Implement**

Create `app/serve/esoconvert.ts`:

```ts
import path from 'node:path';

// Dedupe concurrent conversions of the same .eso path. convertEsoCached
// (packages/core/src/eso/esocache.ts) is not atomic across calls — two
// concurrent requests for the same uncached file race on the shared
// `<sql>.building` temp. Sharing one in-flight promise per resolved path
// serializes same-file work while leaving different files concurrent.
export function makeEsoConverter(
  convertFn: (esoPath: string) => Promise<string>
): (esoPath: string) => Promise<string> {
  const inflight = new Map<string, Promise<string>>();
  return (esoPath: string) => {
    const key = path.resolve(esoPath);
    let p = inflight.get(key);
    if (!p) {
      p = Promise.resolve()
        .then(() => convertFn(esoPath))
        .finally(() => inflight.delete(key));
      inflight.set(key, p);
    }
    return p;
  };
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `yarn test-serve`
Expected: PASS (all three).

- [ ] **Step 5: Commit**

```bash
git add app/serve/esoconvert.ts app/serve/esoconvert.test.ts
git commit -m "serve: eso conversion serializer (dedupe concurrent same-path converts)"
```

---

### Task 3: server core — security + db/fs endpoints

`createServer(deps)` with the security middleware and the `/api/db/allRows` + `/api/fs/*` endpoints. Static serving and dialog/eso endpoints come in Task 4.

**Files:**
- Create: `app/serve/server.ts`
- Test: `app/serve/server.test.ts`

**Interfaces:**
- Consumes: a Node-ABI `sqlite3` (Task 1) for the real-query test only.
- Produces:
  ```ts
  interface ServeDeps {
    engine: { allRows(file: string, sql: string): Promise<unknown[]> };
    convertEso: (esoPath: string) => Promise<string>;
    openDialog: (opts: unknown) => Promise<{ canceled: boolean; filePaths: string[] }>;
    saveDialog: (opts: unknown) => Promise<{ canceled: boolean; filePath?: string }>;
    staticDir: string;
    token: string;
  }
  function createServer(deps: ServeDeps): import('http').Server
  ```
  The expected `Host`/`Origin` are derived at request time from `server.address()`, so no port is passed in.

- [ ] **Step 1: Write the failing test**

Create `app/serve/server.test.ts`:

```ts
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
const sqlite3 = require('sqlite3');

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

test('websocket upgrade is rejected', async () => {
  const res = await req({ method: 'GET', path: '/api/db/allRows', headers: apiHeaders({ connection: 'Upgrade', upgrade: 'websocket' }) });
  assert.ok(res.status === 400 || res.status === 403);
});

test('fs/exists true/false', async () => {
  const yes = await req({ method: 'POST', path: '/api/fs/exists', headers: apiHeaders() }, JSON.stringify({ path: dbPath }));
  assert.equal(JSON.parse(yes.body), true);
  const no = await req({ method: 'POST', path: '/api/fs/exists', headers: apiHeaders() }, JSON.stringify({ path: '/no/such/file' }));
  assert.equal(JSON.parse(no.body), false);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `yarn test-serve`
Expected: FAIL — `Cannot find module './server.ts'`.

- [ ] **Step 3: Implement**

Create `app/serve/server.ts`:

```ts
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import type { AddressInfo } from 'node:net';

export interface ServeDeps {
  engine: { allRows(file: string, sql: string): Promise<unknown[]> };
  convertEso: (esoPath: string) => Promise<string>;
  openDialog: (opts: unknown) => Promise<{ canceled: boolean; filePaths: string[] }>;
  saveDialog: (opts: unknown) => Promise<{ canceled: boolean; filePath?: string }>;
  staticDir: string;
  token: string;
}

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', c => (data += c));
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

function sendJson(res: http.ServerResponse, status: number, value: unknown): void {
  const body = JSON.stringify(value);
  // No Access-Control-Allow-Origin: the page is same-origin; CORS would
  // defeat the Origin guard.
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(body);
}

// Authenticate from headers BEFORE reading the body (an unauthenticated page
// must not be able to force a large POST body as a local DoS).
function authorized(req: http.IncomingMessage, expectedHost: string, token: string): boolean {
  if (req.headers.host !== expectedHost) return false;
  const origin = req.headers.origin;
  if (origin && origin !== `http://${expectedHost}`) return false;
  if (req.headers['x-timestep-token'] !== token) return false;
  return true;
}

export function createServer(deps: ServeDeps): http.Server {
  const server = http.createServer(async (req, res) => {
    const url = (req.url || '/').split('?')[0];
    const expectedHost = `127.0.0.1:${(server.address() as AddressInfo)?.port}`;

    if (url.startsWith('/api/')) {
      if (req.headers.upgrade) return sendJson(res, 400, { error: 'upgrade not supported' });
      if (!authorized(req, expectedHost, deps.token)) return sendJson(res, 403, { error: 'forbidden' });
      try {
        const body = await readBody(req);
        const p = body ? JSON.parse(body) : {};
        return await route(url, p, deps, res);
      } catch (e) {
        return sendJson(res, 500, { error: (e as Error).message });
      }
    }
    return serveStatic(url, deps, res);
  });

  // Reject all WebSocket upgrades outright (the renderer uses fetch).
  server.on('upgrade', (_req, socket) => socket.destroy());
  return server;
}

async function route(url: string, p: Record<string, unknown>, deps: ServeDeps, res: http.ServerResponse): Promise<void> {
  switch (url) {
    case '/api/db/allRows':
      return sendJson(res, 200, await deps.engine.allRows(p.file as string, p.sql as string));
    case '/api/fs/readText':
      return sendJson(res, 200, await fs.promises.readFile(p.path as string, 'utf8'));
    case '/api/fs/writeText':
      await fs.promises.writeFile(p.path as string, p.contents as string);
      return sendJson(res, 200, { ok: true });
    case '/api/fs/exists':
      return sendJson(res, 200, await fs.promises.access(p.path as string).then(() => true, () => false));
    case '/api/dialog/open':
      return sendJson(res, 200, await deps.openDialog(p));
    case '/api/dialog/save':
      return sendJson(res, 200, await deps.saveDialog(p));
    case '/api/eso/convert':
      return sendJson(res, 200, await deps.convertEso(p.path as string));
    default:
      return sendJson(res, 404, { error: 'not found' });
  }
}

// Static serving + per-request token injection into index.html. Placeholder
// is replaced at response time so the on-disk file never holds a live token.
function serveStatic(url: string, deps: ServeDeps, res: http.ServerResponse): void {
  const rel = url === '/' ? 'index.html' : decodeURIComponent(url);
  const file = path.join(deps.staticDir, rel);
  if (!file.startsWith(deps.staticDir)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404); return res.end('not found'); }
    const ext = path.extname(file);
    const mime: Record<string, string> = {
      '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
      '.ttf': 'font/ttf', '.woff': 'font/woff', '.woff2': 'font/woff2',
      '.svg': 'image/svg+xml', '.map': 'application/json'
    };
    let out: Buffer | string = buf;
    if (rel === 'index.html') out = buf.toString('utf8').replace('__TIMESTEP_TOKEN__', deps.token);
    res.writeHead(200, { 'content-type': mime[ext] || 'application/octet-stream' });
    res.end(out);
  });
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `yarn test-serve`
Expected: PASS (all server tests + earlier tasks).

- [ ] **Step 5: Commit**

```bash
git add app/serve/server.ts app/serve/server.test.ts
git commit -m "serve: http server core — security middleware + db/fs endpoints"
```

---

### Task 4: server — static/token + eso/dialog endpoints integration test

The endpoints already exist (Task 3); this task adds the integration tests that lock down static token injection and the dialog/eso wiring through injected deps, so a reviewer can reject regressions here independently.

**Files:**
- Modify: `app/serve/server.test.ts`

**Interfaces:**
- Consumes: `createServer` (Task 3), `makeEsoConverter` (Task 2).

- [ ] **Step 1: Add the failing tests**

Append to `app/serve/server.test.ts`:

```ts
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
```

- [ ] **Step 2: Run**

Run: `yarn test-serve`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add app/serve/server.test.ts
git commit -m "serve: integration tests for static token injection + eso routing"
```

---

### Task 5: native OS file dialogs

**Files:**
- Create: `app/serve/dialog.ts`
- Test: `app/serve/dialog.test.ts`

**Interfaces:**
- Produces:
  ```ts
  type RunFn = (cmd: string, args: string[]) => Promise<string>; // resolves stdout
  function makeDialogs(run?: RunFn, platform?: NodeJS.Platform, hasCmd?: (c: string) => boolean): {
    openDialog(opts: { properties?: string[] }): Promise<{ canceled: boolean; filePaths: string[] }>;
    saveDialog(opts: { defaultPath?: string }): Promise<{ canceled: boolean; filePath?: string }>;
  }
  ```
  Dependencies (`run`, `platform`, `hasCmd`) are injected so tests never spawn a real dialog.

- [ ] **Step 1: Write the failing test**

Create `app/serve/dialog.test.ts`:

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeDialogs } from './dialog.ts';

test('linux uses kdialog when present, sanitizes output', async () => {
  const seen: { cmd: string; args: string[] }[] = [];
  const run = async (cmd: string, args: string[]) => { seen.push({ cmd, args }); return '/home/me/run/eplusout.sql\n'; };
  const d = makeDialogs(run, 'linux', c => c === 'kdialog');
  const res = await d.openDialog({ properties: ['openFile'] });
  assert.deepEqual(res, { canceled: false, filePaths: ['/home/me/run/eplusout.sql'] });
  assert.equal(seen[0].cmd, 'kdialog');
});

test('linux falls back to zenity when kdialog absent', async () => {
  const run = async () => '/x/a.sql';
  const d = makeDialogs(run, 'linux', c => c === 'zenity');
  assert.equal((await d.openDialog({})).filePaths[0], '/x/a.sql');
});

test('user cancel (empty output / nonzero) -> canceled', async () => {
  const run = async () => { throw Object.assign(new Error('cancel'), { code: 1 }); };
  const d = makeDialogs(run, 'linux', () => true);
  assert.deepEqual(await d.openDialog({}), { canceled: true, filePaths: [] });
});

test('no dialog tool -> structured error', async () => {
  const d = makeDialogs(async () => '', 'linux', () => false);
  await assert.rejects(d.openDialog({}), /no file dialog tool/i);
});

test('macOS uses osascript', async () => {
  const seen: string[] = [];
  const run = async (cmd: string) => { seen.push(cmd); return '/Users/me/x.sql'; };
  const d = makeDialogs(run, 'darwin', () => true);
  await d.openDialog({});
  assert.equal(seen[0], 'osascript');
});

test('windows uses powershell', async () => {
  const seen: string[] = [];
  const run = async (cmd: string) => { seen.push(cmd); return 'C:\\Users\\me\\x.sql'; };
  const d = makeDialogs(run, 'win32', () => true);
  const res = await d.openDialog({});
  assert.match(seen[0], /powershell|pwsh/);
  assert.equal(res.filePaths[0], 'C:\\Users\\me\\x.sql');
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `yarn test-serve`
Expected: FAIL — `Cannot find module './dialog.ts'`.

- [ ] **Step 3: Implement**

Create `app/serve/dialog.ts`:

```ts
import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

type RunFn = (cmd: string, args: string[]) => Promise<string>;

// Default runner: spawn with an ARGUMENT ARRAY (never a shell string) so paths
// and titles can't be injected. Resolves stdout; rejects on nonzero exit.
const defaultRun: RunFn = (cmd, args) =>
  new Promise((resolve, reject) => {
    execFile(cmd, args, { maxBuffer: 1 << 20 }, (err, stdout) => {
      if (err) return reject(err);
      resolve(stdout);
    });
  });

function defaultHasCmd(cmd: string): boolean {
  const dirs = (process.env.PATH || '').split(path.delimiter);
  const exts = process.platform === 'win32' ? ['.exe', '.cmd', '.bat', ''] : [''];
  return dirs.some(dir => exts.some(ext => { try { return existsSync(path.join(dir, cmd + ext)); } catch { return false; } }));
}

function sanitize(stdout: string): string {
  return stdout.replace(/\r?\n$/, '').trim();
}

export function makeDialogs(
  run: RunFn = defaultRun,
  platform: NodeJS.Platform = process.platform,
  hasCmd: (c: string) => boolean = defaultHasCmd
) {
  // Returns the chosen path, or null on cancel.
  async function pick(mode: 'open' | 'save', opts: { defaultPath?: string }): Promise<string | null> {
    let cmd: string;
    let args: string[];
    if (platform === 'darwin') {
      cmd = 'osascript';
      const verb = mode === 'open' ? 'choose file' : 'choose file name';
      args = ['-e', `POSIX path of (${verb})`];
    } else if (platform === 'win32') {
      cmd = 'powershell';
      const dlg = mode === 'open' ? 'OpenFileDialog' : 'SaveFileDialog';
      args = ['-NoProfile', '-Command', `Add-Type -AssemblyName System.Windows.Forms; $f = New-Object System.Windows.Forms.${dlg}; if ($f.ShowDialog() -eq 'OK') { $f.FileName }`];
    } else if (hasCmd('kdialog')) {
      cmd = 'kdialog';
      args = mode === 'open' ? ['--getopenfilename'] : ['--getsavefilename'];
      if (opts.defaultPath) args.push(opts.defaultPath);
    } else if (hasCmd('zenity')) {
      cmd = 'zenity';
      args = mode === 'open' ? ['--file-selection'] : ['--file-selection', '--save', '--confirm-overwrite'];
    } else {
      throw new Error('No file dialog tool found. Install zenity or kdialog.');
    }
    try {
      const out = sanitize(await run(cmd, args));
      return out === '' ? null : out;
    } catch {
      return null; // user cancel / nonzero exit
    }
  }

  return {
    async openDialog(opts: { properties?: string[] } = {}) {
      void opts;
      const p = await pick('open', {});
      return p ? { canceled: false, filePaths: [p] } : { canceled: true, filePaths: [] };
    },
    async saveDialog(opts: { defaultPath?: string } = {}) {
      const p = await pick('save', { defaultPath: opts.defaultPath || path.join(os.homedir(), 'timestep.tss') });
      return p ? { canceled: false, filePath: p } : { canceled: true };
    }
  };
}
```

Note: the "no tool" error must propagate from `pick` for the no-tool case but cancel must be swallowed — the implementation throws before the `try` for no-tool, and swallows inside the `try` for cancel. Verify the no-tool test sees the rejection.

- [ ] **Step 4: Run to verify it passes**

Run: `yarn test-serve`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/serve/dialog.ts app/serve/dialog.test.ts
git commit -m "serve: native OS file dialogs (kdialog/zenity/osascript/powershell, arg-array spawn)"
```

---

### Task 6: renderer http-api shim

**Files:**
- Create: `app/src/serve/http-api.ts`
- Create: `app/src/serve/index.tsx`
- Test: `app/src/serve/http-api.test.ts`

**Interfaces:**
- Consumes: the `/api/*` contract (Tasks 3-4).
- Produces: `installHttpApi(): void` — sets `window.api` with the same shape as `app/preload.js`.

- [ ] **Step 1: Write the failing test (jest, jsdom)**

Create `app/src/serve/http-api.test.ts`:

```ts
import { installHttpApi } from './http-api';

describe('http-api shim', () => {
  beforeEach(() => {
    document.head.innerHTML = '<meta name="timestep-token" content="tok-1">';
    (global as unknown as { fetch: jest.Mock }).fetch = jest.fn(async () => ({
      json: async () => [{ x: 1 }]
    })) as unknown as jest.Mock;
    installHttpApi();
  });

  it('db.allRows posts to /api/db/allRows with the token header', async () => {
    const rows = await (window as any).api.db.allRows('/f.sql', 'SELECT 1');
    const [url, opts] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe('/api/db/allRows');
    expect(opts.headers['X-Timestep-Token']).toBe('tok-1');
    expect(JSON.parse(opts.body)).toEqual({ file: '/f.sql', sql: 'SELECT 1' });
    expect(rows).toEqual([{ x: 1 }]);
  });

  it('getPathForFile throws a clear serve-mode error', () => {
    expect(() => (window as any).api.getPathForFile({})).toThrow(/serve mode/i);
  });

  it('dialog.openFiles posts to /api/dialog/open', async () => {
    await (window as any).api.dialog.openFiles({ filters: [] });
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toBe('/api/dialog/open');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `yarn test app/src/serve/http-api.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `app/src/serve/http-api.ts`:

```ts
// Browser shim installing window.api by fetching the loopback server's /api/*
// endpoints — the parallel of app/src/web/web-api.ts, but the SQL runs in the
// server's native sqlite3, not in-tab sql.js. The per-startup token is read
// from the <meta> tag the server injected at response time.

function token(): string {
  const el = document.querySelector('meta[name="timestep-token"]');
  return (el?.getAttribute('content')) || '';
}

async function post<T>(endpoint: string, payload: unknown): Promise<T> {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Timestep-Token': token() },
    body: JSON.stringify(payload)
  });
  return res.json() as Promise<T>;
}

export function installHttpApi(): void {
  const api = {
    dialog: {
      openFiles: (opts: unknown) => post('/api/dialog/open', opts),
      saveFile: (opts: unknown) => post('/api/dialog/save', opts)
    },
    fs: {
      readText: (path: string) => post<string>('/api/fs/readText', { path }),
      writeText: (path: string, contents: string) => post('/api/fs/writeText', { path, contents }),
      exists: (path: string) => post<boolean>('/api/fs/exists', { path })
    },
    db: {
      allRows: (file: string, sql: string) => post<unknown[]>('/api/db/allRows', { file, sql })
    },
    eso: {
      convertToSql: (path: string) => post<string>('/api/eso/convert', { path })
    },
    clipboard: {
      writeText: (text: string) => { navigator.clipboard?.writeText(text); }
    },
    shell: {
      openExternal: (url: string) => { window.open(url, '_blank', 'noopener,noreferrer'); return Promise.resolve(); }
    },
    // Drag-and-drop can't yield a server-openable path in a browser; the
    // button/dialog flow never calls this. Present-but-throwing so a stray
    // drop fails loudly instead of crashing on an undefined function.
    getPathForFile: (_file: File) => {
      throw new Error('Drag-and-drop is not available in serve mode — use the Load Files button.');
    }
  };
  (window as unknown as { api: typeof api }).api = api;
}
```

Create `app/src/serve/index.tsx` (parallel of `app/src/web/index.tsx`):

```tsx
import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';

import { installHttpApi } from './http-api';
import App from 'src/components/App';
import { store } from 'src/store/configureStore';

installHttpApi();

document.addEventListener('DOMContentLoaded', () => {
  render(
    <Provider store={store}>
      <App />
    </Provider>,
    document.getElementById('root')
  );
});

export { store };
```

- [ ] **Step 4: Run to verify it passes**

Run: `yarn test app/src/serve/http-api.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/src/serve/http-api.ts app/src/serve/index.tsx app/src/serve/http-api.test.ts
git commit -m "serve: renderer http-api shim (window.api over fetch; getPathForFile stub)"
```

---

### Task 7: build config, HTML shell, start script, package scripts

**Files:**
- Create: `configs/webpack.config.serve.prod.js`
- Create: `app/serve.html`
- Create: `app/serve/start.ts`
- Modify: `package.json` (scripts)

**Interfaces:**
- Consumes: all prior tasks.
- Produces: `yarn build-serve` (client bundle → `app/dist-serve/`) and `yarn serve` (build + boot).

- [ ] **Step 1: Create the HTML shell**

Create `app/serve.html`:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="timestep-token" content="__TIMESTEP_TOKEN__" />
    <title>Timestep</title>
    <link rel="stylesheet" href="./style.css" />
  </head>
  <body>
    <div id="root"></div>
    <script defer src="./serve.js"></script>
  </body>
</html>
```

- [ ] **Step 2: Create the webpack config**

Create `configs/webpack.config.serve.prod.js` — copy `configs/webpack.config.web.prod.js` and change exactly: the entry to `app/src/serve/index.tsx`, the output `path` to `app/dist-serve` and `filename` to `serve.js`, the `library.name` to `timestepServe`, **remove** the `sql-wasm` asset rule, and add an `externals` guard so a stray Node-only import fails the build loudly:

```js
  // The client bundle must never pull in the Node-only core modules; only
  // app/serve/*.ts (server side) may import these.
  externals: {
    sqlite3: 'commonjs sqlite3',
    '@timestep/core/sqlite3': 'commonjs @timestep/core/sqlite3',
    '@timestep/core/eso-cache': 'commonjs @timestep/core/eso-cache'
  },
```

Keep the `resolve.fallback: { fs: false, path: false, crypto: false }` (harmless; suppresses any transitive Node-builtin references).

- [ ] **Step 3: Create the start entry**

Create `app/serve/start.ts`:

```ts
import http from 'node:http';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { createServer } from './server.ts';
import { makeDialogs } from './dialog.ts';
import { makeEsoConverter } from './esoconvert.ts';
import { Sqlite3Engine } from '@timestep/core/sqlite3';
import { convertEsoCached } from '@timestep/core/eso-cache';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');
// Load the Node-ABI sqlite3 from ROOT node_modules (NOT app/'s Electron-ABI copy).
const require = createRequire(import.meta.url);
const sqlite3 = require(path.join(ROOT, 'node_modules', 'sqlite3'));

const cacheDir = path.join(process.env.XDG_CACHE_HOME || path.join(os.homedir(), '.cache'), 'timestep', 'eso-cache');
const token = crypto.randomBytes(24).toString('hex');
const dialogs = makeDialogs();

const deps = {
  engine: new Sqlite3Engine(sqlite3),
  convertEso: makeEsoConverter((esoPath: string) => convertEsoCached(esoPath, cacheDir, sqlite3)),
  openDialog: dialogs.openDialog,
  saveDialog: dialogs.saveDialog,
  staticDir: path.join(ROOT, 'app', 'dist-serve'),
  token
};

const server = createServer(deps);
server.requestTimeout = 0; // dialogs wait on the user; large .eso converts take minutes
server.listen(0, '127.0.0.1', () => {
  const port = (server.address() as import('net').AddressInfo).port;
  const url = `http://127.0.0.1:${port}/`;
  console.log(`timestep serve → ${url}`);
  openBrowser(url);
});

function openBrowser(url: string): void {
  const cmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'cmd' : 'xdg-open';
  const args = process.platform === 'win32' ? ['/c', 'start', '', url] : [url];
  try { spawn(cmd, args, { stdio: 'ignore', detached: true }).unref(); } catch { /* print-only */ }
}
```

- [ ] **Step 4: Add package scripts**

In `package.json` `scripts`, add:

```json
"build-serve": "rm -rf app/dist-serve && cross-env NODE_ENV=production webpack --config ./configs/webpack.config.serve.prod.js && cp app/serve.html app/dist-serve/index.html",
"serve": "yarn build-serve && node --import tsx app/serve/start.ts",
```

- [ ] **Step 5: Build and smoke by hand**

Run: `yarn build-serve`
Expected: `app/dist-serve/` contains `serve.js`, `style.css`, `index.html` (with the `__TIMESTEP_TOKEN__` placeholder), fonts. **No** `sql-wasm*.wasm`.

Run: `yarn serve` (then Ctrl-C after it prints the URL and opens the browser)
Expected: prints `timestep serve → http://127.0.0.1:<port>/`; the page loads; Load Files pops the native dialog; selecting a `.sql` charts it.

- [ ] **Step 6: Commit**

```bash
git add configs/webpack.config.serve.prod.js app/serve.html app/serve/start.ts package.json
git commit -m "serve: build config + html shell + start entry + yarn serve/build-serve"
```

---

### Task 8: cross-platform verification (headless smoke + manual dialog check)

Validates the native-sqlite3 path on macOS and Windows over Tailscale SSH, and the native dialog with one manual click. Delivery: push the branch; each machine `git fetch` + `yarn install`.

**Files:**
- Create: `scripts/serve-smoke.mjs`
- Create: `scripts/serve-dialog-check.mjs`
- Modify: `package.json` (`smoke-serve` script)
- Modify: `README.md` (serve note)

**Interfaces:**
- Consumes: `yarn build-serve`, `app/serve/start.ts`.

- [ ] **Step 1: Write the headless smoke**

Create `scripts/serve-smoke.mjs` — boots the server with an injected dummy dialog (so no GUI is needed), creates a trivial SQLite DB, and asserts `/api/db/allRows` returns its row over HTTP. This proves native sqlite3 built and loads on the host OS.

```js
// Headless cross-platform smoke for `timestep serve`. No GUI required — the
// dialog is bypassed; this proves native sqlite3 builds/loads and the server
// transport works on the host OS. Run over Tailscale SSH on mac/windows.
//   yarn build-serve && node scripts/serve-smoke.mjs
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';

const require_ = createRequire(import.meta.url);
const sqlite3 = require_('sqlite3');

const dbPath = path.join(os.tmpdir(), `serve-smoke-${process.pid}.sqlite`);
await new Promise((res, rej) => {
  const db = new sqlite3.Database(dbPath);
  db.serialize(() => {
    db.run('CREATE TABLE t (x INTEGER)');
    db.run('INSERT INTO t VALUES (99)');
    db.close(e => (e ? rej(e) : res()));
  });
});

// Use tsx to boot a minimal server inline (reuses createServer + Sqlite3Engine).
const boot = `
import http from 'node:http';
import { createRequire } from 'node:module';
import { createServer } from './app/serve/server.ts';
import { Sqlite3Engine } from '@timestep/core/sqlite3';
const sqlite3 = createRequire(import.meta.url)('sqlite3');
const s = createServer({
  engine: new Sqlite3Engine(sqlite3),
  convertEso: async p => p, openDialog: async () => ({canceled:true,filePaths:[]}),
  saveDialog: async () => ({canceled:true}), staticDir: process.cwd(), token: 'smoke'
});
s.listen(0, '127.0.0.1', () => console.log('PORT=' + s.address().port));
`;
fs.writeFileSync('.serve-smoke-boot.mjs', boot);
const proc = spawnSync('node', ['--import', 'tsx', '.serve-smoke-boot.mjs'], { encoding: 'utf8', timeout: 4000 });
fs.rmSync('.serve-smoke-boot.mjs', { force: true });
fs.rmSync(dbPath, { force: true });
// (Implementation note for the executor: replace spawnSync with a spawn that
// stays alive, parse PORT from stdout, then issue the request below, then kill.)

function query(port) {
  return new Promise((resolve, reject) => {
    const r = http.request({ host: '127.0.0.1', port, method: 'POST', path: '/api/db/allRows',
      headers: { 'content-type': 'application/json', 'x-timestep-token': 'smoke', host: `127.0.0.1:${port}` } },
      res => { let d = ''; res.on('data', c => (d += c)); res.on('end', () => resolve(JSON.parse(d))); });
    r.on('error', reject); r.end(JSON.stringify({ file: dbPath, sql: 'SELECT x FROM t' }));
  });
}
// Executor: wire boot→port→query; assert rows deepEqual [{x:99}]; print PASS/FAIL + os.platform()+os.arch().
console.log('serve-smoke scaffold on', os.platform(), os.arch());
```

> Executor note: this script is a scaffold — finish the boot/port/query/kill wiring so it exits non-zero on failure. Keep it dependency-free (no playwright) so it runs over plain SSH.

- [ ] **Step 2: Write the manual dialog check**

Create `scripts/serve-dialog-check.mjs`:

```js
// Manual one-click check of the native dialog on the host OS. Run in a
// GRAPHICAL session (osascript needs Aqua + Automation grant; WinForms needs
// an interactive desktop). Pops the picker; prints the sanitized path.
//   node --import tsx scripts/serve-dialog-check.mjs
import { makeDialogs } from '../app/serve/dialog.ts';
const d = makeDialogs();
const res = await d.openDialog({});
console.log(JSON.stringify(res));
```

Add to `package.json` scripts: `"smoke-serve": "node scripts/serve-smoke.mjs"`.

- [ ] **Step 3: Run locally on Linux**

Run: `yarn build-serve && yarn smoke-serve`
Expected: prints `PASS` with `linux x64`.

- [ ] **Step 4: Commit, then push the branch**

```bash
git add scripts/serve-smoke.mjs scripts/serve-dialog-check.mjs package.json README.md
git commit -m "serve: cross-platform headless smoke + manual dialog check"
```

Then (with the user's go-ahead to push): `git push -u origin <serve-branch>`.

- [ ] **Step 5: Run on macOS over Tailscale SSH**

```bash
ssh sweeney-macbook-air-228 '
  cd ~/timestep-modernize 2>/dev/null || git clone https://github.com/michaelsweeney/timestep.git ~/timestep-modernize && cd ~/timestep-modernize
  git fetch origin && git checkout <serve-branch> && git pull
  yarn install && yarn --cwd packages/core install
  yarn build-serve && yarn smoke-serve
'
```
Expected: `PASS darwin arm64`. (If native sqlite3 fails to build, that's the Xcode CLT prerequisite — install and retry.) Then, in a graphical session on the Mac, run `node --import tsx scripts/serve-dialog-check.mjs`, pick a file, confirm a clean POSIX path prints.

- [ ] **Step 6: Run on Windows over Tailscale SSH (when `swee-4070` is online)**

```powershell
ssh swee-4070 "cd timestep-modernize; git fetch origin; git checkout <serve-branch>; git pull; yarn install; yarn --cwd packages/core install; yarn build-serve; yarn smoke-serve"
```
Expected: `PASS win32 x64`. (sqlite3 native build needs VS2022 build tools — same toolchain `release.yml` pins via `windows-2022`.) Then, in an interactive desktop session, run `node --import tsx scripts/serve-dialog-check.mjs` and confirm the WinForms picker returns a `C:\...` path.

- [ ] **Step 7: README note**

Add a short note to `README.md` under "Run in a browser": that `yarn serve` runs the same UI locally against **native sqlite3** for large files (the in-browser build remains the no-install demo for smaller files). Do not rewrite the install/landing sections — that's a separate track.

```bash
git add README.md
git commit -m "docs: note yarn serve (local native-sqlite3) in README"
```

---

## Self-Review

**Spec coverage:** server core + 7 endpoints (Tasks 3-4) ✓; native dialogs (Task 5) ✓; renderer shim + `getPathForFile` stub (Task 6) ✓; build config/no-sql.js/Node-only-exclusion (Task 7) ✓; loopback+token+exact Host/Origin+upgrade-reject+no-CORS (Task 3) ✓; eso per-key mutex (Task 2) ✓; ephemeral port + XDG cache dir + long timeouts (Task 7) ✓; sqlite3 ABI split (Tasks 1, 7) ✓; cross-platform verification (Task 8) ✓; drag-drop deferred (Global Constraints) ✓. Out-of-scope per spec and excluded here: npm/`bin` packaging, hosted-demo dataset, README/landing rewrite, CI-release demotion.

**Placeholder scan:** the only intentional scaffold is `serve-smoke.mjs` (Task 8 Step 1), explicitly flagged with an executor note to finish the boot/port/query wiring — every other step has complete code.

**Type consistency:** `ServeDeps` (Task 3) is reused verbatim in Tasks 4/7; `makeEsoConverter` (Task 2) → `convertEso` dep; `makeDialogs` (Task 5) → `openDialog`/`saveDialog` deps; `installHttpApi` (Task 6) ↔ the `/api/*` paths in `route()` (Task 3). The renderer's `window.api` shape matches `app/preload.js` exactly.
