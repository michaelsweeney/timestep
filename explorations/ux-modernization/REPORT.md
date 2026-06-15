# timestep — UX Modernization Assessment

*Exploration / design pass. No application code is modified by this document.*
*Reference codebase for the target aesthetic: `eplus-bnd-branch-visualizer` (BND-Vis), spun out of timestep 2026-06-11.*

---

## 0. TL;DR

timestep's data model and core engine are in good shape; the **interaction shell is the bottleneck**. The "views-as-tabs" model (`viewselector.tsx`, `mappedviews.tsx`) forces the user to look at one chart at a time and rebuild context on every tab switch, when the natural job — comparing series, intervals, and chart types side by side — is inherently multi-pane. BND-Vis already demonstrates the shell timestep wants: resizable/collapsible split panes, a topbar gear popover for global settings, linked selection and a linked hover cursor across views, a persistent browser sidebar, and an inspector. (timestep is a *static* viewer, so it borrows the shell but **not** BND-Vis's temporal playback/transport bar — that does not belong.) The recommendation is to **borrow BND-Vis's shell and interaction model, not its domain views,** and stage the migration so the @timestep/core engine, theming, and data-quality systems carry over untouched.

---

## 1. How the app works today (grounded in code)

**Component tree** (`App.tsx:54`): `Header` -> `MappedViews` -> `Version` + `NotificationSnackbar`, all under a MUI `ThemeProvider` whose palette type is driven by `state.ui.theme` (`App.tsx:56`, `App.tsx:20-33`).

**The "view" abstraction.** State is three slices: `session`, `views`, `ui` (`store/configureStore.tsx:9-11`).

- `session.viewArray` is an array of integer view IDs; `session.activeViewID` is the one currently shown (`reducers/sessionreducer.tsx:6-19`).
- `views` is an object keyed by viewID. Each view independently holds `chartType`, `timestepType`, `seriesOptions`, `selectedSeries`, `loadedObj`, and its own loading queue (`reducers/viewreducer.tsx:1-14`).
- `ViewSelector` (`viewselector.tsx:52-137`) renders the view IDs as buttons with an `X` to remove and a `+` to add, capped at `maxViews = 4` (`viewselector.tsx:53`).
- `MappedViews` (`mappedviews.tsx:40-53`) maps `viewArray` to one `ChartTypeControl` per view. **All views render at once into a 100%x100% container** — there is no real tab-hiding in `MappedViews`; the "active view" concept exists in state but the layout stacks every view's `ChartTypeControl` into the same box. (`calculateContainerDims` at `mappedviews.tsx:13-18` subtracts a hardcoded 175px sidebar + 75px chrome.)
- Each view owns a left `ViewSidebar` (`viewsidebar.tsx:37-51`: chart-type selector, interval select, SI/IP radio) fixed at `width: 150` (`viewsidebar.tsx:18`), plus the chart routed by `ChartTypeControl` (`charttypecontrol.tsx:44-99`).

**Series selection is per-view** (`views[viewID].selectedSeries`), populated by `getAllSeries` -> `getSeriesLookupObj` from `@timestep/core` whenever files/units/interval change (`charttypecontrol.tsx:53-62`). Single-series charts use a virtualized `SeriesSelect`; multiline uses `MultiSeriesSelect` (`seriesselect.tsx`, `multiseriesselect.tsx`).

**Global vs per-view.** Global: `units` (SI/IP — note: lives in `session`, not per-view, despite a per-view `UnitRadio` in the sidebar), `theme`, `files`, `containerDims`, data-quality warnings. Per-view: chart type, interval, selected series, loaded data.

**The core engine.** `@timestep/core` (`packages/core/`) is a clean headless query layer: parsing, SQLite engine, ESO->SQLite conversion, and query functions (`getAllSeries`, `getSeries`, `getFileSummary`, `getDataQuality`). It exports **no React** — the entire UI is replaceable without touching it. This is the single most important fact for the migration: the expensive, domain-correct part is already insulated.

**Data-quality warnings.** Computed post-load via `getDataQuality(files)` (`filelist.tsx:64-72`) and surfaced in the Loaded Files modal grouped by severity (`filelist.tsx:133-161`). Non-blocking.

---

## 2. Honest critique of the views-as-tabs model

