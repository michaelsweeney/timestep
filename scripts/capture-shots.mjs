// Headless screenshot capture for the landing page.
//
// Renders the real `timestep serve` UI in HEADLESS Chromium and screenshots a
// curated, feature-led set of views. Nothing appears on screen: no Electron
// window, no native file dialog (openDialog is stubbed to fixed fixtures), no
// auto-opened browser. Drives the same renderer the app ships, loading real
// EnergyPlus output from test-matrix/ and test-models/.
//
// Prereq: `yarn build-serve` (app/dist-serve), `tsx` installed, local fixtures.
//
//   node --import tsx scripts/capture-shots.mjs                 # full set -> docs/screenshots
//   SHOT=compare node --import tsx scripts/capture-shots.mjs    # one shot
//   VALIDATE=1 SHOT=heatmap node --import tsx scripts/capture-shots.mjs  # -> $TMPDIR, no overwrite
//
// Shots: heatmap (core chart), compare (split-pane linked), data-quality
// (warnings modal), eso (direct .eso load). All light theme.
//
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { createServer } from '../app/serve/server.ts';
import { Sqlite3Engine } from '@timestep/core/sqlite3';
import { convertEsoCached } from '@timestep/core/eso-cache';

const require_ = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sqlite3 = require_(path.join(ROOT, 'node_modules', 'sqlite3'));
const { chromium } = require_(path.join(ROOT, 'node_modules', 'playwright-core'));

const VALIDATE = !!process.env.VALIDATE;
const ONLY = process.env.SHOT || null;
const OUTDIR = VALIDATE ? path.join(os.tmpdir(), 'timestep-shots') : path.join(ROOT, 'docs', 'screenshots');
const FIXDIR = path.join(os.tmpdir(), 'timestep-demo'); // cleaner path shown in screenshots
const cacheDir = path.join(process.env.XDG_CACHE_HOME || path.join(os.homedir(), '.cache'), 'timestep', 'eso-cache');

const M = p => path.join(ROOT, 'test-matrix', p);
const MD = p => path.join(ROOT, 'test-models', p);

// Copy a fixture .sql (and optional .bnd sibling) to a unique basename so two
// runs don't collide on "eplusout.sql" (the app rejects duplicate filenames).
function stage(srcSql, base, { withBnd = true } = {}) {
  fs.mkdirSync(FIXDIR, { recursive: true });
  const dstSql = path.join(FIXDIR, `${base}.sql`);
  fs.copyFileSync(srcSql, dstSql);
  if (withBnd) {
    const srcBnd = srcSql.replace(/\.sql$/, '.bnd');
    if (fs.existsSync(srcBnd)) fs.copyFileSync(srcBnd, path.join(FIXDIR, `${base}.bnd`));
  }
  return dstSql;
}

function startServe(filePaths) {
  const token = crypto.randomBytes(24).toString('hex');
  const server = createServer({
    engine: new Sqlite3Engine(sqlite3),
    convertEso: p => convertEsoCached(p, cacheDir, sqlite3),
    openDialog: async () => ({ canceled: false, filePaths }),
    saveDialog: async () => ({ canceled: true }),
    staticDir: path.join(ROOT, 'app', 'dist-serve'),
    token
  });
  server.requestTimeout = 0;
  return new Promise(res => server.listen(0, '127.0.0.1', () => res({ server, port: server.address().port })));
}

async function paintedPixels(page) {
  return page.evaluate(() => {
    const cs = [...document.querySelectorAll('.canvas-svg-container canvas')];
    let n = 0;
    for (const c of cs) {
      const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
      for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++;
    }
    return cs.length ? n : -1;
  });
}
async function waitForStablePaint(page, timeoutMs, label) {
  const t0 = Date.now();
  let prev = -1;
  for (;;) {
    const n = await paintedPixels(page);
    if (n > 1000 && n === prev) return n;
    prev = n;
    if (Date.now() - t0 > timeoutMs) throw new Error(`timeout: ${label} (last=${n})`);
    await new Promise(r => setTimeout(r, 500));
  }
}

async function openFiles(page, { keepModal = false } = {}) {
  await page.locator('button[aria-controls="file-menu"]').click();
  await page.waitForTimeout(400);
  await page.getByText('Load Files', { exact: true }).first().click();
  await page.locator('select').first().waitFor({ timeout: 180000 });
  await page.waitForTimeout(2000);
  if (!keepModal) {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(700);
  }
}

const setType = (page, pane, v) => page.locator('select').nth(pane * 3).selectOption(v).then(() => page.waitForTimeout(400));
const setFreq = (page, pane, v) => page.locator('select').nth(pane * 3 + 1).selectOption(v).then(() => page.waitForTimeout(400));

