# UX Direction v2 — post per-pane restructure

> Written 2026-06-15 after the per-pane self-contained restructure (commit `959f851`),
> synthesizing a drift audit + a fresh UX critique. Supersedes the pre-restructure
> framing in `REPORT.md` / `PLAN-conservative.md` / the mockups, which now describe an
> architecture (shared left sidebar + variable browser + inspector) the branch
> deliberately abandoned. Those docs are kept as history; **this is the live steer.**

## Status (2026-06-15, implemented)

- **Track A — DONE** (`ce5022e`): 7 orphans + dead `containerDims` state removed;
  `--ok`/`--warn` tokens added; chrome (landing/noselection/version/filelist) +
  the raw Material option controls tokenized via a shared `controlstyles` hook.
- **Track B — DONE** (`d60044a`, `a72e943`): chart colors tokenized in the *live*
  renderers (the audit cited the SVG files, but the controls render the **canvas**
  variants — so the dead SVG `multiline`/`heatmap`/`scatter` twins were deleted, a
  newly-found orphan class); crosshair → accent; `alert()`-in-mousemove + `.size`
  bug fixed; a stray `xw;` ReferenceError removed; series picker now **grouped by
  zone/equipment** (`seriesgroup.ts`); chart-type switch **preserves the series**
  across the compatible Heatmap↔Histogram pair. (B#3 titles / B#5 empty-state /
  B#7 tooltip-units were found **already correct** on inspection — the critique
  over-claimed; left as-is.)
- **Track C #2 (duplicate-pane) — DONE** (`3c1c4fb`): "+ Split chart" now clones
  the focused pane (type/interval/series/data) instead of opening blank.
- **Track C #1 (the keystone — linked time-domain + crosshair) — DONE**
  (`2675c1f`, `bf17a9f`): a thin `linked` slice `{ window, hoverTime, hoverSource }`
  + a per-pane link toggle (default on, shown only when multi-pane). Hovering any
  linked multiline pane draws an aligned crosshair + markers at the same instant in
  every other linked multiline pane (source keeps its full tooltip; receivers show
  just the cursor); brushing/zooming one linked pane drives all linked panes to the
  same x-domain. **The big "unify the 6 SVG/canvas scaffolds" prerequisite was
  descoped** — Track B had already deleted the dead SVG twins, leaving one renderer
  per chart type, so the keystone only needed `multilinecanvas`'s cursor factored
  into `drawCursorAtTime(time, withTooltip)` (which an external hover can drive),
  not a sweeping refactor. Latent fix along the way: memoized `seriesData` so a
  hover dispatch no longer rebuilds the chart mid-hover.
- **Track C #1 follow-on (heatmap joins the linked hover) — DONE** (`5d236d4`):
  a linked heatmap now both honors and emits hovers — hover a multiline → the
  heatmap draws an accent day-line + boxed hour cell at that timestamp; hover a
  heatmap cell → every linked multiline shows its crosshair there. This is the
  cross-chart-type comparison (heatmap + load curve of the same meter) the
  multiline-only keystone couldn't reach. Scatter and histogram still don't
  participate (scatter's x is an arbitrary series, not always time; histogram is
  value-binned).
- **Track C remaining — NOT STARTED**: **#3 global interval**, **#4 variable
  browser**, **#5 tiling grid**, **#6 inspector**.

## The one-sentence finding

The consolidation got the pane **container** right — per-pane ResizeObserver sizing,
clean `PaneHeader`, global units in the topbar, no sidebar indirection — but added
**zero connective tissue between panes**. The app is now a row of polished, fully
isolated charts. The energy modeler's actual job is **comparison** (same meter as
heatmap + load-duration; zone temps across a design week; a meter against its
schedule), and comparison wants *shared context*, not N independent units. Every
recommendation below serves that gap or clears drift blocking it.

---

## Track A — Cleanup / drift (do first, low-risk, unblocks the rest)

Mechanical, no behavior change, shrinks the surface before we build on it.

1. **Delete the dead sidebar cluster together** (children are only alive through the parent):
   `app/src/components/views/{viewsidebar,charttypeselector,unitradio,timestepselect}.tsx`.
