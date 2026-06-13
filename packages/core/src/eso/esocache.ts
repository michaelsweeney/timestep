// Cached ESO → SQLite conversion — the app-facing entry point for opening
// .eso files. Conversions land in <cacheDir>/<key>/<stem>.sql where the key
// hashes the source's identity (absolute path + size + mtime), so re-opening
// an unchanged file is instant and editing/re-running a simulation busts the
// cache naturally. A sibling .bnd is copied next to the converted .sql so
// the existing getAllSeries bnd lookup keeps working.
//
// Node-only (fs + injected sqlite3), exported via @timestep/core/eso-sqlite.

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { esoToSqlite } from './esotosqlite';

type Sqlite3Module = typeof import('sqlite3');

export async function convertEsoCached(
  esoPath: string,
  cacheDir: string,
  sqlite3: Sqlite3Module
): Promise<string> {
  const resolved = path.resolve(esoPath);
  const stat = await fs.promises.stat(resolved);

  // Sibling files fold into the conversion: a .mtr carries meters not in the
  // .eso (MeterFileOnly, *Net:Facility), and a .rdd carries the Avg/Sum Type.
  // Fold their identity into the cache key so editing/re-running busts the
  // cache the same way the .eso does.
  const stem = path.basename(resolved, path.extname(resolved));
  const siblingStat = async (ext: string) => {
    const p = path.join(path.dirname(resolved), `${stem}.${ext}`);
    return fs.existsSync(p) ? { p, stat: await fs.promises.stat(p) } : null;
  };
  const mtr = await siblingStat('mtr');
  const rdd = await siblingStat('rdd');
  const keyPart = (s: typeof mtr) =>
    s ? `\n${s.p}\n${s.stat.size}\n${s.stat.mtimeMs}` : '';

  const key = crypto
    .createHash('sha256')
    .update(
      `${resolved}\n${stat.size}\n${stat.mtimeMs}` + keyPart(mtr) + keyPart(rdd)
    )
    .digest('hex')
    .slice(0, 16);

  const outDir = path.join(cacheDir, key);
  const sqlPath = path.join(outDir, `${stem}.sql`);

  if (!fs.existsSync(sqlPath)) {
    await fs.promises.mkdir(outDir, { recursive: true });
    // Build under a temp name so a crash never leaves a half-written
    // .sql that a later call would treat as a valid cache hit.
    const building = `${sqlPath}.building`;
    await fs.promises.rm(building, { force: true });
    const esoText = await fs.promises.readFile(resolved, 'utf8');
    const mtrText = mtr ? await fs.promises.readFile(mtr.p, 'utf8') : undefined;
    const rddText = rdd ? await fs.promises.readFile(rdd.p, 'utf8') : undefined;
    await esoToSqlite(esoText, building, sqlite3, mtrText, rddText);
    await fs.promises.rename(building, sqlPath);
  }

  const siblingBnd = path.join(
    path.dirname(resolved),
    `${path.basename(resolved, path.extname(resolved))}.bnd`
  );
  const cachedBnd = path.join(outDir, `${stem}.bnd`);
  if (fs.existsSync(siblingBnd) && !fs.existsSync(cachedBnd)) {
    await fs.promises.copyFile(siblingBnd, cachedBnd);
  }

  return sqlPath;
}
