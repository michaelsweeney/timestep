# Modernization progress

Tracking the work-in-progress against `MODERNIZATION.md` (on branch
`copilot/2026-modernize`). All work below lives on
`claude/review-modernize-suggestions-iz1Vo`.

## Done

- **Phase 0 surgical fixes** — duplicate `SET_ACTIVE_VIEW` reducer case,
  `showSaveDialog` arg order, blocking `alert()` → MUI `<Snackbar>`,
  hard-coded `year = 2017` → dynamic.
- **node-sass → sass swap** — unblocks `yarn install` on Node 18+.
- **Renderer security refactor** — `nodeIntegration: false`,
  `contextIsolation: true`, all `electron.remote` / `fs` / `sqlite3`
  imports removed from the renderer. Communication is now exclusively
  through a narrow `window.api` surface defined in `app/preload.js`
  and backed by IPC handlers in `app/ipc-handlers.ts`.
  - Drive-by fix: `readBnd` was returning an empty object before
    `fs.readFile`'s callback fired, so the m3/s → cfm/gpm fluid-type
    detection silently never worked. Now async/await-correct.
  - Drive-by fix: same `showSaveDialog(formatstr, options)` arg-order
    bug existed in `copysave.tsx`'s "Save to CSV" path.
  - Removed `app/src/sql/dbproto.tsx` (no longer needed — the
    `Database.prototype.allAsync` patch is replaced by the IPC handler).

## Not yet smoke-tested

The renderer security refactor has not been run against an actual
Electron build. **Before merging, manually verify**:

1. `yarn dev` boots without errors. The preload script
   (`app/preload.js`) is loaded; check the renderer console for
   `Uncaught ReferenceError: api is not defined` — if you see that,
   the preload didn't load.
2. Click "Load Files" → native file picker opens, a `.sql` file loads
   and the file list populates.
3. Drag a `.sql` file onto "Load Files" → same.
4. Drag a non-`.sql` file → bottom-center MUI Snackbar warning
   appears (no `alert()` popup).
5. Open a chart view → values render. Specifically check a series
   with `m3/s` units when the matching `.bnd` file is alongside the
   `.sql` — the IP units should be `cfm` (Air) or `gpm` (Water);
   previously these silently fell through to the default because of
   the `readBnd` bug.
6. "Save Session" → file picker opens, writes a `.tss`. Cancel works.
7. "Load Session" → reads a `.tss` and restores views.
8. "Copy" / "Save to CSV" buttons on a chart work; clipboard receives
   the data.
9. "Info" button (`InfoOutlinedIcon`) opens the timestep website in
   the OS default browser.
10. Open a SQL file lacking a `Year` column → timestamps show the
    current year, not 2017.

Watch the **main process** stdout for any unhandled IPC errors
(they'll surface as rejected `ipcRenderer.invoke` promises in the
renderer console).

## Architecture notes for future work

`app/preload.js` is intentionally plain JavaScript so it doesn't need
its own webpack pipeline. The renderer-side type surface lives in
`app/src/types/electron-api.d.ts` and must be kept in sync with the
preload by hand. If you find yourself reaching for a richer type
contract, the next step is to add a small `webpack.config.preload.babel.js`
and emit `app/preload.js` from `app/preload.ts`.

`ipc-handlers.ts` caches `sqlite3.Database` handles in a module-level
`Map` keyed by file path. They're never closed. That's fine for the
current "open one file, view it, quit" usage but would leak in a
session that loads many files. Add `db:closeFile` to the API if it
becomes a concern.

## Suggested next step

**Bump Electron 7 → latest stable** (~34). With this branch in place,
the bump is now mostly mechanical:

- `remote` is already gone, so the Electron 14 removal isn't a blocker.
- `nodeIntegration` is already off, so the default change in Electron
  12 isn't a blocker.
- `sqlite3@4.2.0` won't load against modern Electron's Node ABI — bump
  to `sqlite3@^5.1.7` (or migrate to `better-sqlite3` for synchronous
  in-process queries; the IPC layer would simplify since main can
  reply without async wrapping).
- The Electron 7 → modern jump also hits: drag-and-drop `File.path`
  is gone in Electron 32+ (use `webUtils.getPathForFile()` in the
  preload), `webContents.openDevTools()` arg shape, native menu APIs.

After Electron, continue with Phase 1 toolchain (React 16→18, TS
3.7→5, MUI 4→5, D3 5→7, drop `react-hot-loader`).
