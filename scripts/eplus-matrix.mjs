#!/usr/bin/env node
// EnergyPlus condition-matrix test harness for Timestep.
//
// Pulls example/prototype models, applies targeted IDF mutations
// (timestep, Output:SQLite on/off), runs them under the version-matched
// EnergyPlus engine (including design-day-only runs), and checks for
// errors. Outputs land in test-matrix/ (gitignored); fixture entries
// repopulate test-models/ (gitignored). See test-models/README.md.
//
// Usage:
//   node scripts/eplus-matrix.mjs [--list] [--only <substr>] [--jobs N] [--fixtures]
//
// Env overrides: EPLUS_ROOT, EPLUS_PROTOTYPES, EPLUS_WEATHER

import { spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const REPO_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const HOME = os.homedir();

const EPLUS_ROOT = process.env.EPLUS_ROOT || path.join(HOME, 'programs', 'energyplus');
const PROTOTYPES =
  process.env.EPLUS_PROTOTYPES ||
  path.join(HOME, 'Documents', 'energyplus-files', 'pnnl-commercial-prototypes');
const WEATHER =
  process.env.EPLUS_WEATHER ||
  path.join(HOME, 'Documents', 'energyplus-files', 'eplus-weather');

const MATRIX_DIR = path.join(REPO_ROOT, 'test-matrix');
const MODELS_DIR = path.join(REPO_ROOT, 'test-models');

// ---------------------------------------------------------------------------
// Model sources

function findInstall(version) {
  const dirs = fs
    .readdirSync(EPLUS_ROOT)
    .filter((d) => d.startsWith(`EnergyPlus-${version}.`));
  if (!dirs.length) {
    throw new Error(`No EnergyPlus ${version}.x install under ${EPLUS_ROOT}`);
  }
  return path.join(EPLUS_ROOT, dirs.sort().at(-1));
}

function idfVersion(idfText) {
  const m = idfText.match(/^\s*Version\s*,\s*([0-9]+\.[0-9]+)/im);
  if (!m) throw new Error('No Version object found in IDF');
  return m[1];
}

const proto = (type, name) => path.join(PROTOTYPES, type, `${name}.idf`);
// Hospital prototypes live in a sibling stash (pnnl-commercial-prototypes
// has no Hospital dir). Full-year RunPeriod, unlike the ExampleFiles copy,
// whose three sample-month RunPeriods (Jan/Apr/Jul) finish deceptively fast.
const protoHospital = (name) =>
  path.join(HOME, 'Documents', 'energyplus-files', 'prototype-testing',
    'prototype-models', 'ASHRAE901_Hospital_STD2022', `${name}.idf`);
const wx = (name) => path.join(WEATHER, name);
// ExampleFiles/WeatherData resolved against the engine actually chosen for the run
const example = (name) => ({ example: name });
const bundledWx = (name) => ({ bundled: name });

// ---------------------------------------------------------------------------
// IDF mutations

function setTimestep(idf, n) {
  const re = /(^|\n)([ \t]*)Timestep\s*,\s*[0-9]+\s*;/i;
  if (re.test(idf)) return idf.replace(re, `$1$2Timestep,${n};`);
  return `${idf}\n\nTimestep,${n};\n`;
}

function stripSqlite(idf) {
  return idf.replace(/(^|\n)[ \t]*Output:SQLite\s*,[^;]*;[^\n]*/gi, '');
}

function ensureSqlite(idf) {
  if (/^\s*Output:SQLite\s*,/im.test(idf)) return idf;
  return `${idf}\n\nOutput:SQLite,\n    SimpleAndTabular;        !- Option Type\n`;
}

function runSizingPeriods(idf, yesNo) {
  return idf.replace(
    /(^|\n)([ \t]*)(Yes|No)\s*,(\s*!-\s*Run Simulation for Sizing Periods)/i,
    `$1$2${yesNo},$4`
  );
}

// Mixed-frequency output block used by the large-office-multifreq vitest
// fixture — exercises Zone Timestep / Hourly / Daily / Monthly dictionary
// handling in the ESO/SQL readers.
const MULTIFREQ_BLOCK = `
!- Mixed-frequency outputs for ESO parser stress test
!- --- Timestep (sub-hourly, at the simulation Timestep) ---
Output:Variable,*,Site Outdoor Air Drybulb Temperature,Timestep;
Output:Variable,*,Zone Mean Air Temperature,Timestep;
Output:Variable,*,Facility Total HVAC Electricity Demand Rate,Timestep;
Output:Variable,*,Cooling Coil Total Cooling Rate,Timestep;
Output:Variable,*,Heating Coil Heating Rate,Timestep;

!- --- Hourly ---
Output:Variable,*,Site Outdoor Air Drybulb Temperature,Hourly;
Output:Variable,*,Site Outdoor Air Dewpoint Temperature,Hourly;
Output:Variable,*,Site Outdoor Air Relative Humidity,Hourly;
Output:Variable,*,Site Wind Speed,Hourly;
Output:Variable,*,Zone Air Relative Humidity,Hourly;
Output:Variable,*,Zone Lights Electricity Rate,Hourly;
Output:Variable,*,Fan Electricity Rate,Hourly;

!- --- Daily ---
Output:Variable,*,Site Outdoor Air Drybulb Temperature,Daily;
Output:Variable,*,Facility Total Electricity Demand Rate,Daily;
Output:Variable,*,Zone Mean Air Temperature,Daily;
Output:Variable,*,Cooling Coil Total Cooling Energy,Daily;

!- --- Monthly ---
Output:Variable,*,Site Outdoor Air Drybulb Temperature,Monthly;
Output:Variable,*,Facility Total Electricity Demand Rate,Monthly;
Output:Variable,*,Cooling Coil Total Cooling Energy,Monthly;
Output:Variable,*,Boiler Heating Energy,Monthly;

Output:Meter,Electricity:Facility,Hourly;
Output:Meter,NaturalGas:Facility,Hourly;
Output:Meter,Heating:Electricity,Hourly;
Output:Meter,Heating:NaturalGas,Hourly;
Output:Meter,Cooling:Electricity,Hourly;
`;

// Minimal zone-timestep-frequency outputs — without these, a Timestep
// override changes simulation granularity but not ESO volume (stock
// variables are Hourly), so the timestep variants would be no-ops for
// the reader.
const ZTS_BLOCK = `
Output:Variable,*,Site Outdoor Air Drybulb Temperature,Timestep;
Output:Variable,*,Zone Mean Air Temperature,Timestep;
`;

// ---------------------------------------------------------------------------
// Run matrix
//
// name        — run id; also the output folder name (model + what it tests)
// idf         — absolute path or {example: name} resolved from the engine dir
// epw         — absolute path or {bundled: name}; omitted for design-day runs
// designDay   — run with -D (sizing periods only)
// sqlite      — true: ensure Output:SQLite; false: strip it; undefined: stock
// timestep    — override the Timestep object
// fixture     — write into test-models/<name>/ instead of test-matrix/
//               (excluded from default runs; use --fixtures or --only)

const RUNS = [
  // Minimal smoke model — fast, no HVAC, few reports (EnergyPlus 25.2)
  { name: 'zone-uncontrolled-annual', idf: example('1ZoneUncontrolled.idf'), epw: bundledWx('USA_IL_Chicago-OHare.Intl.AP.725300_TMY3.epw') },
  { name: 'zone-uncontrolled-sqlite', idf: example('1ZoneUncontrolled.idf'), epw: bundledWx('USA_IL_Chicago-OHare.Intl.AP.725300_TMY3.epw'), sqlite: true },
  { name: 'zone-uncontrolled-timestep-1', idf: example('1ZoneUncontrolled.idf'), epw: bundledWx('USA_IL_Chicago-OHare.Intl.AP.725300_TMY3.epw'), timestep: 1, appendBlock: ZTS_BLOCK },
  { name: 'zone-uncontrolled-timestep-60', idf: example('1ZoneUncontrolled.idf'), epw: bundledWx('USA_IL_Chicago-OHare.Intl.AP.725300_TMY3.epw'), timestep: 60, appendBlock: ZTS_BLOCK },
  { name: 'zone-uncontrolled-design-day', idf: example('1ZoneUncontrolled.idf'), designDay: true },

  // Simple prototype workhorse (PNNL 90.1, EnergyPlus 22.1)
  { name: 'small-office-annual-no-sql', idf: proto('ASHRAE901_OfficeSmall', 'ASHRAE901_OfficeSmall_STD2022_Seattle'), epw: wx('USA_WA_Seattle-Tacoma.Intl.AP.727930_TMY3.epw'), sqlite: false },
  { name: 'small-office-annual-sqlite', idf: proto('ASHRAE901_OfficeSmall', 'ASHRAE901_OfficeSmall_STD2022_Seattle'), epw: wx('USA_WA_Seattle-Tacoma.Intl.AP.727930_TMY3.epw'), sqlite: true },
  { name: 'small-office-timestep-1', idf: proto('ASHRAE901_OfficeSmall', 'ASHRAE901_OfficeSmall_STD2022_Seattle'), epw: wx('USA_WA_Seattle-Tacoma.Intl.AP.727930_TMY3.epw'), sqlite: true, timestep: 1 },
  { name: 'small-office-design-day', idf: proto('ASHRAE901_OfficeSmall', 'ASHRAE901_OfficeSmall_STD2022_Seattle'), sqlite: true, designDay: true },
  // Stock prototypes ship with every Output:Variable commented out (no ESO);
  // append the multifreq block to get a real prototype ESO for the viewer.
  { name: 'small-office-multifreq-eso', idf: proto('ASHRAE901_OfficeSmall', 'ASHRAE901_OfficeSmall_STD2022_Seattle'), epw: wx('USA_WA_Seattle-Tacoma.Intl.AP.727930_TMY3.epw'), sqlite: true, appendBlock: MULTIFREQ_BLOCK },

  // Very large models — scaling checks
  { name: 'large-office-ny-design-day', idf: proto('ASHRAE901_OfficeLarge', 'ASHRAE901_OfficeLarge_STD2022_NewYork'), sqlite: true, designDay: true },
  { name: 'large-office-annual-sqlite', idf: proto('ASHRAE901_OfficeLarge', 'ASHRAE901_OfficeLarge_STD2022_NewYork'), epw: wx('USA_NY_New.York-John.F.Kennedy.Intl.AP.744860_TMY3.epw'), sqlite: true },
  { name: 'hospital-design-day', idf: protoHospital('ASHRAE901_Hospital_STD2022_Denver'), designDay: true },
  // Big annual ESO with no SQLite — the "large model, .sql missing" case.
  { name: 'hospital-annual-eso-no-sql', idf: protoHospital('ASHRAE901_Hospital_STD2022_Denver'), epw: wx('USA_CO_Denver-Aurora-Buckley.AFB.724695_TMY3.epw'), sqlite: false, appendBlock: MULTIFREQ_BLOCK },

  // Vitest fixtures (regenerate test-models/<name>/; explicit only)
  {
    name: 'large-office-multifreq',
    fixture: true,
    idf: proto('ASHRAE901_OfficeLarge', 'ASHRAE901_OfficeLarge_STD2022_PortAngeles'),
    epw: wx('USA_WA_Port.Angeles-William.R.Fairchild.Intl.AP.727885_TMY3.epw'),
    sqlite: true,
    sizingPeriods: 'Yes',
    appendBlock: MULTIFREQ_BLOCK,
  },
  {
    name: 'large-office-design-day',
    fixture: true,
    idf: proto('ASHRAE901_OfficeLarge', 'ASHRAE901_OfficeLarge_STD2022_PortAngeles'),
    sqlite: true,
    designDay: true,
  },
];

// ---------------------------------------------------------------------------
// Runner

function prepareIdf(run, engineDir) {
  const idfPath =
    typeof run.idf === 'string'
      ? run.idf
      : path.join(engineDir, 'ExampleFiles', run.idf.example);
  let idf = fs.readFileSync(idfPath, 'utf8');
  if (run.timestep !== undefined) idf = setTimestep(idf, run.timestep);
  if (run.sqlite === true) idf = ensureSqlite(idf);
  if (run.sqlite === false) idf = stripSqlite(idf);
  if (run.sizingPeriods) idf = runSizingPeriods(idf, run.sizingPeriods);
  if (run.appendBlock) idf = `${idf}\n${run.appendBlock}`;
  return { idf, basename: path.basename(idfPath) };
}

function resolveEngine(run) {
  // Peek at the source IDF to version-match the engine.
  const probe =
    typeof run.idf === 'string'
      ? fs.readFileSync(run.idf, 'utf8')
      : null;
  if (probe) return findInstall(idfVersion(probe));
  // {example:} models ship with the newest install.
  return findInstall('25.2');
}

function execEnergyPlus(bin, args, cwd) {
  return new Promise((resolve) => {
    const t0 = Date.now();
    const child = spawn(bin, args, { cwd, stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = '';
    child.stderr.on('data', (d) => (stderr += d));
    child.on('close', (code) =>
      resolve({ code, stderr: stderr.slice(-2000), seconds: (Date.now() - t0) / 1000 })
    );
  });
}

function summarizeOutputs(dir) {
  const interesting = ['eplusout.eso', 'eplusout.sql', 'eplusout.err', 'eplusout.bnd', 'eplustbl.htm', 'eplusout.mtr'];
  const out = {};
  for (const f of interesting) {
    const p = path.join(dir, f);
    if (fs.existsSync(p)) out[f] = fs.statSync(p).size;
  }
  return out;
}

function parseEnd(dir) {
  const p = path.join(dir, 'eplusout.end');
  if (!fs.existsSync(p)) return { ok: false, line: '(no eplusout.end)' };
  const line = fs.readFileSync(p, 'utf8').trim();
  const ok = /Completed Successfully/.test(line);
  const warn = Number((line.match(/(\d+)\s+Warning/) || [])[1] ?? -1);
  const severe = Number((line.match(/(\d+)\s+Severe/) || [])[1] ?? -1);
  return { ok, warn, severe, line };
}

async function executeRun(run) {
  const engineDir = resolveEngine(run);
  const engine = path.basename(engineDir).match(/EnergyPlus-([\d.]+)/)[1];
  const finalDir = run.fixture
    ? path.join(MODELS_DIR, run.name)
    : path.join(MATRIX_DIR, run.name);
  // Stage in a scratch dir, then swap in — avoids truncating prior outputs
  // (which may be hardlinked) and never leaves a half-written folder.
  const stageDir = path.join(MATRIX_DIR, `.staging-${run.name}`);
  fs.rmSync(stageDir, { recursive: true, force: true });
  fs.mkdirSync(stageDir, { recursive: true });

  const { idf, basename } = prepareIdf(run, engineDir);
  const idfOut = path.join(stageDir, basename);
  fs.writeFileSync(idfOut, idf);

  const args = ['-d', stageDir];
  if (run.designDay) args.push('-D');
  if (run.epw) {
    const epwPath =
      typeof run.epw === 'string'
        ? run.epw
        : path.join(engineDir, 'WeatherData', run.epw.bundled);
    args.push('-w', epwPath);
  }
  args.push(idfOut);

  const { code, stderr, seconds } = await execEnergyPlus(
    path.join(engineDir, 'energyplus'), args, stageDir
  );
  const end = parseEnd(stageDir);
  const outputs = summarizeOutputs(stageDir);

  fs.rmSync(finalDir, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(finalDir), { recursive: true });
  fs.renameSync(stageDir, finalDir);

  return {
    name: run.name,
    fixture: !!run.fixture,
    engine,
    exitCode: code,
    ok: end.ok && code === 0,
    warnings: end.warn,
    severe: end.severe,
    seconds: Math.round(seconds * 10) / 10,
    endLine: end.line,
    stderr: code === 0 ? undefined : stderr,
    outputs,
    dir: path.relative(REPO_ROOT, finalDir),
  };
}

// ---------------------------------------------------------------------------
// CLI

const argv = process.argv.slice(2);
const flag = (f) => argv.includes(f);
const opt = (f) => {
  const i = argv.indexOf(f);
  return i >= 0 ? argv[i + 1] : undefined;
};

const only = opt('--only');
const jobs = Number(opt('--jobs') || 2);

let selected = RUNS.filter((r) => (only ? r.name.includes(only) : true));
if (!only && !flag('--fixtures')) selected = selected.filter((r) => !r.fixture);

if (flag('--list')) {
  for (const r of RUNS) {
    console.log(
      `${r.name.padEnd(34)} ${r.fixture ? '[fixture] ' : ''}${r.designDay ? 'design-day' : 'annual'}` +
        `${r.timestep !== undefined ? ` timestep=${r.timestep}` : ''}` +
        `${r.sqlite === true ? ' +sqlite' : r.sqlite === false ? ' -sqlite' : ''}`
    );
  }
  process.exit(0);
}

if (!selected.length) {
  console.error(`No runs match --only ${only}`);
  process.exit(1);
}

console.log(`Running ${selected.length} simulation(s), ${jobs} at a time…\n`);
fs.mkdirSync(MATRIX_DIR, { recursive: true });

const queue = [...selected];
const results = [];
await Promise.all(
  Array.from({ length: Math.min(jobs, queue.length) }, async () => {
    while (queue.length) {
      const run = queue.shift();
      process.stdout.write(`▶ ${run.name}\n`);
      const res = await executeRun(run);
      results.push(res);
      const mb = (n) => (n ? `${(n / 1e6).toFixed(1)}M` : '—');
      process.stdout.write(
        `${res.ok ? '✓' : '✗'} ${res.name}  [E+${res.engine}, ${res.seconds}s]  ` +
          `warn=${res.warnings} severe=${res.severe}  ` +
          `eso=${mb(res.outputs['eplusout.eso'])} sql=${mb(res.outputs['eplusout.sql'])}\n`
      );
    }
  })
);

// Merge into any existing results.json so partial (--only) runs update
// their rows without dropping the rest of the inventory.
const resultsPath = path.join(MATRIX_DIR, 'results.json');
let merged = results;
try {
  const prior = JSON.parse(fs.readFileSync(resultsPath, 'utf8')).results ?? [];
  const fresh = new Set(results.map((r) => r.name));
  merged = [...prior.filter((r) => !fresh.has(r.name)), ...results];
} catch {
  /* no prior results */
}
merged.sort((a, b) => a.name.localeCompare(b.name));
fs.writeFileSync(
  resultsPath,
  JSON.stringify({ generated: new Date().toISOString(), results: merged }, null, 2)
);

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} runs OK — details in test-matrix/results.json`);
for (const f of failed) {
  console.log(`\nFAILED: ${f.name} (exit ${f.exitCode})\n  ${f.endLine}\n  ${f.stderr ?? ''}`);
}
process.exit(failed.length ? 1 : 0);
