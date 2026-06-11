import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import sqlite3 from 'sqlite3';
import { esoToSqlite } from '../src/eso/esotosqlite';
import { Sqlite3Engine } from '../src/engine/sqlite3';
import { MINI_ESO_DATA } from './esofixtures';

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
