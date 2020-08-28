import fs from 'fs';
import sqlite3 from 'sqlite3';
import { dbProto } from './dbproto';
import { readBnd } from './readbnd';
import { unitdict } from './conversions';
async function getSeriesIndex(file, idx) {
  dbProto(); // establish async loadfiles

  let loadedobj = {};
  let db = new sqlite3.Database(file);
  let query = `SELECT * FROM ReportDataDictionary WHERE ReportDataDictionaryIndex == ${idx}`;
  let bndfile = file.replace('.sql', '.bnd');
  let bndexists = false;
  let bnd_dict;
  if (fs.existsSync(bndfile)) {
    bndexists = true;
    bnd_dict = readBnd(bndfile);
  }

  let result = await db.allAsync(query);
  let file_short = file
    .replace(/\\/g, '/')
    .split('/')
    .pop()
    .split('.')[0];
  result.forEach(row => {
    let key = file + ',' + row.ReportDataDictionaryIndex;
    row.file = file;
    row.file_short = file_short;
    row.key = key;
    row.units_si = row.Units;

    // handle ip units
    //if m3/s (try to read bnd, get gpm or cfm)
    if (row.Units == 'm3/s') {
      if (bndexists) {
        fluidtype = bnd_dict[row.KeyValue];
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

    row.name_ip_multi = `${row.file_short}, ${row.KeyValue}: ${row.Name} (${row.units_ip}) - ${row.ReportingFrequency}`;
    row.name_si_multi = `${row.file_short}, ${row.KeyValue}: ${row.Name} (${row.units_si}) - ${row.ReportingFrequency}`;
    row.name_ip_single = `${row.KeyValue}: ${row.Name} (${row.units_ip}) - ${row.ReportingFrequency}`;
    row.name_si_single = `${row.KeyValue}: ${row.Name} (${row.units_si}) - ${row.ReportingFrequency}`;
    loadedobj[key] = row;
  });
  return loadedobj;
}

export { getSeriesIndex };
