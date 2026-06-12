// SI → IP unit resolution. ONE source of truth for both the displayed unit
// label and the value conversion, so a series can never show an IP label for a
// number that wasn't actually converted.
//
// This replaces the old split between a `unitdict` (labels) and a `unitconvert`
// (factors): that split let the two disagree — a unit with an IP label but a
// `'tbd'` factor rendered the IP label while the value stayed SI (and a couple
// labels like `kg/m3 -> lb/cfm` were simply wrong). Here a unit is in the table
// only when it has a real, correct conversion; everything else resolves to "SI,
// no conversion" — honest by construction.

export interface UnitResolution {
  /** SI unit, as written by EnergyPlus. */
  units_si: string;
  /** IP label to display. Equals units_si when no IP conversion is known. */
  units_ip: string;
  /** Value converter (identity when no IP conversion is known). */
  toIp: (v: number) => number;
  /** Whether a genuine SI→IP conversion was applied. */
  ipKnown: boolean;
}

type Converter = (v: number) => number;
const identity: Converter = v => v;
const factor = (f: number): Converter => v => v * f;
const cToF: Converter = v => v * 1.8 + 32;

interface Entry {
  ip: string;
  convert: Converter;
}

// Keyed by the raw EnergyPlus SI unit string. Only units with a real, correct
// IP conversion belong here; anything absent resolves to SI (ipKnown=false).
// m3/s is handled separately (its IP unit depends on the fluid — see below).
const TABLE: Record<string, Entry> = {
  C: { ip: 'F', convert: cToF },
  deltaC: { ip: 'deltaF', convert: factor(1.8) }, // a temperature *difference*: scale only, no +32
  m: { ip: 'ft', convert: factor(3.28084) },
  m2: { ip: 'ft2', convert: factor(10.7639) },
  m3: { ip: 'ft3', convert: factor(35.3147) },
  'm/s': { ip: 'fpm', convert: factor(196.85) },
  'm2/s': { ip: 'ft2/s', convert: factor(10.7639) },
  J: { ip: 'btu', convert: factor(0.000947817) },
  'J/kg': { ip: 'Btu/lb', convert: factor(0.000429923) },
  kg: { ip: 'lb', convert: factor(2.20462) },
  'kg/s': { ip: 'lb/s', convert: factor(2.20462) },
  'kg/m3': { ip: 'lb/ft3', convert: factor(0.0624278) },
  'm3/kg': { ip: 'ft3/lb', convert: factor(16.0185) },
  Pa: { ip: 'inH2O', convert: factor(0.00401865) }, // pressure in inches of water (HVAC convention)
  'W/m2': { ip: 'W/ft2', convert: factor(0.092903) }
};

// m3/s volumetric flow: pure unit choice, not a density correction. The fluid
// decides cfm (air) vs gpm (water); for air, a "Standard Density … Volume Flow
// Rate" variable is at standard density (SCFM) vs the actual-density default
// (plain cfm). Same m3/s→ft3/min factor either way — the distinction is the
// label, which mechanical reviewers rely on.
const M3S_AIR: Entry = { ip: 'cfm', convert: factor(2118.88) };
const M3S_AIR_STD: Entry = { ip: 'scfm', convert: factor(2118.88) };
const M3S_WATER: Entry = { ip: 'gpm', convert: factor(15850.32314) };

// Units that are the same in IP and SI (or conventionally reported unchanged):
// power, electrical, frequency, angle, counts/ratios, time. These ARE known IP
// units — identity, factor 1 — not "no conversion." Distinguishing them from
// genuinely-unconvertible units (viscosities, etc.) keeps the data-quality
// "shown in SI" signal honest: W and hr aren't quality issues; kg/m-s is.
const IDENTITY_UNITS = new Set([
  'W', 'K', 'Hz', 'deg', 'V', 'A', 'lux', 'lm', 'cd', 'hr', '%', 'ach', 'N',
  's', 'W/W', 'J/kg-K', 'W/m-K', 'W/m2-K', 'm2-K/W', 'kg/kg-K'
]);

const STANDARD_DENSITY = /standard density/i;

/**
 * Resolve an EnergyPlus SI unit to its IP label and value converter.
 *
 * @param siUnit       the raw `Units` string from ReportDataDictionary
 * @param fluidType    for m3/s only: `'Water'` → gpm, anything else → cfm (the
 *                     air-default; callers pass the `.bnd` node fluid type)
 * @param variableName for m3/s air only: a "Standard Density …" name → scfm
 */
export function resolveUnit(
  siUnit: string | null | undefined,
  fluidType?: string | null,
  variableName?: string | null
): UnitResolution {
  const si = siUnit ?? '';
  if (si === '') {
    return { units_si: '', units_ip: '', toIp: identity, ipKnown: false };
  }
  if (si === 'm3/s') {
    const e =
      fluidType === 'Water'
        ? M3S_WATER
        : STANDARD_DENSITY.test(variableName ?? '')
          ? M3S_AIR_STD
          : M3S_AIR;
    return { units_si: si, units_ip: e.ip, toIp: e.convert, ipKnown: true };
  }
  const e = TABLE[si];
  if (e) return { units_si: si, units_ip: e.ip, toIp: e.convert, ipKnown: true };
  // Same unit in both systems (factor 1) — a known IP unit, just trivial.
  if (IDENTITY_UNITS.has(si)) {
    return { units_si: si, units_ip: si, toIp: identity, ipKnown: true };
  }
  // No known IP conversion — show SI honestly rather than a label we can't back.
  return { units_si: si, units_ip: si, toIp: identity, ipKnown: false };
}
