// import { dbProto } from './dbproto';
import fs from 'fs';
// import sqlite3 from 'sqlite3';
import bettersqlite from 'better-sqlite3';

async function getFileSummary(sqlfiles) {
  // dbProto(); // establish async loadfiles
  let filearray = [];

  for (let i = 0; i < sqlfiles.length; i++) {
    let sqlfile = sqlfiles[i];
    let bndexists = fs.existsSync(sqlfile.replace('.sql', '.bnd'))
      ? true
      : false;

    let result_query = "SELECT * FROM 'Simulations'";
    let reports_query =
      "SELECT ReportDataDictionaryIndex from 'ReportDataDictionary'";

    let db = bettersqlite(sqlfile);
    let result = await db.prepare(result_query).all();
    let reports = await db.prepare(reports_query).all();

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
