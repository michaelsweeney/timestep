import { describe, it, expect } from 'vitest';
import { resolveUnit } from '../src/queries/conversions';

describe('resolveUnit', () => {
  it('resolves m3/s to gpm for water and cfm for air', () => {
    const water = resolveUnit('m3/s', 'Water');
    expect(water.units_ip).toBe('gpm');
    expect(water.ipKnown).toBe(true);
    expect(water.toIp(1)).toBeCloseTo(15850.32314, 4);

    const air = resolveUnit('m3/s', 'Air');
    expect(air.units_ip).toBe('cfm');
    expect(air.toIp(1)).toBeCloseTo(2118.88, 2);
  });

  it('defaults m3/s to cfm when the fluid is unknown, blank, or absent', () => {
    for (const fluid of [undefined, null, '', 'Steam']) {
      const u = resolveUnit('m3/s', fluid as any);
      expect(u.units_ip).toBe('cfm');
      expect(u.toIp(2)).toBeCloseTo(4237.76, 2);
    }
  });

  it('converts temperature with the offset (C -> F)', () => {
    const u = resolveUnit('C');
    expect(u.units_ip).toBe('F');
    expect(u.toIp(0)).toBeCloseTo(32, 6);
    expect(u.toIp(100)).toBeCloseTo(212, 6);
  });

  it('converts a temperature difference by scale only (deltaC -> deltaF)', () => {
    const u = resolveUnit('deltaC');
    expect(u.units_ip).toBe('deltaF');
    expect(u.toIp(10)).toBeCloseTo(18, 6); // a 10 K delta is an 18 R/F delta, not 50
  });

  it('uses the corrected density label and factor (kg/m3 -> lb/ft3)', () => {
    const u = resolveUnit('kg/m3');
    expect(u.units_ip).toBe('lb/ft3'); // was the nonsensical "lb/cfm"
    expect(u.ipKnown).toBe(true);
    expect(u.toIp(1000)).toBeCloseTo(62.4278, 3);
  });

  it('passes energy through (J -> btu)', () => {
    const u = resolveUnit('J');
    expect(u.units_ip).toBe('btu');
    expect(u.toIp(1_000_000)).toBeCloseTo(947.817, 3);
  });

  // The honesty contract: no IP label without a real conversion.
  it('shows SI honestly for units with no known IP conversion', () => {
    for (const si of ['kg/m-s', 'kmol/s', 'ppm', 'someUnknownUnit']) {
      const u = resolveUnit(si);
      expect(u.units_ip).toBe(si); // label stays SI, never a fabricated IP unit
      expect(u.ipKnown).toBe(false);
      expect(u.toIp(42)).toBe(42); // value is unconverted, matching the SI label
    }
  });

  it('treats empty units as dimensionless', () => {
    const u = resolveUnit('');
    expect(u).toMatchObject({ units_si: '', units_ip: '', ipKnown: false });
    expect(u.toIp(7)).toBe(7);
  });

  it('handles null/undefined units as empty', () => {
    expect(resolveUnit(null).units_ip).toBe('');
    expect(resolveUnit(undefined).units_ip).toBe('');
  });
});