2. **Delete remaining orphans** (0 importers each):
   `app/src/components/viewselector.tsx`, `logo.tsx`, `infocontainer.tsx`.
   `logo.tsx` is the last hardcoded indigo/pink brand — its deletion closes that out.
3. **Remove dead `containerDims` state** (write-only, no reader since sizing moved to
   `paneDims`): `sessionreducer.tsx:12-15` default + `:57-61` `SET_CONTAINER_DIMS` +
   `store/actions/index.tsx:46` `setContainerDims`.
4. **Tokenize the chrome still on the MUI palette bridge** (renders OK only because
   `makeTheme` rebuilds the palette from the same tokens — latent coupling, not a
   visible break): `views/landingpage.tsx`, `chartcontrol/charts/noselectioncontainer.tsx`,
   `version.tsx` (`theme.palette.*` → `var(--ink)/var(--ink-dim)`); `filelist.tsx`
   modal (drop `theme.shadows[5]`/`background.paper`/hardcoded `#2e7d32`/`#b26a00`).
5. **Flat-restyle the still-raw Material controls** (match the `rangeslider`/`seriesselect`
   token treatment): `chartcontrol/controls/{colorscaleselect,colorcategoryselect,colorcontrol,bincontrol,singleslider}.tsx`.
6. **Replace the hardcoded chart fallback `#3f8cb5`** with a token in
   `histogram.tsx:80`, `scatter.tsx:202`, `scattercanvas.tsx:243,506`.
7. **Mark the stale docs**: in `REPORT.md` §3 / `README.md` / `PLAN-conservative.md`,
   note that the variable-browser / inspector / left-sidebar architecture was NOT
   shipped (superseded by self-contained panes); units shipped as a topbar toggle, not
   the gear popover; `react-resizable-panels` was not adopted (flex-row placeholder shipped).

> Token system itself is **not** drift: timestep's `:root` palette is byte-identical to
> bnd-viz except the accent (cool blue `#5b9efc` vs amber — intentional) and the dropped
> domain-hue tokens (correct, timestep doesn't need them). Fonts/light-theme mechanism
> differ only in delivery (`@fontsource` offline vs CDN; `[data-theme]` vs `body.light`).

## Track B — Quick wins (cheap, high modeler value, mostly mechanical)

These are visible improvements that need no new state model.

1. **Stop chart-type switching from wiping the series** (`paneheader.tsx:114-120`
   discards `selectedSeries`/`loadedObj` on every type change). Keeping it makes
   "same variable, different chart" one click — the core explore-by-representation loop.
2. **Thread theme tokens into the 4 hardcoded chart colors** — scatter point stroke
   `rgba(0,0,0,0.85)` (`scatter.tsx:210`, `scattercanvas.tsx:238`, near-invisible on dark),
   histogram bar `#3f8cb5`, **multiline crosshair `'black'`** (`multiline.tsx:367`,
   invisible on dark — directly blocks the linked-crosshair feature below).
3. **Put variable name + units in every chart title.** Multiline title is empty
   (`.text('')`, `multiline.tsx:297`); heatmap shows no variable name at all
   (`heatmap.tsx`). Essential the moment two panes sit side by side — today a heatmap
   pane is unidentifiable at a glance.
4. **Pass `groupBy` to the series Autocomplete.** `renderGroup`/`ListSubheader` is
   already wired (`seriesselect.tsx:139-144`) but no `groupBy` is ever passed, so it's
   dead code and the list is a flat alphabetical wall of cryptic E+ names. The raw rows
   already carry reporting frequency + the key/name split — group by category/zone/frequency.
5. **Fix the per-pane empty state.** Files-loaded-but-no-series-picked drops to the
   *landing page* ("drag files onto the window", `charttypecontrol.tsx:87`) — wrong
   message. Should say "select a variable."
6. **Repoint "+ Split chart."** It adds a *blank* pane (`splitbutton.tsx` → `addView`
   with no series), but "Split" implies deriving from the current chart. Either
   duplicate the focused pane's series into the new pane, or relabel "+ Add pane."
7. **Multiline tooltip**: add units to the body; replace the `alert()` misalignment
   guard (`multiline.tsx:446-448` — also a latent `.length`-on-a-`Set` bug that means it
   never fires) with a silent no-op. An `alert()` in a hover path is wrong regardless.
8. **Cap/wrap the flat flex row.** 4+ panes in `mappedviews.tsx` become unreadable thin
   columns; at minimum wrap to a grid past 2.

## Track C — Bigger bets (the comparison keystone — sequenced)

The state model (`views` slice keyed by id) supports all of these without a rewrite.
What's missing is a thin **shared slice** + cross-pane actions — exactly what the
consolidation did *not* add.

**Prerequisite (enabling, invisible on its own):** unify the duplicated SVG/canvas
scaffold + theme-token threading per `d3-review.md` P0/P1, so cursor/scale/color code
is written **once**, not six times. Both #1 and the linked-crosshair gate on this.

1. **Shared cross-pane slice + linked time-domain — the keystone.** Add a small
   `linked` slice `{ window:[t0,t1], hoverTime, intervalDefault }`. Wire brush→`window`
   (multiline already owns a brush+context, `multiline.tsx:169-221` — the write side
   exists in one chart) and have every time-based chart honor an external x-domain;
   wire hover→`hoverTime`→crosshair in each renderer. Per-pane "link" toggle to opt out.
   This is the design-week / fault-window task directly, and it's static (no transport —
   inside the rejected-playback boundary). **This is what turns N isolated panes into one
   comparative instrument.**
