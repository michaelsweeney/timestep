import path from 'path';
import fs from 'fs';

// Resolve paths to the EnergyPlus reference fixtures checked in (or
// gitignored) under <repo>/test-models/.
const REPO_ROOT = path.join(__dirname, '..', '..', '..');

export const designDayDir = path.join(
  REPO_ROOT,
  'test-models',
  'eso-test',
  'design-day'
);

export const designDaySql = path.join(designDayDir, 'eplusout.sql');
export const designDayBnd = path.join(designDayDir, 'eplusout.bnd');

export function fixtureExists(p: string): boolean {
  try {
    return fs.statSync(p).isFile();
  } catch {
    return false;
  }
}
