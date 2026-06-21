// Merge a parsed .mtr (meter file) into a parsed .eso, recovering meters that
// EnergyPlus wrote only to the meter file (Output:Meter:MeterFileOnly, and some
// derived meters like *Net:Facility) and so never appear in the .eso.
//
// EnergyPlus assigns one global ReportDataDictionaryIndex across all outputs:
// a meter present in both files carries the *same* id in each, and a .mtr-only
// meter has an id that never appears in the .eso. So "new meter" = a meter id
// in the .mtr that the .eso didn't already define — no name/frequency matching
// needed, and no risk of colliding with an .eso variable's id.
//
// The .mtr has its own Time table; the new meters' values are re-pointed at
// freshly-appended Time rows (copied from the .mtr) so they join correctly.
// Time rows the new meters don't reference are left out.

import type { ParsedEso, EsoData } from './parseeso';

export function mergeMeterFile(eso: ParsedEso, mtr: ParsedEso): ParsedEso {
  const existingIds = new Set(eso.dictionary.map(d => d.id));
  const newMeters = mtr.dictionary.filter(d => d.isMeter && !existingIds.has(d.id));
  if (newMeters.length === 0) return eso;
  const newIds = new Set(newMeters.map(d => d.id));

  // .mtr Time rows referenced by the new meters, in order of first use.
  const mtrTimeByIdx = new Map(mtr.time.map(t => [t.timeIndex, t]));
  const timeRemap = new Map<number, number>();
  // Typed (not bare `[]`, which strict TS infers as never[]) — rows appended
  // here share the .eso/.mtr time-row shape and are spread into `time` below.
  const appendedTime: typeof mtr.time = [];
  // eso time indexes are 1-based and contiguous, so length is the last index.
  let nextTimeIdx = eso.time.length;
  let addCount = 0;
  for (let i = 0; i < mtr.data.length; i++) {
    const id = mtr.data.dictIds[i];
    if (!newIds.has(id)) continue;
    addCount++;
    const mtrIdx = mtr.data.timeIndexes[i];
    if (!timeRemap.has(mtrIdx)) {
      const src = mtrTimeByIdx.get(mtrIdx);
      if (!src) continue;
      nextTimeIdx++;
      timeRemap.set(mtrIdx, nextTimeIdx);
      appendedTime.push({ ...src, timeIndex: nextTimeIdx });
    }
  }

  // Concatenate the new meter data onto the .eso columnar arrays, remapping
  // each value's TimeIndex to the appended Time row.
  const len = eso.data.length + addCount;
  const dictIds = new Uint32Array(len);
  const timeIndexes = new Uint32Array(len);
  const values = new Float64Array(len);
  dictIds.set(eso.data.dictIds);
  timeIndexes.set(eso.data.timeIndexes);
  values.set(eso.data.values);

  let w = eso.data.length;
  for (let i = 0; i < mtr.data.length; i++) {
    const id = mtr.data.dictIds[i];
    if (!newIds.has(id)) continue;
    const t = timeRemap.get(mtr.data.timeIndexes[i]);
    if (t === undefined) continue;
    dictIds[w] = id;
    timeIndexes[w] = t;
    values[w] = mtr.data.values[i];
    w++;
  }

  const mergedData: EsoData = {
    length: w,
    dictIds: dictIds.subarray(0, w),
    timeIndexes: timeIndexes.subarray(0, w),
    values: values.subarray(0, w)
  };

  return {
    version: eso.version,
    dictionary: [...eso.dictionary, ...newMeters],
    time: [...eso.time, ...appendedTime],
    data: mergedData
  };
}
