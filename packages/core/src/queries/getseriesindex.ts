import type { Engine } from '../engine/types';
import { readBnd } from './readbnd';
import { unitdict } from './conversions';

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
    row.units_si = row.Units;

    // handle ip units
    //if m3/s (try to read bnd, get gpm or cfm)
    if (row.Units == 'm3/s') {
      if (bndexists && bnd_dict) {
        const fluidtype = bnd_dict[row.KeyValue];
        if (fluidtype == 'Air') {
          row.units_ip = 'cfm';
        } else if (fluidtype == 'Water') {
          row.units_ip = 'gpm';
        } else {
          row.units_ip = 'cfm';
        }
      } else {
        // can put some logic in here to try and parse without bnd...
        row.units_ip = 'cfm';
      }
    } else {
      try {
        row.units_ip = unitdict[row.Units.replace('/', '_').replace('%', 'pct')]
          .replace('_', '/')
          .replace('pct', '%');
      } catch {
        if (row.Units == '') {
          row.units_ip = '';
        } else {
          console.log('Processing Error. Check Console Log for Details');
          console.log(row);
          row.units_ip = row.units_si;
        }
      }
    }

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