// Add a series in a pane. The autocomplete is virtualized, so off-screen
// options aren't in the DOM — type `filter` into it to narrow the list, then
// click the option containing `pick` (e.g. a filename, for multi-file) or the
// nth filtered option.
async function addSeries(page, pane, filter, { pick = null, nth = 0 } = {}) {
  const combo = page.locator('[role="combobox"]').nth(pane);
  await combo.click();
  await page.waitForTimeout(300);
  await page.keyboard.type(filter, { delay: 10 });
  await page.waitForTimeout(900);
  let opt;
  if (pick) {
    const m = page.locator('[role="option"]', { hasText: pick });
    opt = (await m.count()) ? m.first() : page.locator('[role="option"]').nth(nth);
  } else {
    opt = page.locator('[role="option"]').nth(nth);
  }
  await opt.click();
  await page.waitForTimeout(500);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
}

async function newPage(browser, w = 1440, h = 900) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
  page.on('pageerror', e => console.log('[pageerror]', String(e)));
  return page;
}

// ---- the curated shots ----------------------------------------------------
const SHOTS = {
  // strong core chart: annual outdoor drybulb heatmap
  heatmap: { w: 1440, h: 900, files: () => [M('zone-uncontrolled-sqlite/eplusout.sql')],
    drive: async page => {
      await setType(page, 0, 'Heatmap');
      await addSeries(page, 0, 'Outdoor Air Drybulb Temperature');
      await waitForStablePaint(page, 120000, 'heatmap');
      await page.waitForTimeout(600);
    } },

  // headline v2 feature: split-pane linked compare, same prototype / two climates
  compare: { w: 1680, h: 950,
    files: () => [stage(M('zone-uncontrolled-sqlite/eplusout.sql'), 'zone-uncontrolled'),
                  stage(MD('large-office-multifreq/eplusout.sql'), 'large-office')],
    drive: async page => {
      await page.getByText('Split chart', { exact: false }).first().click();
      await page.waitForTimeout(1200);
      await setType(page, 0, 'Heatmap');
      await setType(page, 1, 'Heatmap');
      await addSeries(page, 0, 'Outdoor Air Drybulb Temperature', { pick: 'zone-uncontrolled' });
      await addSeries(page, 1, 'Outdoor Air Drybulb Temperature', { pick: 'large-office' });
      await waitForStablePaint(page, 120000, 'compare');
      await page.waitForTimeout(800);
    } },

  // data-quality safeguard: load flow vars with no .bnd -> warnings; keep modal
  'data-quality': { w: 1440, h: 980,
    files: () => [stage(MD('water-flows-design-day/eplusout.sql'), 'water-flows', { withBnd: false })],
    keepModal: true,
    drive: async page => { await page.waitForTimeout(800); } },

  // direct .eso load (converted on the fly, no Output:SQLite). Facility
  // electricity heatmap shows weekday/weekend schedule bands — visually
  // distinct from the outdoor-temp heatmap.
  eso: { w: 1440, h: 900, files: () => [M('small-office-multifreq-eso/eplusout.eso')],
    drive: async page => {
      await setType(page, 0, 'Heatmap');
      await addSeries(page, 0, 'Electricity:Facility');
      await waitForStablePaint(page, 180000, 'eso heatmap');
      await page.waitForTimeout(600);
    } }
};

async function main() {
  fs.mkdirSync(OUTDIR, { recursive: true });
  const results = [];
  const names = ONLY ? [ONLY] : Object.keys(SHOTS);

  for (const name of names) {
    const s = SHOTS[name];
    if (!s) { results.push(`SKIP  ${name} — unknown shot`); continue; }
    // Fresh browser per shot: large fixtures can crash a long-lived instance.
    const browser = await chromium.launch({
      executablePath: '/usr/bin/google-chrome-stable', headless: true,
      args: ['--no-sandbox', '--force-prefers-reduced-motion']
    });
    const { server, port } = await startServe(s.files());
    const page = await newPage(browser, s.w, s.h);
    try {
      await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'domcontentloaded' });
      await openFiles(page, { keepModal: !!s.keepModal });
      await s.drive(page);
      const out = path.join(OUTDIR, `${VALIDATE ? 'validate-' : ''}${name}.png`);
      await page.screenshot({ path: out });
      results.push(`PASS  ${name} -> ${out}`);
    } catch (e) {
      const f = path.join(OUTDIR, `FAIL-${name}.png`);
      await page.screenshot({ path: f }).catch(() => {});
      results.push(`FAIL  ${name} — ${String(e.message || e).split('\n')[0]} [${f}]`);
    } finally {
      await browser.close().catch(() => {});
      server.close();
    }
  }
  console.log('\n' + results.join('\n'));
  process.exit(results.some(r => r.startsWith('FAIL')) ? 1 : 0);
}

main();
