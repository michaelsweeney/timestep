import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

// serve must load the Node-ABI sqlite3 from the REPO-ROOT node_modules, not
// app/'s Electron-ABI copy. A bare require('sqlite3') from app/serve/ would
// resolve app/node_modules first — so resolve the root copy by absolute path,
// exactly as start.ts does.
const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

test('root sqlite3 loads under plain Node and runs a query', async () => {
  const sqlite3 = require(path.join(ROOT, 'node_modules', 'sqlite3'));
  await new Promise<void>((resolve, reject) => {
    const db = new sqlite3.Database(':memory:');
    db.serialize(() => {
      db.run('CREATE TABLE t (x INTEGER)');
      db.run('INSERT INTO t VALUES (42)');
      db.all('SELECT x FROM t', (err: unknown, rows: { x: number }[]) => {
        if (err) return reject(err);
        try {
          assert.deepEqual(rows, [{ x: 42 }]);
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    });
  });
});
