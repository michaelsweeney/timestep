# timestep — D3 Chart Code Review

*Focused review of the D3 renderers under `app/src/components/views/chartcontrol/charts/`. Exploration only; no code changed.*

All paths below are relative to `app/src/components/views/chartcontrol/charts/` unless noted.

## File inventory

| File | ~Lines | Role | Variant |
|------|-------:|------|---------|
| `d3container.tsx` | 52 | Theme-aware root container (axis/text CSS, tooltip) | shared |
| `chartdimensions.tsx` | 71 | Exported margin/label constants per chart type | shared config |
| `heatmaprange.ts` | 78 | Calendar heatmap x-domain (variable-length runs) | shared util |
| `noselectioncontainer.tsx` | 45 | Empty-state fallback | shared |
| `heatmap.tsx` | 340 | SVG calendar heatmap | SVG |
| `heatmapcanvas.tsx` | 402 | Same heatmap, canvas-rendered cells | canvas |
| `multiline.tsx` | 630 | Dual-Y line chart + zoom/brush context | SVG |
| `multilinecanvas.tsx` | 674 | Same, canvas line rendering | canvas |
| `scatter.tsx` | 498 | x/y/z scatter + brush zoom + color legend | SVG |
| `scattercanvas.tsx` | 589 | Same, canvas point rendering | canvas |
| `histogram.tsx` | 224 | D3 histogram, single series | SVG only |
| `statistics.tsx` | 98 | MUI table of summary stats (no D3) | n/a |

Three of the five chart types ship **both an SVG and a canvas implementation** (heatmap, multiline, scatter); histogram is SVG-only; statistics is a table.

---

## Priority findings

### P0 — SVG/canvas variants duplicate ~60-70% of each chart

The biggest maintenance liability. Each chart type maintains two near-identical files that differ only in the draw step; everything around the draw (margins, scales, axes, labels, legend, tooltip, brush/zoom) is copied.

- **Heatmap:** margins identical (`heatmap.tsx:59-62` == `heatmapcanvas.tsx:59-62`); scales identical (`:69-77` == `:69-77`); color legend identical including the random gradient-ID generation (`heatmap.tsx:249-329` ~= `heatmapcanvas.tsx:308-390`). Only difference: SVG `.join('rect')` (`heatmap.tsx:97-115`) vs `context.rect()` loop (`heatmapcanvas.tsx:129-141`).
- **Multiline:** `handleYAxes()` is copied verbatim (`multiline.tsx:75-133` == `multilinecanvas.tsx:75-133`); scale setup (`:151-172` vs `:180-201`), axis setup (`:169-246` vs `:198-275`), and the entire brush/zoom block (`multiline.tsx:510-604` ~= `multilinecanvas.tsx:553-647`) are ~95% identical.
- **Scatter:** scales (`scatter.tsx:138-147` vs `scattercanvas.tsx:105-115`), data-array build (`:155-185` vs `:195-229`), axis/label setup (`:214-316` vs `:255-358`), legend (`:320-400` vs `:362-444`), and brush (`:437-488` vs `:530-578`) all duplicated.

**Fix:** extract the shared scaffold (margins -> scales -> axes -> legend -> tooltip -> brush) into per-chart hooks/utilities (`useChartScaffold(chartType, data, dims, theme)`), leaving each variant to implement only `drawSeries(selectionOrContext, scales)`. This is also the prerequisite for linked selection (REPORT.md S3.2/Phase 3) — wire shared cursor/scale once, not six times.

### P0 — Hardcoded colors bypass the theme (break/degrade in light & dark)

`d3container.tsx:6-19` recolors axes and panel by `theme.palette.type`, but **data encodings and several marks are hardcoded** and never consult the theme:

