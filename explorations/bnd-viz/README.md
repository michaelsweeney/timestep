# BND system visualizer (trial)

Prototype of a clickable HVAC system visualizer built from the EnergyPlus
`.bnd` report. **Project docs moved to `~/repos/eplus-bnd-branch-visualizer/`**
(README = concept, research, architecture; PROMPT.md = agent kickoff
brief). The code stays here until the timestep v2.0 milestone clears, then
migrates to that repo.

## Run it

Open `index.html` in a browser (needs network for the cytoscape CDN) and
pick a sample from the dropdown, or drop any `eplusout.bnd`. Regenerate
the gitignored sample bundle with `node collect-samples.mjs`; `#sample=N`
in the URL auto-loads one. Layout dropdown: **system flow** (deterministic
schematic, fluid-colored polyline edges) or **organic** (fcose). Click a
component or edge to drill down to every object touching its nodes.
