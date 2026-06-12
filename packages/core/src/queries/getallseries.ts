import type { Engine } from '../engine/types';
import { resolveUnit } from './conversions';
import { checkArray } from './checkarray';
import { readBnd, resolveFluidType } from './readbnd';

export async function getAllSeries(engine: Engine, sqlfiles: string[]) {
  checkArray(sqlfiles);
  const loadedobj: any[] = [];
  for (let i = 0; i < sqlfiles.length; i++) {
    const sqlfile = sqlfiles[i];
    const bndfile = sqlfile.replace('.sql', '.bnd');
    const bndexists = await engine.fileExists(bndfile);
    let bnd_dict: Record<string, string> | undefined;

    if (bndexists) {
      bnd_dict = await readBnd(engine, bndfile);
    }

    const query = `SELECT * FROM ReportDataDictionary`;
    const result = (await engine.allRows(sqlfile, query)) as any[];

    result.forEach(orig_row => {
      const row: any = { ...orig_row };
      const key = sqlfile + ',' + row.ReportDataDictionaryIndex;
      row.file = sqlfile;
      row.file_short = sqlfile
        .replace(/\\/g, '/')
        .split('/')
        .pop()!
        .split('.')[0];
      row.key = key;

      // For m3/s, cfm vs gpm comes from the fluid: the .bnd node type when the
      // key is a node, else a name-based fallback. Every other unit resolves
      // from the SI string alone.
      const fluidType =
        row.Units === 'm3/s'
          ? resolveFluidType(row.KeyValue, row.Name, bnd_dict)
          : undefined;
      const u = resolveUnit(row.Units, fluidType);
      row.units_si = u.units_si;
      row.units_ip = u.units_ip;

      // Meters have no KeyValue (NULL in the E+ .sql); label them by Name
      // alone rather than "null: Name".
      const keyPrefix = row.KeyValue ? `${row.KeyValue}: ` : '';
      row.name_ip_multi = `${row.file_short}, ${keyPrefix}${row.Name} (${row.units_ip}) - ${row.ReportingFrequency}`;
      row.name_si_multi = `${row.file_short}, ${keyPrefix}${row.Name} (${row.units_si}) - ${row.ReportingFrequency}`;
      row.name_ip_single = `${keyPrefix}${row.Name} (${row.units_ip}) - ${row.ReportingFrequency}`;
      row.name_si_single = `${keyPrefix}${row.Name} (${row.units_si}) - ${row.ReportingFrequency}`;

      const row_filtered = {
        name_ip_multi: row.name_ip_multi,
        name_ip_single: row.name_ip_single,
        name_si_multi: row.name_si_multi,
        name_si_single: row.name_si_single,
        units_ip: row.units_ip,
        units_si: row.units_si,
        Units: row.units,
        file: row.file,
        file_short: row.file_short,
        key: row.key,
        TimestepType: row.TimestepType,
        ReportingFrequency: row.ReportingFrequency
      };
      loadedobj.push(row_filtered);
    });
  }
  return loadedobj;
}
