import type { Engine } from '../engine/types';
import { checkArray } from './checkarray';
import { readBnd, resolveFluidTypeDetailed } from './readbnd';
import { resolveUnit } from './conversions';

// Load-time data-quality / fidelity warnings for a loaded file. The engine now
// *knows* when a value or unit is approximate (a unit it can't convert to IP, a
// fluid it had to guess, a flow it defaulted to cfm for lack of a .bnd); this
// surfaces that to the user instead of silently degrading. See
// DESIGN-variable-model.md ("…and says so") and GitHub #29.
//
// Every signal here is derived from the loaded .sql dictionary + whether the
// sibling .bnd is reachable — nothing depends on state that's lost after an ESO
// conversion. (Whether a .mtr/.rdd was available at conversion time is not
// recoverable from the converted .sql, so those aren't flagged here.)

export type DataQualitySeverity = 'info' | 'warning';

export interface DataQualityWarning {
  /** Stable identifier for the warning kind. */
  code:
    | 'empty'
    | 'no-bnd-flows-cfm'
    | 'fluid-name-guessed'
    | 'units-si-only';
  severity: DataQualitySeverity;
  /** One-line, user-facing summary. */
  message: string;
  /** Optional supporting detail (e.g. a few affected variable names). */
  detail?: string;
}

export interface FileDataQuality {
  filename: string;
  warnings: DataQualityWarning[];
}

// Cap how many names we list in a detail string so a pathological file can't
// produce a wall of text; the count in the message carries the full magnitude.
const SAMPLE = 6;
const sample = (names: string[]): string => {
  const shown = names.slice(0, SAMPLE).join(', ');
  return names.length > SAMPLE ? `${shown}, …` : shown;
};

export async function getDataQuality(
  engine: Engine,
  sqlfiles: string[]
): Promise<FileDataQuality[]> {
  checkArray(sqlfiles);
  const out: FileDataQuality[] = [];

  for (const sqlfile of sqlfiles) {
    const warnings: DataQualityWarning[] = [];
    const bndfile = sqlfile.replace('.sql', '.bnd');
    const bndExists = await engine.fileExists(bndfile);
    const bndDict = bndExists ? await readBnd(engine, bndfile) : undefined;

    const rows = (await engine.allRows(
      sqlfile,
      'SELECT KeyValue, Name, Units FROM ReportDataDictionary'
    )) as any[];

    if (rows.length === 0) {
      warnings.push({
        code: 'empty',
        severity: 'info',
        message: 'No report variables in this file — nothing to chart.'
      });
      out.push({ filename: sqlfile, warnings });
      continue;
    }

    const m3sDefaulted: string[] = []; // cfm only because no fluid info
    const m3sGuessed: string[] = []; // cfm/gpm inferred from the name
    const siOnly: string[] = []; // no IP conversion known → shown in SI

    for (const r of rows) {
      if (r.Units === 'm3/s') {
        const f = resolveFluidTypeDetailed(r.KeyValue, r.Name, bndDict);
        if (f.source === 'name') m3sGuessed.push(r.Name);
        else if (f.source === 'default') m3sDefaulted.push(r.Name);
        // source === 'bnd' is authoritative — no warning
      } else {
        const u = resolveUnit(r.Units, undefined, r.Name);
        // A non-empty SI unit with no known IP conversion is shown in SI.
        if (!u.ipKnown && (r.Units ?? '') !== '') siOnly.push(r.Name);
      }
    }

    if (!bndExists && (m3sDefaulted.length || m3sGuessed.length)) {
      const n = m3sDefaulted.length + m3sGuessed.length;
      warnings.push({
        code: 'no-bnd-flows-cfm',
        severity: 'warning',
        message:
          `${n} air/water flow${n === 1 ? '' : 's'} shown as cfm — no .bnd ` +
          `file, so cfm vs gpm can't be resolved.`,
        detail: 'Load the sibling .bnd to label water flows as gpm.'
      });
    } else if (m3sGuessed.length) {
      // .bnd present but some flows aren't nodes — resolved by name guess.
      warnings.push({
        code: 'fluid-name-guessed',
        severity: 'info',
        message:
          `${m3sGuessed.length} flow${m3sGuessed.length === 1 ? '' : 's'} had ` +
          `cfm/gpm inferred from the variable name (not in the .bnd).`,
        detail: sample(dedupe(m3sGuessed))
      });
    }

    if (siOnly.length) {
      const names = dedupe(siOnly);
      warnings.push({
        code: 'units-si-only',
        severity: 'info',
        message:
          `${names.length} variable${names.length === 1 ? '' : 's'} shown in ` +
          `SI — no IP conversion is defined for ${names.length === 1 ? 'its' : 'their'} unit.`,
        detail: sample(names)
      });
    }

    out.push({ filename: sqlfile, warnings });
  }

  return out;
}

const dedupe = (xs: string[]): string[] => Array.from(new Set(xs));
