import { dbProto } from './dbproto';
import fs from 'fs';
import sqlite3 from 'sqlite3';

async function getFileSummary(sqlfiles) {
  dbProto(); // establish async loadfiles
  let filearray = [];

  for (let i = 0; i < sqlfiles.length; i++) {
    let sqlfile = sqlfiles[i];
    let bndexists = fs.existsSync(sqlfile.replace('.sql', '.bnd'))
      ? true
      : false;
    let db = new sqlite3.Database(sqlfile);

    let result = await db.allAsync("SELECT * FROM 'Simulations'");
    let reports = await db.allAsync(
      "SELECT ReportDataDictionaryIndex from 'ReportDataDictionary'"
    );
    let fileobj = {
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

export { getFileSummary };
