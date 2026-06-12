import { describe, it, expect } from 'vitest';
import sqlite3 from 'sqlite3';
import { Sqlite3Engine } from '../src/engine/sqlite3';
import { readBnd } from '../src/queries/readbnd';
import { designDayBnd, fixtureExists } from './fixtures';

// Requires the gitignored large-office design-day fixture; skips when absent
// (e.g. CI). Populate test-models/large-office-design-day/ to run locally.
describe.skipIf(!fixtureExists(designDayBnd))('readBnd', () => {
  it('parses the design-day .bnd into a node→fluid map', async () => {
    const engine = new Sqlite3Engine(sqlite3);
    const bnd = await readBnd(engine, designDayBnd);

    expect(bnd).toBeTypeOf('object');
    // The design-day prototype is a Large Office with both air and water
    // loops — should resolve at least one node of each fluid type.
    const fluids = new Set(Object.values(bnd));
    expect(fluids.size).toBeGreaterThan(0);
    expect(Object.keys(bnd).length).toBeGreaterThan(10);
  });
});
