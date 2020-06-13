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
    let query = "SELECT * FROM 'Simulations'";
    let result = await db.allAsync(query);
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

async function loadAllSeries(sqlfiles, timestep) {
  dbProto(); // establish async loadfiles
  checkArray(sqlfiles); // error handling for sql files of same name

  let loadedobj = []; // compiler for multiple sqlfiles

  for (let i = 0; i < sqlfiles.length; i++) {
    // loop through each file
    let sqlfile = sqlfiles[i];
    let bndfile = sqlfile.replace('.sql', '.bnd');
    let bndexists = false;
    let bnd_dict;

    if (fs.existsSync(bndfile)) {
      bndexists = true;
      bnd_dict = readBnd(bndfile);
    }

    let db = new sqlite3.Database(sqlfile);
    let query = `SELECT * FROM ReportDataDictionary WHERE ReportingFrequency = '${timestep}'`;

    let result = await db.allAsync(query);
    result.forEach(row => {
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
      row.name_ip = `${row.file_short}, ${row.KeyValue}: ${row.Name} (${row.units_ip}) - ${row.ReportingFrequency}`;
      row.name_si = `${row.file_short}, ${row.KeyValue}: ${row.Name} (${row.units_si}) - ${row.ReportingFrequency}`;
      loadedobj.push(row);
    });
  }
  return loadedobj;
}

async function loadAvailSeries(sqlfiles, steptype, units) {
  dbProto(); // establish async loadfiles
  checkArray(sqlfiles); // error handling for sql files of same name

  let loadedobj = []; // compiler for multiple sqlfiles

  for (let i = 0; i < sqlfiles.length; i++) {
    // loop through each file
    let sqlfile = sqlfiles[i];
    let bndfile = sqlfile.replace('.sql', '.bnd');
    let bndexists = false;
    let bnd_dict;

    if (fs.existsSync(bndfile)) {
      bndexists = true;
      bnd_dict = readBnd(bndfile);
    }

    let db = new sqlite3.Database(sqlfile);
    let query =
      "SELECT * FROM ReportDataDictionary WHERE ReportingFrequency = '" +
      steptype +
      "'";

    let result = await db.allAsync(query);
    result.forEach(row => {
      let file_short = sqlfile
        .replace(/\\/g, '/')
        .split('/')
        .pop()
        .split('.')[0];
      let key = sqlfile + ',' + row.ReportDataDictionaryIndex;
      row.file = sqlfile;
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
          row.units_ip = unitdict[
            row.Units.replace('/', '_').replace('%', 'pct')
          ]
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

      if (units == 'si') {
        row.name_short =
          file_short +
          ', ' +
          row.KeyValue +
          ', ' +
          row.Name +
          ' (' +
          row.units_si +
          ')';
      }

      if (units == 'ip') {
        row.name_short =
          file_short +
          ', ' +
          row.KeyValue +
          ', ' +
          row.Name +
          ' (' +
          row.units_ip +
          ')';
      }
      loadedobj.push(row);
    });
  }
  return loadedobj;
}

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
    row.name_ip = `${row.file_short}, ${row.KeyValue}: ${row.Name} (${row.units_ip}) - ${row.ReportingFrequency}`;
    row.name_si = `${row.file_short}, ${row.KeyValue}: ${row.Name} (${row.units_si}) - ${row.ReportingFrequency}`;
    loadedobj[key] = row;
  });
  return loadedobj;
}

async function getSeries(filetag, units) {
  dbProto(); // establish async loadfiles
  let sqlfile = filetag.split(',')[0];
  let file_short = sqlfile
    .replace(/\\/g, '/')
    .split('/')
    .pop()
    .split('.')[0];
  let idx = filetag.split(',')[1];

  let series_obj = await getSeriesIndex(sqlfile, idx);
  series_obj = Object.values(series_obj)[0];
  let long_name;
  if (units == 'IP') {
    long_name = series_obj.name_ip;
  } else {
    long_name = series_obj.name_si;
  }

  let db = new sqlite3.Database(sqlfile);
  let query_year =
    "SELECT ReportData.Value, ReportData.TimeIndex, Time.Year, Time.SimulationDays, Time.Month, Time.Day, Time.Hour, Time.Minute, Time.Dst, Time.Interval, Time.DayType FROM 'ReportData' INNER JOIN Time ON ReportData.TimeIndex = Time.TimeIndex WHERE ReportData.ReportDataDictionaryIndex = " +
    idx;
  let query_noyear =
    "SELECT ReportData.Value, ReportData.TimeIndex, Time.Month, Time.Day, Time.SimulationDays, Time.Hour, Time.Minute, Time.Dst, Time.Interval, Time.DayType FROM 'ReportData' INNER JOIN Time ON ReportData.TimeIndex = Time.TimeIndex WHERE ReportData.ReportDataDictionaryIndex = " +
    idx;
  let result;

  try {
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

    data.name = long_name;
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

    if (units == 'SI') {
      data.units = data.units_si;
      data.value = data.value_si;
    } else if (units == 'IP') {
      data.units = data.units_ip;
      data.value = data.value_ip;
    }

    data_array.push(data);
  });
  return data_array;
}

