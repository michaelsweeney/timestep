import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import sqlite3 from 'sqlite3';
import { convertEsoCached } from '../src/eso/esocache';
import { Sqlite3Engine } from '../src/engine/sqlite3';
import { MINI_ESO_DATA } from './esofixtures';

// App-facing entry point: convert an .eso to a cached .sql keyed on the
// source's identity (path + size + mtime), reusing prior conversions.

const tmpRoot = path.join(os.tmpdir(), `timestep-esocache-${process.pid}`);
const cacheDir = path.join(tmpRoot, 'cache');
let esoPath: string;

beforeEach(() => {
  fs.rmSync(tmpRoot, { recursive: true, force: true });
  fs.mkdirSync(tmpRoot, { recursive: true });
  esoPath = path.join(tmpRoot, 'eplusout.eso');
  fs.writeFileSync(esoPath, MINI_ESO_DATA);
});

afterAll(() => {
  fs.rmSync(tmpRoot, { recursive: true, force: true });
});

describe('convertEsoCached', () => {
  it('converts to <cacheDir>/<key>/<stem>.sql and the result is queryable', async () => {
    const sqlPath = await convertEsoCached(esoPath, cacheDir, sqlite3);

    expect(sqlPath.startsWith(cacheDir)).toBe(true);
    expect(path.basename(sqlPath)).toBe('eplusout.sql');

    const engine = new Sqlite3Engine(sqlite3);
    const rows = (await engine.allRows(
      sqlPath,
      'SELECT COUNT(*) AS n FROM ReportDataDictionary'
    )) as any[];
    expect(rows[0].n).toBe(5);
  });

  it('reuses the cached conversion for an unchanged source', async () => {
    const first = await convertEsoCached(esoPath, cacheDir, sqlite3);
    const stamp = fs.statSync(first).mtimeMs;
    const second = await convertEsoCached(esoPath, cacheDir, sqlite3);

    expect(second).toBe(first);
    expect(fs.statSync(second).mtimeMs).toBe(stamp);
  });

  it('re-converts when the source changes', async () => {
    const first = await convertEsoCached(esoPath, cacheDir, sqlite3);
    fs.writeFileSync(esoPath, MINI_ESO_DATA + '\n');
    fs.utimesSync(esoPath, new Date(), new Date(Date.now() + 5000));

    const second = await convertEsoCached(esoPath, cacheDir, sqlite3);
    expect(second).not.toBe(first);
  });

  it('copies a sibling .bnd next to the converted .sql for getAllSeries', async () => {
    fs.writeFileSync(path.join(tmpRoot, 'eplusout.bnd'), 'bnd-content');

    const sqlPath = await convertEsoCached(esoPath, cacheDir, sqlite3);
    const bnd = sqlPath.replace('.sql', '.bnd');
    expect(fs.readFileSync(bnd, 'utf8')).toBe('bnd-content');
  });
});