**The core problem: the job is comparison, the model is isolation.** The reason someone opens EnergyPlus timeseries is almost always comparative — this zone vs that zone, this run vs last run, hourly vs daily, the heatmap *and* the load-duration curve for the same variable. The tab model makes every comparison a memory exercise: you configure View 1, switch to View 2, and now View 1 is gone from sight. The hard 4-view cap (`viewselector.tsx:53`) is a symptom — tabs don't tile, so more than a few becomes unmanageable, so it's capped.

**Specific weaknesses, each tied to code:**

1. **No side-by-side.** Despite `MappedViews` rendering all views into one container, there's no tiling/split — views overlap or stack awkwardly because the layout was built for one-at-a-time. The user can't put two charts next to each other, which is the whole point.

2. **Nothing is linked.** Each view's `selectedSeries`, `timestepType`, and zoom live in isolation (`viewreducer.tsx`). Selecting "Zone 1 Air Temperature" in one view tells the others nothing. BND-Vis's headline feature — "linked selection drives every view at once" (README:59) — has no analog here.

3. **Redundant per-view chrome.** Every view repeats the full sidebar (chart type / interval / units) at a fixed 150px (`viewsidebar.tsx:18`). With 4 views that's 4 sidebars consuming horizontal space, and the unit radio is per-view in the UI but global in state (`sessionreducer` `units`) — a latent inconsistency.

4. **No persistent variable browser.** Series selection is buried inside each chart's control panel via an autocomplete. There's no always-visible catalog of "what variables exist in these files," so discovery is poor and re-selecting the same series across views means re-searching the autocomplete each time.

5. **No inspector / detail-on-demand.** Hover tooltips exist per chart, but there's no persistent panel showing the current selection's stats, units, file provenance, or data-quality notes in one place.

6. **Fixed-pixel layout math.** `mappedviews.tsx:13-18` hardcodes `-175` and `-75`; `viewsidebar` hardcodes `150`; `header.tsx:21` sets `minWidth: 700`. These are brittle and don't survive a resizable-pane world.

7. **Settings half-migrated.** The header reorg (settings | FILES | views ... logo, `header.tsx:53-72`) and the new `settingsmenu.tsx` burger already moved theme/about/links into a popover — this is the *right* direction and matches BND-Vis's topbar gear. But interval and units are still per-view sidebar controls, so global settings are split across two places.

**What's already good and must be preserved:**
- The `@timestep/core` boundary (headless, no React).
- The freshly theme-aware `d3container` (`d3container.tsx:4-44`) and the indigo/pink brand applied per-theme in `logo.tsx:21,24` (`#3f51b5`/`#8c9eff`, `#f50057`/`#ff5c8d`).
- The data-quality warnings system.
- The virtualized series selects (handle thousands of variables).

---

## 3. Proposed modern architecture

Borrow BND-Vis's **shell** and **interaction model**; keep timestep's **domain** (timeseries charts, not graph/3D). The CSS-variable theming and pane mechanics in BND-Vis (`app.css:1-19` token set; `app.css:138-160` splitters + `.closed` collapse pattern) are the concrete template.

### 3.1 The shell — resizable/collapsible split panes

Replace the tab strip with a **tiling workspace**. Layout regions:

```
+------------------------------------------------------------------+
|  topbar:  timestep | [files] [+ chart]            ... [gear]     |  <- global
+------------+--------------------------------------+--------------+
|  VARIABLE  |   chart pane    |   chart pane        |  INSPECTOR   |
|  BROWSER   |   (heatmap)     |   (multiline)       |  (selection  |
|  (series   |-----------------+---------------------|   stats,     |
|  catalog,  |   chart pane    |   chart pane        |   provenance,|
|  search,   |   (scatter)     |   (statistics)      |   DQ notes)  |
|  facets)   |  <- each pane resizable + collapsible |              |
|            |  (the chart grid fills the height —   |              |
|            |   no bottom transport bar)            |              |
+------------+--------------------------------------+--------------+
```

- **Panes tile** (horizontal + vertical splitters, `app.css:138-149`). Each pane has a head bar with title + collapse toggle (`app.css:150-160` `.closed` writing-mode-vertical pattern). The 4-view cap disappears — panes are added/split, not tab-limited.
- Each pane is still "a view" internally (chart type + interval + series), so the `views` slice survives largely intact — what changes is *layout*, not the per-view config model.

### 3.2 Linked selection across panes

