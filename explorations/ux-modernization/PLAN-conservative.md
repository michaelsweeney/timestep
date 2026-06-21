# timestep — Conservative Split-Pane: Implementation Plan

*Chosen direction: replace the views-as-tabs model with a resizable/collapsible
split-pane shell (the "conservative evolution" mock-up). This plan drives real
implementation. Every phase cites real `app/src` code.*

## Constraints (baked in, non-negotiable)

- **Keep the searchable virtualized multiselect series dropdown** — `app/src/components/views/chartcontrol/controls/seriesselect.tsx` (and `multiseriesselect.tsx`). Reuse as-is; do not replace. Hundreds of variables depend on its virtualization.
- **No playback / transport / scrub anywhere.** A **linked hover-crosshair** is a *read* interaction, allowed only as the final optional phase.
- **React + Redux + MUI v4 + `@timestep/core` stay.** `@timestep/core` (`packages/core/`) is untouched in every phase. **MUI v4 → v5 is explicitly out of scope.**
- **Preserve:** the theme-aware `d3container` (`charts/d3container.tsx`), the data-quality warnings (`getDataQuality` → `filelist.tsx:64-72`), and session save/load (`savesession.tsx` / `loadsession.tsx`).

## Where the tab model actually lives (the ground truth)

Two mechanisms make "tabs":

1. **The tab strip** — `viewselector.tsx:52-137`: renders `viewArray` as buttons, `+` adds (capped at `maxViews = 4`, `viewselector.tsx:53`), `X` removes; clicking sets `activeViewID` via `setActiveView` (`store/actions/index.tsx:19`).
2. **Single-active rendering** — `mappedviews.tsx:40-53` maps *every* `viewArray` id to a `ChartTypeControl`, but each `ChartTypeControl` hides itself unless focused: `style={{ display: viewActive ? 'inline-block' : 'none' }}` at `charttypecontrol.tsx:81` and `:90`, where `viewActive = activeViewID == viewID` (`charttypecontrol.tsx:51`). **So all views already mount simultaneously** — they're just CSS-hidden. That is the single most important fact for this migration: we are *unhiding and tiling already-mounted components*, not building a new render path.

The sizing coupling that makes tiling hard:

- One global `state.session.containerDims` (`sessionreducer.tsx:12-15`, default 700×500) is computed once in `mappedviews.tsx:13-18` by measuring the outer container minus hardcoded `175` (sidebar) and `75` (chrome), and dispatched via `setContainerDims` (`store/actions/index.tsx:46`).
- All five chart controls read it identically: `const { containerDims, ... } = props.session` and compute `plotDims = { width: Math.max(containerDims.width, 200), height: Math.max(containerDims.height - controlsHeight, 200) }`:
  - `heatmapcontrol.tsx:23,51-54`
  - `multilinecontrol.tsx:27,74-75`
  - `scattercontrol.tsx:22,76-77`
  - `histogramcontrol.tsx:19,45-46`
  - `statisticscontrol.tsx:30,38-39`
- `plotDims` is passed to the chart as the `plotdims` prop (e.g. `heatmapcontrol.tsx:140-141`), and the D3 renderer redraws off it. **One global dims value works only because one chart is visible at a time.** Tiling needs per-pane dims. This is Phase 2 and is the crux.

---

## Phase 1 — Pane state model (S)

**Goal:** stop treating `activeViewID` as "only-visible"; treat it as "focused pane." Remove the 4-pane cap. No layout change yet — this phase is pure state semantics and is independently shippable.

