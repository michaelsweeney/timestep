import { describe, it, expect } from 'vitest';
import sqlite3 from 'sqlite3';
import { Sqlite3Engine } from '../src/engine/sqlite3';
import { getFileSummary } from '../src/queries/getfilesummary';
import { designDaySql, fixtureExists } from './fixtures';

// Requires the gitignored large-office design-day fixture; skips when absent
// (e.g. CI). Populate test-models/large-office-design-day/ to run locally.
describe.skipIf(!fixtureExists(designDaySql))('getFileSummary', () => {
  it('returns shape + counts for the design-day .sql', async () => {
    const engine = new Sqlite3Engine(sqlite3);
    const summary = await getFileSummary(engine, [designDaySql]);

    expect(summary).toHaveLength(1);
    const f = summary[0];
    expect(f.filename).toBe(designDaySql);
    expect(f.bndexists).toBe(true);
    expect(typeof f.version).toBe('string');
    expect(f.version).toMatch(/EnergyPlus.*Version/i);
    expect(f.numreports).toBeGreaterThan(0);
    expect(typeof f.timesteps).toBe('number');
  });
});
