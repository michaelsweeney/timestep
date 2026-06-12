import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import sqlite3 from 'sqlite3';
import { esoToSqlite } from '../src/eso/esotosqlite';
import { Sqlite3Engine } from '../src/engine/sqlite3';
import {
  MINI_ESO_DATA,
  MINI_ESO_METER_DATA,
  MINI_MTR_DATA,
  MINI_RDD
} from './esofixtures';

// Converts the synthetic ESO into a real SQLite file, then queries it
// through the same Sqlite3Engine + SQL the app's query layer uses.

let dbPath: string;
let engine: Sqlite3Engine;

beforeAll(async () => {
  dbPath = path.join(os.tmpdir(), `timestep-esotest-${process.pid}.sql`);
  fs.rmSync(dbPath, { force: true });
  await esoToSqlite(MINI_ESO_DATA, dbPath, sqlite3);
  engine = new Sqlite3Engine(sqlite3);
});

afterAll(() => {
  fs.rmSync(dbPath, { force: true });
});

describe('esoToSqlite', () => {
  it('writes ReportDataDictionary rows with the E+ schema columns', async () => {
    const rows = (await engine.allRows(
      dbPath,
      'SELECT * FROM ReportDataDictionary ORDER BY ReportDataDictionaryIndex'
    )) as any[];

    expect(rows).toHaveLength(5);
    expect(rows[0]).toMatchObject({
      ReportDataDictionaryIndex: 7,
      IsMeter: 0,
      KeyValue: 'Environment',
      Name: 'Site Outdoor Air Drybulb Temperature',
      ReportingFrequency: 'Hourly',
      Units: 'C'
    });
  });

  it('answers the app getseries join with correct values and times', async () => {
    const rows = (await engine.allRows(
      dbPath,
      "SELECT ReportData.Value, ReportData.TimeIndex, Time.Month, Time.Day, " +
        'Time.SimulationDays, Time.Hour, Time.Minute, Time.Dst, Time.Interval, ' +
        "Time.DayType FROM 'ReportData' INNER JOIN Time ON " +
        'ReportData.TimeIndex = Time.TimeIndex WHERE ' +
        'ReportData.ReportDataDictionaryIndex = 12 ORDER BY ReportData.TimeIndex'
    )) as any[];

    expect(rows).toEqual([
      {
        Value: 20.5, TimeIndex: 1, Month: 12, Day: 21, SimulationDays: 1,
        Hour: 0, Minute: 10, Dst: 0, Interval: 10, DayType: 'WinterDesignDay'
      },
      {
        Value: 21.5, TimeIndex: 2, Month: 12, Day: 21, SimulationDays: 1,
        Hour: 0, Minute: 20, Dst: 0, Interval: 10, DayType: 'WinterDesignDay'
      }
    ]);
  });

  it('writes a Simulations row so getFileSummary works', async () => {
    const rows = (await engine.allRows(
      dbPath,
      "SELECT * FROM 'Simulations'"
    )) as any[];

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ CompletedSuccessfully: 1 });
    expect(rows[0].EnergyPlusVersion).toContain('25.2.0');
  });
});

describe('esoToSqlite meters', () => {
  let meterDb: string;
  let meterEngine: Sqlite3Engine;

  beforeAll(async () => {
    meterDb = path.join(os.tmpdir(), `timestep-esometer-${process.pid}.sql`);
    fs.rmSync(meterDb, { force: true });
    await esoToSqlite(MINI_ESO_METER_DATA, meterDb, sqlite3);
    meterEngine = new Sqlite3Engine(sqlite3);
  });

  afterAll(() => {
    fs.rmSync(meterDb, { force: true });
  });

  it('writes meter rows as the native E+ schema does (IsMeter=1, KeyValue=NULL)', async () => {
    const meters = (await meterEngine.allRows(
      meterDb,
      'SELECT ReportDataDictionaryIndex AS id, IsMeter, KeyValue, Name, Units ' +
        'FROM ReportDataDictionary WHERE IsMeter = 1 ORDER BY id'
    )) as any[];

    expect(meters).toEqual([
      { id: 65, IsMeter: 1, KeyValue: null, Name: 'Electricity:Facility', Units: 'J' },
      { id: 1992, IsMeter: 1, KeyValue: null, Name: 'NaturalGas:Facility', Units: 'J' }
    ]);
    // the report variable is still a non-meter
    const vars = (await meterEngine.allRows(
      meterDb,
      'SELECT IsMeter, KeyValue FROM ReportDataDictionary WHERE ReportDataDictionaryIndex = 7'
    )) as any[];
    expect(vars[0]).toMatchObject({ IsMeter: 0, KeyValue: 'Environment' });
  });

  it('makes meter timeseries queryable via the getseries join', async () => {
    const rows = (await meterEngine.allRows(
      meterDb,
      "SELECT ReportData.Value, Time.Hour FROM 'ReportData' INNER JOIN Time ON " +
        'ReportData.TimeIndex = Time.TimeIndex WHERE ' +
        'ReportData.ReportDataDictionaryIndex = 65'
    )) as any[];
    expect(rows).toEqual([{ Value: 123456.0, Hour: 1 }]);
  });
});

