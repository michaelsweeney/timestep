// Pure ESO parser — no Node built-ins, safe to export from the barrel.
// Parses the EnergyPlus .eso text format: a data dictionary (one line per
// reported variable, ids 1-6 reserved for time/environment stamps),
// then per-environment data records. The .mtr meter file shares the
// same format.

export interface EsoDictEntry {
  id: number;
  nitems: number;
  /**
   * The report key (zone/node/surface/object name). `null` for meters, which
   * have no key field — matching how the native E+ .sql stores meter rows
   * (KeyValue = NULL, IsMeter = 1).
   */
  keyValue: string | null;
  name: string;
  units: string;
  /** SQL-style ReportingFrequency, matching the E+ .sql schema values. */
  reportingFrequency: string;
  /** True for meter dictionary lines (the keyless `<Name> [units] !freq` form). */
  isMeter: boolean;
}

export interface EsoTimeRow {
  timeIndex: number;
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  dst: number | null;
  interval: number;
  intervalType: number;
  simulationDays: number;
  dayType: string | null;
  environmentPeriodIndex: number;
  warmupFlag: number;
}

// Columnar data storage: a 162 MB annual ESO holds ~8M values, so
// per-row objects cost gigabytes of heap. Typed arrays keep the whole
// parse under a few hundred MB.
export interface EsoData {
  length: number;
  dictIds: Uint32Array;
  timeIndexes: Uint32Array;
  values: Float64Array;
}

export interface ParsedEso {
  version: string;
  dictionary: EsoDictEntry[];
  time: EsoTimeRow[];
  data: EsoData;
}

class DataColumns {
  length = 0;
  dictIds = new Uint32Array(1024);
  timeIndexes = new Uint32Array(1024);
  values = new Float64Array(1024);

  push(dictId: number, timeIndex: number, value: number) {
    if (this.length === this.values.length) {
      const grow = <T extends Uint32Array | Float64Array>(a: T): T => {
        const next = new (a.constructor as new (n: number) => T)(a.length * 2);
        next.set(a);
        return next;
      };
      this.dictIds = grow(this.dictIds);
      this.timeIndexes = grow(this.timeIndexes);
      this.values = grow(this.values);
    }
    this.dictIds[this.length] = dictId;
    this.timeIndexes[this.length] = timeIndex;
    this.values[this.length] = value;
    this.length++;
  }

  finish(): EsoData {
    return {
      length: this.length,
      dictIds: this.dictIds.subarray(0, this.length),
      timeIndexes: this.timeIndexes.subarray(0, this.length),
      values: this.values.subarray(0, this.length)
    };
  }
}

// ESO "!Tag" → ReportingFrequency string used in the E+ SQLite schema.
const FREQUENCY_MAP: Record<string, string> = {
  'Each Call': 'HVAC System Timestep',
  TimeStep: 'Zone Timestep',
  Hourly: 'Hourly',
  Daily: 'Daily',
  Monthly: 'Monthly',
  RunPeriod: 'Run Period',
  Annual: 'Annual'
};

const RESERVED_MAX_ID = 6;

function parseDictionaryLine(line: string): EsoDictEntry | null {
  const first = line.indexOf(',');
  const second = line.indexOf(',', first + 1);
  if (first < 0 || second < 0) return null;

  const id = Number(line.slice(0, first));
  if (!Number.isInteger(id) || id <= RESERVED_MAX_ID) return null;
  const nitems = Number(line.slice(first + 1, second));

  // The text after id,nitems is one of two shapes:
  //   report variable: "<KeyValue>,<Name> [units] !freq[ [min/max cols]]"
  //   meter:           "<Name> [units] !freq[ [min/max cols]]"   (no key field)
  // Match the "[units] !freq" tail first, then decide by whether the head
  // before it carries a key (a comma) or is a bare meter name.
  const rest = line.slice(second + 1);
  const m = rest.match(/^(.*?)\s*\[([^\]]*)\]\s*!(.+?)(?:\s*\[.*)?$/);
  if (!m) return null;

  const frequency = FREQUENCY_MAP[m[3].trim()];
  if (!frequency) return null;

  const head = m[1];
  const keyEnd = head.indexOf(',');
  // No comma in the head -> meter (keyless). Native E+ .sql stores meter rows
  // with KeyValue = NULL and IsMeter = 1; mirror that here.
  const isMeter = keyEnd < 0;
  const keyValue = isMeter ? null : head.slice(0, keyEnd).trim();
  const name = isMeter ? head.trim() : head.slice(keyEnd + 1).trim();

  return {
    id,
    nitems,
    keyValue,
    name,
    units: m[2].trim(),
    reportingFrequency: frequency,
    isMeter
  };
}

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

// IntervalType codes as written by EnergyPlus into the .sql Time table.
const INTERVAL_TYPE = {
  timestep: -1,
  hourly: 1,
  daily: 2,
  monthly: 3,
  runPeriod: 4,
  annual: 5
} as const;

