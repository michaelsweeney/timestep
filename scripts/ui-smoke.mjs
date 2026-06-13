// UI smoke test: launch the built app, load real EnergyPlus outputs, and
// assert a chart actually renders (or the app degrades gracefully when an
// output has no readable series). Drives the packaged renderer via
// playwright-core's Electron driver with the native file dialog stubbed in
// the main process.
//
// Prereqs: `yarn build` (app/main.prod.js + app/dist), app/node_modules
// installed (native sqlite3), and the local test-matrix outputs
// (regenerate with `yarn eplus-matrix`). Run: `yarn smoke-ui`
//
// Cases cover the ISSUE#23 matrix: timeseries volume, sparse prototype
// outputs, design-day-only, in-app .eso conversion, and an
// empty-dictionary .sql that must not crash the app.

import fs from 'fs';
import os from 'os';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const require_ = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { _electron } = require_(path.join(ROOT, 'node_modules', 'playwright-core'));
const electronPath = require_(path.join(ROOT, 'node_modules', 'electron'));

const M = p => path.join(ROOT, 'test-matrix', p);

// An output with Time/dictionary tables present but zero series — the
// "tabular-only, nothing chartable" shape. Built from a real file so the
// schema is authentic.
async function makeEmptySql() {
  const src = M('small-office-design-day/eplusout.sql');
  const dst = path.join(os.tmpdir(), `timestep-smoke-empty-${process.pid}.sql`);
  fs.copyFileSync(src, dst);
  const sqlite3 = require_(path.join(ROOT, 'app', 'node_modules', 'sqlite3'));
  const db = new sqlite3.Database(dst);
  await new Promise((res, rej) =>
    db.exec('DELETE FROM ReportData; DELETE FROM ReportDataDictionary;', e =>
      e ? rej(e) : res()
    )
  );
  await new Promise(res => db.close(res));
  return dst;
}

const CASES = [
  { name: 'volume: zone-uncontrolled annual (172 vars, 1.27M rows)',
    files: [M('zone-uncontrolled-sqlite/eplusout.sql')], expectSeries: true },
  { name: 'sparse: large office prototype (2 environment vars)',
    files: [M('large-office-annual-sqlite/eplusout.sql')], expectSeries: true },
  { name: 'design-day only: small office (96 rows)',
    files: [M('small-office-design-day/eplusout.sql')], expectSeries: true },
  { name: 'heatmap: design-day fills width (dynamic range, not a sliver)',
    files: [M('small-office-design-day/eplusout.sql')], expectSeries: true,
    view: 'Heatmap', minXSpanFrac: 0.5 },
  { name: 'eso: in-app conversion (33MB multifreq .eso)',
    files: [M('small-office-multifreq-eso/eplusout.eso')], expectSeries: true },
  { name: 'edge: empty dictionary — must not crash', expectSeries: false }
];

const log = (s, ...a) => console.log(s, ...a);

async function paintedPixels(page) {
  return page.evaluate(() => {
    const c = document.querySelector('.canvas-svg-container canvas');
    if (!c) return -1;
    const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    let n = 0;
    for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++;
    return n;
  });
}

// Wait until the chart canvas has painted AND the pixel count has settled
// (two consecutive samples agree). The chart draws axes first and the data
// series a frame or two later, so a bare `> 1000` check can return mid-paint
// on a slow/loaded machine — yielding a tiny count or, for the data line,
// missing it entirely. Returns the settled pixel count.
async function waitForStablePaint(page, timeoutMs, label) {
  const t0 = Date.now();
  let prev = -1;
  for (;;) {
    const n = await paintedPixels(page);
    if (n > 1000 && n === prev) return n;
    prev = n;
    if (Date.now() - t0 > timeoutMs) throw new Error(`timeout: ${label}`);
    await new Promise(r => setTimeout(r, 500));
  }
}

// Fraction of the canvas width spanned by painted pixels. Guards the heatmap
// dynamic-range fix: a sub-annual run (design day) used to collapse into a
// left-edge sliver under the old hard-coded [0,365] domain.
async function paintedXSpanFrac(page) {
  return page.evaluate(() => {
    const c = document.querySelector('.canvas-svg-container canvas');
    if (!c) return 0;
    const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    let minX = Infinity, maxX = -1;
    for (let y = 0; y < c.height; y++)
      for (let x = 0; x < c.width; x++)
        if (d[(y * c.width + x) * 4 + 3] > 0) { if (x < minX) minX = x; if (x > maxX) maxX = x; }
    return maxX < 0 ? 0 : (maxX - minX) / c.width;
  });
}

const missing = CASES.flatMap(c => c.files || []).filter(f => !fs.existsSync(f));
if (missing.length) {
  console.error('missing fixtures (run `yarn eplus-matrix`):\n  ' + missing.join('\n  '));
  process.exit(2);
}
CASES[CASES.length - 1].files = [await makeEmptySql()];

const app = await _electron.launch({
  executablePath: electronPath,
  args: [path.join(ROOT, 'app')]
});
const page = await app.firstWindow();
const pageErrors = [];
page.on('pageerror', e => pageErrors.push(String(e)));

await page.waitForLoadState('domcontentloaded');
if ((await page.title()) !== 'Timestep') throw new Error('unexpected window title');

