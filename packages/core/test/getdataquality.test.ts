import { describe, it, expect } from 'vitest';
import { getDataQuality } from '../src/queries/getdataquality';
import type { Engine } from '../src/engine/types';

// Fake-engine fixtures (no EnergyPlus needed): a dictionary of rows + an
// optional .bnd node list. Mirrors the getallseries.test.ts pattern.

const BND = [
  ' Node,1,SUPPLY AIR NODE,Air,4',
  ' Node,2,CHILLED WATER NODE,Water,2'
].join('\n');

// Default Time response: a single contiguous environment with an ordinary day
// type — no temporal warning. Tests that exercise the non-contiguous-time check
// pass their own `time` rows.
const CONTIGUOUS_TIME = [{ EnvironmentPeriodIndex: 1, DayType: 'Monday' }];

function engineWith(
  rows: any[],
  opts: { bnd: boolean },
  time: any[] = CONTIGUOUS_TIME
): Engine {
  return {
    allRows: async (_file?: any, query?: string) =>
      query && /FROM\s+Time/i.test(query)
        ? time.map(r => ({ ...r }))
        : rows.map(r => ({ ...r })),
    readText: async () => BND,
    fileExists: async () => opts.bnd
  };
}

const codes = (w: any[]) => w.map(x => x.code);

