import type { Engine } from '../engine/types';

// Parses an EnergyPlus .bnd report into { nodeName: fluidType }. Used to
// resolve m3/s values against the actual fluid (gpm for liquid loops,
// cfm for air loops).
export async function readBnd(
  engine: Engine,
  bnd: string
): Promise<Record<string, string>> {
  const bndobj: Record<string, string> = {};
  const contents = await engine.readText(bnd);
  const lines = contents.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const linesplit = lines[i].split(',');
    if (linesplit[0] === ' Node') {
      bndobj[linesplit[2]] = linesplit[3];
    }
  }
  return bndobj;
}
