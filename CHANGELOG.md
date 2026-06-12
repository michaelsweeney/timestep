# Changelog

## 2.0.0 (2026-06-12)

First release in six years — a full modernization of the 2020-era app.

### Highlights

- **Open `.eso` files directly.** ESO output is converted to SQLite on the
  fly (cached per file identity), so models without `Output:SQLite` work in
  the app. Conversion verified row-identical to native `.sql` output at all
  reporting frequencies. Meters are recovered too — both those embedded in
  the `.eso` and meter-file-only ones from a sibling `.mtr`
  (`Output:Meter:MeterFileOnly`, derived meters like
  `ElectricityNet:Facility`) — and the Avg/Sum variable type is restored
  from a sibling `.rdd`.
- **Runs in a browser.** The same app also builds as a static site
  (`yarn build-web`) running SQLite in-tab via WebAssembly (sql.js) — drop a
  `.sql`/`.eso` on the page, nothing uploaded, no install.
- **Honest unit resolution.** One resolver maps SI to IP units and never
  shows an IP label without a real conversion (unknown units display SI).
  m³/s flows resolve cfm vs gpm from the `.bnd` node fluid type, with a
  name-based fallback for non-node water flows; standard-density air flows
  are labeled scfm. Fixed wrong legacy labels (`kg/m3` → lb/ft³, not
  "lb/cfm").
- **Data-quality warnings on load.** The Loaded Files dialog flags fidelity
  caveats instead of degrading silently: flows defaulted to cfm for lack of
  a `.bnd`, cfm/gpm guessed from a variable name, variables shown in SI
  because no IP conversion exists.
- **Modernized stack.** Electron 7 → 41, webpack 4 → 5, TypeScript 3.7 →
  5.9, React tooling refreshed. Renderer hardened: `nodeIntegration` off,
  `contextIsolation` on, all filesystem/database access through a narrow
  preload bridge.
- **`@timestep/core`.** Query and parsing logic extracted into a tested,
  environment-neutral package (vitest, multi-frequency EnergyPlus fixtures
  plus ESO↔SQL parity tests) powering both the desktop and browser builds.
- **Release pipeline.** Dead Azure CI replaced with GitHub Actions; builds
  published to GitHub Releases (the old site download link had been broken
  since 2024).

### Notes

- Versions before 2.0.0 (`0.2.0` / `0.1.0`) predate this changelog. The
  file previously contained the upstream electron-react-boilerplate
  template history; see that project for pre-fork entries.