**Changes:**
- `viewselector.tsx:53` — delete `const maxViews = 4` and the `viewIDs.length < maxViews` guard in `AddButtonMarkup` (`viewselector.tsx:77`). (This component is replaced entirely in Phase 3; the cap removal lands here so Phase 2 can be tested with >1 visible pane.)
- `charttypecontrol.tsx:51,81,90` — keep `viewActive` for the *focus ring* but stop using it to hide. Replace `display: viewActive ? 'inline-block' : 'none'` with always-visible; add a focus outline keyed on `viewActive` (a class, not display). Clicking a pane dispatches `setActiveView(viewID)` so `activeViewID` = focused pane.
- No reducer changes: the `views` slice (`store/reducers/viewreducer.tsx`) and `viewArray` / `activeViewID` (`sessionreducer.tsx:10-11`) already model exactly what we need — per-pane chart type, interval, series, loading queue. **Reuse the slice; do not add a new one.**

**Reused:** entire `views` slice; `addView`/`removeView`/`setActiveView`/`resetViews` actions (`store/actions/index.tsx:19-44`); `ADD_VIEW`/`REMOVE_VIEW`/`SET_ACTIVE_VIEW` reducers (`sessionreducer.tsx:31-55`).

**New:** nothing structural. A focus-outline style in `charttypecontrol.tsx`'s `useStyles`.

**Risk:** Low — but unhiding all panes *exposes the Phase 2 bug immediately* (every pane sizes off the same global dims and they'll overlap/mis-size). So Phase 1 is not visually shippable alone; it pairs with Phase 2 (see "First PR").

**Test:** With two views added, both `ChartTypeControl`s are in the DOM and visible (verify via React DevTools / no `display:none`). Clicking either updates `activeViewID` (Redux DevTools) and moves the focus ring. The `+` button adds a 5th view without being disabled.

---

## Phase 2 — Per-pane sizing refactor (L) — THE CRUX

**Goal:** each pane measures *itself* and sizes its chart independently, so N panes render side-by-side at different sizes. Replace the single global `containerDims` with per-pane dims.

**Approach: `ResizeObserver` per pane, dims passed by props (not store).** Keeping dims out of Redux avoids a per-resize dispatch storm across the tree and a fan-out re-render of every connected control; each pane re-renders only itself. (If a store entry is later needed for save/restore of layout, add `views[id].dims` then — but props are correct for the first cut.)

**Mechanism:**
1. Add a thin `PaneFrame` wrapper (new component, ~40 lines) that owns a `ref` + a `ResizeObserver` on its own box and holds `{width, height}` in local state. It renders `ChartTypeControl` and threads `paneDims` down as a prop. The observer replaces the window-resize listener + manual measurement currently in `mappedviews.tsx:21-38`.
2. Thread `paneDims` from `ChartTypeControl` into each chart control. In each of the five controls, change the `plotDims` source from `props.session.containerDims` to `props.paneDims`:
   - `heatmapcontrol.tsx:51-54`, `multilinecontrol.tsx:74-75`, `scattercontrol.tsx:76-77`, `histogramcontrol.tsx:45-46`, `statisticscontrol.tsx:38-39`.
   - The `Math.max(..., 200)` clamps and the `- controlsHeight` math stay identical — only the input dims change. This is a mechanical, uniform edit across five files (the controls are near-identical here; consider a tiny shared `usePlotDims(paneDims, controlsHeight)` helper to do it once).
3. Remove the global path: drop `setContainerDims` dispatch and the `calculateContainerDims`/resize-listener in `mappedviews.tsx:13-38`; remove `containerDims` from `sessionreducer.tsx:12-15` and the `SET_CONTAINER_DIMS` case (`sessionreducer.tsx:57-61`) and the `setContainerDims` action (`store/actions/index.tsx:46`). (Optional: leave the reducer field during transition, delete in cleanup.)

**D3 re-render path (critical):** the D3 charts redraw inside a `useEffect` keyed on their props, including `plotdims` (the chart receives `plotdims={plotDims}` — `heatmapcontrol.tsx:140`). When `paneDims` changes, `plotDims` changes identity, the control re-renders, the new `plotdims` flows to the chart, and its effect re-runs and redraws against the resized container (`d3container.tsx` is the measured box). **Two things to verify/guard:**
- **Throttle the observer.** `ResizeObserver` fires continuously during a splitter drag; debounce/rAF-coalesce in `PaneFrame` (the old code used `setTimeout(...,0)` — `mappedviews.tsx:30-33`; keep an equivalent) so D3 redraws at most once per frame.
- **Object identity.** Only push new `paneDims` when width/height actually change (compare prev), or every observer tick forces a redraw even when size is stable.

**Reused:** all five controls' clamp/controls-height math; the chart components and `d3container.tsx` unchanged; `ChartWrapper` (`chartwrapper.tsx`) unchanged (it's `width: 100%`, so it fills whatever the pane gives it).

