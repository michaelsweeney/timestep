# Codex Handoff — timestep Track C (remaining UX work)

> Self-contained brief for picking up the remaining **Track C** items of the
> timestep UX modernization. Written 2026-06-15. You (Codex) have none of the
> prior conversation context, so this covers orientation, architecture, what's
> already done, and a concrete recipe per remaining item.
>
> **The live steer is `explorations/ux-modernization/DIRECTION-v2.md`** — read it
> first. `REPORT.md` / `PLAN-conservative.md` / the mockups describe an abandoned
> architecture (left sidebar + variable browser + inspector) and are **history**.

---

## 0. Orientation & guardrails (read before touching anything)

- **Branch:** `feat/split-pane-foundation`. `master` holds the private **v2.0.0
  DRAFT** release — **do not touch master, do not push** (pushing needs explicit
  owner consent). Commit freely **locally** on the feature branch.
- **Keep the version at `v2.0.0`** (it's an unreleased draft). Don't bump it.
- **Commit style:** recent commits end with a `Co-Authored-By:` trailer — match
  the existing style. Stage only files you intentionally touched; `app/dist-web`
  is build output (gitignored) — never commit it.
- **DIRECTION-v2.md has a `## Status` section** — update it when you land an item.

### Build / serve / verify loop (this works here)

```bash
# build the web bundle (renderer → app/dist-web)
yarn build-web

# serve it (simple &, NOT nohup/disown — those get reaped in this env)
python3 -m http.server 8092 --bind 0.0.0.0 --directory app/dist-web &
# wait for readiness without a foreground sleep:
curl -s --retry 15 --retry-connrefused --retry-delay 1 -o /dev/null http://localhost:8092/
```

Screenshot/interaction checks use **playwright-core** driving
`/usr/bin/google-chrome-stable` with `NODE_PATH=<repo>/node_modules`. Set theme
via `localStorage.setItem('timestep-theme','dark'|'light')` then reload. Load a
fixture through the web file picker via a playwright `filechooser` event.
Fixtures live in `test-models/` (e.g.
`test-models/small-office-seattle/ASHRAE901_OfficeSmall_STD2022_Seattle.sql`).
**Most of these features are invisible without interaction — verify by driving
the UI and screenshotting, not just by building.**

---

## 1. Architecture cheat-sheet

**Stack:** Electron app (`michaelsweeney/timestep`), EnergyPlus timeseries viewer.
React + Redux (Redux Toolkit `configureStore`), MUI v4 (kept for load-bearing
primitives: virtualized Autocomplete, Slider, Dialog/Menu/Switch — restyled
flat), D3 charts, webpack 5 (renderer / web / main bundles), `@timestep/core`
query/parse lib. Styling is a **CSS-token system** (`app/src/css/app.global.css`):
`:root` vars (`--bg`, `--panel`, `--panel-2`, `--hairline(-2)`, `--ink(-dim/-faint)`,
`--accent #5b9efc`, `--ok`, `--warn`, `--mono` JetBrains Mono, `--sans` IBM Plex
Sans); dark default + `:root[data-theme='light']`. `App` sets `data-theme` on
`<html>` from the `ui.theme` slice.

**Custom `connect`** (`app/src/store/connect/index.tsx`): wraps react-redux. Its
default `mapDispatchToProps` **auto-binds every action creator** exported from
`app/src/store/actions/index.tsx` via `bindActionCreators` → available as
`props.actions.<name>` in **every** connected component. **So a new action creator
needs no registration** — export it and call `props.actions.foo(...)`.
Caveat: several components' `mapStateToProps` also spread `actions: {...state.actions}`
— that's a no-op (`state.actions` doesn't exist); the real actions come from
`mapDispatch`. Don't rely on `state.actions`.

**Store shape** (`app/src/store/reducers/index.tsx`, `combineReducers`):
- `session` (`sessionreducer.tsx`): `units` ('si'|'ip', global), `files`,
  `fileInfo`, `activeViewID`, `viewArray` (ordered pane ids), `version`, etc.
- `views` (`viewreducer.tsx`): keyed by id → per-pane `{ viewID, label,
  timestepType, chartType, seriesOptions, selectedSeries, selectedSeriesLabel,
  loadedObj, loadingQueue, isLoading, linked }`.
- `ui` (`uireducer.tsx`): `{ theme }` (persisted to localStorage by a store
  subscription in `configureStore.tsx`).