- `scatter.tsx:202` — default point fill (missing z): `'#3f8cb5'`
- `scatter.tsx:210` — point stroke: `'rgba(0,0,0,0.85)'` (near-invisible on dark panel `#2b2a2a`)
- `scattercanvas.tsx:238` — canvas point stroke: `'rgba(0,0,0,0.85)'`
- `scattercanvas.tsx:243` — canvas default point fill: `'#3f8cb5'`
- `scattercanvas.tsx:506` — tooltip marker fill fallback: `'#3f8cb5'`
- `histogram.tsx:80` — bar fill: `'#3f8cb5'` (single hardcoded color, no scale, no theme)
- `multiline.tsx:367` — crosshair/x-line stroke: `'black'` (invisible on dark)
- `multilinecanvas.tsx:410` — same `'black'` crosshair
- `d3container.tsx:31` — tooltip `backgroundColor: 'rgb(43, 42, 42)'` is always dark gray even in light mode (`color: 'white'` text on light-mode pages is fine but the panel doesn't match light chrome).

**Fix:** thread theme-derived tokens (point stroke = `theme.palette.divider`/text color; default mark fill = brand indigo `#3f51b5`/`#8c9eff`; histogram bar = `theme.palette.primary.main`; crosshair = axis color from `d3container`'s `axis` value `#cfcfcf`/`rgba(0,0,0,0.75)`) into the renderers, ideally via the same hook from P0 so there's one source of theme truth. The scatter `rgba(0,0,0,0.85)` strokes are the most visible bug — points lose their outline on the dark panel.

### P1 — Color-legend code duplicated across heatmap and scatter

Both build the same `linearGradient` via template string with stops at 0/33/66/100% calling `colorFunc(t)`, plus the same `reversecolor` ternary (`heatmap.tsx:283`, `scatter.tsx:354`) and random gradient ID. Four copies total (heatmap SVG/canvas + scatter SVG/canvas). `colorscaleindex.tsx` only exports the *interpolators* (the big d3 `scaleobj`, `colorscaleindex.tsx:52-101`) — there's no shared *legend renderer*.

**Fix:** one `<ColorRamp domain reverse colorFunc format>` component (or `drawColorRamp` util) consumed by all four. Pairs naturally with the inspector/legend work in REPORT.md.

### P1 — `reversecolor` + `createColorScale` copy-pasted four times

`createColorScale()` flips the domain on `reversecolor`: `heatmap.tsx:48-51`, `heatmapcanvas.tsx:48-51`, `scatter.tsx:84-88`, `scattercanvas.tsx:84-88` — identical. Belongs next to `colorscaleindex.tsx` as a single helper.

### P2 — SVG variants don't null-guard the ref; canvas variants do

Canvas variants wrap their whole body in `if (container.current)` (`heatmapcanvas.tsx:79`, `multilinecanvas.tsx:138`, `scattercanvas.tsx:120`). SVG variants call `select(container.current)` directly (`heatmap.tsx:79`, `multiline.tsx:138`, `scatter.tsx:105`) and will throw if the ref is null — a real risk in a resizing/tiling pane world (REPORT.md Phase 1). Add the guard, or centralize it in the shared scaffold.

### P2 — No explicit canvas-vs-SVG selection rule

Nothing in the chart files decides which variant renders; the parent must pass the right component. There's no data-size threshold (e.g. "switch to canvas above N points"). For the tiled/linked future where many charts render at once at 8760 points, this matters for performance (REPORT.md S5). **Fix:** make the choice explicit and data-driven (point count / pane count), or — once P0 unifies the scaffold — pick the renderer per-pane behind one component.

### P3 — Dead / fragile code

- `scatter.tsx:205` — stray statement `xw;` (no-op).
- `histogram.tsx:196` — uses `event` without importing it from d3 (relies on a global); fragile.
- `multiline.tsx:205` / `multilinecanvas.tsx:205` — redundant `.style('opacity', 1)` already set later.

---

## Theming integration — current state vs. target

**Current:** `d3container.tsx` is the only theme-aware piece. It works by CSS specificity (`d3container.tsx:7-10` comment): D3 sets axis stroke via low-specificity presentation attributes, so the container's CSS overrides axes/domain/ticks (`.axis-text`, `.domain`, `.tick line`, `.x-line`, lines 18-19), while inline `.style('fill')` on series marks wins for data encodings. Clever, but it only covers axes + panel background; everything in the P0 hardcoded-color list slips through because those are inline styles, not CSS-overridable attributes.

**Target:** one theme token object passed into every renderer (axis color, panel, default mark fill = brand indigo, mark stroke, crosshair, tooltip bg). The container keeps handling axes via CSS; the renderers stop hardcoding. Then dark/light is correct everywhere, and the brand indigo/pink (`logo.tsx:21,24`) can show up as default series colors instead of `#3f8cb5`.

---

## Performance notes

- Canvas variants exist precisely for the large-data case (8760+ points): one `clearRect` + a draw loop (`heatmapcanvas.tsx:129-141`, `scattercanvas.tsx:241-250`) vs. binding thousands of DOM nodes. Correct instinct; the cost is interactivity — canvas loses per-element hover, so hover does nearest-point math on `mousemove` (`scattercanvas.tsx:476-526`).
- The tiling/linked future (REPORT.md S5) multiplies live charts. Recommendation: default tiled panes to canvas, share the scaffold so a linked-cursor redraw only re-runs `drawSeries`, and debounce resize (already done in `mappedviews.tsx:28-34`, but layout math moves to the pane manager).

---

## Recommended sequence

1. **Extract theme tokens + kill hardcoded colors** (P0 colors, P1 reversecolor/legend). Small, high-visibility, unblocks correct dark mode. Do first.
2. **Unify SVG/canvas per chart behind a shared scaffold** (P0 duplication, P2 null-guard, P2 renderer selection). The big structural win; prerequisite for linked selection.
3. **Shared `<ColorRamp>` + `createColorScale` helper** (P1). Falls out of step 2.
4. **Clean dead code** (P3) opportunistically.

Steps 1-2 should land *before* the REPORT.md Phase 3 linked-selection work, so the shared cursor/highlight is wired once.
