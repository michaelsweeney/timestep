# Design: `timestep serve` — local native-sqlite3 server

**Date:** 2026-06-21 · **Status:** approved (brainstorming), revised after Codex + opencode-go review · **Repo:** `michaelsweeney/timestep`

## Motivation

timestep has three possible runtimes for its (single, unchanged) renderer, distinguished
only by the I/O layer behind `window.api`:

| Runtime | Engine | Big-file behavior | Status before this work |
|---|---|---|---|
| Electron desktop | native sqlite3 | fast, read by path off disk | exists (v2.0.0) |
| Hosted / `yarn web` (static) | sql.js (WASM) | whole file in tab memory — ~300 MB cliff | exists |
| **`timestep serve`** | **native sqlite3 over localhost** | **fast, read by path off disk** | **this work (new)** |

The hosted/static build loads the entire `.sql` into tab memory (`new SQL.Database(new
Uint8Array(await file.arrayBuffer()))` in `app/src/web/registry.ts`), so a typical
EnergyPlus annual/sub-hourly output (300 MB+) is degraded and the multi-GB / multi-sim
case OOMs the tab. The hosted app is therefore a **demo for small/preloaded data**, not the
real tool.

The real tool must run locally with native sqlite3. The desktop app does this but carries
the unsigned-binary friction (Gatekeeper/SmartScreen) and 3-OS build upkeep. `timestep
serve` delivers native performance **without** distributing a signed binary: it ships over
npm/source, so the OS executable-trust gate never fires.

