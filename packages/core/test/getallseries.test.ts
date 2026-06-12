import { describe, it, expect } from 'vitest';
import { getAllSeries } from '../src/queries/getallseries';
import type { Engine } from '../src/engine/types';

// getAllSeries resolves the IP unit for each ReportDataDictionary entry. The
// load-bearing, historically buggy case: a variable reported in m3/s must be
// shown as cfm for an air-loop node and gpm for a water-loop node, and the
// air-vs-water decision comes from the sibling .bnd file (node -> fluid type).
//
// These run against a fake Engine so they need no EnergyPlus fixtures — the
// .bnd text and the dictionary rows are authored to the real shapes
// (` Node,<i>,<NODE NAME>,<Air|Water>,...`; KeyValue == node name).

const BND = [
  'Program Version,EnergyPlus',
  '! <Node Connection>',
  ' Node,1,SUPPLY AIR NODE,Air,4',
  ' Node,2,CHILLED WATER NODE,Water,2',
  ' Node,3,SOME MYSTERY NODE,,0', // present but no fluid type
  ''
].join('\n');

// One dictionary row per scenario we want to assert.
const DICT = [
  { ReportDataDictionaryIndex: 1, KeyValue: 'SUPPLY AIR NODE',
    Name: 'System Node Standard Density Volume Flow Rate', Units: 'm3/s',
    ReportingFrequency: 'Hourly', TimestepType: 'Zone' },
  { ReportDataDictionaryIndex: 2, KeyValue: 'CHILLED WATER NODE',
    Name: 'System Node Volume Flow Rate', Units: 'm3/s',
    ReportingFrequency: 'Hourly', TimestepType: 'Zone' },
  { ReportDataDictionaryIndex: 3, KeyValue: 'SOME MYSTERY NODE',
    Name: 'System Node Volume Flow Rate', Units: 'm3/s',
    ReportingFrequency: 'Hourly', TimestepType: 'Zone' },
  { ReportDataDictionaryIndex: 4, KeyValue: 'NOT A NODE AT ALL',
    Name: 'System Node Volume Flow Rate', Units: 'm3/s',
    ReportingFrequency: 'Hourly', TimestepType: 'Zone' },
  { ReportDataDictionaryIndex: 5, KeyValue: 'Environment',
    Name: 'Site Outdoor Air Drybulb Temperature', Units: 'C',
    ReportingFrequency: 'Hourly', TimestepType: 'Zone' }
];

function fakeEngine(opts: { bndExists: boolean }): Engine {
  return {
    allRows: async () => DICT.map(r => ({ ...r })),
    readText: async () => BND,
    fileExists: async () => opts.bndExists
  };
}

const byKey = (rows: any[]) => {
  // key is `${sqlfile},${index}` — index uniquely identifies the row here.
  const m: Record<string, any> = {};
  rows.forEach(r => (m[r.key.split(',').pop()] = r));
  return m;
};

describe('getAllSeries m3/s -> cfm/gpm resolution', () => {
  it('uses the .bnd fluid type: Air -> cfm, Water -> gpm', async () => {
    const rows = await getAllSeries(fakeEngine({ bndExists: true }), ['/x/eplusout.sql']);
    const r = byKey(rows);
    expect(r['1'].units_ip).toBe('cfm'); // air node
    expect(r['2'].units_ip).toBe('gpm'); // water node
  });

  it('falls back to cfm when the node is in the .bnd but has no fluid type', async () => {
    const rows = await getAllSeries(fakeEngine({ bndExists: true }), ['/x/eplusout.sql']);
    expect(byKey(rows)['3'].units_ip).toBe('cfm');
  });

  it('falls back to cfm when the m3/s key is not found in the .bnd', async () => {
    const rows = await getAllSeries(fakeEngine({ bndExists: true }), ['/x/eplusout.sql']);
    expect(byKey(rows)['4'].units_ip).toBe('cfm');
  });

  it('falls back to cfm for m3/s when no .bnd is present at all', async () => {
    const rows = await getAllSeries(fakeEngine({ bndExists: false }), ['/x/eplusout.sql']);
    const r = byKey(rows);
    expect(r['1'].units_ip).toBe('cfm');
    expect(r['2'].units_ip).toBe('cfm'); // no bnd -> can't know it's water
  });

  it('still maps non-m3/s units via the conversion table (C -> F)', async () => {
    const rows = await getAllSeries(fakeEngine({ bndExists: true }), ['/x/eplusout.sql']);
    expect(byKey(rows)['5'].units_ip).toBe('F');
    expect(byKey(rows)['5'].units_si).toBe('C');
  });

  it('preserves the SI unit alongside the IP unit', async () => {
    const rows = await getAllSeries(fakeEngine({ bndExists: true }), ['/x/eplusout.sql']);
    expect(byKey(rows)['1'].units_si).toBe('m3/s');
    expect(byKey(rows)['2'].units_si).toBe('m3/s');
  });
});
