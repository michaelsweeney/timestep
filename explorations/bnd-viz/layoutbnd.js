// Deterministic rule-based "system flow" layout for the BND graph.
//
// One fixed rule set, no randomness — the same .bnd always produces the
// same drawing:
//
//   columns (left → right):
//     0 plant supply side (boilers, chillers, towers, pumps, plant pipes)
//     1 air handler / airside supply equipment (OA system, coils, fans)
//     2 distribution (supply paths, terminals, ADUs, zone equipment)
//     3 zones
//     4 return path (plenums, zone mixers)
//
//   bands (top → bottom): one horizontal band per system — plant and
//   condenser loops first (sorted), then air loops (sorted), then
//   anything unassigned. A vertex's band is the system it serves.
//
//   within a (column, band) cell: topological rank along flow edges sets
//   the x sub-column; same-rank vertices stack vertically, sorted by id.
//
// Components that touch both a water loop and an air loop (water coils)
// are drawn airside — the water edge crossing columns is the schematic.

function computeSystemLayout(model, graph) {
  const ids = Object.keys(graph.vertices).sort();
  const V = graph.vertices;

  // --- which loops reference each vertex, via branch membership ---------
  const branchLoop = graph.branchLoop;
  const loopKind = graph.loopKind;
  const vertexLoops = {}; // id -> Set of loop names
  const touch = (id, loop) => {
    if (!loop) return;
    (vertexLoops[id] = vertexLoops[id] || new Set()).add(loop);
  };
  for (const c of model.componentSets) {
    const id = `${c.type}|${c.name}`;
    if (c.parentType === 'BRANCH') touch(id, branchLoop[c.parentName]);
  }
  for (const conn of model.connectors)
    touch(`CONNECTOR:${conn.type.toUpperCase()}|${conn.name}`, conn.loopName);
  for (const path of model.airPaths)
    for (const comp of path.components)
      touch(`${comp.type}|${comp.name}`, path.airLoop);

  // return-path component ids (column 4)
  const returnComps = new Set(
    model.airPaths
      .filter(p => p.kind === 'Return')
      .flatMap(p => p.components.map(c => `${c.type}|${c.name}`))
  );

  // resolve a vertex's root group by walking container parents
  const rootGroup = id => {
    let g = V[id] && V[id].group;
    const seen = new Set();
    while (g && V[g] && !seen.has(g)) { seen.add(g); g = V[g].group; }
    return g;
  };

  const airLoopOf = id => {
    for (const l of vertexLoops[id] || []) if (loopKind[l] === 'Air') return l;
    const rg = rootGroup(id);
    if (rg && rg.startsWith('loop|')) {
      const l = rg.slice(5);
      if (loopKind[l] === 'Air') return l;
    }
    return null;
  };
  const waterLoopOf = id => {
    for (const l of vertexLoops[id] || [])
      if (loopKind[l] === 'Plant' || loopKind[l] === 'Condenser') return l;
    const rg = rootGroup(id);
    if (rg && rg.startsWith('loop|')) {
      const l = rg.slice(5);
      if (loopKind[l] === 'Plant' || loopKind[l] === 'Condenser') return l;
    }
    return null;
  };

  // --- edges (flow only, both endpoints leaf vertices) ------------------
  const edges = graph.elements
    .filter(e => e.data.source)
    .map(e => ({ s: e.data.source, t: e.data.target, fluid: e.data.fluid }));

  // --- classification: column + band -----------------------------------
  // a component is airside if any of its nodes carries Air — branch
  // membership alone misses water coils that live inside zone equipment
  // (a VAV reheat coil's only branch is the hot-water demand side, but it
  // belongs in the air band, with the water edge crossing columns)
  const touchesAir = id =>
    V[id].pairs.some(p =>
      [p.inlet, p.outlet].some(
        n => n && model.nodes[n] && model.nodes[n].fluidType === 'Air'
      )
    );

  const colOf = {};
  const bandOf = {};
  for (const id of ids) {
    const v = V[id];
    const air = airLoopOf(id);
    const water = waterLoopOf(id);
    if (v.type === 'ZONE') {
      colOf[id] = 3;
      bandOf[id] = null; // inferred from feeding terminal below
    } else if (returnComps.has(id)) {
      colOf[id] = 4;
      bandOf[id] = air || null;
    } else if (rootGroup(id) === 'zones' || V[id].zone) {
      colOf[id] = 2; // terminals, ADUs, zone equipment (incl. their coils)
      bandOf[id] = air || null;
    } else if (air) {
      // supply path splitters are distribution; everything else is AHU
      colOf[id] = v.type.startsWith('AIRLOOPHVAC:ZONESPLITTER') ? 2 : 1;
      bandOf[id] = air;
    } else if (water) {
      // explicit branch membership beats the fluid heuristic: an
      // air-cooled chiller touches an outdoor-air node but lives waterside
      colOf[id] = 0;
      bandOf[id] = water;
    } else if (touchesAir(id)) {
      colOf[id] = 1; // air-touching equipment with no branch membership
      bandOf[id] = null;
    } else {
      colOf[id] = 0;
      bandOf[id] = 'misc';
    }
  }

  // infer missing bands (zones, zone-equipment coils, orphan terminals)
  // from neighbors, several passes so chains resolve: splitter → terminal
  // → coil → zone → plenum …
  // only walk Air edges — a reheat coil also has water edges to its plant
  // loop, and propagating along those would pull it into the water band
  for (let pass = 0; pass < 6; pass++) {
    for (const e of edges) {
      if (e.fluid !== 'Air') continue;
      if (bandOf[e.t] == null && bandOf[e.s] != null && bandOf[e.s] !== 'misc')
        bandOf[e.t] = bandOf[e.s];
      if (bandOf[e.s] == null && bandOf[e.t] != null && bandOf[e.t] !== 'misc')
        bandOf[e.s] = bandOf[e.t];
    }
  }
  for (const id of ids) if (bandOf[id] == null) bandOf[id] = 'misc';

  // --- band order: plant/condenser loops, then air loops, then misc -----
  const plantBands = Object.keys(loopKind)
    .filter(l => loopKind[l] === 'Plant' || loopKind[l] === 'Condenser')
    .sort();
  const airBands = Object.keys(loopKind).filter(l => loopKind[l] === 'Air').sort();
  const bandOrder = [...plantBands, ...airBands, 'misc'].filter(b =>
    ids.some(id => bandOf[id] === b)
  );

  // --- rank within each (band, column) cell -----------------------------
  // BFS from in-degree-0 members; loops are cyclic, so if a cell has no
  // entry point, seed with its lexicographically smallest member.
  const rankOf = {};
  const cellMembers = {};
  for (const id of ids) {
    if (V[id].container) continue; // compounds wrap their children
    (cellMembers[`${bandOf[id]}|${colOf[id]}`] =
      cellMembers[`${bandOf[id]}|${colOf[id]}`] || []).push(id);
  }
  for (const key of Object.keys(cellMembers)) {
    const members = cellMembers[key].sort();
    const inCell = new Set(members);
    const indeg = {};
    members.forEach(m => (indeg[m] = 0));
    const out = {};
    for (const e of edges)
      if (inCell.has(e.s) && inCell.has(e.t) && e.s !== e.t) {
        (out[e.s] = out[e.s] || []).push(e.t);
        indeg[e.t]++;
      }
    let frontier = members.filter(m => indeg[m] === 0);
    if (frontier.length === 0) frontier = [members[0]];
    const seen = new Set();
    let rank = 0;
    while (frontier.length) {
      const next = [];
      for (const m of frontier.sort()) {
        if (seen.has(m)) continue;
        seen.add(m);
        rankOf[m] = rank;
        for (const n of out[m] || []) if (!seen.has(n)) next.push(n);
      }
      frontier = next;
      rank++;
    }
    for (const m of members) if (!seen.has(m)) rankOf[m] = 0;
  }

  // --- positions ---------------------------------------------------------
  const X_STEP = 170; // between ranks
  const Y_STEP = 75; // between stacked vertices
  const COL_GUTTER = 260;
  const BAND_GUTTER = 140;

  // column inner width = widest rank count across bands
  const colRanks = [0, 0, 0, 0, 0];
  for (const id of Object.keys(rankOf))
    colRanks[colOf[id]] = Math.max(colRanks[colOf[id]], rankOf[id] + 1);
  const colBase = [];
  let x = 0;
  for (let c = 0; c < 5; c++) {
    colBase[c] = x;
    x += colRanks[c] * X_STEP + COL_GUTTER;
  }

  const positions = {};
  let bandY = 0;
  const bandLabels = [];
  for (const band of bandOrder) {
    let bandHeight = 0;
    for (let c = 0; c < 5; c++) {
      const members = (cellMembers[`${band}|${c}`] || []).sort(
        (a, b) => rankOf[a] - rankOf[b] || (a < b ? -1 : 1)
      );
      // stacks wrap every WRAP slots into a sub-column so a 50-zone band
      // doesn't become a several-thousand-pixel strip
      const WRAP = 14;
      const slotAtRank = {};
      for (const m of members) {
        const r = rankOf[m];
        const slot = slotAtRank[r] || 0;
        slotAtRank[r] = slot + 1;
        positions[m] = {
          x: colBase[c] + r * X_STEP + Math.floor(slot / WRAP) * (X_STEP * 0.75),
          y: bandY + (slot % WRAP) * Y_STEP
        };
      }
      const tallest = Math.min(WRAP, Math.max(0, ...Object.values(slotAtRank)));
      bandHeight = Math.max(bandHeight, tallest * Y_STEP);
    }
    bandLabels.push({ band, y: bandY, kind: loopKind[band] || 'misc' });
    bandY += bandHeight + BAND_GUTTER;
  }

  return { positions, colOf, bandOf, bandLabels };
}

if (typeof module !== 'undefined') module.exports = { computeSystemLayout };