// Yields one line at a time without materializing an 8M-element array
// for large files.
function* iterateLines(text: string): Generator<string> {
  let start = 0;
  while (start < text.length) {
    let end = text.indexOf('\n', start);
    if (end < 0) end = text.length;
    yield text.slice(start, end);
    start = end + 1;
  }
}

export function parseEso(text: string): ParsedEso {
  const lines = iterateLines(text);
  const version = lines.next().value?.trim() ?? '';
  const dictionary: EsoDictEntry[] = [];

  const time: EsoTimeRow[] = [];
  const data = new DataColumns();
  // `break` inside for..of would close the generator, so the dictionary →
  // data transition is a phase flag inside a single loop.
  let inDictionary = true;
  const freqById = new Map<number, string>();
  // Most recent TimeIndex per frequency bucket; stamp 2 serves both
  // Zone Timestep and Hourly values (hourly values follow their own
  // full-hour stamp, mirroring how E+ writes the .sql Time table).
  const current: Record<string, number> = {};
  let envIndex = 0;

  const pushTime = (row: Omit<EsoTimeRow, 'timeIndex'>): number => {
    const timeIndex = time.length + 1;
    time.push({ timeIndex, ...row });
    return timeIndex;
  };

  for (const raw of lines) {
    const line = raw.trim();

    if (inDictionary) {
      if (line === 'End of Data Dictionary') {
        inDictionary = false;
        continue;
      }
      const entry = parseDictionaryLine(line);
      if (entry) {
        dictionary.push(entry);
        freqById.set(entry.id, entry.reportingFrequency);
      }
      continue;
    }

    if (line === '' || line === 'End of Data') continue;
    const first = line.indexOf(',');
    if (first < 0) continue;
    const id = Number(line.slice(0, first));

    if (id > RESERVED_MAX_ID) {
      // Hot path: a value line. Only the first field matters (min/max
      // extras follow on Daily/Monthly lines); parseFloat stops at the
      // comma, so no split allocation.
      const freq = freqById.get(id);
      if (!freq) continue;
      const timeIndex = current[freq];
      if (!timeIndex) continue;
      data.push(id, timeIndex, parseFloat(line.slice(first + 1)));
      continue;
    }

    const fields = line.slice(first + 1).split(',');

    if (id === 1) {
      envIndex++;
    } else if (id === 2) {
      // dayOfSim, month, day, dst, hour, startMin, endMin, dayType
      const [sim, month, day, dst, hour, startMin, endMin] = fields.map(Number);
      const endTotal = (hour - 1) * 60 + endMin;
      const interval = Math.round(endMin - startMin);
      const idx = pushTime({
        year: 0,
        month,
        day,
        hour: Math.floor(endTotal / 60),
        minute: Math.round(endTotal % 60),
        dst,
        interval,
        intervalType:
          interval === 60 ? INTERVAL_TYPE.hourly : INTERVAL_TYPE.timestep,
        simulationDays: sim,
        dayType: fields[7]?.trim() ?? null,
        environmentPeriodIndex: envIndex,
        warmupFlag: 0
      });
      current['Zone Timestep'] = idx;
      current['HVAC System Timestep'] = idx;
      current['Hourly'] = idx;
    } else if (id === 3) {
      // cumDay, month, day, dst, dayType
      const [sim, month, day, dst] = fields.map(Number);
      current['Daily'] = pushTime({
        year: 0,
        month,
        day,
        hour: 24,
        minute: 0,
        dst,
        interval: 1440,
        intervalType: INTERVAL_TYPE.daily,
        simulationDays: sim,
        dayType: fields[4]?.trim() ?? null,
        environmentPeriodIndex: envIndex,
        warmupFlag: 0
      });
    } else if (id === 4) {
      // cumDays, month
      const [sim, month] = fields.map(Number);
      const days = DAYS_IN_MONTH[month - 1] ?? 30;
      current['Monthly'] = pushTime({
        year: 0,
        month,
        day: days,
        hour: 24,
        minute: 0,
        dst: null,
        interval: days * 1440,
        intervalType: INTERVAL_TYPE.monthly,
        simulationDays: sim,
        dayType: null,
        environmentPeriodIndex: envIndex,
        warmupFlag: 0
      });
    } else if (id === 5 || id === 6) {
      // run-period / annual stamps: single cumulative field
      const sim = Number(fields[0]);
      current[id === 5 ? 'Run Period' : 'Annual'] = pushTime({
        year: 0,
        month: 0,
        day: 0,
        hour: 0,
        minute: 0,
        dst: 0,
        interval: 0,
        intervalType: id === 5 ? INTERVAL_TYPE.runPeriod : INTERVAL_TYPE.annual,
        simulationDays: sim,
        dayType: null,
        environmentPeriodIndex: envIndex,
        warmupFlag: 0
      });
    }
  }

  return { version, dictionary, time, data: data.finish() };
}