/* --------------- INTERNAL FUNCTIONS / HELPERS --------------- */

function dbProto() {
  sqlite3.Database.prototype.getAsync = function(sql) {
    let that = this;
    return new Promise(function(resolve, reject) {
      that.get(sql, function(err, row) {
        if (err) reject(err);
        else resolve(row);
      });
    });
  };

  sqlite3.Database.prototype.allAsync = function(sql) {
    let that = this;
    return new Promise(function(resolve, reject) {
      that.all(sql, function(err, rows) {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  };

  sqlite3.Database.prototype.runAsync = function(sql) {
    let that = this;
    return new Promise(function(resolve, reject) {
      that.run(sql, function(err) {
        if (err) reject(err);
        else resolve();
      });
    });
  };
}

function checkArray(sqlfiles) {
  let checkarray = [];
  for (let i = 0; i < sqlfiles.length; i++) {
    let sqlfile = sqlfiles[i];
    let sqlfile_short = sqlfile
      .split('/')
      .pop()
      .split('.')[0];
    if (checkarray.includes(sqlfile_short)) {
      alert('Error: All SQL Files Must Have Unique Filenames');
      return;
    }
    checkarray.push(sqlfile_short);
  }
}

async function loadAllStandardTables(sqlfiles) {
  dbProto(); // establish async loadfiles
  checkArray(sqlfiles); // error handling for sql files of same name

  let loadedobj = {}; // compiler for multiple sqlfiles

  for (let i = 0; i < sqlfiles.length; i++) {
    // loop through each file
    let sqlfile = sqlfiles[i];

    let db = new sqlite3.Database(sqlfile);
    let query = "SELECT tbl_name FROM sqlite_master WHERE type = 'table'";

    let result = await db.allAsync(query);
    result.forEach(row => {
      let rpt = {};
      rpt.file = sqlfile;
      rpt.file_short = sqlfile
        .replace(/\\/g, '/')
        .split('/')
        .pop()
        .split('.')[0];
      rpt.key = rpt.file + '|' + row.tbl_name;
      rpt.name = rpt.file_short + ' - ' + row.tbl_name;
      loadedobj[rpt.key] = rpt;
    });
  }
  return loadedobj;
}

async function loadAllTabularDataTables(sqlfiles) {
  dbProto(); // establish async loadfiles
  checkArray(sqlfiles); // error handling for sql files of same name

  let loadedobj = {}; // compiler for multiple sqlfiles

  for (let i = 0; i < sqlfiles.length; i++) {
    // loop through each file
    let sqlfile = sqlfiles[i];

    let db = new sqlite3.Database(sqlfile);
    let query =
      "SELECT DISTINCT reportn.Value As ReportName, fs.Value As ReportForString, tn.Value As TableName FROM TabularData As td INNER JOIN Strings As reportn ON reportn.StringIndex=td.ReportNameIndex INNER JOIN Strings As fs ON fs.StringIndex=td.ReportForStringIndex INNER JOIN Strings As tn ON tn.StringIndex=td.TableNameIndex WHERE tn.StringTypeIndex = 1 OR tn.StringTypeIndex = 2 OR tn.StringTypeIndex = 3 AND td.Value = ''";
    query =
      "SELECT DISTINCT ReportName || '|' || ReportForString || '|' || TableName FROM TabularDataWithStrings ";

    let result = await db.allAsync(query);
    result.forEach(row => {
      let key = row["ReportName || '|' || ReportForString || '|' || TableName"];
      let split = key.split('|');

      let rpt = {};
      rpt.key = sqlfile + '|' + key;
      rpt.ReportName = split[0];
      rpt.ReportForString = split[1];
      rpt.TableName = split[2];
      rpt.file = sqlfile;
      rpt.file_short = sqlfile
        .replace(/\\/g, '/')
        .split('/')
        .pop()
        .split('.')[0];
      rpt.name =
        rpt.file_short +
        ' - ' +
        rpt.ReportName +
        ', ' +
        rpt.ReportForString +
        ', ' +
        rpt.TableName;
      loadedobj[key] = rpt;
    });
  }
  return loadedobj;
}

async function getStandardTable(tag) {
  dbProto();
  let sqlfile = tag[0].replace('"', '');
  let reportname = tag[1].replace('"', '');
  let db = new sqlite3.Database(sqlfile);
  let query = `SELECT * FROM ${reportname}`;
  let result = await db.allAsync(query);
  return result;
}

async function getTabularDataTable(tag) {
  dbProto();

  let sqlfile = tag[0].replace('"', '');
  let reportname = tag[1].replace('"', '');
  let reportfor = tag[2].replace('"', '');
  let tablename = tag[3].replace('"', '');

  let db = new sqlite3.Database(sqlfile);
  let query = `
        SELECT

        TD.RowId,
        TD.ColumnId,
        TD.Value,

        rptname.Value as rptname,
        rptfor.Value as rptfor,
        tblname.Value as tblname,
        rowname.Value as rowname,
        colname.Value as colname,
        unitname.Value as unitname

        FROM TabularData TD

        INNER JOIN Strings rptname ON TD.ReportNameIndex = rptname.StringIndex
        INNER JOIN Strings rptfor ON TD.ReportForStringIndex = rptfor.StringIndex
        INNER JOIN Strings tblname ON TD.TableNameIndex = tblname.StringIndex
        INNER JOIN Strings rowname ON TD.RowNameIndex = rowname.StringIndex
        INNER JOIN Strings colname ON TD.ColumnNameIndex = colname.StringIndex
        INNER JOIN Strings unitname ON TD.UnitsIndex = unitname.StringIndex

        WHERE tblname = "${tablename}"
        AND rptname = "${reportname}"
        AND rptfor = "${reportfor}"
        `;

  let result = await db.allAsync(query);
  return result;
}

async function getTables(tag) {
  dbProto();

  let table;

  let tagsplit = tag.split('|');
  if (tagsplit.length == 2) {
    table = await getStandardTable(tagsplit);
    return table;
  } else if (tagsplit.length == 4) {
    table = await getTabularDataTable(tagsplit);
    return table;
  } else {
    console.log(tagsplit.length);
    console.warn('Table Tag Parsing Error');
  }
}

function readBnd(bnd) {
  let bndobj = {};
  fs.readFile(bnd, 'utf8', function(err, contents) {
    if (err) throw err;
    let lines = contents.split('\n');

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      let linesplit = line.split(',');
      if (linesplit[0] == ' Node') {
        bndobj[linesplit[2]] = linesplit[3];
      }
    }
  });
  return bndobj;
}

const unitdict = {
  deg: 'deg',
  m: 'ft',
  m2: 'ft2',
  m3: 'ft3',
  deg: 'deg',
  m: 'ft',
  m2: 'ft2',
  m3: 'ft3',
  s: 's',
  Hz: 'Hz',
  C: 'F',
  K: 'K',
  deltaC: 'deltaF',
  m_s: 'fpm',
  J: 'btu',
  W: 'W',
  kg: 'lb',
  N: 'N',
  kg_s: 'lb_s',
  m3_s: 'cfm',
  Pa: 'atm',
  Pa: 'atm',
  J_kg: 'btu/lb',
  kg_m3: 'lb/cfm',
  W_m2: 'w/ft2',
  J_kg_K: 'J/kg-K',
  W_m_K: 'W/m-K',
  m2_s: 'ft2/s',
  W_m2_K: 'W/m2-K',
  m2_K_W: 'm2-K/W',
  W: 'W',
  V: 'V',
  A: 'A',
  lx: 'lx',
  lm: 'lm',
  cd: 'cd',
  cd_m2: 'cd/ft2',
  m2_s: 'ft2/s',
  kg_m_s: 'lb/ft-min',
  N_s_m2: 'N-s/m2',
  kg_kg_K: 'kg/kg-K',
  m3_kg: 'cfm/lb',
  ach: 'ach',
  hr: 'hr',
  pct: 'pct'
};

const unitconvert = {
  deg: 1,
  m: 3.28,
  m2: 10.7639,
  m3: 35.3147,
  s: 1,
  Hz: 1,
  C: 'cToF',
  K: 1,
  deltaC: 'cToF',
  m_s: 196.85,
  J: 0.000947817,
  W: 1,
  kg: 2.20462,
  N: 1.0,
  kg_s: 2.205,
  m3_s: 2118.88,
  Pa: 9.86923e-6,
  J_kg: 'tbd',
  kg_m3: 'tbd',
  W_m2: 0.0929,
  J_kg_K: 1,
  W_m_K: 1,
  m2_s: 10.7639,
  W_m2_K: 1,
  m2_K_W: 1,
  W: 1,
  V: 1,
  A: 1,
  lx: 1,
  lm: 1,
  cd: 1,
  cd_m2: 1,
  m2_s: 1,
  kg_m_s: 'tbd',
  N_s_m2: 'tbd',
  kg_kg_K: 1,
  m3_kg: 'tbd',
  ach: 1,
  hr: 1,
  pct: 1
};

export { loadAvailSeries, loadAllSeries, getSeries, getFileSummary };
/* --------------------------------------------------------- */

// queries:

// SELECT * FROM sqlite_master WHERE type = 'table'
// SELECT * FROM TabularData
