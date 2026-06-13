import { describe, it, expect } from 'vitest';
import { parseRdd } from '../src/eso/parserdd';
import { MINI_RDD } from './esofixtures';

describe('parseRdd', () => {
  it('maps variable names to Avg/Sum from the trailing comment', () => {
    const m = parseRdd(MINI_RDD);
    expect(m['Site Outdoor Air Drybulb Temperature']).toBe('Avg');
    expect(m['Zone Mean Air Temperature']).toBe('Avg');
    expect(m['Other Equipment Total Heating Energy']).toBe('Sum');
  });

  it('handles both Zone and HVAC prefixes', () => {
    const m = parseRdd(
      'Output:Variable,*,Fan Air Mass Flow Rate,hourly; !- HVAC Average [kg/s]\n' +
        'Output:Variable,*,Air System Solver Iteration Count,hourly; !- HVAC Sum []'
    );
    expect(m['Fan Air Mass Flow Rate']).toBe('Avg');
    expect(m['Air System Solver Iteration Count']).toBe('Sum');
  });

  it('ignores header and comment lines', () => {
    const m = parseRdd(MINI_RDD);
    // header lines start with "!" — nothing from them leaks in
    expect(Object.keys(m)).not.toContain('Program Version,EnergyPlus, Version 25.2.0-cf7368216c');
    expect(Object.keys(m)).toHaveLength(4);
  });

  it('returns an empty map for empty input', () => {
    expect(parseRdd('')).toEqual({});
  });
});
