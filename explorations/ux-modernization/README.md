# timestep — UX Modernization Exploration

Design/exploration pass on modernizing timestep's interaction shell, taking
`eplus-bnd-branch-visualizer` (BND-Vis) as the aesthetic + UX reference. **No
application code is modified by anything in this directory** — these are written
analyses and static, openable-in-browser mock-ups only.

## Contents

- **`REPORT.md`** — UX modernization assessment: critique of the views-as-tabs
  model, proposed split-pane + linked-selection architecture, phased migration
  path on the real stack (MUI v4 + Redux + D3, Electron + web), risks & what to
  preserve (@timestep/core, theming, data-quality warnings).
- **`d3-review.md`** — focused review of the D3 chart renderers: SVG/canvas
  duplication, hardcoded colors that bypass the theme, shared-scale/legend
  opportunities, performance, prioritized findings with file:line refs.
- **`mockups/`** — three self-contained static HTML mock-ups (open directly in a
  browser, no build step). Each has a dark/light toggle in the gear popover and
  uses the timestep brand colors (indigo `#3f51b5`/`#8c9eff`, pink
  `#f50057`/`#ff5c8d`).
  - `01-conservative.html` — closest to today: header + one shared sidebar, two
    resizable/collapsible chart panes, settings moved into the gear popover.
  - `02-ambitious.html` — full BND-Vis-style shell: variable browser + 2×2 tiled
    panes + inspector. **Linked selection + linked hover** are the focus (hover a
    time-based chart, watch the crosshair appear across every linked pane and the
    value read into the inspector — a read interaction, no playback).
  - `03-focused.html` — one large deep chart with a linked context/overview
    brush strip, inline chart-type switcher, thin variable rail, live inspector.

The mock-ups demonstrate **layout and interaction model**, not real data — chart
art is procedurally faked.
