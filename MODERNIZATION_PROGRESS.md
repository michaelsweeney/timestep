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
  `contextIsolation: true`. Renderer talks to main only through a narrow
  `window.api` bridge (`app/preload.js` + `app/ipc-handlers.ts`).
  Drive-by fixes: `readBnd` async correctness; `copysave.tsx` had the
  same `showSaveDialog` arg-order bug; `dbproto.tsx` removed.
- **Renderer build fix** — `target: 'web'` and empty `externals` on the
  renderer configs so the bundle doesn't depend on a Node `require` at
  runtime. Removed the dev DLL pre-bundle. App.html now reads dev mode
  from a URL query param (passed by main) since `process` is no longer
  available to the renderer.
- **Electron 7 → 41 + ecosystem** — full bump:
  - electron 7.1.13 → ^41.0.0
  - electron-builder ^22 → ^26
  - electron-rebuild ^1 → @electron/rebuild ^4
  - electron-devtools-installer ^2 → ^4 (with v3+ options-object API)
  - sqlite3 4.2.0 → ^5.1.7 (in app/package.json)
  - Dropped electron-updater + electron-log (auto-update class was
    dead code; not instantiated anywhere)
  - Dropped electron-debug v4 (uses `node:`-prefixed imports webpack 4
    can't resolve). Devtools are now opened directly in main when in
    dev mode.
  - Dropped `devtron` (long-deprecated since 2018).
  - Replaced `extends browserslist-config-erb` with explicit
    `last 2 chrome versions` (we control which Chromium ships).
  - `webpack.config.base.js`: `output.hashFunction: 'sha256'` (works
    around webpack 4's md4 default that OpenSSL 3 / Node 17+ rejects).
  - Build/dev scripts set `NODE_OPTIONS=--openssl-legacy-provider`
    because terser-webpack-plugin v2 also uses md4 internally and
    ignores `hashFunction`. Both shims go away with webpack 5.
  - Added `skipLibCheck: true` to `tsconfig.json`.
  - File.path drag-drop → `webUtils.getPathForFile` exposed via
    preload (File.path was removed in Electron 32+).
  - `webPreferences.sandbox: false` set explicitly (required for
    preload to use webUtils; sandbox tightening is future work).
- **Case-sensitivity fixes** — `Multilinecontrol` →
  `multilinecontrol`, `Multilinelegend` → `multilinelegend`,
  `@material-ui/core/typography` → `Typography`. These were broken on
  Linux (case-strict) but worked on macOS HFS+.

- **Dev workflow boot-up on Electron 41 / Plasma 6 Wayland**
  (commit `3a4cfc3`) — first-time runtime testing surfaced six small
  but load-bearing fixes:
  - `internals/scripts/CheckNativeDep.js` early-returns when there are
    no native modules in the root tree. Its empty-list path called
    `npm ls  --json` with no args, which on npm 11 (Node 24) returns
    the whole root dep set and got every JS root dep mis-flagged as
    native — hard-blocking `yarn install`.
  - `app/package.json` declares `"type": "commonjs"` so Electron 41's
    `await import()`-based entry load routes through the CJS loader,
    which is where `@babel/register`'s extension hook lives.
  - New `app/main.dev.cjs` shim that requires
    `internals/scripts/BabelRegister` then `./main.dev.ts`. Necessary
    because the `-r BabelRegister` flag stopped intercepting the
    entry under Electron 41 / Node 22's dynamic-import-based entry
    path. The `.cjs` extension forces CJS load regardless.
  - `start-main-dev` script points at the shim and passes
    `--ozone-platform=x11`. KDE Plasma 6 was creating the
    native-Wayland surface but never presenting it; XWayland works.
  - Deleted orphan `app/app.global.css`. Nothing imported it, but
    `TypedCssModulesPlugin`'s glob picked it up and choked on its
    `@import '~@fortawesome/...'` (`~` prefix removed in css-loader 6+).
  - `app/app.html` — block-scope the two inline `<script>` tags. Both
    declared top-level `const params`, and classic script tags share
    the global lexical environment → SyntaxError before React mounted.

- **Renderer loads same-origin in dev** (commit `0d130d0`) — Chromium's
  Local Network Access (successor to PNA) blocks `file://` →
  `http://localhost` script loads, which 403'd `renderer.dev.js` in
  DevTools. In dev, main now loads `app.html` *from* the dev server
  so the document and the renderer bundle share the
  `http://localhost:PORT` origin. Prod still loads via `file://` inside
  the asar (both HTML and `renderer.prod.js` co-located → same-origin).
  Codex was the second pair of eyes that recommended this approach
  over a Chromium command-line flag; archived rationale in
  `.claude/handoffs/2026-05-22-electron-41-renderer-403-pna.md`.

- **Dropped react-hot-loader v4** (commit `d91b478`) — was broken
  under webpack 5 (HMR patch references the CJS `module` global,
  absent in `target: 'web'` bundles) and React 16.6+ (needs
  `@hot-loader/react-dom` aliased over `react-dom`; the alias never
  made the webpack 5 migration). Was planned as Phase 1 (Fast Refresh
  replacement) — pulled forward because the three touchpoints (index
  AppContainer wrap, App.tsx `hot()` HOC, dev webpack entry) were
  smaller than debugging the broken v4. The PLAIN_HMR substitution
  added in `7656f68` was also removed (dead with hot-loader gone).
  Fast Refresh / HMR is gone until the React 18 bump; full reload
  via `Ctrl+R` works.

- **Reference test models** (commit `c3b5d09`) — 20 ASHRAE 901
  prototype tabular `.htm` reports across building-type × climate-zone
  matrix, checked in under `test-models/`. Matching `.sql` databases
  are gitignored (binary, ~7-8 MB each).

## What now actually builds

Both `yarn build-renderer` and `yarn build-main` complete cleanly.
TypeScript still has 3 pre-existing errors in `app/src/store/index.tsx`
from a Babel-only `export X from '...'` syntax — orthogonal to this
work.

## Smoke-test status

Verified by running on Linux / KDE Plasma 6 Wayland:

1. ✅ `yarn install` completes at root + `app/`; native sqlite3
   rebuilds against Electron 41 via `@electron/rebuild`.
2. ✅ `yarn dev` boots; renderer dev server on :1212; Electron
   window appears; React mounts; renderer DevTools shows only the
   benign CSP dev-warning. (Required the six fixes above to get
   here.)

Still to drive in the UI:

3. Click "Load Files" → native dialog opens, a `.sql` file loads,
   chart renders.
4. Drag a `.sql` file onto "Load Files" → file loads. **Riskiest
   item** — exercises `webUtils.getPathForFile` inside the
   contextBridge (the Electron 32+ File.path migration).
5. Same drag-drop test on "Load Session" with a `.tss`.
6. Drag a non-`.sql` file → MUI Snackbar warning.
7. Open a chart view; values render; m3/s units pick up cfm/gpm
   from a sibling `.bnd` file (this fixes a longstanding bug).
8. "Save Session" / "Load Session" round-trips.
9. "Copy" / "Save to CSV" buttons work; clipboard receives data.
10. "Info" button opens timestep.herokuapp.com in OS browser.
11. `yarn package` produces a working artifact on at least one
    platform (macOS / Linux / Windows).
12. Re-run on macOS and Windows before merging — the fixes above
    are Linux-shaped (ozone-platform flag, case-sensitivity, etc.).

## In progress

- **TypeScript 3.7 → 5.9** — partially landed.
  - typescript bumped to ^5.9.0; @types/node bumped to ^20.
  - tsconfig `baseUrl` + `paths` added so `src/...` imports resolve.
  - Pre-existing Babel-only `export X from '...'` in
    `app/src/store/index.tsx` rewritten to standard ES form.
  - tsconfig loosened: `noImplicitAny`, `useUnknownInCatchVariables`,
    `noUnusedLocals`, `noUnusedParameters` set to false. This is a
    necessary concession because `yarn ts` was effectively never
    running (it was bailing on syntax errors before semantic
    analysis), so the codebase has 5+ years of un-flagged
    type debt.
  - **`yarn ts` went from 853 errors → ~213.** The remainder are
    real type issues under `strictNullChecks` etc.: `TS2339`
    (~80) property-not-on-type, `TS2345` (~51) arg-not-assignable,
    `TS18046` (~42) unknown narrowing, `TS18048` (~11)
    possibly-undefined. Not blocking the bundler (Babel doesn't use
    tsc), but `yarn ts` does not pass.

- **Webpack 4 → 5** — landed.
  - webpack ^4.41 → ^5.106, webpack-cli ^3 → ^7,
    webpack-dev-server ^3 → ^5, webpack-merge ^4 → ^6 (drops the
    `merge.smart` API; converted to plain `merge()`).
  - Loaders: babel-loader ^8 → ^10, css-loader ^3 → ^7,
    style-loader ^1 → ^4, sass-loader ^8 → ^16,
    mini-css-extract-plugin ^0.9 → ^2, terser-webpack-plugin ^2 → ^5.
  - file-loader / url-loader removed entirely; replaced with
    webpack 5 native asset modules (`type: 'asset'` /
    `'asset/resource'`) for fonts and images.
  - optimize-css-assets-webpack-plugin (webpack 4 only) replaced
    with css-minimizer-webpack-plugin ^8.
  - `webpack-bundle-analyzer` ^3 → ^5.
  - `typed-css-modules-webpack-plugin` ^0.1 → ^0.2.
  - `@babel/core` and the babel presets bumped to ^7.24; dropped
    seven `plugin-proposal-*` plugins that have moved into
    `@babel/preset-env` since (class-properties, json-strings,
    logical-assignment-operators, nullish-coalescing-operator,
    numeric-separator, optional-chaining, export-namespace-from).
  - Removed `@types/webpack` (was pinned to webpack 4 types).
  - **Removed both shims** the Electron bump added:
    `NODE_OPTIONS=--openssl-legacy-provider` from build/dev scripts
    and `output.hashFunction: 'sha256'`. Webpack 5 + terser v5
    don't use md4.
  - Webpack configs renamed from `*.babel.js` to plain `*.js` and
    converted to CommonJS — webpack-cli v6+ no longer auto-loads
    `.babel.js` configs through `@babel/register`. Internal scripts
    (`CheckNodeEnv`, `DeleteSourceMaps`) follow the same change.
  - Externals moved from `webpack.config.base.js` to
    `webpack.config.main.prod.js` only — they belong to the main
    process bundle, not the renderer.
  - Asset module rule paired with `resolve: { fullySpecified: false }`
    on `*.m?js` to match webpack 4 / Node CJS resolution semantics
    (MUI's esm builds depend on this).
  - dev-server v5: `before()` hook → `setupMiddlewares`; static
    config switched to the new `static: { directory }` shape.
  - **`yarn build-renderer` and `yarn build-main` both succeed**
    on webpack 5. Renderer artifact is 647 KiB minified
    (acceptable for a React + MUI + D3 + Redux app; size budget
    can be tackled with code-splitting in a later pass).

## Known follow-ups (Phase 1)

- **Finish the TS bump** — work through the remaining ~213 type
  errors. Many will fall to typed prop interfaces on the Redux-
  connected components; some are genuine null-safety issues.
- **React 16 → 18** + add Fast Refresh. react-hot-loader is already
  gone (see "Done"); no HMR until the React 18 work lands.
- **MUI 4 → 5** — `makeStyles` → `styled`/`sx`, `createMuiTheme` →
  `createTheme`.
- **D3 5 → 7** — fix `mouse`/`event` API removal in `multiline.tsx`
  and the `(event, datum)` callback signature change everywhere.
- **Re-enable sandbox** — currently `sandbox: false` so the preload
  can call `webUtils.getPathForFile`. Move dialog/file-input handling
  to main-side and tighten sandbox to `true`.
- **TS strict-mode payoff** — components are still typed as `props`
  with no shape; add prop interfaces incrementally.
- **Remove the Babel `export X from '...'` proposal** in
  `app/src/store/index.tsx` (also fixes the 3 standing tsc errors).

## Architecture notes

- `app/preload.js` is plain JavaScript so no extra build step is
  needed. Renderer-side type surface in
  `app/src/types/electron-api.d.ts` is hand-maintained.
- `ipc-handlers.ts` caches `sqlite3.Database` handles in a
  module-level Map keyed by file path. Handles are never closed.
  Fine for the current "open one file, view it, quit" usage.
- Browser-hosted version (per `MODERNIZATION.md`) is a separate
  long-running track; nothing on this branch progresses it directly,
  but the IPC abstraction is shaped so swapping main's sqlite3 for
  sql.js is mechanical.