2. **"Duplicate pane as…" / send-series-to-new-pane.** Cheaper than #1 and arguably the
   first thing to ship: a header action that opens a new pane pre-loaded with this pane's
   series and a different chart type. Reuses `addView` + existing
   `changeSelectedSeries`/`changeLoadedArray` — no new state. Kills the "do all the
   discovery work twice" friction for the canonical heatmap+multiline-of-same-meter task.
3. **Global interval with per-pane override.** Promote `timestepType` to a topbar
   default next to units (which is already global), keep the per-pane override in
   `paneheader.tsx`. Most comparisons want a shared interval; setting it N times is wrong.
4. **Persistent variable browser embedding the existing virtualized select.** One durable
   catalog: grouped by category/zone/frequency, a **units facet** (the unit field exists
   per row, never surfaced), recently-used, and **inline data-quality badges**. The rich
   per-variable DQ notes (`getdataquality.ts` — guessed fluid names, SI-only, cfm-default
   flows) are currently buried in the Loaded-Files modal grouped *by file*
   (`filelist.tsx:133-161`); the modeler picking "Chilled Water Mass Flow" never learns
   its unit was *guessed*. The detail strings already name affected variables — surface
   them at selection time. (This is the one piece of the old REPORT architecture worth
   reviving, but as an *embed* of the current select, not a replacement.)
5. **Real tiling grid + saved arrangements.** Replace the flat flex row with
   `react-resizable-panels` (the PLAN's never-adopted Phase 3) for nested h+v splits and
   a 2×2 preset, then round-trip a *named layout* through the existing session save/load
   (`viewArray` + per-view config already persists). Makes "my four-up dashboard" a
   reusable workspace, not a per-session rebuild. Prerequisite for #4-style multi-pane
   to be readable.
6. **Inspector-on-demand (optional).** Reuse `statistics.tsx` math (min/max/mean/peak-time)
   + units + source file + per-series DQ notes, driven by the focused pane's selection
   (and linked `hoverTime` once #1 lands). "What am I looking at and is it trustworthy"
   without hunting tabs/modals.

## Recommended sequence

**Track A** (cleanup) → **Track B #1–5** (the cheapest visible wins, several of which —
title-with-units, don't-wipe-series, empty-state — are prerequisites for multi-pane to
feel coherent) → **D3 scaffold/token unification** (the enabling prerequisite) →
**Track C #2** (duplicate-pane, the cheapest comparison primitive) → **C #1** (linked
time-domain + crosshair, the keystone) → then C #3/#4/#5 as appetite allows.

The D3 cleanup is the highest-leverage *enabling* investment even though it shows nothing
on its own — it's the gate for both the keystone and the visible color fixes.