- `linked` (`linkedreducer.tsx`, **added this session**): `{ window, hoverTime,
  hoverSource }` — the thin cross-pane comparison slice.

**Component tree (per-pane, self-contained — no shared sidebar):**
```
App
├─ Header (topbar)         app/src/components/header.tsx
│   ├─ FileMenu  SplitButton  SessionSummary  UnitToggle  SettingsMenu
└─ MappedViews             app/src/components/views/mappedviews.tsx  (flat flex row)
    └─ PaneFrame (per pane) paneframe.tsx     (ResizeObserver → paneDims)
        └─ ChartTypeControl charttypecontrol.tsx
            ├─ PaneHeader   views/paneheader.tsx   (chart-type ▾ · interval ▾ · 🔗 · ⚙ ⤓)
            └─ <Type>Control  views/chartcontrol/{multiline,heatmap,scatter,histogram,statistics}control.tsx
                └─ <Type>Canvas views/chartcontrol/charts/...
```

**Charts — the LIVE render path:** the **canvas** renderers are live
(`multilinecanvas.tsx`, `heatmapcanvas.tsx`, `scattercanvas.tsx`) plus
`histogram.tsx` (SVG) and `statistics.tsx` (a table). The old SVG twins
(`multiline/heatmap/scatter.tsx`) were **deleted** this session — don't resurrect
them. Each canvas renderer draws data marks on a `<canvas>` and keeps an **SVG
overlay** (in `d3container.tsx`) for axes / labels / crosshair / cell-highlight /
tooltip.
- **Canvas-context colors** (`fillStyle`/`strokeStyle`) can't read CSS vars — use
  `charts/themetokens.ts` `token('--accent', fallback)` to resolve a token to a
  string in JS.
- **SVG overlay elements** ARE CSS-themeable — style them in `d3container.tsx`'s
  `useStyles` (e.g. `.x-line`, `.cell-highlight`, `.cell-dayline`, `.axis-text`).

---

## 2. Already done this session (do NOT redo)

Branch is 5 commits past `f5d4d7a`:
- `2675c1f` **linked hover crosshair** — hover any linked multiline pane → aligned
  crosshair + markers at the same instant in every other linked multiline pane.
- `bf17a9f` **linked time-domain** — brush/zoom one linked pane → all linked panes
  share the x-domain.
- `5d236d4` **heatmap joins the linked hover** — multiline hover → heatmap draws an
  accent day-line + boxed hour cell; heatmap hover → multiline crosshair.
- `cb1cef0`, `201b60d` docs.

**The linked machinery you'll reuse / coexist with:**
- `linked` slice `{ window, hoverTime, hoverSource }` + per-view `linked` boolean
  (default `true`; toggle in PaneHeader, shown only when multi-pane).
- Actions: `setHoverTime(time, source)`, `clearHoverTime()`, `setLinkedWindow(domain)`,
  `changeViewLinked(linked, viewID)`.
- Renderer pattern (in `multilinecanvas.tsx` & `heatmapcanvas.tsx`): a
  `cursorApi = useRef()` holding `{ drawCursorAtTime(time, withTooltip), hideCursor() }`
  set at the end of the chart build, plus a
  `useEffect(..., [hoverTime, hoverSource])` that draws/hides the cursor from the
  shared time when this pane isn't the source. Local mouse handlers broadcast the
  snapped time (deduped via a `lastHoverSent` ref).

Earlier tracks (also done): Track A cleanup (orphans/dead state removed, tokens),
Track B (chart colors tokenized, series picker grouped by zone/equipment via
`seriesgroup.ts`, series preserved across Heatmap↔Histogram), Track C#2 (+Split
duplicates the focused pane).

---

## 3. Remaining Track C work

Recommended order: **#3 (fully spec'd below) → #6 (now cheap, leverages linked
`hoverTime`) → #4 / #5 (bigger, need a placement/design decision — read
DIRECTION-v2 §Track C first).**

### #3 — Global interval in the topbar (with per-pane override)  ← START HERE

**Goal:** an interval selector in the topbar next to Units (which is already
global). Most comparisons want one shared interval; setting it per-pane N times is
the friction. Keep the per-pane override in PaneHeader for the divergent case.

