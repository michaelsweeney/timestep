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

  // Meters embedded in the .eso must now convert with full parity. Asserted by
  // index against the native rows (not a blanket equality) because the native
  // .sql can also carry .mtr-only meters the .eso never contained — recovering
  // those is the separate .mtr-ingestion question (see DESIGN-variable-model.md).
  it('recovers .eso-embedded meters with dictionary parity', async () => {
    const converted = (await engine.allRows(
      convertedPath,
      'SELECT ReportDataDictionaryIndex AS id, IsMeter, KeyValue, Name, ' +
        'ReportingFrequency, Units FROM ReportDataDictionary WHERE IsMeter = 1 ' +
        'ORDER BY id'
    )) as any[];
    expect(converted.length).toBeGreaterThan(0); // previously meters were dropped

    const ids = converted.map(r => r.id).join(',');
    const native = (await engine.allRows(
      annualSql,
      'SELECT ReportDataDictionaryIndex AS id, IsMeter, KeyValue, Name, ' +
        `ReportingFrequency, Units FROM ReportDataDictionary WHERE ` +
        `ReportDataDictionaryIndex IN (${ids}) ORDER BY id`
    )) as any[];

    expect(converted).toEqual(native);
    // sanity: the recovered rows really are meters with a NULL key
    expect(converted.every(r => r.IsMeter === 1 && r.KeyValue === null)).toBe(true);
  }, 60_000);

  it('answers the getseries join identically for an .eso-embedded meter', async () => {
    const [meter] = (await engine.allRows(
      convertedPath,
      'SELECT ReportDataDictionaryIndex AS id FROM ReportDataDictionary ' +
        'WHERE IsMeter = 1 ORDER BY id LIMIT 1'
    )) as any[];

    const native = (await engine.allRows(annualSql, GETSERIES_JOIN(meter.id))) as any[];
    const converted = (await engine.allRows(convertedPath, GETSERIES_JOIN(meter.id))) as any[];

    expect(converted.length).toBe(native.length);
    expect(converted[0]).toEqual(native[0]);
    expect(converted.at(-1)).toEqual(native.at(-1));
    const sum = (rows: any[]) => rows.reduce((a, r) => a + r.Value, 0);
    expect(sum(converted)).toBeCloseTo(sum(native), 6);
  }, 60_000);

  // With the sibling .mtr merged, the converted DB should carry the *full*
  // native meter set — including meters the .eso never embedded
  // (ElectricityNet:Facility), the gap quantified in DESIGN-variable-model.md §7.
  it('reaches full meter parity when the sibling .mtr is merged', async () => {
    const annualMtr = path.join(annualDir, 'eplusout.mtr');
    if (!fixtureExists(annualMtr)) return; // .mtr optional for the fixture

    const withMtr = path.join(os.tmpdir(), `timestep-esomtrparity-${process.pid}.sql`);
    fs.rmSync(withMtr, { force: true });
    try {
      const esoText = await fs.promises.readFile(annualEso, 'utf8');
      const mtrText = await fs.promises.readFile(annualMtr, 'utf8');
      await esoToSqlite(esoText, withMtr, sqlite3, mtrText);

      const METER_Q =
        'SELECT ReportDataDictionaryIndex AS id, IsMeter, KeyValue, Name, ' +
        'ReportingFrequency, Units FROM ReportDataDictionary WHERE IsMeter = 1 ' +
        'ORDER BY id';
      const native = (await engine.allRows(annualSql, METER_Q)) as any[];
      const withMtrMeters = (await engine.allRows(withMtr, METER_Q)) as any[];
      // the .eso-only conversion (built in beforeAll) recovered a strict subset
      const esoOnly = (await engine.allRows(convertedPath, METER_Q)) as any[];

      // merging the .mtr recovers meters the .eso never embedded...
      expect(withMtrMeters.length).toBeGreaterThan(esoOnly.length);
      // ...up to the full native meter set, row-for-row.
      expect(withMtrMeters).toEqual(native);
    } finally {
      fs.rmSync(withMtr, { force: true });
    }
  }, 60_000);

  // With the sibling .rdd supplied, the converted report-variable Type (Avg/Sum)
  // should match native row-for-row (F2). Meters are always Sum regardless.
  it('reproduces the Avg/Sum Type when the sibling .rdd is supplied', async () => {
    const annualRdd = path.join(annualDir, 'eplusout.rdd');
    if (!fixtureExists(annualRdd)) return; // .rdd optional for the fixture

    const withRdd = path.join(os.tmpdir(), `timestep-rddparity-${process.pid}.sql`);
    fs.rmSync(withRdd, { force: true });
    try {
      const esoText = await fs.promises.readFile(annualEso, 'utf8');
      const rddText = await fs.promises.readFile(annualRdd, 'utf8');
      await esoToSqlite(esoText, withRdd, sqlite3, undefined, rddText);

      const TYPE_Q =
        'SELECT ReportDataDictionaryIndex AS id, Name, Type FROM ' +
        'ReportDataDictionary WHERE IsMeter = 0 ORDER BY id';
      const native = (await engine.allRows(annualSql, TYPE_Q)) as any[];
      const converted = (await engine.allRows(withRdd, TYPE_Q)) as any[];

      // both Avg and Sum are represented in this fixture, so this is a real test
      const types = new Set(native.map(r => r.Type));
      expect(types.has('Avg') && types.has('Sum')).toBe(true);
      expect(converted).toEqual(native);

      // and meters are Sum without needing the .rdd at all
      const meterTypes = (await engine.allRows(
        withRdd,
        'SELECT DISTINCT Type FROM ReportDataDictionary WHERE IsMeter = 1'
      )) as any[];
      expect(meterTypes).toEqual([{ Type: 'Sum' }]);
    } finally {
      fs.rmSync(withRdd, { force: true });
    }
  }, 60_000);
});