const results = [];
let caseIndex = 0;
for (const c of CASES) {
  caseIndex++;
  const errBefore = pageErrors.length;
  try {
    await app.evaluate(({ dialog }, filePaths) => {
      dialog.showOpenDialog = async () => ({ canceled: false, filePaths });
    }, c.files);

    // close any popper/menu left over from the previous case
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);

    // "Load Files" lives inside the FILES menu
    await page.getByText('FILES', { exact: true }).click();
    await page.getByRole('menuitem', { name: 'Load Files' }).click();
    // sidebar replaces the landing page once files land (eso conversion
    // can take a while on first run)
    await page.getByText('Multiline', { exact: true }).waitFor({ timeout: 120000 });

    // the app auto-opens a "Loaded Files" summary modal once the file
    // summary query lands — dismiss it before driving the sidebar
    try {
      await page.getByText('Loaded Files').waitFor({ timeout: 10000 });
      await page.keyboard.press('Escape');
      await page.getByText('Loaded Files').waitFor({ state: 'hidden', timeout: 5000 });
    } catch { /* no modal (e.g. empty outputs) — fine */ }

    await page.getByText(c.view || 'Multiline', { exact: true }).click();

    const combo = page.getByRole('combobox').first();
    await combo.click();

    let detail;
    if (c.expectSeries) {
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
      const px = await waitForStablePaint(page, 120000, 'chart canvas painted');
      detail = `${px} painted px`;
      if (c.minXSpanFrac) {
        const frac = await paintedXSpanFrac(page);
        if (frac < c.minXSpanFrac)
          throw new Error(`x-span ${(frac * 100).toFixed(1)}% < required ${(c.minXSpanFrac * 100).toFixed(0)}% (sliver regression)`);
        detail += `, x-span ${(frac * 100).toFixed(1)}% of width`;
      }
      await page.keyboard.press('Escape');
    } else {
      // graceful empty state: sidebar renders with the no-data message and
      // an empty series select; no crash (verified visually 2026-06-11)
      await page.getByText('No data selected').waitFor({ timeout: 15000 });
      await page.keyboard.press('Escape');
      if ((await page.title()) !== 'Timestep') throw new Error('window lost');
      detail = 'graceful: No data selected, no crash';
    }
    if (pageErrors.length > errBefore)
      throw new Error('renderer errors: ' + pageErrors.slice(errBefore).join(' | '));
    results.push({ name: c.name, pass: true, detail });
  } catch (e) {
    const shot = path.join(os.tmpdir(), `timestep-smoke-fail-${caseIndex}.png`);
    await page.screenshot({ path: shot }).catch(() => {});
    results.push({ name: c.name, pass: false, detail: `${String(e.message || e).split('\n')[0]} [${shot}]` });
  }
}

// --- Session save/load round-trip ---------------------------------------
// Drives Save Session -> a temp .tss on disk (real fs via the IPC bridge),
// then Load Session back from it, and asserts the restored view re-renders.
// Both dialogs are stubbed in main, same as the file-open cases.
{
  const name = 'session: .tss save/load round-trip restores a rendering view';
  const errBefore = pageErrors.length;
  const tss = path.join(os.tmpdir(), `timestep-smoke-session-${process.pid}.tss`);
  try {
    fs.rmSync(tss, { force: true });
    const sqlFile = M('small-office-design-day/eplusout.sql');

    // load fresh + select a series so there's something to persist
    await app.evaluate(({ dialog }, filePaths) => {
      dialog.showOpenDialog = async () => ({ canceled: false, filePaths });
    }, [sqlFile]);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
    await page.getByText('FILES', { exact: true }).click();
    await page.getByRole('menuitem', { name: 'Load Files' }).click();
    await page.getByText('Multiline', { exact: true }).waitFor({ timeout: 120000 });
    try {
      await page.getByText('Loaded Files').waitFor({ timeout: 10000 });
      await page.keyboard.press('Escape');
      await page.getByText('Loaded Files').waitFor({ state: 'hidden', timeout: 5000 });
    } catch {}
    await page.getByText('Multiline', { exact: true }).click();
    await page.getByRole('combobox').first().click();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await waitForStablePaint(page, 120000, 'pre-save chart painted');
    await page.keyboard.press('Escape');

    // Save Session -> temp .tss
    await app.evaluate(({ dialog }, filePath) => {
      dialog.showSaveDialog = async () => ({ canceled: false, filePath });
    }, tss);
    await page.getByText('FILES', { exact: true }).click();
    await page.getByText('Save Session', { exact: true }).click();
    await page.waitForTimeout(800);
    await page.keyboard.press('Escape');

    if (!fs.existsSync(tss)) throw new Error('Save Session wrote no .tss file');
    const parsed = JSON.parse(fs.readFileSync(tss, 'utf8'));
    if (!parsed.session || !parsed.views)
      throw new Error('.tss missing session/views keys');

    // Load Session <- temp .tss; the restored view must re-render. Do NOT
    // re-click the chart-type selector — that races the restore.
    await app.evaluate(({ dialog }, filePath) => {
      dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [filePath] });
    }, tss);
    await page.getByText('FILES', { exact: true }).click();
    await page.getByText('Load Session', { exact: true }).click();
    await page.waitForTimeout(500);
    await page.keyboard.press('Escape');

    const px = await waitForStablePaint(page, 60000, 'post-load chart painted');
    if (pageErrors.length > errBefore)
      throw new Error('renderer errors: ' + pageErrors.slice(errBefore).join(' | '));
    results.push({ name, pass: true, detail: `saved ${Object.keys(parsed.views).length} view(s), restored ${px} painted px` });
  } catch (e) {
    const shot = path.join(os.tmpdir(), `timestep-smoke-fail-session.png`);
    await page.screenshot({ path: shot }).catch(() => {});
    results.push({ name, pass: false, detail: `${String(e.message || e).split('\n')[0]} [${shot}]` });
  } finally {
    fs.rmSync(tss, { force: true });
  }
}

await app.close();

let failed = 0;
for (const r of results) {
  log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.name} — ${r.detail}`);
  if (!r.pass) failed++;
}
log(`\n${results.length - failed}/${results.length} smoke cases passed`);
process.exit(failed ? 1 : 0);