**New:** `PaneFrame` wrapper with `ResizeObserver`; optional `usePlotDims` helper.

**Risk:** **High — this is the bulk of the work.** Failure modes: (a) redraw thrash during drag (mitigate: rAF/debounce); (b) a chart that read a *stale* global dim somewhere not caught above (grep `containerDims` to confirm only those 5 controls + `mappedviews` + reducer reference it — already verified: those are the only consumers); (c) `statisticscontrol` is a table, not D3 — confirm it tolerates prop-driven dims (it computes the same `plotDims` at `statisticscontrol.tsx:38-39` but is layout-flexible, lowest risk).

**Test:** Render two panes at different widths via a temporary fixed 50/50 flex split (before the real splitter exists). Resize the OS window and confirm each chart redraws to its own box, not a shared size. Drag the temporary divider and confirm: charts redraw, no console errors, redraw coalesces (not one per pixel — check with a draw counter / perf profile). Switch chart types in one pane while the other holds — both keep correct independent sizes. Verify dark mode still themes axes (`d3container.tsx`) after a resize redraw.

---

## Phase 3 — Split-pane shell (M)

**Goal:** replace the tab strip and the single-container render with a real resizable/collapsible tiling layout that lays out the Phase-1 always-mounted, Phase-2 self-sizing panes.

**Approach: use `react-resizable-panels`** (not hand-rolled).
- **Rationale:** small, dependency-free, React-idiomatic (`<PanelGroup><Panel/><PanelResizeHandle/></PanelGroup>`), supports nested horizontal+vertical groups and collapsible panels out of the box, and plays well with `ResizeObserver`-based children (it resizes the DOM box; our `PaneFrame` observes and reflows — clean separation). Hand-rolling the splitter drag math (BND-Vis does this in `app.css`/JS) is more code and more bugs for no gain here.
- **Bundle/Electron compat:** pure JS/React, no native deps, no worker — bundles identically for the Electron renderer and the `target:web` build. ~3KB gz. No `locateFile`/wasm concerns (unlike sql.js). Safe.
- **Alternative considered — hand-rolled CSS splitters** (port BND-Vis `app.css` `.splitter`/`.hsplitter` + `.closed` collapse pattern into MUI `makeStyles`): viable, zero deps, exact aesthetic match, but you reimplement drag/keyboard/collapse. Choose this only if the owner wants zero new deps; otherwise prefer the library.

**Changes:**
- New `PaneLayout` component replaces `mappedviews.tsx`'s body: a `PanelGroup` rendering one `Panel` per `viewArray` id, each wrapping `PaneFrame` → `ChartTypeControl`. Add/remove/split controls live in the pane headers (and/or a slim toolbar), dispatching the existing `addView`/`removeView` (`store/actions/index.tsx:32-44`). Collapse uses the library's collapsible `Panel`.
- Retire `viewselector.tsx` from the header (`header.tsx:64` `<ViewSelector/>`). Replace with a single `+ Split` affordance (still calling `addView`/`setActiveView`). The header's settings/files grouping (`header.tsx:53-72`) is otherwise unchanged.
- The per-pane `ViewSidebar` (`viewsidebar.tsx:37-51`: chart-type / interval / units) stays per-pane initially (conservative); a follow-up may hoist global units to the gear popover, but that's not required here.

