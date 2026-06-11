import path from 'path';
import fs from 'fs';

// Resolve paths to the EnergyPlus reference fixtures under
// <repo>/test-models/ (gitignored, local-only — see test-models/README.md;
// regenerate with `node scripts/eplus-matrix.mjs`).
const REPO_ROOT = path.join(__dirname, '..', '..', '..');

export const designDayDir = path.join(
  REPO_ROOT,
  'test-models',
  'large-office-design-day'
);

export const designDaySql = path.join(designDayDir, 'eplusout.sql');
export const designDayBnd = path.join(designDayDir, 'eplusout.bnd');

export const annualDir = path.join(
  REPO_ROOT,
  'test-models',
  'large-office-multifreq'
);

// Annual run with 20 curated variables spread across four reporting
// frequencies (Zone Timestep / Hourly / Daily / Monthly) — exercises
// the multi-frequency dictionary handling that has historically been
// a friction point in Timestep.
export const annualSql = path.join(annualDir, 'eplusout.sql');
export const annualBnd = path.join(annualDir, 'eplusout.bnd');

export function fixtureExists(p: string): boolean {
  try {
    return fs.statSync(p).isFile();
  } catch {
    return false;
  }
}