**Model (simplest that fits):** one action `SET_GLOBAL_INTERVAL` that **two**
reducers respond to (combineReducers lets every slice see every action):
`session` stores it for display; `views` applies it to **all** panes'
`timestepType`. Last-write-wins; a per-pane select still diverges one pane until
the next global set. No "follows-global" per-view flag needed.

**Steps:**
1. `sessionreducer.tsx`: add `intervalDefault: 'Hourly'` to `initialState`; add
   `case 'SET_GLOBAL_INTERVAL': return { ...state, intervalDefault: action.payload };`
2. `viewreducer.tsx`: add
   `case 'SET_GLOBAL_INTERVAL':` → return a new views map with every view's
   `timestepType` set to `action.payload`
   (`Object.fromEntries(Object.entries(state).map(([id, v]) => [id, { ...v, timestepType: action.payload }]))`).
3. `actions/index.tsx`: export
   `setGlobalInterval(interval) => ({ type: 'SET_GLOBAL_INTERVAL', payload: interval })`.
4. New `app/src/components/intervalselect.tsx`, modeled on `unittoggle.tsx` but a
   flat token-styled native `<select>` (6 options) — reuse the look from
   `paneheader.tsx`'s `classes.select`. Reads `state.session.intervalDefault`,
   dispatches `setGlobalInterval(e.target.value)`. The interval list is in
   `paneheader.tsx:13` (`INTERVALS`) — extract it to a shared const (e.g.
   `app/src/components/views/intervals.ts`) and import in both places.
5. `header.tsx`: render `<IntervalSelect/>` next to `<UnitToggle/>` (line ~74).
6. `paneheader.tsx`: **leave the per-pane interval select as-is** (it dispatches
   `changeTimestepType(value, viewID)` → diverges that pane only).

**Verify:** load a fixture, `+Split` to 2 panes, change the topbar interval → both
panes re-resolve series at the new interval; then change one pane's interval in its
header → only that pane changes.

**Watch:** changing `timestepType` re-runs `charttypecontrol.tsx:60` (re-parses
`seriesOptions`) and may re-resolve the selected series (E+ series keys embed the
reporting frequency). This behavior already exists for the per-pane select; the
global set just triggers it for all panes. Sanity-check a loaded series survives a
global interval change (or reloads cleanly).

**Files:** `sessionreducer.tsx`, `viewreducer.tsx`, `actions/index.tsx`, new
`intervalselect.tsx`, `header.tsx`, `intervals.ts` (new). Reference: `unittoggle.tsx`
(pattern), `paneheader.tsx:12-20,131-133`.

### #6 — Inspector-on-demand (now cheap — leverages linked `hoverTime`)

**Goal:** a togglable panel showing, for the focused pane's selection: min/max/mean
/ peak-time, units, source file, and per-series **data-quality** notes. Now that
the `linked` slice carries `hoverTime`, it can also show **value-at-cursor across
linked panes** — the "what am I looking at, at this instant, and is it trustworthy"
view.

**Reuse:** `statistics.tsx` (the summary-stat math), `statisticscontrol.tsx`,
`state.linked.hoverTime` (value-at-time), and **`getDataQuality(files)` from
`src/sql`** (`app/src/sql/index.tsx` → wraps `@timestep/core`; returns
`FileDataQuality[]`, each with `.warnings: DataQualityWarning[]` of
`{ severity, ... }`). DQ notes are surfaced today only in the Loaded-Files modal
grouped *by file* (`filelist.tsx`, "Data quality" section ~L145-161) — the modeler
picking a series never sees them at selection time. Drive the inspector off
`state.session.activeViewID` → that view's selection. Placement: a collapsible
right panel or a PaneHeader popover (the app deliberately has no left sidebar —
keep it on-demand, not always-on).

### #4 — Persistent variable browser (embed, not replacement)