The keystone is two linked read-interactions: **linked selection** and a **linked hover cursor**. Both are passive reads — there is no playback or auto-advance anywhere in timestep.

- **Linked selection.** A **shared selection** (a set of series keys) that any pane can read and any pane can write. Clicking a series in the browser, or a point in one chart, highlights it across all panes and drives the inspector. This is BND-Vis README:59-66 translated to timeseries: instead of "click a zone -> highlights in all panes," it's "select Zone 1 Air Temp -> it lights up in the multiline, gets a marker in the scatter, and its row activates in statistics."
- **Linked hover cursor.** Hovering a time-based chart broadcasts the hovered instant to every linked pane, which each draw a crosshair at that timestamp and surface the value there; the inspector reads the value(s) at the hovered instant. This is the BND-Vis "hover crosshair + tooltip" idea — but driven purely by the mouse over the charts, **not** by a transport scrubber.

Implementation: a new `linkedSelection` reducer slice (`{ series: string[], hoverTime: number|null, window: [t0,t1], linkedZoom: bool }`). `hoverTime` is set on chart hover and cleared on leave (no timer ever writes it). Panes opt into linking (a per-pane "linked" toggle) so a pane can be pinned independent when desired. Linked zoom means brushing a date range in one chart re-windows all linked panes — a **static** zoom/window control, no play affordance — directly addresses critique #2.

### 3.3 Persistent series/variable browser (left)

A left sidebar that is the **catalog of everything in the loaded files**, not buried in each chart. Built on the existing `getAllSeries`/`getSeriesLookupObj` data (`charttypecontrol.tsx:53-62`) and the virtualized list already in `seriesselect.tsx:44-89`. Facet by file, key type, frequency. A click sends the series to the focused pane (or to the shared selection if linked). This replaces N per-chart autocompletes with one durable, searchable tree — directly addresses critique #4.

### 3.4 Inspector (right)

Mirrors BND-Vis's inspector (`app.css` `#inspector` block). For a timeseries selection it shows: series label + key, units (SI/IP), source file, frequency, summary stats (min/max/mean/peak time — reuse `statistics.tsx`'s utility functions), and any data-quality warnings for that series/file (reuse `getDataQuality`). Detail-on-demand in one stable place — addresses critique #5.

### 3.5 Settings in the topbar gear popover

