import type { Engine } from '../engine/types';
import { readBnd, resolveFluidType } from './readbnd';
import { resolveUnit } from './conversions';

export async function getSeriesIndex(engine: Engine, file: string, idx: any) {
  const loadedobj: Record<string, any> = {};
  const query = `SELECT * FROM ReportDataDictionary WHERE ReportDataDictionaryIndex == ${idx}`;
  const bndfile = file.replace('.sql', '.bnd');
  const bndexists = await engine.fileExists(bndfile);
  let bnd_dict: Record<string, string> | undefined;
  if (bndexists) {
    bnd_dict = await readBnd(engine, bndfile);
  }

  const result = (await engine.allRows(file, query)) as any[];
  const file_short = file
    .replace(/\\/g, '/')
    .split('/')
    .pop()!
    .split('.')[0];
  result.forEach(row => {
    const key = file + ',' + row.ReportDataDictionaryIndex;
    row.file = file;
    row.file_short = file_short;
    row.key = key;

    // For m3/s, cfm vs gpm comes from the fluid: the .bnd node type when the
    // key is a node, else a name-based fallback. Every other unit resolves from
    // the SI string alone. (Mirrors getAllSeries — same resolvers, so the list
    // and the plotted series agree.)
    const fluidType =
      row.Units === 'm3/s'
        ? resolveFluidType(row.KeyValue, row.Name, bnd_dict)
        : undefined;
    const u = resolveUnit(row.Units, fluidType, row.Name);
    row.units_si = u.units_si;
    row.units_ip = u.units_ip;

    // Meters have no KeyValue (NULL in the E+ .sql); label them by Name alone
    // rather than "null: Name". Mirrors getAllSeries.
    const keyPrefix = row.KeyValue ? `${row.KeyValue}: ` : '';
    row.name_ip_multi = `${row.file_short}, ${keyPrefix}${row.Name} (${row.units_ip}) - ${row.ReportingFrequency}`;
    row.name_si_multi = `${row.file_short}, ${keyPrefix}${row.Name} (${row.units_si}) - ${row.ReportingFrequency}`;
    row.name_ip_single = `${keyPrefix}${row.Name} (${row.units_ip}) - ${row.ReportingFrequency}`;
    row.name_si_single = `${keyPrefix}${row.Name} (${row.units_si}) - ${row.ReportingFrequency}`;
    loadedobj[key] = row;
  });
  return loadedobj;
}
