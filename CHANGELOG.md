# Changelog

## 2.0.0 (unreleased)

First release in six years — a full modernization of the 2020-era app.

### Highlights

- **Open `.eso` files directly.** ESO output is converted to SQLite on the
  fly (cached per file identity), so models without `Output:SQLite` work in
  the app. Conversion verified row-identical to native `.sql` output at all
  reporting frequencies.
- **Modernized stack.** Electron 7 → 41, webpack 4 → 5, TypeScript 3.7 →
  5.9, React tooling refreshed. Renderer hardened: `nodeIntegration` off,
  `contextIsolation` on, all filesystem/database access through a narrow
  preload bridge.
- **`@timestep/core`.** Query and parsing logic extracted into a tested,
  environment-neutral package (vitest, multi-frequency EnergyPlus fixtures)
  as the seed of a reusable library.
- **Release pipeline.** Dead Azure CI replaced with GitHub Actions; builds
  published to GitHub Releases (the old site download link had been broken
  since 2024).

### Notes

- Versions before 2.0.0 (`0.2.0` / `0.1.0`) predate this changelog. The
  file previously contained the upstream electron-react-boilerplate
  template history; see that project for pre-fork entries.
