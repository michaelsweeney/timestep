import type { Engine } from '../engine/types';

// Parses an EnergyPlus .bnd report's node list into { nodeName: fluidType }.
// Used to resolve m3/s flows against the actual fluid (gpm for liquid loops,
// cfm for air loops).
//
// The node list looks like:
//   ! <Node>,<NodeNumber>,<Node Name>,<Node Fluid Type>,<# Times Referenced…>
//    Node,29,HEATSYS1 SUPPLY INLET NODE,Water,3
// We key on lines whose first field is exactly " Node" AND whose second field
// is the integer node number — that excludes the "! <Node>,…" header and any
// other record that happens to start with "Node" (e.g. "Node Connection").
export async function readBnd(
  engine: Engine,
  bnd: string
): Promise<Record<string, string>> {
  const bndobj: Record<string, string> = {};
  const contents = await engine.readText(bnd);
  for (const line of contents.split('\n')) {
    const f = line.split(',');
    if (f[0] === ' Node' && f.length >= 4 && /^\s*\d+\s*$/.test(f[1])) {
      const name = f[2].trim();
      const fluid = f[3].trim();
      if (name) bndobj[name] = fluid;
    }
  }
  return bndobj;
}

// Decide the fluid (and therefore cfm vs gpm) for an m3/s variable.
//   1. If its key is a node in the .bnd, use that node's fluid type.
//   2. Otherwise (non-node flows — Water Use Equipment, plant/zone volume
//      flows — or a blank/missing .bnd entry) fall back to the variable name:
//      a name that clearly names water resolves to Water (gpm); everything else
//      stays the air default (cfm). This is a heuristic, not authoritative —
//      the .bnd node lookup is preferred whenever it resolves.
// Returns 'Water' | 'Air' | undefined (undefined → caller's cfm default).
const WATERY = /\b(water|chilled|condenser|steam|hot\s*water)\b/i;
const AIRY = /\bair\b/i;

export function resolveFluidType(
  keyValue: string | null | undefined,
  name: string | null | undefined,
  bndDict?: Record<string, string>
): 'Water' | 'Air' | undefined {
  if (bndDict && keyValue) {
    const fluid = bndDict[keyValue];
    if (fluid === 'Water') return 'Water';
    if (fluid === 'Air') return 'Air';
    // present-but-blank or other → fall through to the name heuristic
  }
  const n = name ?? '';
  if (WATERY.test(n) && !AIRY.test(n)) return 'Water';
  return undefined;
}
