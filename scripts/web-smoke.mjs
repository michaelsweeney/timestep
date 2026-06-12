// Web smoke test: serve the static web build (app/dist-web) and drive it in a
// real Chromium via playwright-core, proving the browser path works end to
// end with NO Electron — file load through the in-tab sql.js engine, .eso
// in-tab conversion, and an actual chart paint. The desktop equivalent is
// scripts/ui-smoke.mjs; this is its no-Electron twin.
//
// Prereqs: `yarn build-web`, a system Chromium/Chrome, and the test-matrix
// fixtures (`yarn eplus-matrix`). Run: `yarn smoke-web`

import fs from 'fs';
import http from 'http';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const require_ = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { chromium } = require_(path.join(ROOT, 'node_modules', 'playwright-core'));

const WEB_DIR = path.join(ROOT, 'app', 'dist-web');
const M = p => path.join(ROOT, 'test-matrix', p);
const PORT = 8137;

const CASES = [
  { name: 'sql: design-day small office in-tab', files: [M('small-office-design-day/eplusout.sql')] },
  { name: 'sql: zone-uncontrolled annual (1.27M rows) in-tab', files: [M('zone-uncontrolled-sqlite/eplusout.sql')] },
  { name: 'eso: in-tab conversion + chart (multifreq .eso)', files: [M('small-office-multifreq-eso/eplusout.eso')] }
];

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.wasm': 'application/wasm', '.ttf': 'font/ttf', '.svg': 'image/svg+xml',
  '.map': 'application/json'
};

const log = (s, ...a) => console.log(s, ...a);

function findChrome() {
  const candidates = [
    '/usr/bin/chromium-browser', '/usr/bin/chromium',
    process.env.HOME + '/.local/bin/google-chrome',
    '/usr/bin/google-chrome-stable', '/usr/bin/google-chrome'
  ];
  const hit = candidates.find(p => { try { return fs.existsSync(p); } catch { return false; } });
  if (!hit) throw new Error('no system Chromium/Chrome found');
  return hit;
}

// Minimal static server with correct wasm/font mime types.
function serve(dir, port) {
  const server = http.createServer((req, res) => {
    const rel = decodeURIComponent(req.url.split('?')[0]);
    let file = path.join(dir, rel === '/' ? 'index.html' : rel);
    if (!file.startsWith(dir)) { res.writeHead(403); return res.end(); }
    fs.readFile(file, (err, buf) => {
      if (err) { res.writeHead(404); return res.end('not found'); }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
      res.end(buf);
    });
  });
  return new Promise(resolve => server.listen(port, () => resolve(server)));
}

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

const missing = CASES.flatMap(c => c.files).filter(f => !fs.existsSync(f));
if (missing.length) {
  console.error('missing fixtures (run `yarn eplus-matrix`):\n  ' + missing.join('\n  '));
  process.exit(2);
}
if (!fs.existsSync(path.join(WEB_DIR, 'index.html'))) {
  console.error('no web build — run `yarn build-web` first');
  process.exit(2);
}

const server = await serve(WEB_DIR, PORT);
const browser = await chromium.launch({ executablePath: findChrome(), headless: true });
const page = await browser.newPage();
const pageErrors = [];
page.on('pageerror', e => pageErrors.push(String(e)));

await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'domcontentloaded' });
if ((await page.title()) !== 'Timestep') throw new Error('unexpected window title');

const results = [];
let caseIndex = 0;
for (const c of CASES) {
  caseIndex++;
  const errBefore = pageErrors.length;
  try {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // FILES -> Load Files opens our hidden <input type=file>; Playwright
    // intercepts it as a filechooser.
    await page.getByText('FILES', { exact: true }).click();
    const [chooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.getByRole('menuitem', { name: 'Load Files' }).click()
    ]);
    await chooser.setFiles(c.files);

    await page.getByText('Multiline', { exact: true }).waitFor({ timeout: 120000 });
    try {
      await page.getByText('Loaded Files').waitFor({ timeout: 10000 });
      await page.keyboard.press('Escape');
      await page.getByText('Loaded Files').waitFor({ state: 'hidden', timeout: 5000 });
    } catch { /* no modal — fine */ }

    await page.getByText('Multiline', { exact: true }).click();
    const combo = page.getByRole('combobox').first();
    await combo.click();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    const px = await waitForStablePaint(page, 120000, 'chart canvas painted');
    await page.keyboard.press('Escape');

    if (pageErrors.length > errBefore)
      throw new Error('renderer errors: ' + pageErrors.slice(errBefore).join(' | '));
    results.push({ name: c.name, pass: true, detail: `${px} painted px` });
  } catch (e) {
    const shot = path.join(ROOT, `web-smoke-fail-${caseIndex}.png`);
    await page.screenshot({ path: shot }).catch(() => {});
    results.push({ name: c.name, pass: false, detail: `${String(e.message || e).split('\n')[0]} [${shot}]` });
  }
}

await browser.close();
await new Promise(res => server.close(res));

let failed = 0;
for (const r of results) {
  log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.name} — ${r.detail}`);
  if (!r.pass) failed++;
}
log(`\n${results.length - failed}/${results.length} web smoke cases passed`);
process.exit(failed ? 1 : 0);
