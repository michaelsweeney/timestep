import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import sqlite3 from 'sqlite3';
import { esoToSqlite } from '../src/eso/esotosqlite';
import { Sqlite3Engine } from '../src/engine/sqlite3';
import { annualDir, annualSql, fixtureExists } from './fixtures';

// Parity: convert the multifreq fixture's .eso and verify the converted
// database answers the app's queries identically to the native .sql
// written by the same EnergyPlus run. Skips when the fixture is absent
// (regenerate with: node scripts/eplus-matrix.mjs --only large-office-multifreq).

const annualEso = path.join(annualDir, 'eplusout.eso');
const present = fixtureExists(annualEso) && fixtureExists(annualSql);

const d = describe.skipIf(!present);

let convertedPath: string;
let engine: Sqlite3Engine;

const GETSERIES_JOIN = (idx: number) =>
  'SELECT ReportData.Value, ReportData.TimeIndex, Time.Month, Time.Day, ' +
  'Time.SimulationDays, Time.Hour, Time.Minute, Time.Dst, Time.Interval, ' +
  "Time.DayType FROM 'ReportData' INNER JOIN Time ON " +
  'ReportData.TimeIndex = Time.TimeIndex WHERE ' +
  `ReportData.ReportDataDictionaryIndex = ${idx} ORDER BY ReportData.TimeIndex`;

beforeAll(async () => {
  if (!present) return;
  convertedPath = path.join(os.tmpdir(), `timestep-esoparity-${process.pid}.sql`);
  fs.rmSync(convertedPath, { force: true });
  const esoText = await fs.promises.readFile(annualEso, 'utf8');
  await esoToSqlite(esoText, convertedPath, sqlite3);
  engine = new Sqlite3Engine(sqlite3);
}, 300_000);

afterAll(() => {
  if (convertedPath) fs.rmSync(convertedPath, { force: true });
});

d('ESO/SQL parity on the multifreq fixture', () => {
  it('reproduces the variable dictionary (ids, names, frequencies, units)', async () => {
    const native = (await engine.allRows(
      annualSql,
      'SELECT ReportDataDictionaryIndex AS id, KeyValue, Name, ReportingFrequency, Units ' +
        'FROM ReportDataDictionary WHERE IsMeter = 0 ORDER BY ReportDataDictionaryIndex'
    )) as any[];
    const converted = (await engine.allRows(
      convertedPath,
      'SELECT ReportDataDictionaryIndex AS id, KeyValue, Name, ReportingFrequency, Units ' +
        'FROM ReportDataDictionary WHERE IsMeter = 0 ORDER BY ReportDataDictionaryIndex'
    )) as any[];

    expect(converted.length).toBe(native.length);
    expect(converted).toEqual(native);
  });

  it('answers the getseries join identically for one variable at each frequency', async () => {
    const dict = (await engine.allRows(
      annualSql,
      "SELECT ReportDataDictionaryIndex AS id, ReportingFrequency FROM ReportDataDictionary " +
        "WHERE IsMeter = 0 AND Name = 'Site Outdoor Air Drybulb Temperature'"
    )) as any[];
    expect(dict.length).toBeGreaterThanOrEqual(4); // ZTS / Hourly / Daily / Monthly

    for (const { id, ReportingFrequency } of dict) {
      const native = (await engine.allRows(annualSql, GETSERIES_JOIN(id))) as any[];
      const converted = (await engine.allRows(convertedPath, GETSERIES_JOIN(id))) as any[];

      expect(converted.length, `${ReportingFrequency} row count`).toBe(native.length);
      // Spot-check shape at the ends, then aggregate equality over values.
      expect(converted[0], `${ReportingFrequency} first row`).toEqual(native[0]);
      expect(converted.at(-1), `${ReportingFrequency} last row`).toEqual(native.at(-1));
      const sum = (rows: any[]) => rows.reduce((a, r) => a + r.Value, 0);
      expect(sum(converted), `${ReportingFrequency} value sum`).toBeCloseTo(
        sum(native),
        6
      );
    }
  }, 60_000);

  it('matches total ReportData volume for non-meter variables', async () => {
    const q =
      'SELECT COUNT(*) AS n FROM ReportData JOIN ReportDataDictionary USING ' +
      '(ReportDataDictionaryIndex) WHERE IsMeter = 0';
    const native = (await engine.allRows(annualSql, q)) as any[];
    const converted = (await engine.allRows(convertedPath, q)) as any[];
    expect(converted[0].n).toBe(native[0].n);
  }, 60_000);
});
