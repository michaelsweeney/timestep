# Timestep

A SQL-based timeseries viewer for [EnergyPlus](https://energyplus.net/) output.
Timestep is a cross-platform desktop app (Electron + React) that loads
EnergyPlus simulation results and lets you explore the timeseries interactively
— line charts, heatmaps, histograms, scatter plots, and summary statistics —
without writing any SQL.

![Multiline chart](docs/screenshots/multiline.png)

## What it does

- **Loads `.sql` and `.eso` output directly.** Point it at an EnergyPlus
  `eplusout.sql` (from `Output:SQLite`) or a raw `eplusout.eso`. ESO files are
  converted to SQLite on the fly and cached, so models without `Output:SQLite`
  work too — conversion is verified row-identical to native `.sql` at every
  reporting frequency.
- **Multiple simulations side by side.** Load several output files and compare
  the same variable across runs on one chart.
- **Searchable variables.** Filter the report-variable dictionary by name to
  find a series quickly.
- **Unit conversion.** Picks up IP/SI conversions (e.g. m³/s → cfm/gpm) from a
  sibling `.bnd` file when present.
- **Export.** Copy series to the clipboard, save to CSV, and save/restore a
  full viewing session (`.tss`).

| | |
|---|---|
| ![Heatmap](docs/screenshots/heatmap.png) | ![Scatter](docs/screenshots/scatter.png) |
| ![Histogram](docs/screenshots/histogram.png) | ![Statistics](docs/screenshots/statistics.png) |

## Install

Download the installer for your platform from the
[Releases](https://github.com/michaelsweeney/timestep/releases) page:

- **macOS** — `.dmg`
- **Windows** — `.exe` (NSIS) or `.msi`
- **Linux** — `.AppImage`, `.deb`, or `.rpm`

## Development

Requires Node.js 18+ (CI runs on Node 24) and Yarn 1.x.

```bash
yarn install                      # root deps
yarn --cwd packages/core install  # @timestep/core (linked workspace)
yarn dev                          # renderer dev server + Electron with reload
```

Common scripts:

```bash
yarn build                    # build main + renderer bundles
yarn --cwd packages/core test # core parsing/query unit tests (vitest)
yarn smoke-ui                 # end-to-end UI smoke test against the built app
yarn package-linux            # build installers for the current platform
```

`yarn smoke-ui` and `yarn eplus-matrix` need local EnergyPlus fixtures; see
`scripts/eplus-matrix.mjs` and `test-models/README` for regenerating them.

## Architecture

- **`app/`** — the Electron app. The renderer runs with `nodeIntegration: false`
  and `contextIsolation: true`; all filesystem and database access goes through
  a narrow preload bridge (`app/preload.js` + `app/ipc-handlers.ts`).
- **`packages/core`** (`@timestep/core`) — environment-neutral parsing and query
  logic (ESO→SQLite conversion, `.bnd` parsing, series queries), extracted as a
  tested, reusable library.

See [`MODERNIZATION_PROGRESS.md`](MODERNIZATION_PROGRESS.md) for the v2.0.0
modernization history and remaining follow-ups.

## License

MIT © 2020–present Michael Sweeney