describe('esoToSqlite with a sibling .mtr', () => {
  let db: string;
  let engine: Sqlite3Engine;

  beforeAll(async () => {
    db = path.join(os.tmpdir(), `timestep-esomtr-${process.pid}.sql`);
    fs.rmSync(db, { force: true });
    await esoToSqlite(MINI_ESO_METER_DATA, db, sqlite3, MINI_MTR_DATA);
    engine = new Sqlite3Engine(sqlite3);
  });

  afterAll(() => {
    fs.rmSync(db, { force: true });
  });

  it('merges in a .mtr-only meter (ElectricityNet:Facility) at its global id', async () => {
    const meters = (await engine.allRows(
      db,
      'SELECT ReportDataDictionaryIndex AS id, IsMeter, KeyValue, Name ' +
        'FROM ReportDataDictionary WHERE IsMeter = 1 ORDER BY id'
    )) as any[];
    // .eso meters 65 + 1992, plus the .mtr-only 1652 — and no duplicate 65
    expect(meters.map(m => m.id)).toEqual([65, 1992, 1652].sort((a, b) => a - b));
    expect(meters.find(m => m.id === 1652)).toMatchObject({
      IsMeter: 1,
      KeyValue: null,
      Name: 'ElectricityNet:Facility'
    });
  });

  it('makes the merged meter queryable with its value and time', async () => {
    const rows = (await engine.allRows(
      db,
      "SELECT ReportData.Value, Time.Month, Time.Hour FROM 'ReportData' INNER JOIN " +
        'Time ON ReportData.TimeIndex = Time.TimeIndex WHERE ' +
        'ReportData.ReportDataDictionaryIndex = 1652'
    )) as any[];
    expect(rows).toEqual([{ Value: 777.0, Month: 12, Hour: 1 }]);
  });
});

describe('esoToSqlite variable Type (F2)', () => {
  const typeByName = async (db: string, eng: Sqlite3Engine) => {
    const rows = (await eng.allRows(
      db,
      'SELECT Name, Type, IsMeter FROM ReportDataDictionary'
    )) as any[];
    return Object.fromEntries(rows.map(r => [r.Name, r.Type]));
  };

  it('derives report-variable Type from a sibling .rdd; meters are always Sum', async () => {
    const db = path.join(os.tmpdir(), `timestep-rdd-${process.pid}.sql`);
    fs.rmSync(db, { force: true });
    try {
      // MINI_ESO_METER_DATA has a variable (id 7) + meters (65, 1992); pair it
      // with a .rdd that types the variable.
      const rdd =
        'Output:Variable,*,Site Outdoor Air Drybulb Temperature,hourly; !- Zone Average [C]\n';
      await esoToSqlite(MINI_ESO_METER_DATA, db, sqlite3, undefined, rdd);
      const eng = new Sqlite3Engine(sqlite3);
      const t = await typeByName(db, eng);
      expect(t['Site Outdoor Air Drybulb Temperature']).toBe('Avg'); // from .rdd
      expect(t['Electricity:Facility']).toBe('Sum'); // meter, always Sum
      expect(t['NaturalGas:Facility']).toBe('Sum');
    } finally {
      fs.rmSync(db, { force: true });
    }
  });

  it('leaves report-variable Type empty without a .rdd, but meters still Sum', async () => {
    const db = path.join(os.tmpdir(), `timestep-nordd-${process.pid}.sql`);
    fs.rmSync(db, { force: true });
    try {
      await esoToSqlite(MINI_ESO_METER_DATA, db, sqlite3); // no .mtr, no .rdd
      const eng = new Sqlite3Engine(sqlite3);
      const t = await typeByName(db, eng);
      expect(t['Site Outdoor Air Drybulb Temperature']).toBe(''); // unknown -> honest empty
      expect(t['Electricity:Facility']).toBe('Sum'); // meter, derivable without any file
    } finally {
      fs.rmSync(db, { force: true });
    }
  });

  it('uses the full MINI_RDD map and leaves omitted variables empty', async () => {
    const db = path.join(os.tmpdir(), `timestep-rddfull-${process.pid}.sql`);
    fs.rmSync(db, { force: true });
    try {
      await esoToSqlite(MINI_ESO_DATA, db, sqlite3, undefined, MINI_RDD);
      const eng = new Sqlite3Engine(sqlite3);
      const t = await typeByName(db, eng);
      expect(t['Other Equipment Total Heating Energy']).toBe('Sum');
      expect(t['Zone Mean Air Temperature']).toBe('Avg');
      // "Site Total Sky Cover" is intentionally absent from MINI_RDD
      expect(t['Site Total Sky Cover']).toBe('');
    } finally {
      fs.rmSync(db, { force: true });
    }
  });
});
