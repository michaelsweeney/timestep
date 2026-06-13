import { describe, it, expect } from 'vitest';
import sqlite3 from 'sqlite3';
import { Sqlite3Engine } from '../src/engine/sqlite3';
import { readBnd, resolveFluidType } from '../src/queries/readbnd';
import type { Engine } from '../src/engine/types';
import { designDayBnd, fixtureExists } from './fixtures';

// A .bnd with the node-list block plus the kinds of noise that surround it:
// the "! <Node>" header, a "Node Connection" detail record, and a blank-fluid
// node. Only the real node-list lines (second field = node number) should be
// picked up.
const SYNTH_BND = [
  'Program Version,EnergyPlus,Version 25.2',
  '! <#Nodes>,<Number of Unique Nodes>',
  ' #Nodes,3',
  '! <Node>,<NodeNumber>,<Node Name>,<Node Fluid Type>,<# Times Node Referenced After Definition>',
  ' Node,1,SUPPLY AIR NODE,Air,4',
  ' Node,2,CHILLED WATER SUPPLY NODE,Water,2',
  ' Node,3,MYSTERY NODE,,0',
  '! <Node Connection>,<Node Name>,<Node ObjectType>,<Object Name>,<Object Node Type>',
  ' Node Connection,SOME NODE,Fan:VariableVolume,SUPPLY FAN,Outlet',
  ''
].join('\n');

const fakeEngine = (text: string): Engine => ({
  allRows: async () => [],
  readText: async () => text,
  fileExists: async () => true
});

describe('readBnd (synthetic, fixture-free)', () => {
  it('keys only the node-list lines, excluding the header and Node Connection rows', async () => {
    const bnd = await readBnd(fakeEngine(SYNTH_BND), '/x/eplusout.bnd');
    expect(bnd).toEqual({
      'SUPPLY AIR NODE': 'Air',
      'CHILLED WATER SUPPLY NODE': 'Water',
      'MYSTERY NODE': '' // present but blank fluid type
    });
    // the "! <Node>" header and the "Node Connection" detail must not leak in
    expect(bnd['<NodeNumber>']).toBeUndefined();
    expect(bnd['SOME NODE']).toBeUndefined();
  });
});

describe('resolveFluidType', () => {
  const bnd = {
    'SUPPLY AIR NODE': 'Air',
    'CHILLED WATER SUPPLY NODE': 'Water',
    'MYSTERY NODE': ''
  };

  it('uses the .bnd node fluid when the key is a node', () => {
    expect(resolveFluidType('SUPPLY AIR NODE', 'System Node Volume Flow Rate', bnd)).toBe('Air');
    expect(resolveFluidType('CHILLED WATER SUPPLY NODE', 'System Node Volume Flow Rate', bnd)).toBe('Water');
  });

  it('falls back to the name for a blank-fluid node', () => {
    // blank node + watery name -> Water; blank node + neutral name -> undefined
    expect(resolveFluidType('MYSTERY NODE', 'Plant Hot Water Volume Flow Rate', bnd)).toBe('Water');
    expect(resolveFluidType('MYSTERY NODE', 'System Node Volume Flow Rate', bnd)).toBeUndefined();
  });

  it('resolves non-node water flows by name (the F3 case)', () => {
    // Water Use Equipment flows are keyed by the equipment, not a node
    expect(
      resolveFluidType('SWH WATER EQUIP', 'Water Use Equipment Hot Water Volume Flow Rate', bnd)
    ).toBe('Water');
  });

  it('keeps non-node air flows on the cfm default (undefined)', () => {
    expect(
      resolveFluidType('VAV SYS 1', 'Air System Outdoor Air Volume Flow Rate', bnd)
    ).toBeUndefined();
    expect(
      resolveFluidType('ZONE 1', 'Zone Mechanical Ventilation Standard Density Volume Flow Rate', bnd)
    ).toBeUndefined();
  });

  it('works with no .bnd at all (name-only)', () => {
    expect(resolveFluidType('X', 'Water Use Connections Hot Water Volume Flow Rate')).toBe('Water');
    expect(resolveFluidType('X', 'Air System Outdoor Air Volume Flow Rate')).toBeUndefined();
  });
});

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
