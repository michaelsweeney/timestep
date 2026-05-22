# Codex Handoff

**Date:** 2026-05-22
**Topic:** electron-41-renderer-403-pna

## Goal

Get the dev workflow (`yarn dev` → renderer dev server + Electron 41 with
context-isolation) working end-to-end so we can drive the modernization
branch's smoke-test checklist. Currently the renderer JS fails to load in
the Electron window with a "403 Forbidden" error in DevTools, even though
the dev server is happily serving the file.

## Question for Codex

(a) Confirm or refute the hypothesis that this is Chromium 134's
**Private Network Access (PNA)** blocking a `file://` → `http://localhost`
request, **OR** identify the actual mechanism if it's something else.

(b) Recommend the cleanest fix among these candidates (or propose a
better one), with reasoning:

  1. Serve `app.html` from the dev server so the renderer is loaded
     same-origin (`http://localhost:1212/app.html?dev=1...`). This is
     the canonical electron-react-boilerplate pattern; the current code
     diverged from it during the contextIsolation refactor.
  2. Launch Electron with a Chromium command-line flag that disables PNA
     (or related) blocking — `--disable-features=BlockInsecurePrivateNetworkRequests`
     or similar. Dev-only.
  3. Add a CSP / specific response headers to the dev server so Chromium
     stops blocking.
  4. Something else.

Smallest sustainable change wins; this is a dev-only concern. We
specifically want to NOT regress production (which loads `app.html` and
`renderer.prod.js` both via `file://` from the asar — same origin, fine).

## Context

### What we observed

- `app/main.dev.ts` calls `mainWindow.loadURL('file://${__dirname}/app.html?dev=1&port=1212')`.
- `app/app.html` has an inline script that does
  `document.write('<script defer src="http://localhost:1212/dist/renderer.dev.js"></script>')`
  for the dev case.
- Renderer DevTools shows:
  ```
  renderer.dev.js:1  Failed to load resource: the server responded
  with a status of 403 (Forbidden)
  ```
- `curl http://localhost:1212/dist/renderer.dev.js` returns 200, **even
  with `-H 'Origin: file://'` or `-H 'Origin: null'`**. The full 13 MB
  bundle streams back. So the dev server is NOT 403-ing — Chromium is
  synthesizing it.
- No 403 / "forbidden" / "private network" / CORS string appears in
  the webpack-dev-server log either.
- Electron is being launched with `--ozone-platform=x11` (forced
  XWayland because KDE Plasma 6 + native Wayland was not presenting
  the window).

### Files in play

- `configs/webpack.config.renderer.dev.js` — current dev-server config.
  Has `headers: { 'Access-Control-Allow-Origin': '*' }`, no
  `allowedHosts`. `static.directory` points to `configs/dist` (which
  is empty / doesn't exist). `setupMiddlewares` spawns the Electron
  main process via `npm run start-main-dev` when `START_HOT=1`.
- `app/main.dev.ts` — main-process entry. Loads `app.html` via
  `file://`. Has the BrowserWindow construction with
  `nodeIntegration: false`, `contextIsolation: true`, `sandbox: false`,
  `preload: path.join(__dirname, 'preload.js')`.
- `app/app.html` — dual-`<script>` HTML. Currently each script block
  is wrapped in `{}` for block scoping (just fixed an unrelated
  `Identifier 'params' has already been declared` bug). In dev, it
  document.write's the dev-server URL; in prod, it loads
  `./dist/renderer.prod.js` relative.
- `app/main.dev.cjs` — shim that registers `@babel/register` then
  requires `main.dev.ts`. Forced into existence because Electron 41's
  default_app.asar loads the entry via `await import()` which bypasses
  `@babel/register`'s CJS extension hooks. Not directly relevant to
  the PNA question but explains the slightly-non-stock dev entry path.
- `package.json` script `start-main-dev`:
  ```
  cross-env START_HOT=1 NODE_ENV=development electron --ozone-platform=x11 ./app/main.dev.cjs
  ```

### Decisions already made

- Renderer must run with `contextIsolation: true` + a preload-based
  IPC bridge (this is a security refactor on the modernize branch we
  do not want to revert).
- Production codepath is fine (asar, same-origin file:// load) and
  should not be touched.
- This is a dev-only fix scope.

### Things already tried

- `ELECTRON_OZONE_PLATFORM_HINT=x11` env var (not honored by Electron 41).
- `electron --ozone-platform-hint=x11` cli flag (also weak; Wayland
  errors persisted).
- `electron --ozone-platform=x11` cli flag (worked — window now
  visible). Unrelated to the 403, but how we got the window on screen.
- Curl from outside the renderer with various Origin headers — server
  always returns 200.

## Scope guardrails

- **Touch:** `configs/webpack.config.renderer.dev.js`, `app/main.dev.ts`,
  `app/main.dev.cjs`, `app/app.html`, `package.json` scripts. Whichever
  subset is needed.
- **Don't touch:** production webpack config, production main bundle,
  renderer React code, preload script, IPC handler surface.
- **Read-only?** No — feel free to apply the fix you recommend, but
  keep the diff surgical and call it out explicitly so the user can
  review before commit. Do not commit; leave changes uncommitted.

## Verification

After the change, the workflow `yarn dev` should:
1. Start the dev server on :1212 (already works).
2. Launch the Electron window (already works).
3. Renderer JS loads — devtools Network panel shows
   `renderer.dev.js` as 200, **not** 403. React mounts. The Timestep
   UI (sidebar + chart area) renders.

No regression in `yarn build-renderer` / `yarn build-main` / `yarn package`.
