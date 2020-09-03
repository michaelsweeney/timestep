import fs from 'fs';
import sqlite3 from 'sqlite3';
// import { dbProto } from './dbproto';
import { unitdict, unitconvert } from './conversions';
import { checkArray } from './checkarray';
import { readBnd } from './readbnd';
import bettersqlite from 'better-sqlite3';

async function getAllSeries(sqlfiles) {
  // dbProto();
  checkArray(sqlfiles);
  let loadedobj = [];
  for (let i = 0; i < sqlfiles.length; i++) {
    let sqlfile = sqlfiles[i];
    let bndfile = sqlfile.replace('.sql', '.bnd');
    let bndexists = false;
    let bnd_dict;

    if (fs.existsSync(bndfile)) {
      bndexists = true;
      bnd_dict = readBnd(bndfile);
    }

    let query = `SELECT * FROM ReportDataDictionary`;

    let db = bettersqlite(sqlfile);
    let result = await db.prepare(query).all();

    result.forEach(orig_row => {
      let row = { ...orig_row };
      let key = sqlfile + ',' + row.ReportDataDictionaryIndex;
      row.file = sqlfile;
      row.file_short = sqlfile
        .replace(/\\/g, '/')
        .split('/')
        .pop()
        .split('.')[0];
      row.key = key;
      row.units_si = row.Units;

      // handle ip units
      //if m3/s (try to read bnd, get gpm or cfm)
      if (row.Units == 'm3/s') {
        if (bndexists) {
          let fluidtype = bnd_dict[row.KeyValue];
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
          row.units_ip = unitdict[
            row.Units.replace('/', '_').replace('%', 'pct')
          ]
            .replace('_', '/')
            .replace('pct', '%');
        } catch {
          if (row.Units == '') {
            row.units_ip = '';
          } else {
            console.warn('Processing Error. Check Console Log for Details');
            console.warn(row);
            row.units_ip = row.units_si;
          }
        }
      }
      row.name_ip_multi = `${row.file_short}, ${row.KeyValue}: ${row.Name} (${row.units_ip}) - ${row.ReportingFrequency}`;
      row.name_si_multi = `${row.file_short}, ${row.KeyValue}: ${row.Name} (${row.units_si}) - ${row.ReportingFrequency}`;
      row.name_ip_single = `${row.KeyValue}: ${row.Name} (${row.units_ip}) - ${row.ReportingFrequency}`;
      row.name_si_single = `${row.KeyValue}: ${row.Name} (${row.units_si}) - ${row.ReportingFrequency}`;

      let row_filtered = {
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

export { getAllSeries };
