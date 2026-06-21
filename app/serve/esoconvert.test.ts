import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeEsoConverter } from './esoconvert.ts';

test('concurrent converts of the same path dedupe to one call', async () => {
  let calls = 0;
  const convert = makeEsoConverter(async (p: string) => {
    calls++;
    await new Promise(r => setTimeout(r, 20));
    return p.replace(/\.eso$/, '.sql');
  });
  const [a, b] = await Promise.all([
    convert('/x/eplusout.eso'),
    convert('/x/eplusout.eso')
  ]);
  assert.equal(a, '/x/eplusout.sql');
  assert.equal(b, '/x/eplusout.sql');
  assert.equal(calls, 1); // deduped
});

test('different paths run independently', async () => {
  let calls = 0;
  const convert = makeEsoConverter(async (p: string) => {
    calls++;
    return p.replace(/\.eso$/, '.sql');
  });
  await Promise.all([convert('/a.eso'), convert('/b.eso')]);
  assert.equal(calls, 2);
});

test('a failed conversion clears so a retry re-runs', async () => {
  let calls = 0;
  const convert = makeEsoConverter(async () => {
    calls++;
    if (calls === 1) throw new Error('boom');
    return '/ok.sql';
  });
  await assert.rejects(convert('/a.eso'));
  assert.equal(await convert('/a.eso'), '/ok.sql');
  assert.equal(calls, 2);
});