**Reused:** `ChartTypeControl` and everything below it; `addView`/`removeView`/`setActiveView`; `PaneFrame` from Phase 2.

**New:** `react-resizable-panels` dep; `PaneLayout`; pane-header controls; a `+ Split` button.

**Risk:** Medium. Library learning curve; nested group layout for 2×2; ensuring collapse doesn't zero a `PaneFrame`'s observed size (guard: clamp min size, and treat collapsed = unmount or `display:none` with a re-measure on expand).

**Test:** Add 3-4 panes; drag handles → each chart reflows (Phase 2 must be solid first). Collapse a pane → neighbors grow, no errors; expand → chart redraws at new size. Remove a pane → `viewArray` updates, layout reflows. Save/load session round-trips `viewArray` + per-view config unchanged (session save/load untouched). Dark mode intact.

---

## Phase 4 — Persistent variable browser (M) — OPTIONAL, deferrable

**Goal:** promote series selection out of each chart's control tabs into a left side panel, so the catalog of variables is always visible.

**Approach:** a new `VariableBrowser` side panel that **embeds the existing `seriesselect.tsx` / `multiseriesselect.tsx`** (kept per the hard constraint) plus the series-options data already computed in `charttypecontrol.tsx:53-62` (`getAllSeries` → `getSeriesLookupObj`). Selecting a variable dispatches into the focused pane's view (`changeSelectedSeries`, the same action the in-chart select already calls — `heatmapcontrol.tsx:84`).

**Reused:** `seriesselect.tsx` (virtualized, untouched); the `getAllSeries`/`getSeriesLookupObj` pipeline; `changeSelectedSeries` action.

**New:** `VariableBrowser` panel; wiring "selection targets the focused pane."

**Risk:** Low-Medium. Mostly UI placement; the data + select component already exist. **Clearly deferrable** — Phases 1-3 deliver the split-pane win without it.

**Test:** With a pane focused, picking a variable in the browser loads it into that pane's chart; the in-chart select still works (both paths call the same action); virtualization still smooth at hundreds of series.

---

## Phase 5 — Linked hover-crosshair (M) — OPTIONAL, read-only, NO playback

**Goal:** hovering a time-based chart draws a crosshair at that instant across all *linked* panes and reads the value into an inspector/readout. **Pure read interaction. No timer, no auto-advance, no transport.**

**Approach:** add a single shared `hoverTime: number | null` to the store (a new tiny `linked` slice, or a field reused across views — keep it minimal). On chart `mousemove`, set `hoverTime`; on `mouseleave`, clear it. Each chart's D3 effect draws a dashed crosshair when `hoverTime != null` (multiline already has a bisector tooltip in `charts/multiline.tsx` to build on). A per-pane "link" toggle lets a pane opt out.

**Reused:** existing D3 hover/bisector code in `multiline.tsx`; `d3container.tsx` theming for the crosshair color.

**New:** `hoverTime` state + setter/clearer; crosshair draw in each time-based chart; optional inspector readout.

**Risk:** Medium — touches every renderer; do it after any D3 shared-scaffold cleanup (see `d3-review.md`) so the crosshair is wired once. **Strictly optional and last.**

**Test:** Hover the multiline → crosshair appears in the linked heatmap at the same timestamp; leave → it clears. Toggling a pane's link removes it from the broadcast. No setInterval/rAF loop exists anywhere (grep to confirm no playback crept in).

---

# Optional parallel track — "Demo mode" (does NOT gate Phases 1-5)

A `DEMO=1` web-build variant that auto-loads a bundled dataset so timestep can be shown without a local EnergyPlus run — deployable to Cloudflare Pages, BND-Vis-style.