describe('getDataQuality', () => {
  it('flags an empty (dictionary-less) file', async () => {
    const [q] = await getDataQuality(engineWith([], { bnd: false }), ['/x/a.sql']);
    expect(codes(q.warnings)).toEqual(['empty']);
    expect(q.warnings[0].severity).toBe('info');
  });

  it('warns when m3/s flows default to cfm because no .bnd is present', async () => {
    const rows = [
      { KeyValue: 'SUPPLY AIR NODE', Name: 'System Node Volume Flow Rate', Units: 'm3/s' },
      { KeyValue: 'CHILLED WATER NODE', Name: 'System Node Volume Flow Rate', Units: 'm3/s' }
    ];
    const [q] = await getDataQuality(engineWith(rows, { bnd: false }), ['/x/a.sql']);
    expect(codes(q.warnings)).toContain('no-bnd-flows-cfm');
    const w = q.warnings.find(x => x.code === 'no-bnd-flows-cfm')!;
    expect(w.severity).toBe('warning');
    expect(w.message).toMatch(/2 air\/water flows shown as cfm/);
  });

  it('does NOT warn no-bnd when a .bnd resolves the node flows', async () => {
    const rows = [
      { KeyValue: 'SUPPLY AIR NODE', Name: 'System Node Volume Flow Rate', Units: 'm3/s' },
      { KeyValue: 'CHILLED WATER NODE', Name: 'System Node Volume Flow Rate', Units: 'm3/s' }
    ];
    const [q] = await getDataQuality(engineWith(rows, { bnd: true }), ['/x/a.sql']);
    // both are authoritative .bnd nodes → no data-quality warning at all
    expect(q.warnings).toHaveLength(0);
  });

  it('flags name-guessed (non-node) flows even when a .bnd is present', async () => {
    const rows = [
      { KeyValue: 'SUPPLY AIR NODE', Name: 'System Node Volume Flow Rate', Units: 'm3/s' }, // bnd node
      { KeyValue: 'SWH WATER EQUIP', Name: 'Water Use Equipment Hot Water Volume Flow Rate', Units: 'm3/s' } // non-node, name-guessed
    ];
    const [q] = await getDataQuality(engineWith(rows, { bnd: true }), ['/x/a.sql']);
    expect(codes(q.warnings)).toContain('fluid-name-guessed');
    const w = q.warnings.find(x => x.code === 'fluid-name-guessed')!;
    expect(w.severity).toBe('info');
    expect(w.detail).toContain('Water Use Equipment Hot Water Volume Flow Rate');
  });

  it('flags variables shown in SI because no IP conversion exists', async () => {
    const rows = [
      { KeyValue: 'X', Name: 'Some Viscosity Variable', Units: 'kg/m-s' }, // no IP
      { KeyValue: 'Env', Name: 'Site Outdoor Air Drybulb Temperature', Units: 'C' } // has IP
    ];
    const [q] = await getDataQuality(engineWith(rows, { bnd: false }), ['/x/a.sql']);
    expect(codes(q.warnings)).toContain('units-si-only');
    const w = q.warnings.find(x => x.code === 'units-si-only')!;
    expect(w.message).toMatch(/1 variable shown in SI/);
    expect(w.detail).toContain('Some Viscosity Variable');
  });

  it('does not flag dimensionless ("") units as SI-only', async () => {
    const rows = [
      { KeyValue: 'X', Name: 'Chiller Part Load Ratio', Units: '' }
    ];
    const [q] = await getDataQuality(engineWith(rows, { bnd: false }), ['/x/a.sql']);
    expect(codes(q.warnings)).not.toContain('units-si-only');
  });

  it('returns no warnings for a clean, fully-resolvable file', async () => {
    const rows = [
      { KeyValue: 'Env', Name: 'Site Outdoor Air Drybulb Temperature', Units: 'C' },
      { KeyValue: 'Zone', Name: 'Zone Mean Air Temperature', Units: 'C' }
    ];
    const [q] = await getDataQuality(engineWith(rows, { bnd: false }), ['/x/a.sql']);
    expect(q.warnings).toHaveLength(0);
  });

  it('flags non-contiguous time when multiple environment periods exist', async () => {
    const rows = [
      { KeyValue: 'Env', Name: 'Site Outdoor Air Drybulb Temperature', Units: 'C' }
    ];
    const time = [
      { EnvironmentPeriodIndex: 1, DayType: 'SummerDesignDay' },
      { EnvironmentPeriodIndex: 2, DayType: 'WinterDesignDay' }
    ];
    const [q] = await getDataQuality(
      engineWith(rows, { bnd: false }, time),
      ['/x/a.sql']
    );
    expect(codes(q.warnings)).toContain('non-contiguous-time');
    const w = q.warnings.find(x => x.code === 'non-contiguous-time')!;
    expect(w.severity).toBe('warning');
    expect(w.message).toMatch(/design-day|non-contiguous/i);
  });

  it('flags a single design-day environment', async () => {
    const rows = [
      { KeyValue: 'Env', Name: 'Site Outdoor Air Drybulb Temperature', Units: 'C' }
    ];
    const time = [{ EnvironmentPeriodIndex: 1, DayType: 'SummerDesignDay' }];
    const [q] = await getDataQuality(
      engineWith(rows, { bnd: false }, time),
      ['/x/a.sql']
    );
    expect(codes(q.warnings)).toContain('non-contiguous-time');
  });

  it('does not flag a single contiguous run period', async () => {
    const rows = [
      { KeyValue: 'Env', Name: 'Site Outdoor Air Drybulb Temperature', Units: 'C' }
    ];
    const time = [
      { EnvironmentPeriodIndex: 1, DayType: 'Monday' },
      { EnvironmentPeriodIndex: 1, DayType: 'Tuesday' }
    ];
    const [q] = await getDataQuality(
      engineWith(rows, { bnd: false }, time),
      ['/x/a.sql']
    );
    expect(codes(q.warnings)).not.toContain('non-contiguous-time');
  });

  it('stays silent when the Time table cannot be queried (older files)', async () => {
    const rows = [
      { KeyValue: 'Env', Name: 'Site Outdoor Air Drybulb Temperature', Units: 'C' }
    ];
    const engine: Engine = {
      allRows: async (_file?: any, query?: string) => {
        if (query && /FROM\s+Time/i.test(query)) {
          throw new Error('no such table: Time');
        }
        return rows.map(r => ({ ...r }));
      },
      readText: async () => BND,
      fileExists: async () => false
    };
    const [q] = await getDataQuality(engine, ['/x/a.sql']);
    expect(codes(q.warnings)).not.toContain('non-contiguous-time');
  });

  it('reports per-file for multiple files', async () => {
    // can't vary the fake engine per file, so just assert shape/length
    const rows = [{ KeyValue: 'Env', Name: 'T', Units: 'C' }];
    const res = await getDataQuality(engineWith(rows, { bnd: false }), ['/x/a.sql', '/x/b.sql']);
    expect(res.map(r => r.filename)).toEqual(['/x/a.sql', '/x/b.sql']);
  });
});
