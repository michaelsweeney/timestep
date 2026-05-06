async function getFileSummary(sqlfiles) {
  let filearray = [];

  for (let i = 0; i < sqlfiles.length; i++) {
    let sqlfile = sqlfiles[i];
    let bndexists = await window.api.fs.exists(sqlfile.replace('.sql', '.bnd'));

    let result_query = "SELECT * FROM 'Simulations'";
    let reports_query =
      "SELECT ReportDataDictionaryIndex from 'ReportDataDictionary'";

    let result = await window.api.db.allRows(sqlfile, result_query);
    let reports = await window.api.db.allRows(sqlfile, reports_query);

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