**How it rides the existing web data path (no engine changes):**
- The web build already runs queries against in-tab sql.js: `web/registry.ts` owns `files`/`dbs` maps and `registerFile(file: File)` (`registry.ts:43-46`); `.sql` opens straight from bytes, `.eso` materializes via `@timestep/core`'s `esoToSqlite` — both answer queries identically to desktop.
- Demo mode bypasses the file picker by **fetching a bundled `.sql` as bytes, wrapping it in a `File`, and calling the same `registerFile` → `changeFiles` path** the drop handler uses (`filehandler.tsx:33-35` `handleFileChange`: `resetViews` → `addView(1)` → `setActiveView(1)` → `changeFiles(f)`). So the demo loads through the identical pipeline; nothing downstream knows the difference.
- **Swap the FILES menu for a read-only dataset switcher** when `DEMO`: replace `FileHandler` in the header (`header.tsx` → `filemenu.tsx`) with a `<select>` of bundled datasets that re-invokes the fetch→register→`changeFiles` flow. Show a **"Demo" badge** in the header next to the wordmark.

**Datasets (DOE/PNNL commercial prototype buildings — public domain, U.S. government work):**
- **Default: Medium Office prototype** — annual hourly `.sql`. Lighter than the Large Office / Hospital, but still rich enough for the showcase: multi-zone heatmaps, multiline zone comparisons, facility electricity, HVAC loads. This is the primary demo dataset.
- Optional second entry in the switcher (e.g. Small Office for an even lighter load, or a Large Office for a denser heatmap) — nice-to-have, not required.

**Bundle-size trade-off (flag explicitly):**
- A full annual-hourly prototype `.sql` is multi-MB even for Medium Office; Hospital/Large would be substantially heavier (hence Medium Office as default). Options, cheapest first:
  1. **Ship Medium Office only**, gzipped in the bundle; `fetch` + inflate (`DecompressionStream('gzip')` in-browser, or pako) before wrapping as a `File`. Keeps the deployed asset small and under Cloudflare Pages' per-file limits.
  2. **Trim variables/frequency** at bundle time (drop sub-hourly; keep the handful of variables the demo highlights) to shrink the `.sql` before gzip.
  3. Lazy-fetch the dataset on first demo interaction rather than at load, so initial page weight stays tiny.
- Pick the lightest prototype that still demonstrates heatmap + multi-zone multiline; Medium Office is that pick. Public-domain status means we can redistribute the prototype `.sql` in the bundle with attribution and no license friction.

**Risk:** Low and isolated — gated behind `DEMO`, touches only the web build's header/file-entry; the desktop build and all of Phases 1-5 are unaffected.

**Test:** `DEMO=1` build auto-loads Medium Office through `changeFiles`; charts populate identically to a manual drop; the dataset switcher swaps datasets via the same path; the "Demo" badge shows; desktop/non-demo build is unchanged (no badge, normal FILES menu).

---

# First PR — smallest shippable slice

**Ship Phases 1 + 2 together, behind the existing single-view fallback.**

Rationale: Phase 1 alone isn't visually shippable (unhiding panes exposes the shared-dims bug); Phase 2 alone has nothing to size. Together they are the real foundation and are testable with a *temporary* fixed 50/50 flex split before the Phase-3 library lands. Keep `viewArray.length === 1` rendering exactly as today (one pane, full width) so the default single-view experience is byte-for-byte unchanged — the new path only engages when a second pane is added. This de-risks the crux (per-pane `ResizeObserver` sizing) in isolation, with the polished resizable/collapsible shell (Phase 3) following once sizing is proven.

Concretely, the first PR:
1. Removes `maxViews` cap (`viewselector.tsx:53`) and the display-toggle hide (`charttypecontrol.tsx:81,90`) → focus ring instead.
2. Adds `PaneFrame` (`ResizeObserver`, debounced) and switches the five controls from `props.session.containerDims` to `props.paneDims` (`heatmapcontrol.tsx:51-54` and siblings).
3. Lays panes in a temporary equal flex row (no library yet); single-view path unchanged.
4. Leaves `@timestep/core`, `d3container` theming, data-quality, and session save/load untouched.
