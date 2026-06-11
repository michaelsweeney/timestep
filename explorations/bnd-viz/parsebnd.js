// Parser for the EnergyPlus .bnd (Branch Node Details) report.
//
// The file is self-documenting: every record type is preceded by a
// "! <Type>,<field>,..." header line, data rows are comma-delimited with
// nesting expressed as leading whitespace. Names cannot contain commas
// (IDF is comma-delimited), so a trim+split per line is safe.
//
// Classic script (no modules) so index.html works from file://; also
// usable from node via module.exports for the test harness.

function parseBnd(text) {
  const model = {
    nodes: {}, // name -> {num, name, fluidType, refs, suspicious}
    componentSets: [], // {parentType, parentName, type, name, inlet, outlet, description}
    branches: [], // {name, loopName, loopType, inlet, outlet}
    branchLists: [], // {name, loopName, loopType}
    loops: [], // {name, side, kind: 'Plant'|'Condenser', inlet, outlet, branchList, connectorList}
    loopConnections: [], // {loopName, kind: 'Supply'|'Return', fromNode, toNode}
    connectors: [], // {type, name, loopName, loopSide, scope, nodes: [{inlet, outlet}], branches: [{inlet, outlet}]}
    airLoops: [], // {name, oaUsed}
    airPaths: [], // {kind: 'Supply'|'Return', name, airLoop, components: [{type, name, nodes: [{inlet, outlet}]}]}
    controlledZones: [], // {name, equipList, zoneNode, inlets: [], exhausts: [], returns: []}
    zoneEquipLists: [], // {name, zone, components: [{type, name, heatPriority, coolPriority}]}
    nodeConnections: [], // {node, objectType, objectName, connectionType, fluidStream, parent}
    outdoorAirNodes: [] // node names
  };

  // connectorKey -> connector, so Connector Nodes/Branches rows attach to
  // the most recently matching Connector record.
  const connectorIndex = {};
  const connectorKey = (type, name, loopName, loopSide) =>
    `${type}|${name}|${loopName}|${loopSide}`;
  const zoneIndex = {};
  let currentAirPath = null;
  let currentAirPathComponent = null;
  let currentZoneEquipList = null;

  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('!') || line.startsWith('#')) continue;
    const f = line.split(',').map(s => s.trim());
    const tag = f[0];

    switch (tag) {
      case 'Node':
      case 'Suspicious Node':
        model.nodes[f[2]] = {
          num: Number(f[1]),
          name: f[2],
          fluidType: f[3],
          refs: Number(f[4]),
          suspicious: tag === 'Suspicious Node'
        };
        break;

      case 'Component Set':
        model.componentSets.push({
          parentType: f[2],
          parentName: f[3],
          type: f[4],
          name: f[5],
          inlet: f[6],
          outlet: f[7],
          description: f[8]
        });
        break;

      case 'Branch List':
        model.branchLists.push({ name: f[2], loopName: f[3], loopType: f[4] });
        break;

      case 'Branch':
        model.branches.push({
          name: f[2],
          loopName: f[3],
          loopType: f[4],
          inlet: f[5],
          outlet: f[6]
        });
        break;

      case 'Plant Loop':
      case 'Condenser Loop':
        model.loops.push({
          name: f[1],
          side: f[2],
          kind: tag === 'Plant Loop' ? 'Plant' : 'Condenser',
          inlet: f[3],
          outlet: f[4],
          branchList: f[5],
          connectorList: f[6]
        });
        break;

      case 'Plant Loop Supply Connection':
      case 'Condenser Loop Supply Connection':
        model.loopConnections.push({
          loopName: f[1],
          kind: 'Supply',
          fromNode: f[2],
          toNode: f[3]
        });
        break;
      case 'Plant Loop Return Connection':
      case 'Condenser Loop Return Connection':
        model.loopConnections.push({
          loopName: f[1],
          kind: 'Return',
          fromNode: f[2],
          toNode: f[3]
        });
        break;

      case 'Plant Loop Connector':
      case 'Condenser Loop Connector':
      case 'AirLoopHVAC Connector': {
        const conn = {
          type: f[1],
          name: f[2],
          loopName: f[3],
          loopSide: f[4],
          scope: tag.replace(' Connector', ''),
          nodes: [],
          branches: []
        };
        model.connectors.push(conn);
        connectorIndex[connectorKey(f[1], f[2], f[3], f[4])] = conn;
        break;
      }
      case 'Plant Loop Connector Nodes':
      case 'Condenser Loop Connector Nodes':
      case 'AirLoopHVAC Connector Nodes': {
        const conn = connectorIndex[connectorKey(f[2], f[3], f[6], f[7])];
        if (conn) conn.nodes.push({ inlet: f[4], outlet: f[5] });
        break;
      }
      case 'Plant Loop Connector Branches':
      case 'Condenser Loop Connector Branches':
      case 'AirLoopHVAC Connector Branches': {
        const conn = connectorIndex[connectorKey(f[2], f[3], f[6], f[7])];
        if (conn) conn.branches.push({ inlet: f[4], outlet: f[5] });
        break;
      }

      case 'AirLoopHVAC':
        model.airLoops.push({ name: f[1], oaUsed: f[6] === 'Yes' });
        break;

      // The air loop's supply/return nodes and the zone equipment side use
      // different node names joined only by these mapping records — model
      // them as implicit crossovers like the plant loop interface.
      case 'AirLoop Supply Connections':
        model.loopConnections.push({
          loopName: f[2],
          kind: 'AirSupply',
          fromNode: f[6],
          toNode: f[4]
        });
        break;
      case 'AirLoop Return Connections':
        model.loopConnections.push({
          loopName: f[2],
          kind: 'AirReturn',
          fromNode: f[4],
          toNode: f[6]
        });
        break;

      case 'Supply Air Path':
      case 'Return Air Path':
        currentAirPath = {
          kind: tag === 'Supply Air Path' ? 'Supply' : 'Return',
          name: f[2],
          airLoop: f[3],
          components: []
        };
        model.airPaths.push(currentAirPath);
        break;
      case 'Supply Air Path Component':
      case 'Return Air Path Component':
        currentAirPathComponent = { type: f[2], name: f[3], nodes: [] };
        if (currentAirPath) currentAirPath.components.push(currentAirPathComponent);
        break;
      case 'Supply Air Path Component Nodes':
      case 'Return Air Path Component Nodes':
        if (currentAirPathComponent)
          currentAirPathComponent.nodes.push({ inlet: f[4], outlet: f[5] });
        break;

      case 'Controlled Zone': {
        const zone = {
          name: f[1],
          equipList: f[2],
          zoneNode: f[4],
          inlets: [],
          exhausts: [],
          returns: []
        };
        model.controlledZones.push(zone);
        zoneIndex[zone.name] = zone;
        break;
      }
      case 'Controlled Zone Inlet':
        if (zoneIndex[f[2]]) zoneIndex[f[2]].inlets.push(f[3]);
        break;
      case 'Controlled Zone Exhaust':
        if (zoneIndex[f[2]]) zoneIndex[f[2]].exhausts.push(f[3]);
        break;
      case 'Controlled Zone Return':
        if (zoneIndex[f[2]]) zoneIndex[f[2]].returns.push(f[3]);
        break;

      case 'Zone Equipment List':
        currentZoneEquipList = { name: f[2], zone: f[3], components: [] };
        model.zoneEquipLists.push(currentZoneEquipList);
        break;
      case 'Zone Equipment Component':
        if (currentZoneEquipList)
          currentZoneEquipList.components.push({
            type: f[2],
            name: f[3],
            heatPriority: Number(f[5]),
            coolPriority: Number(f[6])
          });
        break;

      case 'Parent Node Connection':
      case 'Non-Parent Node Connection':
        model.nodeConnections.push({
          node: f[1],
          objectType: f[2],
          objectName: f[3],
          connectionType: f[4],
          fluidStream: Number(f[5]),
          parent: tag === 'Parent Node Connection'
        });
        break;

      case 'Outdoor Air Node':
        model.outdoorAirNodes.push(f[2]);
        break;
    }
  }

  return model;
}

if (typeof module !== 'undefined') module.exports = { parseBnd };
