import type { Engine } from '../engine/types';
import { getSeriesIndex } from './getseriesindex';
import { unitconvert } from './conversions';

export async function getSeries(engine: Engine, filetag: string) {
  const sqlfile = filetag.split(',')[0];
  const idx = filetag.split(',')[1];

  const series_index = await getSeriesIndex(engine, sqlfile, idx);
  const series_obj: any = Object.values(series_index)[0];

  const long_name_single_ip = series_obj.name_ip_single;
  const long_name_multi_ip = series_obj.name_ip_multi;
  const long_name_single_si = series_obj.name_si_single;
  const long_name_multi_si = series_obj.name_si_multi;

  const query_year =
    "SELECT ReportData.Value, ReportData.TimeIndex, Time.Year, Time.SimulationDays, Time.Month, Time.Day, Time.Hour, Time.Minute, Time.Dst, Time.Interval, Time.DayType FROM 'ReportData' INNER JOIN Time ON ReportData.TimeIndex = Time.TimeIndex WHERE ReportData.ReportDataDictionaryIndex = " +
    idx;
  const query_noyear =
    "SELECT ReportData.Value, ReportData.TimeIndex, Time.Month, Time.Day, Time.SimulationDays, Time.Hour, Time.Minute, Time.Dst, Time.Interval, Time.DayType FROM 'ReportData' INNER JOIN Time ON ReportData.TimeIndex = Time.TimeIndex WHERE ReportData.ReportDataDictionaryIndex = " +
    idx;
  let result: any[];

  try {
    result = (await engine.allRows(sqlfile, query_year)) as any[];
  } catch {
    console.log('no year');
    result = (await engine.allRows(sqlfile, query_noyear)) as any[];
  }

  const data_array: any[] = [];
  result.forEach(row => {
    const data: any = {};
    let year: number;
    if (row.Year) {
      year = row.Year;
    } else {
      // EnergyPlus SQL files don't always carry a Year column. The simulation
      // year is arbitrary for non-actual-weather runs, so fall back to the
      // current year purely so Date construction succeeds.
      year = new Date().getFullYear();
    }
    const time = new Date(
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
        (unitconvert[
          series_obj.units_si.replace('/', '_').replace('%', 'pct')
        ] as number);

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
