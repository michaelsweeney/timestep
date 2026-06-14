# Design — Settings menu, dark mode, and non-contiguous-time warning

Date: 2026-06-14
Status: approved (pending spec review)

Two independent features, built and verified separately:

- **A** — a settings burger menu in the header housing a dark-mode toggle, external links, and an About dialog; dark mode reaches the chrome *and* the chart canvas (not the data color scales).
- **B** — a new load-time data-quality warning for design-day / non-contiguous temporal data.

---

## Feature A — Settings menu + dark mode + About

### Header layout

The logo moves from far-right to second-from-left; a hamburger leads. File/view
controls anchor right.

```
 before:  [ FILES ▾ ] [ view selector ] ················· [ timestep ]
 after:   [ ☰ ] [ timestep ] ················· [ view selector ] [ FILES ▾ ]
```

`header.tsx` currently splits into `headerLeft` (FileMenu + ViewSelector) and
`headerRight` (Logo). The reflow: `headerLeft` becomes `[SettingsMenu][Logo]`,
`headerRight` becomes `[ViewSelector][FileMenu]` (right-aligned). Widths/padding
adjusted; `minWidth: 700` retained.

### Components

**`SettingsMenu` (new — `app/src/components/settingsmenu.tsx`)**
- Hamburger `IconButton` (`@material-ui/icons/Menu`) + MUI `Menu`, mirroring the
  existing `FileMenu` anchor/open/close pattern.
- Items, in order:
  1. **Dark mode** — a `MenuItem` containing a label + MUI `Switch`. Reflects
     `ui.theme === 'dark'`; toggling dispatches `toggleTheme`. Clicking the row
     toggles too (does not close the menu, so the user sees the flip).
  2. divider
  3. **View on GitHub** → `shell.openExternal('https://github.com/michaelsweeney/timestep')`
  4. **Report an Issue** → `…/timestep/issues`
  5. **Latest Release** → `…/timestep/releases/latest`
  6. **About timestep** → opens `AboutDialog`
- External-link helper: `window.api.shell.openExternal`, the same call used in
  `infocontainer.tsx`.

**`AboutDialog` (new — `app/src/components/aboutdialog.tsx`)**
- MUI `Dialog`, opened from the burger. Content:
  - App name (`timestep`) + version, sourced the same way `version.tsx` reads it.
  - One-line description ("EnergyPlus timeseries visualization").
  - Links: GitHub repo, Issues, Latest Release (via `shell.openExternal`).
- Replaces the dead-end `InfoContainer` button (today it only opens the repo).
  `InfoContainer` is removed and its single usage deleted; the About item
  supersedes it.

### Theme state and propagation

Single source of truth: the MUI theme's `palette.type`. Everything — chrome and
chart canvas — derives from it.

- **Store** — add a `ui` slice with `theme: 'light' | 'dark'` (default `'light'`)
  and a `toggleTheme` action, following the existing store/`connect`/actions
  pattern.
- **Persistence** — on `toggleTheme`, write the new value to
  `localStorage['timestep-theme']`. On store init, seed `ui.theme` from
  `localStorage` if present, else `'light'`. No `prefers-color-scheme` follow in
  v1.
- **`App.tsx`** — `connect` to `ui.theme`; build the theme with
  `createMuiTheme({ palette: { type, secondary: { main: grey[800] } } })` and pass
  it to the existing `ThemeProvider`. `CssBaseline` already applies the palette's
  default background/text to the body, so the chrome flips for free; remaining
  hardcoded chrome colors are themed (see below).
- **Chart canvas** — `d3container.tsx`'s `makeStyles` becomes theme-aware:
  - root `backgroundColor`: `theme.palette.type === 'dark' ? '#2b2a2a' : '#fff'`
  - root `color` (drives D3 axis lines via `currentColor`) and a nested
    `'& text, & .axis-text'` `fill` rule: light text on dark, dark on light.
  - Tooltip already dark (`rgb(43,42,42)`) — unchanged.
  - Data encodings (heatmap color scale, series/scatter palettes, histogram
    fills) are **not** touched.
  Because `makeStyles` regenerates when the theme changes via `ThemeProvider`,
  the canvas recolors live without re-rendering the D3 charts.

### Hardcoded chrome colors to theme

Audited; these need to follow the palette (not stay literal) for dark mode to
look right:
- `header.tsx`: `borderBottom: '1px solid rgba(0,0,0,0.3)'` and the box-shadow →
  theme-derived (e.g. `theme.palette.divider`).
- `logo.tsx`: brand colors `#3f51b5` / `#f50057` are intentional brand accents
  and read acceptably on both backgrounds → **left as-is**.
- Any other panel/sidebar literals surfaced during implementation get the same
  treatment; the rule is "follow the palette unless it's a brand accent."

---

## Feature B — non-contiguous-time data-quality warning

### Detection

New warning in `packages/core/src/queries/getdataquality.ts`:

- **code**: `'non-contiguous-time'`
- **severity**: `'warning'`
- **trigger**: query the `Time` table (present and identical on both load paths —
  native `.sql` and ESO-converted `.sql`, which writes `EnvironmentPeriodIndex`
  and `DayType` per esotosqlite.ts:21-25). Warn when **either**:
  - more than one distinct `EnvironmentPeriodIndex`, **or**
  - any `DayType` in (`'SummerDesignDay'`, `'WinterDesignDay'`).
- **message**: "This file contains design-day or non-contiguous time data —
  time-series charts (heatmap, line) may show gaps or overlaps."
- **detail**: optional — the distinct environment count and/or design-day day
  types observed.

The `DataQualityWarning['code']` union and any exhaustive consumers are extended
to include the new code. Surfaces automatically in the Loaded Files list
(`filelist.tsx`), which already renders the warning array — no UI change.

### Why Time-table based, not EnvironmentPeriods

The ESO-converted SQLite is a minimal schema and does not carry an
`EnvironmentPeriods` table, but it does carry `Time.EnvironmentPeriodIndex` and
`Time.DayType`. Keying off `Time` makes the check identical for `.sql` and
`.eso`-origin files, consistent with the module's existing "nothing that's lost
after ESO conversion" contract.

---

## Testing

- **B (core, TDD)** — add cases to `packages/core/test/getdataquality.test.ts`:
  a design-day fixture (from the `02-eso-full` / large-office-design-day source)
  asserts `codes` contains `'non-contiguous-time'`; a contiguous annual fixture
  asserts it does **not**. Red → green.
- **A (UI)** — verified by running the app: toggle dark mode, confirm chrome +
  chart canvas flip and data colors are unchanged; confirm burger links open;
  confirm About dialog renders version. Plus a smoke check that all three bundles
  (main, renderer, web) compile clean.

## Out of scope (YAGNI)

- `prefers-color-scheme` OS-follow (toggle is manual; easy to add later).
- Re-tuning data color scales for dark backgrounds (the "Full incl. data
  palettes" option was not chosen).
- Per-view or per-chart theme overrides.
