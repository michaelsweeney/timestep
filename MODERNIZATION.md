# Timestep — 2026 Modernization Guide

This document reviews the current codebase (as of the `0.2.0` release) and proposes concrete modernization steps across three dimensions:

1. **Dependency & toolchain upgrades** — bringing every package to a current, supported version.
2. **Code quality improvements** — fixing bugs, adopting idiomatic patterns, and tightening TypeScript.
3. **Browser-hosted version** — eliminating the Electron dependency so users can run Timestep directly in a browser tab via a local server.

---

## Table of Contents

- [Current Stack Snapshot](#current-stack-snapshot)
- [Critical Issues (Fix Now)](#critical-issues-fix-now)
- [Dependency Upgrades](#dependency-upgrades)
- [Code Quality Improvements](#code-quality-improvements)
- [Browser-Hosted Version](#browser-hosted-version)
- [Testing Modernization](#testing-modernization)
- [Build Toolchain](#build-toolchain)
- [Suggested Prioritized Roadmap](#suggested-prioritized-roadmap)

---

## Current Stack Snapshot

| Concern | Current | Latest Stable (2026) |
|---|---|---|
| Electron | 7.1.13 (2019) | ~34.x |
| React | 16.12.0 | 19.x |
| Material UI | 4.x (`@material-ui/core`) | 6.x (`@mui/material`) |
| Redux Toolkit | 1.4.0 | 2.x |
| TypeScript | 3.7.5 | 5.x |
| Webpack | 4.x | 5.x (or Vite 6) |
| D3 | ~5.x | 7.x |
| node-sass | 4.x (deprecated) | sass (dart-sass) 1.x |
| react-hot-loader | 4.x (deprecated) | React Fast Refresh |
| React Router | 5.x | 6.x |
| connected-react-router | 6.x | N/A (router in v6 is store-agnostic) |
| sqlite3 | native binary | sql.js (WASM) for browser |
| Node.js engine target | `>=7.x` | `>=20.x` |

---

## Critical Issues (Fix Now)

These are bugs or security risks in the **current** codebase, independent of any planned upgrade.

### 1. Duplicate reducer `case` (silent bug)

**File:** `app/src/store/reducers/sessionreducer.tsx`

`SET_ACTIVE_VIEW` is defined twice in the same `switch` statement. The second definition is dead code — it is silently ignored by JavaScript. The two bodies happen to be identical, so no functional bug exists today, but it is a maintainability trap.

```ts
// ❌ duplicate — remove the second one
case 'SET_ACTIVE_VIEW':
  return { ...state, activeViewID: action.payload };
// ... many other cases ...
case 'SET_ACTIVE_VIEW': {           // ← dead code, never reached
  return { ...state, activeViewID: action.payload };
}
```

**Fix:** Remove the duplicate case (lines 72–77 of `sessionreducer.tsx`).

---

### 2. `nodeIntegration: true` with no `contextIsolation`

**File:** `app/main.dev.ts`

```ts
webPreferences: {
  nodeIntegration: true   // ← any injected script has full Node.js access
}
```

This is a well-documented Electron security vulnerability. If the renderer ever loads remote content or is exposed to XSS, an attacker gains full filesystem and shell access.

**Fix (Electron path):**
- Set `contextIsolation: true` (Electron ≥ 12 default).
- Set `nodeIntegration: false`.
- Move all Node/filesystem calls to the **main process**.
- Expose a narrow API to the renderer via a `preload` script using `contextBridge.exposeInMainWorld`.

---

### 3. `electron.remote` usage

**Files:** `app/src/components/filehandler.tsx`, `loadsession.tsx`, `savesession.tsx`

`remote` was deprecated in Electron 12 and removed in Electron 14. All three components call `remote.dialog.showOpenDialog` / `remote.dialog.showSaveDialog`. The app will break on any upgrade past Electron 13.

**Fix:** Move dialog calls to the main process and communicate via IPC (`ipcMain` / `ipcRenderer`).

---

### 4. `alert()` used for user-facing errors

**Files:** `filehandler.tsx`, `loadsession.tsx`

```ts
alert('file loading error: only valid SQLite files allowed');
```

`alert()` blocks the entire renderer thread, is unstyled, and is unavailable in a browser Worker or in Electron with `sandbox: true`.

**Fix:** Replace with a Material UI `Snackbar` or `Dialog` component managed via Redux state or React context.

---

### 5. Non-standard `file.path` in drag-and-drop

**Files:** `filehandler.tsx`, `loadsession.tsx`

```ts
let files = Object.values(e.dataTransfer.files).map(f => f.path);
```

`File.prototype.path` is a **non-standard Electron extension** of the Web `File` API. It does not exist in any browser. This is one of the main blockers for a browser-hosted version.

**Fix (browser):** Use `FileReader` / `file.arrayBuffer()` to read file contents; pass the `File` object itself rather than a path string.

---

### 6. D3 `mouse()` and `event` (removed in D3 v7)

**File:** `app/src/components/views/chartcontrol/charts/multiline.tsx`

```ts
import { mouse, event } from 'd3';
// ...
let xpos = xScale.invert(mouse(this)[0]);
// ...
.style('left', (event.pageX / window.innerWidth) * -500 + event.pageX + 'px')
```

`d3.mouse` and the global `d3.event` object were **removed in D3 v7** (2020). Migration is required before upgrading D3.

**Fix:** Replace `mouse(this)` with `d3.pointer(event, this)`, and pass the native `event` parameter from handler arguments rather than the global `d3.event`.

---

### 7. Hard-coded year fallback in `getseries.tsx`

```ts
year = 2017; // new Date().getFullYear();
```

The commented-out alternative (`getFullYear()`) would at least be dynamic, but even that is wrong: EnergyPlus SQL files typically simulate a design year that may not match the current calendar year. The hard-coded 2017 will silently produce incorrect timestamps for any simulation that does not include a `Year` column.

**Fix:** Document the fallback clearly or derive the year from the simulation metadata in `getFileSummary`.

---

## Dependency Upgrades

### React 16 → React 19

React 19 ships with major ergonomic improvements: the new `use()` hook, `useActionState`, `useOptimistic`, automatic `memo` for function components, and the new JSX transform (no `import React` needed in every file).

- Remove `react-hot-loader` and `@hot-loader/react-dom` (both archived/unmaintained).
- Enable **React Fast Refresh** via the Vite or Webpack 5 plugin instead.
- The `hot()` HOC wrapping `App.tsx` can be removed entirely.

### Material UI v4 → MUI v6

MUI v5 introduced the `sx` prop and the `styled` API, both of which replace `makeStyles`. `makeStyles` was kept in a compatibility package (`@mui/styles`) through v5 but is fully removed in v6.

Migration steps:
1. Replace `@material-ui/core` → `@mui/material`.
2. Replace all `makeStyles` calls with either the `sx` prop (for inline one-off styles) or `styled()` from `@mui/material/styles` (for reusable styled components).
3. Replace `createMuiTheme` → `createTheme`.
4. Replace `StylesProvider` / `createGenerateClassName` → `StyledEngineProvider` with `injectFirst` if CSS ordering is needed.

### Redux Toolkit: adopt `createSlice`

The app imports `@reduxjs/toolkit` but still hand-writes action creators and string `type` constants. This is the old "plain Redux" pattern and loses the main benefit of RTK.

**Current pattern (verbose, error-prone):**
```ts
// actions/index.tsx
export function setActiveView(id) {
  return { type: 'SET_ACTIVE_VIEW', payload: id };
}

// sessionreducer.tsx
case 'SET_ACTIVE_VIEW':
  return { ...state, activeViewID: action.payload };
```

**Modern RTK pattern (less code, typed, no string typos):**
```ts
// store/sessionSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    setActiveView(state, action: PayloadAction<number>) {
      state.activeViewID = action.payload;
    },
    // ...
  }
});

export const { setActiveView } = sessionSlice.actions;
export default sessionSlice.reducer;
```

Converting both `sessionreducer.tsx` and `viewreducer.tsx` to slices eliminates all the manual action type strings and produces fully-typed action creators automatically.

### TypeScript 3.7 → 5.x

TypeScript 5 adds:
- Decorators (Stage 3 standard)
- `const` type parameters
- `satisfies` operator (great for Redux state types)
- Variadic tuple types
- Much improved inference for generic functions

Update `tsconfig.json` `target` from `es5`/`es6` to `ES2022` or `ESNext` and enable `strict: true` throughout.

### React Router 5 → React Router 6

React Router 6 (and v6.4 data router) removes `Switch`, `Redirect`, and the `history` package dependency. Routes are defined with `<Routes>` + `<Route element={…} />` instead of `component=`.

The app only uses routing to switch between views and a landing page, so the migration is relatively small:
- Remove `connected-react-router` (no longer needed — React Router 6 does not require Redux integration).
- Replace `<Switch>` with `<Routes>`, `<Route component={X}>` with `<Route element={<X />}>`.
- Remove the `history` v4 package.

### D3 5 → D3 7

Beyond the `mouse`/`event` fixes above, D3 v7:
- Switches all selection callbacks to receive `(event, datum)` arguments.
- Removes `d3.scan` in favour of `d3.leastIndex`.
- Improves TypeScript types.

Review all D3 usage in `multiline.tsx`, `heatmap.tsx`, `scatter.tsx`, `histogram.tsx`, and `statistics.tsx` for the callback signature change.

### node-sass → sass (dart-sass)

`node-sass` is archived and no longer maintained. It does not support modern Sass syntax. Replace:
```
node-sass  →  sass
sass-loader (update to latest)
```

### Webpack 4 → Vite 6

Webpack 4 startup time on this project is typically 15–30 s. Vite 6 with native ESM provides sub-second cold starts and instant HMR. For a project of this size the migration is straightforward:

1. Delete all files in `configs/`.
2. Add `vite.config.ts` with `@vitejs/plugin-react` (for Fast Refresh) and `vite-plugin-electron` (to keep the Electron build path).
3. Replace `webpack-dev-server` with `vite`.
4. Update scripts in `package.json`.

If keeping Webpack, upgrade to Webpack 5 (drops IE 11, better tree-shaking, persistent cache, Module Federation support).

---

## Code Quality Improvements

### Full TypeScript strict mode

Most component props are typed as `any` or not typed at all:

```ts
const App = props => { … }          // props: any
const FileHandler = props => { … }  // props: any
```

Enable `"strict": true` in `tsconfig.json` and type every component prop, action, and state interface. Use RTK's `createSlice` to auto-generate action types (see above).

### Replace `connect()` HOC with `useSelector` / `useDispatch`

The app uses a custom `connect` wrapper from `src/store/connect`. React-Redux 7+ ships typed hooks that are simpler and avoid the double-component wrapping:

```ts
// Before
const mapStateToProps = state => ({ files: state.session.files });
export default connect(mapStateToProps)(FileHandler);

// After
const files = useSelector((state: RootState) => state.session.files);
const dispatch = useAppDispatch();
```

### Add React Error Boundaries

No error boundaries exist anywhere in the component tree. A crash in a single chart view takes down the entire application. Wrap `ChartTypeControl` (and each chart type) in an `ErrorBoundary` component.

### Fix `savesession.tsx` argument order

```ts
// ❌ arguments are reversed — first arg should be options, second is the browserId
remote.dialog.showSaveDialog(formatstr, options)

// ✓ correct
remote.dialog.showSaveDialog(options)
```

The current call passes the JSON string as the first argument (which Electron's dialog API ignores) and the options object second. This silently fails to save on newer Electron versions.

### Remove dead/commented code

- `app/src/components/App.tsx` contains a commented-out `useEffect` block intended for testing only.
- `main.dev.ts` has multiple commented-out `webPreferences` blocks and a commented-out `openDevTools()` call.
- `configureStore.tsx` imports `createStore` from `redux` but never uses it.
- `mappedviews.tsx` declares `resizeTimer` inside the effect instead of outside it, causing a `var`-hoisting style issue.

### Standardize file extensions

The project uses `.tsx` for files that contain no JSX (e.g., `dbproto.tsx`, `getseries.tsx`, `sessionreducer.tsx`, `configureStore.tsx`). Non-JSX files should use `.ts`.

### `opencollective-postinstall` removal

The `postinstall` script runs `opencollective-postinstall`, which prints a funding message and makes a network request on every `yarn install`. Remove it to speed up CI and offline installs.

---

## Browser-Hosted Version

The goal is a version that users can launch by running one command (`npm start` / `npx serve dist`) and opening a browser tab — no Electron installation required. All existing charting and analysis features should be preserved.

### Architecture overview

```
Browser tab
   └── React + Redux + D3 (unchanged UI logic)
           └── sql.js (SQLite WASM) ← replaces sqlite3 native module
                   ↑
           <input type="file"> / Drag-and-drop ← replaces electron.remote.dialog
```

No server-side component is required. The SQLite file is loaded entirely in the browser using the WebAssembly port of SQLite (`sql.js`). All queries run client-side in a Web Worker to avoid blocking the main thread.

### Step-by-step migration

#### 1. Replace `sqlite3` with `sql.js`

`sql.js` (https://github.com/sql-js/sql.js) is SQLite compiled to WebAssembly. It has an almost identical API.

```ts
// Before (Node.js / Electron)
import sqlite3 from 'sqlite3';
const db = new sqlite3.Database(sqlfile);
const rows = await db.allAsync(query);

// After (browser / sql.js)
import initSqlJs from 'sql-js';
const SQL = await initSqlJs({ locateFile: f => `/wasm/${f}` });
const buffer = await file.arrayBuffer();
const db = new SQL.Database(new Uint8Array(buffer));
const result = db.exec(query);
const rows = result[0].values.map(/* reshape to match existing row format */);
```

The WASM binary (`sql-wasm.wasm`) must be served alongside the app bundle. With Vite this is done by placing it in `public/wasm/`.

#### 2. Replace file-system calls

| Current (Electron) | Browser replacement |
|---|---|
| `remote.dialog.showOpenDialog()` | `<input type="file" multiple accept=".sql">` + `onChange` handler |
| `e.dataTransfer.files[n].path` | `e.dataTransfer.files[n]` (the `File` object itself) |
| `fs.readFile(path, 'utf8', cb)` | `file.text()` (async, returns string) |
| `fs.writeFile(path, data, cb)` | `Blob` + `URL.createObjectURL` + programmatic `<a download>` click |
| `fs.existsSync(path)` | Not applicable — pass the `.bnd` file separately or skip BND support in browser mode |

#### 3. Replace `electron.remote` session dialogs

`loadsession.tsx` and `savesession.tsx` both use `remote.dialog` and `fs`. The session format is already JSON, so:

- **Load:** `<input type="file" accept=".tss">` → `FileReader.readAsText()` → `JSON.parse()`.
- **Save:** `JSON.stringify(state)` → `new Blob([…], { type: 'application/json' })` → `<a href={URL.createObjectURL(blob)} download="session.tss">`.

#### 4. Move SQLite queries to a Web Worker

The sql.js WASM runtime can run inside a dedicated Web Worker (or `SharedWorker`) to prevent query execution from blocking UI renders. Use the `Comlink` library to expose a typed async interface from the worker:

```ts
// worker.ts (runs in Web Worker)
import { expose } from 'comlink';
const api = { getAllSeries, getSeries, getFileSummary };
expose(api);

// calling code in the renderer
import { wrap } from 'comlink';
const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
const sqlApi = wrap<typeof api>(worker);
const summary = await sqlApi.getFileSummary(fileBuffers);
```

#### 5. Remove all Electron-specific dependencies

The following packages are only needed for the Electron build. In a standalone browser build they should be excluded (via build configuration or a `browser` field in `package.json`):

- `electron`, `electron-builder`, `electron-rebuild`, `electron-debug`
- `electron-devtools-installer`
- `electron-log`, `electron-updater`
- `devtron`, `spectron`
- `react-hot-loader`, `@hot-loader/react-dom`
- `source-map-support`

#### 6. Serving the browser version

After building a static bundle (`vite build` or `webpack --mode=production`), the app can be served with any static file server:

```bash
# Option A — npx (no global install needed)
npx serve dist

# Option B — Node built-in HTTP server (Node 18+)
node --experimental-network-imports -e "
  const { createServer } = require('http');
  const { readFileSync } = require('fs');
  // ...minimal static server
"

# Option C — Python (always available on macOS/Linux)
cd dist && python3 -m http.server 3000
```

Add a `start:web` script to `package.json`:
```json
"start:web": "vite build && npx serve dist -l 3000"
```

#### 7. Progressive enhancement for BND files

EnergyPlus `.bnd` files (zone/equipment connectivity reports) are currently detected via `fs.existsSync`. In the browser, the user would need to manually drag or select the `.bnd` file alongside the `.sql` file. Show a UI prompt if `.bnd` data would enhance the current view.

---

## Testing Modernization

| Current | Recommended |
|---|---|
| `enzyme` + `enzyme-adapter-react-16` (archived) | `@testing-library/react` |
| `sinon` (mocking) | `vitest`'s built-in mock API or `jest-mock` |
| `testcafe` + `testcafe-browser-provider-electron` | Playwright (E2E for both Electron and browser) |
| `jest` + `babel-jest` | `vitest` (native ESM, no Babel needed, jest-compatible API) |

Vitest integrates with Vite and runs tests in ~1/3 the time of Jest on this codebase size because it reuses the same transform pipeline.

---

## Build Toolchain

### Migrate configs to Vite

The existing `configs/` directory contains four Webpack config files totalling ~500 lines. A Vite equivalent is typically 30–50 lines:

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { src: '/app/src' }
  },
  optimizeDeps: {
    exclude: ['sql.js']   // WASM must not be pre-bundled
  },
  server: { port: 1212 }
});
```

For the Electron build, add `vite-plugin-electron`:

```ts
import electron from 'vite-plugin-electron';
// ...
plugins: [react(), electron([{ entry: 'app/main.dev.ts' }])]
```

### CI pipeline (azure-pipelines.yml)

- Update Node.js version to 20 LTS.
- Cache `node_modules` between pipeline runs.
- Add a separate `build:web` job that produces a static artifact.
- Run Playwright E2E tests in a headless Chrome container.

---

## Suggested Prioritized Roadmap

| Priority | Task | Impact |
|---|---|---|
| 🔴 P0 | Fix duplicate reducer case (sessionreducer) | Bug fix |
| 🔴 P0 | Fix `electron.remote` deprecation | Security / correctness |
| 🔴 P0 | Disable `nodeIntegration` / add `contextIsolation` | Security |
| 🔴 P0 | Fix `savesession` argument order | Correctness |
| 🟠 P1 | Replace `alert()` with MUI Snackbar | UX |
| 🟠 P1 | Upgrade D3 to v7, fix `mouse`/`event` API | Correctness |
| 🟠 P1 | Replace `node-sass` with `sass` | Build correctness |
| 🟠 P1 | Replace `react-hot-loader` with Fast Refresh | Developer experience |
| 🟡 P2 | Migrate Redux to `createSlice` | Code quality |
| 🟡 P2 | Replace `enzyme` with `@testing-library/react` | Testability |
| 🟡 P2 | Upgrade MUI v4 → v6 | Long-term supportability |
| 🟡 P2 | Upgrade React 16 → 19 | Performance, new features |
| 🟡 P2 | Enable TypeScript strict mode | Type safety |
| 🟢 P3 | Migrate Webpack → Vite | Developer experience, build speed |
| 🟢 P3 | **Browser-hosted version** (sql.js + File API) | New capability |
| 🟢 P3 | Add React Error Boundaries | Resilience |
| 🟢 P3 | Replace `testcafe` with Playwright | E2E coverage |
| 🟢 P3 | Move SQLite queries to Web Worker | Performance (browser version) |

---

*Document prepared for the `2026-modernize` branch — May 2026.*