Finish what `settingsmenu.tsx` started. Move **global** settings into the gear popover: theme (already there), SI/IP units (currently a per-view radio but global in state — consolidate to the popover and delete the per-view radio), default colorscale, and crosshair/tooltip prefs. Per-pane settings (chart type, interval, this pane's series) stay on the pane. Mirrors BND-Vis "theme / SI-IP / colorscale live in the topbar gear popover" (README:44). Addresses critique #3 and #7.

### 3.6 Keyboard / interaction improvements

- Brush-to-zoom on any chart; `esc` resets; `shift`-brush adds to selection.
- `/` focuses the variable-browser search.
- Pane focus ring; number keys jump panes.
- Shareable state via URL/hash params (BND-Vis README:70-73) — though in Electron this maps better to session save/load, which already exists (`savesession.tsx`/`loadsession.tsx`).

---

## 4. Migration path (real stack: MUI v4 + Redux + D3, Electron + web)

The good news: **state model and core engine mostly survive**; this is predominantly a *layout/shell* replacement plus one new cross-cutting feature (linked selection). Phasing from cheap -> structural:

### Phase 0 — Consolidate settings (cheap, days)
Move SI/IP units and default colorscale into the gear popover (`settingsmenu.tsx`), delete the per-view `UnitRadio` from `viewsidebar.tsx`. No new architecture; removes the global/per-view inconsistency and shrinks per-view chrome. Pure win, low risk.

### Phase 1 — Replace the tab strip with a split-pane layout (moderate, structural-but-contained)
Swap `ViewSelector` + `MappedViews` for a tiling pane manager. Keep the `views` slice as-is — each pane is still a "view." Two realistic options:
- **(a) Library:** adopt `react-resizable-panels` or `react-mosaic` for the pane tree. Fastest to a working tiling shell; integrates with React/MUI cleanly.
- **(b) Hand-rolled:** port BND-Vis's splitter/collapse CSS (`app.css:138-160`) into MUI `makeStyles`. More control, matches the reference exactly, no new dep, but you reimplement drag math.
Recommendation: **(a)** for speed; the pane *contents* are unchanged `ChartTypeControl`s. Remove the hardcoded layout math in `mappedviews.tsx:13-18` and `viewsidebar.tsx:18`. Drop the `maxViews=4` cap.

### Phase 2 — Persistent variable browser + inspector (moderate)
Lift series selection out of per-chart controls into a left browser backed by existing `getAllSeries` data and the existing virtualized list component. Add the right inspector reusing `statistics.tsx` math and `getDataQuality`. These are new components but consume existing core APIs — no engine work.

### Phase 3 — Linked selection + linked hover cursor (structural, the real new capability)
Add the `linkedSelection` slice and per-pane link toggles. Wire each chart to read the shared selection + hovered instant and to write on interaction (click selects; hover sets `hoverTime`, leave clears it — no timer, no playback). This touches every chart renderer (they must accept an external highlight + hover cursor) but builds on D3 patterns already present (multiline already does bisector tooltip + brush; `multiline.tsx`). Optionally fold in a static linked-zoom brush here (one chart's range re-windows the linked panes). Do this *after* the shared D3 refactor in `d3-review.md` so you wire shared cursor/scale code once, not six times.

### On framework convergence with BND-Vis
**Don't converge the framework.** BND-Vis is intentionally framework-less (vanilla ESM + Vite) because it was a greenfield prototype; timestep has a mature Redux store, MUI v4, and an Electron build. Rewriting timestep to vanilla would throw away the state model and the data-quality/session/file machinery for no user-visible gain. **Converge the *aesthetic and interaction model*, not the runtime.** Concretely: lift BND-Vis's CSS token set (`app.css:1-19`) and pane/splitter/inspector patterns into MUI theme + `makeStyles`; keep React/Redux. The one place to consider sharing actual code is `@timestep/core` — BND-Vis is already slated to *consume* core as its first external consumer (README:243), so the dependency arrow points core -> both apps, which is correct.

*Optional, separate track:* MUI v4 is EOL-adjacent. A v4->v5 bump is worth doing but is **orthogonal** to this UX work and shouldn't gate it. Sequence it before Phase 3 if appetite exists, since v5's `sx`/emotion makes token-based theming cleaner; otherwise defer.

---

## 5. Risks, trade-offs, what to preserve

**Preserve (do not touch):**
- `@timestep/core` engine and its headless boundary (`packages/core/`). Every phase consumes it; none modifies it.
- Theme-awareness in `d3container.tsx` and the indigo/pink brand (`logo.tsx:21,24`).
- Data-quality warnings (`getDataQuality`, `filelist.tsx:64-72`).
- Session save/load and file-load machinery.
- The virtualized series list (it's what makes thousands of variables tractable).

**Risks / trade-offs:**
- **Performance with many live panes.** Tabs render one chart; tiling renders many simultaneously. With several SVG charts at 8760 points each, this can stutter. Mitigation: prefer the canvas chart variants for tiled/linked mode, and share the D3 setup so redraws are cheap (see `d3-review.md`). This is a real cost the tab model was hiding.
- **Linked selection is genuinely new code** crossing all renderers — the largest structural risk. De-risk by landing the D3 shared-cursor/scale refactor first.
- **MUI v4 longevity.** Building a lot of new UI on v4 deepens the eventual v5 migration. Decide explicitly: either bump v5 before Phase 2-3, or accept the v4 debt knowingly.
- **Electron vs web parity.** The shell is DOM/CSS so it ports to both; BND-Vis's URL-hash state-sharing is web-flavored — in Electron, route shareable state through the existing session save/load instead.
- **Scope creep toward BND-Vis's domain.** Resist pulling in graph/3D/topology — those are BND-Vis's job. timestep borrows the shell, not the views.

---

## 6. Highest-leverage moves (ranked)

1. **Linked selection + linked hover cursor** — the single capability that turns N isolated charts into one comparative instrument (a read interaction; no playback). Everything else is in service of this.
2. **Split-pane shell replacing tabs** (Phase 1) — unblocks side-by-side, removes the 4-view cap, and is contained because pane *contents* are unchanged.
3. **Persistent variable browser** — fixes discovery; cheap because the data + virtualized list already exist.
4. **Finish settings consolidation into gear** (Phase 0) — small, removes a real inconsistency, sets the topbar pattern.
5. **Share D3 scale/axis/cursor code before wiring linking** — see `d3-review.md`; do it once, not six times.
