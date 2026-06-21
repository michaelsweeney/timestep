import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import type { AddressInfo } from 'node:net';
import { createServer } from './server.ts';
import { makeDialogs } from './dialog.ts';
import { makeEsoConverter } from './esoconvert.ts';
import { Sqlite3Engine } from '@timestep/core/sqlite3';
import { convertEsoCached } from '@timestep/core/eso-cache';

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, '..', '..');
// Load the Node-ABI sqlite3 from ROOT node_modules (NOT app/'s Electron-ABI copy).
const require = createRequire(import.meta.url);
const sqlite3 = require(path.join(ROOT, 'node_modules', 'sqlite3'));

const cacheDir = path.join(
  process.env.XDG_CACHE_HOME || path.join(os.homedir(), '.cache'),
  'timestep',
  'eso-cache'
);
const token = crypto.randomBytes(24).toString('hex');
const dialogs = makeDialogs();

const deps = {
  engine: new Sqlite3Engine(sqlite3),
  convertEso: makeEsoConverter((esoPath: string) => convertEsoCached(esoPath, cacheDir, sqlite3)),
  openDialog: dialogs.openDialog,
  saveDialog: dialogs.saveDialog,
  staticDir: path.join(ROOT, 'app', 'dist-serve'),
  token
};

const server = createServer(deps);
server.requestTimeout = 0; // dialogs wait on the user; large .eso converts take minutes
server.listen(0, '127.0.0.1', () => {
  const port = (server.address() as AddressInfo).port;
  const url = `http://127.0.0.1:${port}/`;
  // eslint-disable-next-line no-console
  console.log(`timestep serve → ${url}`);
  openBrowser(url);
});

function openBrowser(url: string): void {
  const cmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'cmd' : 'xdg-open';
  const args = process.platform === 'win32' ? ['/c', 'start', '', url] : [url];
  try {
    spawn(cmd, args, { stdio: 'ignore', detached: true }).unref();
  } catch {
    /* print-only fallback */
  }
}
