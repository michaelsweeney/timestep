// Parses an EnergyPlus .bnd report into { nodeName: fluidType }.
// Previously this used fs.readFile with a callback and returned the (still
// empty) accumulator before the read completed — the m3/s → cfm/gpm fluid
// detection silently never worked. Now async via the IPC bridge.
export async function readBnd(bnd: string): Promise<Record<string, string>> {
  const bndobj: Record<string, string> = {};
  const contents = await window.api.fs.readText(bnd);
  const lines = contents.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const linesplit = lines[i].split(',');
    if (linesplit[0] === ' Node') {
      bndobj[linesplit[2]] = linesplit[3];
    }
  }
  return bndobj;
}
