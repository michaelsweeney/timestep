import { describe, it, expect } from 'vitest';
import sqlite3 from 'sqlite3';
import { Sqlite3Engine } from '../src/engine/sqlite3';
import { annualSql, fixtureExists } from './fixtures';

// Regression guard for the historical pain point: an ESO/SQL output can
// carry the same Output:Variable at multiple reporting frequencies, and
// each must surface as a distinct ReportDataDictionary entry. The annual
// fixture deliberately requests "Site Outdoor Air Drybulb Temperature" at
// Zone Timestep / Hourly / Daily / Monthly so this stays exercised.
describe('multi-frequency dictionary', () => {
  it('surfaces the same variable name at four distinct frequencies', async () => {
    if (!fixtureExists(annualSql)) {
      throw new Error(
        `Fixture missing: ${annualSql}. Regenerate with: node scripts/eplus-matrix.mjs --only large-office-multifreq`
      );
    }

    const engine = new Sqlite3Engine(sqlite3);
    const rows = (await engine.allRows(
      annualSql,
      `SELECT ReportingFrequency, COUNT(*) AS n
       FROM ReportDataDictionary
       WHERE Name = 'Site Outdoor Air Drybulb Temperature'
       GROUP BY ReportingFrequency`
    )) as Array<{ ReportingFrequency: string; n: number }>;

    const byFreq = Object.fromEntries(rows.map(r => [r.ReportingFrequency, r.n]));

    expect(byFreq).toEqual({
      'Zone Timestep': 1,
      Hourly: 1,
      Daily: 1,
      Monthly: 1
    });
  });

  it('returns a healthy report count for the annual fixture', async () => {
    if (!fixtureExists(annualSql)) {
      throw new Error(`Fixture missing: ${annualSql}.`);
    }
    const engine = new Sqlite3Engine(sqlite3);
    const rows = (await engine.allRows(
      annualSql,
      `SELECT COUNT(*) AS n FROM ReportDataDictionary`
    )) as Array<{ n: number }>;
    // The 20-line spec expands to ~167 entries once the * key wildcards
    // resolve per-zone / per-coil. Anything in this ballpark passes;
    // anything close to design-day's small meter set means the IDF
    // changes didn't take.
    expect(rows[0].n).toBeGreaterThan(100);
  });
});