**Goal:** a durable catalog embedding the existing virtualized series Autocomplete:
grouped by category/zone/frequency (grouping helper already exists:
`controls/seriesgroup.ts`), a **units facet** (the unit field exists per row, never
surfaced), recently-used, and **inline DQ badges** (so the modeler picking e.g.
"Chilled Water Mass Flow" learns at selection time that its unit was *guessed* —
today that's buried in the by-file Loaded-Files modal). **Embed the current select,
don't rebuild it.**

**Needs a placement decision** (the per-pane-self-contained direction removed the
left sidebar — a global browser is in tension with that; consider a togglable
drawer/panel). Read DIRECTION-v2 §Track C #4 and decide before building.
**Files to study:** `controls/seriesselect.tsx` & `multiseriesselect.tsx` (the
virtualized Autocomplete; `groupBy`/`renderGroup` already wired),
`controls/seriesgroup.ts`, `getDataQuality` in `src/sql` (`app/src/sql/index.tsx`),
`filelist.tsx` (current by-file DQ display).

### #5 — Real tiling grid + saved arrangements (biggest lift)

**Goal:** replace the flat flex row (`mappedviews.tsx`) with **react-resizable-panels**
for nested horizontal+vertical splits and a 2×2 preset; then round-trip a **named
layout** through the existing session save/load (`viewArray` + per-view config
already persist).

**Scope notes:** check whether `react-resizable-panels` is in `package.json` (the
PLAN called it "Phase 3, never adopted"). You'll add a layout tree to session state
and rewrite `MappedViews`. The per-pane `ResizeObserver` (`paneframe.tsx`) already
makes charts resize to arbitrary boxes, so charts will adapt inside resizable
panels without renderer changes. **Files:** `mappedviews.tsx`, `paneframe.tsx`,
`savesession.tsx` / `loadsession.tsx`, `sessionreducer.tsx` (`viewArray`).

---

## 4. Landmines (cost real debugging time here)

- **Unstable array refs rebuild the whole chart.** A canvas renderer's build
  `useEffect` keys on its data prop; if the control passes `Object.values(loadedObj)`
  fresh each render, an unrelated dispatch (e.g. a linked hover) retriggers the
  build and **wipes the live cursor**. `multilinecontrol` now `useMemo`s
  `seriesData` for exactly this reason; `heatmapcontrol` is fine because
  `Object.values(loadedObj)[0]` returns the stable inner ref. If you add panes that
  subscribe to `linked` (re-render on every hover), make sure their canvas data prop
  is reference-stable.
- **Per-view fields must be set in 4 places.** When adding a per-view field (like
  `linked`), set it in: `viewreducer` `initialState`, ADD_VIEW **seed** branch,
  ADD_VIEW **default** branch, and `splitbutton.tsx`'s `seed` (if it should clone on
  +Split). Grep how `linked` is threaded as the template.
- **Canvas vs SVG coloring:** canvas marks → `themetokens.ts` `token()`; SVG overlay
  → CSS in `d3container.tsx`. Don't hardcode hex.
- **The heatmap is a day×hour calendar**, not a continuous time axis — that's why
  the linked heatmap highlight is a day-line + cell, not a vertical crosshair. A
  single hourly cell is ~1px wide in a 365-day calendar; the day-line carries the
  legibility.

---

## 5. Quick reference — files

| Concern | File |
|---|---|
| Topbar | `app/src/components/header.tsx` |
| Global Units toggle (pattern for #3) | `app/src/components/unittoggle.tsx` |
| Session slice | `app/src/store/reducers/sessionreducer.tsx` |
| Views slice | `app/src/store/reducers/viewreducer.tsx` |
| linked slice | `app/src/store/reducers/linkedreducer.tsx` |
| Actions (auto-bound) | `app/src/store/actions/index.tsx` |
| Custom connect | `app/src/store/connect/index.tsx` |
| Pane container | `app/src/components/views/charttypecontrol.tsx` |
| Pane header (chart-type/interval/link) | `app/src/components/views/paneheader.tsx` |
| Workspace row (for #5) | `app/src/components/views/mappedviews.tsx` |
| Multiline renderer (linked pattern) | `app/src/components/views/chartcontrol/charts/multilinecanvas.tsx` |
| Heatmap renderer (linked pattern) | `app/src/components/views/chartcontrol/charts/heatmapcanvas.tsx` |
| Shared chart container / SVG theming | `app/src/components/views/chartcontrol/charts/d3container.tsx` |
| Canvas color bridge | `app/src/components/views/chartcontrol/charts/themetokens.ts` |
| Stats math (for #6) | `app/src/components/views/chartcontrol/charts/statistics.tsx` |
| Data-quality notes (#4/#6) | `getDataQuality` in `app/src/sql/index.tsx` (→ `@timestep/core`); shown in `filelist.tsx` |
| Series grouping (#4) | `app/src/components/views/chartcontrol/controls/seriesgroup.ts` |
| Live steer | `explorations/ux-modernization/DIRECTION-v2.md` |
