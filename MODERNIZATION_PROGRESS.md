# Modernization progress

Tracking the work-in-progress against `MODERNIZATION.md` (on branch
`copilot/2026-modernize`). All work below lives on
`claude/review-modernize-suggestions-iz1Vo`.

## Done

- **`2f11159` — Phase 0 surgical fixes**
  - Removed duplicate `SET_ACTIVE_VIEW` reducer case.
  - Fixed `showSaveDialog` argument order in `savesession.tsx`.
  - Replaced blocking `alert()` with MUI `<Snackbar>` driven by a new
    Redux `notification` field (`SET_NOTIFICATION` / `CLEAR_NOTIFICATION`).
  - Made `getseries.tsx` year fallback dynamic (`new Date().getFullYear()`)
    and documented why a fallback exists at all.
- **`d068c60` — node-sass → sass swap**
  - Replaces archived `node-sass@4` with dart-sass `sass@^1.77`.
  - Unblocks `yarn install` on Node 18+ (no more node-gyp / libsass build).
  - sass-loader 8 auto-detects dart-sass; no webpack config changes.

## Not yet smoke-tested

The Phase 0 fixes have not been run against an actual Electron build.
**Before merging, manually verify**:

1. `yarn dev` boots without errors.
2. Drag a non-`.sql` file onto "Load Files" → bottom-center Snackbar
   appears, no `alert()` dialog, UI thread isn't blocked.
3. Drag a non-`.tss` file onto "Load Session" → same Snackbar behavior.
4. Save Session → file picker opens, saves a `.tss`, cancel exits cleanly.
5. Open an EnergyPlus SQL file lacking a `Year` column → timestamps
   show the current year, not 2017.

## Deferred from Phase 0 (own PR)

Disabling `nodeIntegration` and removing `electron.remote` is a much
larger refactor than the rest of Phase 0 because the `app/src/sql/*`
layer (`getseries`, `getallseries`, `getseriesindex`, `getfilesummary`,
`readbnd`, `dbproto`) calls native `sqlite3` directly from the renderer.
Once `nodeIntegration: false`, `sqlite3` cannot load in the renderer.

To finish: add `app/preload.ts` with `contextBridge.exposeInMainWorld`,
move all SQL/`fs`/`dialog` calls to main and expose them via
`ipcMain.handle` / `ipcRenderer.invoke`, then flip
`nodeIntegration: false` + `contextIsolation: true` in `main.dev.ts`.
Webpack configs need a small change to compile/copy the preload script.
Needs an actual Electron build smoke test on macOS / Windows / Linux.

## Suggested next step

**Bump Electron 7 → latest stable**, then do the security refactor on
top of that bump. Doing them in this order means the IPC/contextBridge
work targets the current Electron API surface rather than 2019's.
This will also fix the `electron-rebuild` warnings during `yarn install`
postinstall.

After Electron + security: continue with Phase 1 toolchain (React 16→18,
TS 3.7→5, MUI 4→5, D3 5→7, drop `react-hot-loader`).
