import type { Engine } from '../engine/types';

export async function getFileSummary(engine: Engine, sqlfiles: string[]) {
  const filearray = [];

  for (let i = 0; i < sqlfiles.length; i++) {
    const sqlfile = sqlfiles[i];
    const bndexists = await engine.fileExists(sqlfile.replace('.sql', '.bnd'));

    const result_query = "SELECT * FROM 'Simulations'";
    const reports_query =
      "SELECT ReportDataDictionaryIndex from 'ReportDataDictionary'";

    const result = (await engine.allRows(sqlfile, result_query)) as any[];
    const reports = (await engine.allRows(sqlfile, reports_query)) as any[];

    const fileobj = {
      filename: sqlfile,
      bndexists: bndexists,
      timesteps: result[0].NumTimestepsPerHour,
      timestamp: result[0].TimeStamp,
      version: result[0].EnergyPlusVersion,
      numreports: reports.length
    };
    filearray.push(fileobj);
  }

  return filearray;
}
