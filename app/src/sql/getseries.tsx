import { getSeriesIndex } from './getseriesindex';
import { unitconvert } from './conversions';
import sqlite3 from 'sqlite3';
import { dbProto } from './dbproto';
import bettersqlite from 'better-sqlite3';

async function getSeries(filetag) {
  let sqlfile = filetag.split(',')[0];
  let file_short = sqlfile
    .replace(/\\/g, '/')
    .split('/')
    .pop()
    .split('.')[0];
  let idx = filetag.split(',')[1];

  let series_obj = await getSeriesIndex(sqlfile, idx);
  series_obj = Object.values(series_obj)[0];

  let long_name_single_ip = series_obj.name_ip_single;
  let long_name_multi_ip = series_obj.name_ip_multi;
  let long_name_single_si = series_obj.name_si_single;
  let long_name_multi_si = series_obj.name_si_multi;

  let query_year =
    "SELECT ReportData.Value, ReportData.TimeIndex, Time.Year, Time.SimulationDays, Time.Month, Time.Day, Time.Hour, Time.Minute, Time.Dst, Time.Interval, Time.DayType FROM 'ReportData' INNER JOIN Time ON ReportData.TimeIndex = Time.TimeIndex WHERE ReportData.ReportDataDictionaryIndex = " +
    idx;
  let query_noyear =
    "SELECT ReportData.Value, ReportData.TimeIndex, Time.Month, Time.Day, Time.SimulationDays, Time.Hour, Time.Minute, Time.Dst, Time.Interval, Time.DayType FROM 'ReportData' INNER JOIN Time ON ReportData.TimeIndex = Time.TimeIndex WHERE ReportData.ReportDataDictionaryIndex = " +
    idx;
  let result;

  let db = new sqlite3.Database(sqlfile);
  // let db = bettersqlite(sqlfile);

  try {
    // result = await db.prepare(query_year).all();
    result = await db.allAsync(query_year);
  } catch {
    console.log('no year');
    result = await db.allAsync(query_noyear);
  }

  let data_array = [];
  result.forEach(row => {
    let data = {};
    let year;
    if (row.Year) {
      year = row.Year;
    } else {
      year = 2017; // new Date().getFullYear();
    }
    let time = new Date(
      year + '-' + row.Month + '-' + row.Day + ' ' + row.Hour + ':' + row.Minute
    );
    data.name_ip_single = long_name_single_ip;
    data.name_ip_multi = long_name_multi_ip;

    data.name_si_single = long_name_single_si;
    data.name_si_multi = long_name_multi_si;

    data.value_si = row.Value;
    data.time = time;
    data.units_si = series_obj.units_si;
    data.units_ip = series_obj.units_ip;
    data.type = series_obj.Type;

    data.day = row.Day;
    data.hour = row.Hour;
    data.minute = row.Minute;
    data.month = row.Month;
    data.year = year;
    data.simulationday = row.SimulationDays;
    data.key = filetag;

    if (series_obj.units_si == 'C') {
      data.value_ip = row.Value * 1.8 + 32;
    } else if (series_obj.Units == 'm3/s') {
      if (series_obj.units_ip == 'gpm') {
        data.value_ip = row.Value * 15850.32314;
      } else if (series_obj.units_ip == 'cfm') {
        data.value_ip = row.Value * 2118.88;
      } else {
        console.warn('m3/s conversion error:');
        console.warn(row);
        console.warn(series_obj);
        data.value_ip = row.Value;
      }
    } else {
      data.value_ip =
        row.Value *
        unitconvert[series_obj.units_si.replace('/', '_').replace('%', 'pct')];

      if (isNaN(data.value_ip)) {
        console.warn('unit_dict conversion error:');
        console.warn(row);
        console.warn(series_obj);
        data.value_ip = row.Value;
      } else {
      }
    }

    data_array.push(data);
  });
  return data_array;
}

export { getSeries };
