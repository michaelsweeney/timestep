import type { Engine } from '../engine/types';
import { readBnd } from './readbnd';
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

    // For m3/s, the IP unit (cfm vs gpm) comes from the node fluid type in the
    // .bnd; every other unit resolves from the SI string alone. (Mirrors
    // getAllSeries — same resolver, so the list and the plotted series agree.)
    const fluidType =
      row.Units === 'm3/s' && bnd_dict ? bnd_dict[row.KeyValue] : undefined;
    const u = resolveUnit(row.Units, fluidType);
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
