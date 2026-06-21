# Design: `timestep serve` — local native-sqlite3 server

**Date:** 2026-06-21 · **Status:** approved (brainstorming) · **Repo:** `michaelsweeney/timestep`

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

1. **`app/serve/server.mjs`** — `node:http` server. Binds `127.0.0.1` only. Serves the
   static `app/dist-serve/` bundle and exposes `/api/*` endpoints that re-implement the
   seven handlers in `app/ipc-handlers.ts`, backed by the **same** `Sqlite3Engine`
   (`@timestep/core/sqlite3`) and `convertEsoCached` (`@timestep/core/eso-cache`) the
   desktop app uses. Native sqlite3 reads files by path off disk here — the point of the
   tool.

2. **`app/serve/dialog.mjs`** — native open/save dialog shell-out behind a single injectable
   function. Linux: `kdialog` → `zenity` (whichever resolves). macOS: `osascript` (`choose
   file` / `choose file name`). Windows: PowerShell `OpenFileDialog` / `SaveFileDialog`.
   Clear error when none is found. Injectable so tests stub it.

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
   server runs the SQL, so the WASM engine and its `.wasm` asset rule are dropped).

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
| `getPathForFile` | — | not supported in serve v0 (drag-drop deferred) |

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
  `<meta>` tag (NOT the URL — avoids leaking via history/referer). `http-api` sends it as
  `X-Timestep-Token`; the server rejects any `/api` request missing/wrong token **and**
  rejects requests whose `Origin`/`Host` is not localhost. This defeats DNS-rebinding /
  localhost-CSRF (a malicious site open in another tab cannot drive the server).
- Primary-flow paths originate from the server's own native dialog, so there is no
  untrusted-path vector there; the token guard covers the derived-sibling `.bnd` reads.

No user **data** exposure is added relative to v1: no uploads, no telemetry in the app. The
only new risk is the local listener, and the above contains it to the machine.

## Testing (TDD)

- Server endpoints are integration-testable headlessly: boot the server on an ephemeral
  loopback port, `POST /api/db/allRows` against a fixture `.sql`, assert rows.
- Security: `/api` call without token → 403; with a non-localhost `Origin` → 403.
- `/api/eso/convert` against a fixture `.eso` → produces a queryable `.sql`.
- Native dialog is stubbed via the injectable in `dialog.mjs` (interactive dialogs are not
  driven in tests).
- Aligns with the existing test harness (core uses vitest; app uses jest — server tests use
  the Node-side harness).

## Scope

**In (v0):**
- Button → native open dialog → native sqlite3 query (the value proposition).
- Native save dialog + server-side write, keeping the renderer byte-for-byte identical to
  Electron (CSV / `.tss` save; clipboard).
- `.eso` conversion via `convertEsoCached`.
- Loopback bind + token/origin hardening.

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
