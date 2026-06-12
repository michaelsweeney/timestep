import { describe, it, expect } from 'vitest';
import { parseEso } from '../src/eso/parseeso';
import {
  MINI_ESO,
  MINI_ESO_DATA,
  MINI_ESO_METER,
  MINI_ESO_METER_DATA
} from './esofixtures';

describe('parseEso data section', () => {
  it('creates Time rows per stamp using the E+ SQL end-time conventions', () => {
    const { time } = parseEso(MINI_ESO_DATA);

    expect(time).toHaveLength(5);
    // 10-min zone timesteps: end-time as hour:minute
    expect(time[0]).toMatchObject({
      timeIndex: 1, month: 12, day: 21, hour: 0, minute: 10,
      interval: 10, simulationDays: 1, dayType: 'WinterDesignDay',
      environmentPeriodIndex: 1
    });
    expect(time[1]).toMatchObject({ timeIndex: 2, hour: 0, minute: 20 });
    // hourly stamp (0.00-60.00) → Hour=1, Minute=0, Interval=60
    expect(time[2]).toMatchObject({
      timeIndex: 3, hour: 1, minute: 0, interval: 60
    });
    // daily → Hour=24, Minute=0, Interval=1440
    expect(time[3]).toMatchObject({
      timeIndex: 4, month: 12, day: 21, hour: 24, minute: 0,
      interval: 1440, dayType: 'WinterDesignDay'
    });
    // monthly → Day=days-in-month, Interval=days*1440, Dst/DayType NULL
    expect(time[4]).toMatchObject({
      timeIndex: 5, month: 12, day: 31, hour: 24, minute: 0,
      interval: 44640, dst: null, dayType: null
    });
  });

  it('binds values to the most recent stamp of their frequency, dropping min/max extras', () => {
    const { data } = parseEso(MINI_ESO_DATA);

    const rows = Array.from({ length: data.length }, (_, i) => ({
      dictId: data.dictIds[i],
      timeIndex: data.timeIndexes[i],
      value: data.values[i]
    }));
    expect(rows).toEqual([
      { dictId: 12, timeIndex: 1, value: 20.5 },
      { dictId: 12, timeIndex: 2, value: 21.5 },
      { dictId: 7, timeIndex: 3, value: -15.5 },
      { dictId: 8, timeIndex: 3, value: 0.0 },
      { dictId: 63, timeIndex: 4, value: 18.0 },
      { dictId: 50, timeIndex: 5, value: -30412800.0 }
    ]);
  });
});

describe('parseEso dictionary', () => {
  it('parses variable entries with SQL-style reporting frequencies', () => {
    const parsed = parseEso(MINI_ESO);

    expect(parsed.dictionary).toHaveLength(5);

    const byId = new Map(parsed.dictionary.map(d => [d.id, d]));
    expect(byId.get(7)).toMatchObject({
      id: 7,
      keyValue: 'Environment',
      name: 'Site Outdoor Air Drybulb Temperature',
      units: 'C',
      reportingFrequency: 'Hourly'
    });
    expect(byId.get(8)).toMatchObject({ units: '' });
    expect(byId.get(12)).toMatchObject({
      reportingFrequency: 'Zone Timestep'
    });
    expect(byId.get(63)).toMatchObject({
      keyValue: 'ZN001:WALL001',
      name: 'Surface Inside Face Temperature',
      reportingFrequency: 'Daily'
    });
    expect(byId.get(50)).toMatchObject({
      units: 'J',
      reportingFrequency: 'Monthly'
    });
  });

  it('does not emit dictionary entries for the reserved stamp ids 1-6', () => {
    const parsed = parseEso(MINI_ESO);
    const ids = parsed.dictionary.map(d => d.id);
    for (const reserved of [1, 2, 3, 4, 5, 6]) {
      expect(ids).not.toContain(reserved);
    }
  });

  it('tags report variables as non-meters', () => {
    const byId = new Map(parseEso(MINI_ESO).dictionary.map(d => [d.id, d]));
    expect(byId.get(7)).toMatchObject({ isMeter: false, keyValue: 'Environment' });
  });
});

describe('parseEso meters', () => {
  it('recovers keyless meter lines as isMeter with null keyValue', () => {
    const byId = new Map(parseEso(MINI_ESO_METER).dictionary.map(d => [d.id, d]));

    // the report variable is unaffected
    expect(byId.get(7)).toMatchObject({
      keyValue: 'Environment',
      name: 'Site Outdoor Air Drybulb Temperature',
      isMeter: false
    });
    // hourly meter: no key field
    expect(byId.get(65)).toMatchObject({
      keyValue: null,
      name: 'Electricity:Facility',
      units: 'J',
      reportingFrequency: 'Hourly',
      isMeter: true
    });
    // monthly meter, with Daily/Monthly min/max companion columns, still parses
    expect(byId.get(1992)).toMatchObject({
      keyValue: null,
      name: 'NaturalGas:Facility',
      units: 'J',
      reportingFrequency: 'Monthly',
      isMeter: true
    });
  });

  it('binds meter values to their frequency stamp, dropping min/max extras', () => {
    const { dictionary, data } = parseEso(MINI_ESO_METER_DATA);
    // meters made it into the dictionary (previously dropped entirely)
    expect(dictionary.filter(d => d.isMeter).map(d => d.id).sort((a, b) => a - b)).toEqual([65, 1992]);

    const rows = Array.from({ length: data.length }, (_, i) => ({
      dictId: data.dictIds[i],
      value: data.values[i]
    }));
    // hourly meter value and the monthly meter's leading Value (extras dropped)
    expect(rows).toContainEqual({ dictId: 65, value: 123456.0 });
    expect(rows).toContainEqual({ dictId: 1992, value: 7890123.0 });
  });
});
