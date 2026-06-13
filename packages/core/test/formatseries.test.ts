import { describe, it, expect } from 'vitest';
import {
  getSeriesKeys,
  getSeriesLookupObj
} from '../src/queries/formatseries';

// Pure-function tests — no engine, no fixture, no I/O. Cheap regression
// guards for the field-name selection logic that the chart layer relies on.
describe('getSeriesKeys', () => {
  it('picks single-file IP variants', () => {
    expect(getSeriesKeys('ip', [{}])).toEqual({
      name: 'name_ip_single',
      value: 'value_ip',
      units: 'units_ip'
    });
  });

  it('picks multi-file SI variants', () => {
    expect(getSeriesKeys('si', [{}, {}, {}])).toEqual({
      name: 'name_si_multi',
      value: 'value_si',
      units: 'units_si'
    });
  });

  it('returns empties for an unknown unit system', () => {
    expect(getSeriesKeys('xx' as any, [{}])).toEqual({
      name: '',
      value: '',
      units: ''
    });
  });
});

describe('getSeriesLookupObj', () => {
  it('keys an array by display-name for the requested frequency', () => {
    const array = [
      {
        key: 'k1',
        name_ip_single: 'A',
        name_si_single: 'A_si',
        ReportingFrequency: 'Hourly'
      },
      {
        key: 'k2',
        name_ip_single: 'B',
        name_si_single: 'B_si',
        ReportingFrequency: 'Daily'
      }
    ];
    const result = getSeriesLookupObj({
      array,
      units: 'ip',
      timestepType: 'Hourly',
      files: [{}]
    });
    expect(result).toEqual({ A: 'k1' });
  });
});
