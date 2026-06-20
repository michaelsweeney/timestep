# Changelog

## 2.0.0 (2026-06-12)

First release of the 2.x line.

### Highlights

- **Open `.eso` files directly.** ESO output is converted to SQLite on the
  fly (cached per file identity), so models without `Output:SQLite` work in
  the app, with no model re-run. Meters are recovered too — both those
  embedded in the `.eso` and meter-file-only ones from a sibling `.mtr`
  (`Output:Meter:MeterFileOnly`, derived meters like `ElectricityNet:Facility`)
  — and the Avg/Sum variable type is restored from a sibling `.rdd`.
- **Runs in a browser.** The same app builds as a static site
  (`yarn build-web`) running SQLite in-tab via WebAssembly (sql.js) — drop a
  `.sql`/`.eso` on the page, nothing uploaded, no install.
- **Honest unit resolution.** One resolver maps SI to IP units and never
  shows an IP label without a real conversion (unknown units display SI).
  m³/s flows resolve cfm vs gpm from the `.bnd` node fluid type, with a
  name-based fallback for non-node water flows; standard-density air flows
  are labeled scfm.
- **Data-quality warnings on load.** The Loaded Files dialog flags fidelity
  caveats instead of degrading silently: flows defaulted to cfm for lack of
  a `.bnd`, cfm/gpm guessed from a variable name, variables shown in SI
  because no IP conversion exists.

### Notes

- Versions before 2.0.0 predate this changelog.
