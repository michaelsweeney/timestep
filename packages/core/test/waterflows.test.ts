import { describe, it, expect } from 'vitest';
import sqlite3 from 'sqlite3';
import { Sqlite3Engine } from '../src/engine/sqlite3';
import { getAllSeries } from '../src/queries/getallseries';
import { waterFlowsSql, waterFlowsBnd, fixtureExists } from './fixtures';

// Integration coverage for cfm/gpm fluid resolution on a real EnergyPlus run.
// 5ZoneVAV-ChilledWaterStorage has air-loop nodes, chilled-water nodes, and
// service hot water equipment — so it exercises node-keyed flows of both
// fluids AND the non-node WaterUse:Equipment case (the F3 gap). Skips when the
// gitignored fixture is absent (regenerate:
//   node scripts/eplus-matrix.mjs --only water-flows-design-day).

const present = fixtureExists(waterFlowsSql) && fixtureExists(waterFlowsBnd);

describe.skipIf(!present)('m3/s fluid resolution on a real run', () => {
  it('resolves node and non-node flows to the right IP unit', async () => {
    const engine = new Sqlite3Engine(sqlite3);
    const rows = (await getAllSeries(engine, [waterFlowsSql])) as any[];
    const m3s = rows.filter(r => r.units_si === 'm3/s');
    expect(m3s.length).toBeGreaterThan(0);

    // Non-node Water Use Equipment flows are keyed by the equipment, not a
    // .bnd node — they used to fall to the blind cfm default. They must now
    // resolve to gpm by name (F3).
    const wue = m3s.filter(r =>
      /Water Use Equipment Hot Water Volume Flow Rate/.test(r.name_si_single)
    );
    expect(wue.length).toBeGreaterThan(0);
    expect(wue.every(r => r.units_ip === 'gpm')).toBe(true);

    // Node-keyed flows resolve from the .bnd fluid type: chilled-water nodes
    // → gpm, air nodes → cfm. Both fluids are present in this model.
    const nodeFlows = m3s.filter(r =>
      /System Node Standard Density Volume Flow Rate/.test(r.name_si_single)
    );
    expect(nodeFlows.some(r => r.units_ip === 'gpm')).toBe(true);
    expect(nodeFlows.some(r => r.units_ip === 'cfm')).toBe(true);

    // Nothing in this set should be left mislabeled as a raw m3/s IP unit.
    expect(m3s.every(r => r.units_ip === 'gpm' || r.units_ip === 'cfm')).toBe(true);
  });
});