**Distribution model going forward (context, not part of this spec's build):**
- Hosted static app = zero-friction demo (needs a small preloaded sample dataset — does not
  exist yet; tracked separately).
- `timestep serve` = primary local tool for real EnergyPlus files (this spec).
- Electron desktop = kept as the double-click on-ramp for non-technical users; CI release
  demoted to manual `workflow_dispatch` (tracked separately).

## Core idea

`serve` is the Electron **main process re-hosted over loopback HTTP**, pointed at the user's
real browser. The renderer is **unchanged**: it already talks only to `window.api` and
already expects real filesystem *paths* (that is exactly how the Electron build works). With
server-side native file dialogs returning real paths, the existing path-based flow works
with zero renderer changes.

## Components (each one job)

1. **`app/serve/server.mjs`** — `node:http` server. Binds `127.0.0.1` only on an **ephemeral
   free port** (avoids `EADDRINUSE` across instances; the token makes a fixed port
   unnecessary), prints the URL, opens the browser. Serves the static `app/dist-serve/`
   bundle and exposes `/api/*` endpoints that re-implement the seven handlers in
   `app/ipc-handlers.ts`, backed by the **same** `Sqlite3Engine` (`@timestep/core/sqlite3`)
   and `convertEsoCached` (`@timestep/core/eso-cache`) the desktop app uses. Native sqlite3
   reads files by path off disk here — the point of the tool. Three server-only concerns the
   desktop app didn't have:
   - **eso-cache concurrency.** `convertEsoCached` (`esocache.ts:50–61`) is not atomic across
     concurrent calls — two simultaneous `/api/eso/convert` requests for the same uncached
     `.eso` race on the shared `<sql>.building` temp path. The Electron UI loads files
     sequentially; an HTTP server can get concurrent requests (reloads, retries). Wrap
     conversions in a **per-cache-key async mutex** — serialize same-key, allow different
     keys to run concurrently.
   - **Cache directory.** Desktop uses `app.getPath('userData')/eso-cache`, unavailable in
     plain Node. Use an OS cache path (`${XDG_CACHE_HOME:-~/.cache}/timestep/eso-cache`);
     document it; no eviction in v0 (same as desktop).
   - **Long operations.** Dialog and `/api/eso/convert` endpoints set no (or a very long)
     request timeout — a native dialog waits on the user; a large `.eso` convert can take
     minutes. Concurrent `db.allRows` on the same cached handle serialize inside node-sqlite3
     (correct, not parallel) — documented, not a bug.

2. **`app/serve/dialog.mjs`** — native open/save dialog shell-out behind a single injectable
   function (stubbed in tests). Linux: `kdialog` → `zenity` (whichever resolves on `PATH`);
   macOS: `osascript` (`choose file` / `choose file name`); Windows: PowerShell
   `OpenFileDialog` / `SaveFileDialog`. Hardening from review:
   - **Spawn with argument arrays** (`execFile`/`spawn`), never shell-concatenated commands.
   - **Sanitize dialog output** before returning it to the renderer — trim trailing
     newlines, normalize macOS POSIX paths, reject empty/malformed results; handle user
     cancellation as a clean `{canceled:true}`.
   - **Surface "no dialog tool found" as a structured JSON error** the renderer shows as a
     notification ("Install zenity or kdialog"), not a bare 500. Note the macOS
     Automation/Accessibility permission prompt on first `osascript` use.

3. **`app/src/serve/http-api.ts`** — renderer shim installing `window.api` by `fetch`-ing
   `/api/*`. The parallel of `app/src/web/web-api.ts`. `clipboard.writeText` and
   `shell.openExternal` stay client-side (same as `web-api.ts`). Reads the session token
   from an injected `<meta>` tag and sends it as the `X-Timestep-Token` header on every
   `/api` call.

4. **`app/src/serve/index.tsx`** + **`app/serve.html`** — entry + HTML shell, parallels of
   `app/src/web/index.tsx` / `app/web.html`. The HTML contains a `__TIMESTEP_TOKEN__`
   placeholder in a `<meta>` tag that the server replaces per startup.

5. **`configs/webpack.config.serve.prod.js`** — mirrors `webpack.config.web.prod.js` but
   entry = `app/src/serve/index.tsx`, output `app/dist-serve/`, and **no sql.js** (the
   server runs the SQL, so the WASM engine and its `.wasm` asset rule are dropped). The
   client bundle must **not** pull in the Node-only core modules — `@timestep/core/sqlite3`
   and `@timestep/core/eso-cache` (they `import sqlite3`/`fs`); only `server.mjs` imports
   those. The `http-api.ts` shim imports neither, so a clean graph keeps them out, but the
   config should guard it (exclude/externalize) so a stray import fails the build loudly.

`package.json`: add `build-serve` (webpack + copy `serve.html` → `dist-serve/index.html`)
and `serve` (`build-serve` then `node app/serve/server.mjs`, open browser). npx/`bin`
packaging is **phase 2**.

## API surface (mirrors `window.api` / the 7 IPC handlers)

| `window.api` call | endpoint | server action |
|---|---|---|
| `dialog.openFiles(opts)` | `POST /api/dialog/open` | native open dialog → `{canceled, filePaths}` |
| `dialog.saveFile(opts)` | `POST /api/dialog/save` | native save dialog → `{canceled, filePath}` |
| `fs.readText(path)` | `POST /api/fs/readText` | read file utf8 |
| `fs.writeText(path,contents)` | `POST /api/fs/writeText` | write file |
| `fs.exists(path)` | `POST /api/fs/exists` | `fs.access` → bool |
| `db.allRows(file,sql)` | `POST /api/db/allRows` | `Sqlite3Engine.allRows` |
| `eso.convertToSql(path)` | `POST /api/eso/convert` | `convertEsoCached(path, cacheDir, sqlite3)` |
| `clipboard.writeText` | — | client-side `navigator.clipboard` |
| `shell.openExternal` | — | client-side `window.open` |
| `getPathForFile` | — | **stub that throws a clear error** (see note) |

**`getPathForFile` must be a present stub, not absent.** It's called only inside the
`handleDrop` handlers (`filehandler.tsx:113`, `loadsession.tsx:104`), never at module load —
so the page loads fine without it and the button/dialog flow never touches it. But if the
property is missing, a drag-drop would throw `getPathForFile is not a function`. The
`http-api.ts` shim therefore exposes `getPathForFile: () => { throw new Error('Drag-and-drop
is not available in serve mode — use the Load Files button.') }`, and the renderer surfaces
that via its existing notification path. (A cleaner-but-renderer-touching alternative — hide
the drop zones when `window.api` signals serve mode — is deferred with drag-drop itself.)

## Data flow (one trace)

"Load Files" → `dialog.openFiles` → `POST /api/dialog/open` → server pops native dialog →
`{filePaths:["/home/you/eplusout.sql"]}` → renderer calls `db.allRows(path, sql)` → `POST
/api/db/allRows` → `Sqlite3Engine` opens the file **by path**, queries, returns rows. File
bytes never cross the wire; no whole-file-in-memory. A `.sql` opens directly; an `.eso`
routes through `/api/eso/convert` first, identical to desktop. Sibling `.bnd` resolution
uses `fs.exists`/`fs.readText` on the path the renderer derives from the `.sql` path — same
as Electron.

## Security (the only new attack surface vs v1)

v1/v2 have no listening socket; `serve` adds one with filesystem access. Hardening is a
first-class requirement, not an afterthought:

- **Loopback bind** (`127.0.0.1`), never `0.0.0.0` — no LAN/Wi-Fi exposure of the file-read
  endpoints.
- **Per-startup random token** (`crypto.randomBytes`), injected into the served HTML via a
  `<meta>` tag at **response time** (NOT build time, NOT the URL — avoids a stale on-disk
  token and avoids leaking via history/referer). `http-api` reads it from the meta tag and
  sends it as `X-Timestep-Token`; the server rejects any `/api` request missing/wrong token.
- **Exact Host/Origin match, not suffix.** Require `Host` to exactly equal
  `127.0.0.1:<port>` and, when `Origin` is present, to exactly match the served origin. A
  "contains localhost" check is bypassable by `localhost.evil.test` — do not use it.
- **Authenticate from headers before reading the request body**, so an unauthenticated page
  cannot force a large POST body as a local DoS.
- **Reject WebSocket upgrades outright.** The renderer uses `fetch`, never WS; an
  unhandled `upgrade` event is an Origin-check bypass surface, so the server rejects all
  upgrades.
- **No permissive CORS.** The page and API are same-origin, so the server must **never**
  emit `Access-Control-Allow-Origin` (a debugging convenience that would defeat the whole
  Origin guard). Optional defense-in-depth: a `Content-Security-Policy` (`default-src
  'self'; script-src 'self'`) on the served HTML to raise the XSS-token-theft bar.

**Trust model (corrected from an earlier draft):** paths are *not* all dialog-originated.
`db.allRows`/`fs.readText`/`fs.writeText`/`eso.convertToSql` all take caller-supplied path
strings, and `loadsession.tsx:46` restores file paths from a saved `.tss` JSON (not the
current dialog). So a valid token is a **bearer capability granting the same filesystem
authority the Electron renderer already has** (read/write any path the server process can
reach). This is accepted as in-scope for v0 — identical to the desktop security model — and
the spec states it explicitly rather than claiming a dialog-only path origin. A future
hardening (out of scope) would maintain a server-side allowlist of paths granted by dialogs,
cache outputs, and saved-session contents.

No user **data** exposure is added relative to v1: no uploads, no telemetry in the app. The
only new risk is the local listener, and the above contains it to the machine.

## Testing (TDD)

- Server endpoints are integration-testable headlessly: boot the server on an ephemeral
  loopback port, `POST /api/db/allRows` against a fixture `.sql`, assert rows.
- Security: `/api` call without/with-wrong token → 403; non-localhost `Origin` → 403;
  spoofed `Host` (`localhost.evil.test`) → 403; WebSocket `upgrade` request → rejected; no
  `Access-Control-Allow-Origin` header in any response.
- `/api/eso/convert` against a fixture `.eso` → produces a queryable `.sql`; **two
  concurrent converts of the same uncached `.eso`** both succeed and produce one valid cache
  entry (exercises the per-key mutex / no `.building` corruption).
- Native dialog is stubbed via the injectable in `dialog.mjs` (interactive dialogs are not
  driven in tests).
- Aligns with the existing test harness (core uses vitest; app uses jest — server tests use
  the Node-side harness).

## Scope

**In (v0):**
- Button → native open dialog → native sqlite3 query (the value proposition).
- Native save dialog + server-side write, keeping the renderer byte-for-byte identical to
  Electron (CSV / `.tss` save; clipboard).
- `.eso` conversion via `convertEsoCached`, guarded by a per-cache-key mutex.
- Loopback bind + token + exact Host/Origin + upgrade-reject + no-CORS hardening.
- `getPathForFile` present as a throwing stub (drag-drop disabled but no runtime crash).

**Out (deferred):**
- **Drag-and-drop** — a browser will not expose a dropped file's path (the reason Electron
  needs `webUtils.getPathForFile`, which only works in Electron). v0 is Load-Files-button
  only. An upload-to-temp fallback could be added later; explicitly not now.
- **npx / `bin` distribution** — phase 2; v0 proves it locally via `yarn serve`.
- Preloaded demo dataset for the hosted app; CI-release demotion; README/landing rewrite —
  separate tracks, not this spec.

## Non-goals

- No change to the renderer, the Redux store, `@timestep/core`, or the desktop/web builds.
- No new query/parse logic — `serve` only adds a transport over existing engine code.
