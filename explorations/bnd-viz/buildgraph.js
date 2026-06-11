// Turns a parsed .bnd model into a clickable system graph.
//
// Model: components are vertices, EnergyPlus nodes are the edges — in E+
// a fluid node IS the connection point between two pieces of equipment,
// so an edge is drawn wherever one vertex's outlet node is another's
// inlet node. Loops (plant / condenser / air) become compound parents.
//
// Components that are themselves containers of other component sets
// (AirLoopHVAC:OutdoorAirSystem, unitary systems, ADUs) are rendered as
// compound parents too — their children carry the flow, so the container
// contributes no edges of its own.

function buildGraph(model) {
  const vertices = {}; // id -> {id, type, name, group, pairs: [{inlet, outlet}], container}
  const vid = (type, name) => `${type}|${name}`;
  const loopId = name => `loop|${name}`;

  const branchLoop = {}; // branch name -> loop name
  for (const b of model.branches) branchLoop[b.name] = b.loopName;

  // Loop compound parents. Air loops only appear via AirLoopHVAC records
  // and branch loopNames, plant/condenser via Loop records.
  const loopKind = {};
  for (const l of model.loops) loopKind[l.name] = l.kind;
  for (const a of model.airLoops) loopKind[a.name] = 'Air';
  for (const b of model.branches)
    if (!(b.loopName in loopKind)) loopKind[b.loopName] = b.loopType;

  // Container components: appear as the parent of other component sets.
  const containerKeys = new Set(
    model.componentSets
      .filter(c => c.parentType !== 'BRANCH')
      .map(c => vid(c.parentType, c.parentName))
  );

  const ensureVertex = (type, name) => {
    const id = vid(type, name);
    if (!vertices[id])
      vertices[id] = { id, type, name, group: null, pairs: [], container: false };
    return vertices[id];
  };

  // 1. Component sets → vertices, grouped by loop (via branch) or container.
  for (const c of model.componentSets) {
    const v = ensureVertex(c.type, c.name);
    v.pairs.push({ inlet: c.inlet, outlet: c.outlet, description: c.description });
    if (c.parentType === 'BRANCH') {
      v.group = loopId(branchLoop[c.parentName] || c.parentName);
      v.branch = c.parentName;
    } else {
      v.group = vid(c.parentType, c.parentName);
    }
  }
  // 2. Splitters/mixers from connector lists and air paths.
  for (const conn of model.connectors) {
    const v = ensureVertex(`CONNECTOR:${conn.type.toUpperCase()}`, conn.name);
    v.pairs.push(...conn.nodes);
    v.group = loopId(conn.loopName);
  }
  for (const path of model.airPaths) {
    for (const comp of path.components) {
      const v = ensureVertex(comp.type, comp.name);
      v.pairs.push(...comp.nodes);
      v.group = loopId(path.airLoop);
    }
  }

  // 3. Zones: inlets are graph-inlet nodes; returns and exhausts leave the
  // zone, so they are graph-outlet nodes.
  for (const z of model.controlledZones) {
    const v = ensureVertex('ZONE', z.name);
    for (const n of z.inlets) v.pairs.push({ inlet: n, outlet: null });
    for (const n of [...z.returns, ...z.exhausts])
      v.pairs.push({ inlet: null, outlet: n });
    v.zoneNode = z.zoneNode;
    v.group = 'zones';
  }

  // 4. Zone equipment that never appears in a component set (e.g. ADUs are
  // containers; baseboards etc. appear via component sets already).
  for (const list of model.zoneEquipLists) {
    for (const comp of list.components) {
      const v = ensureVertex(comp.type, comp.name);
      if (!v.group) v.group = 'zones';
      v.zone = list.zone;
    }
  }

  // 5. The structured records under-report some node hookups: return
  // plenums have no node rows at all, and multi-stream components (ERV
  // heat exchangers) only carry their primary pair in Component Sets —
  // the secondary stream exists solely in the node connection records.
  // Augment every vertex with its own Inlet/Outlet connections that the
  // structured records missed.
  const connByObject = {};
  for (const nc of model.nodeConnections)
    (connByObject[vid(nc.objectType, nc.objectName)] =
      connByObject[vid(nc.objectType, nc.objectName)] || []).push(nc);
  for (const v of Object.values(vertices)) {
    const inlets = new Set(v.pairs.map(p => p.inlet));
    const outlets = new Set(v.pairs.map(p => p.outlet));
    for (const nc of connByObject[v.id] || []) {
      if (nc.connectionType === 'Inlet' && !inlets.has(nc.node))
        v.pairs.push({ inlet: nc.node, outlet: null });
      if (nc.connectionType === 'Outlet' && !outlets.has(nc.node))
        v.pairs.push({ inlet: null, outlet: nc.node });
    }
  }

  // A container's own flow edges are suppressed only when its children
  // fully bridge its inlet/outlet nodes (e.g. an OutdoorAirSystem whose
  // mixer + coils cover the path). A partially-decomposed parent — an air
  // terminal whose only child is its reheat coil — keeps its edges, since
  // dropping them would sever the flow path. Checked after every vertex
  // exists (ADUs are created from zone equipment lists in step 4).
  const childrenOf = {};
  for (const v of Object.values(vertices))
    if (v.group && containerKeys.has(v.group))
      (childrenOf[v.group] = childrenOf[v.group] || []).push(v);
  for (const key of containerKeys) {
    const v = vertices[key];
    if (!v) continue;
    const kids = childrenOf[key] || [];
    v.kidInlets = new Set(kids.flatMap(k => k.pairs.map(p => p.inlet)));
    v.kidOutlets = new Set(kids.flatMap(k => k.pairs.map(p => p.outlet)));
    v.container =
      v.pairs.length === 0 ||
      v.pairs.every(
        p =>
          (!p.inlet || v.kidInlets.has(p.inlet)) &&
          (!p.outlet || v.kidOutlets.has(p.outlet))
      );
  }

  // Edges: shared node name, outlet side → inlet side. Suppression is
  // per endpoint: a container registers only endpoints its children do
  // not cover, so a partially-decomposed parent (air terminal with only
  // a reheat coil child) keeps its uncovered inlet without duplicating
  // the child's outlet edge.
  const byOutlet = {};
  const byInlet = {};
  for (const v of Object.values(vertices)) {
    for (const p of v.pairs) {
      if (p.outlet && !(v.kidOutlets && v.kidOutlets.has(p.outlet)))
        (byOutlet[p.outlet] = byOutlet[p.outlet] || new Set()).add(v.id);
      if (p.inlet && !(v.kidInlets && v.kidInlets.has(p.inlet)))
        (byInlet[p.inlet] = byInlet[p.inlet] || new Set()).add(v.id);
    }
  }

  const edges = [];
  const seenEdges = new Set();
  const addEdge = (source, target, label, kind) => {
    const key = `${source}→${target}→${label}`;
    if (source === target || seenEdges.has(key)) return;
    seenEdges.add(key);
    edges.push({ source, target, label, kind });
  };

  for (const node of Object.keys(byOutlet)) {
    if (!byInlet[node]) continue;
    for (const s of byOutlet[node])
      for (const t of byInlet[node]) addEdge(s, t, node, 'flow');
  }
  // Loop supply↔demand crossovers connect two different node names.
  for (const lc of model.loopConnections) {
    for (const s of byOutlet[lc.fromNode] || [])
      for (const t of byInlet[lc.toNode] || [])
        addEdge(s, t, `${lc.fromNode} ⇒ ${lc.toNode}`, 'crossover');
  }

  // Drill-down index: node name -> all node connections touching it.
  const connectionsByNode = {};
  for (const nc of model.nodeConnections)
    (connectionsByNode[nc.node] = connectionsByNode[nc.node] || []).push(nc);

  // Cytoscape elements. Every vertex is emitted as a node; cytoscape makes
  // a node compound automatically when another node names it as parent.
  // Synthetic groups (loops, zones) are added for any referenced id that
  // is not a real vertex.
  const elements = [];
  const syntheticGroups = new Set();
  for (const v of Object.values(vertices))
    if (v.group && !vertices[v.group]) syntheticGroups.add(v.group);
  for (const g of syntheticGroups) {
    const isLoop = g.startsWith('loop|');
    const label = isLoop ? g.slice(5) : g === 'zones' ? 'Zones' : g.split('|')[1];
    elements.push({
      data: { id: g, label, parent: null, isGroup: true, kind: isLoop ? loopKind[label] : 'container' }
    });
  }
  for (const v of Object.values(vertices)) {
    elements.push({
      data: {
        id: v.id,
        label: v.name,
        type: v.type,
        parent: v.group,
        branch: v.branch || null,
        isZone: v.type === 'ZONE',
        isContainer: v.container
      }
    });
  }
  let i = 0;
  for (const e of edges) {
    if (!vertices[e.source] || !vertices[e.target]) continue;
    elements.push({
      data: { id: `e${i++}`, source: e.source, target: e.target, label: e.label, kind: e.kind }
    });
  }

  return { elements, vertices, connectionsByNode };
}

if (typeof module !== 'undefined') module.exports = { buildGraph };
