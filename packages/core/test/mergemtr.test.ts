import { describe, it, expect } from 'vitest';
import { parseEso } from '../src/eso/parseeso';
import { mergeMeterFile } from '../src/eso/mergemtr';
import { MINI_ESO_METER_DATA, MINI_MTR_DATA } from './esofixtures';

describe('mergeMeterFile', () => {
  it('adds .mtr-only meters and skips meters already in the .eso', () => {
    const eso = parseEso(MINI_ESO_METER_DATA); // vars + meters 65, 1992
    const mtr = parseEso(MINI_MTR_DATA); // meter 65 (dup) + 1652 (new)
    const merged = mergeMeterFile(eso, mtr);

    const ids = merged.dictionary.map(d => d.id);
    // the new .mtr-only meter is added...
    expect(ids).toContain(1652);
    expect(merged.dictionary.find(d => d.id === 1652)).toMatchObject({
      name: 'ElectricityNet:Facility',
      keyValue: null,
      isMeter: true
    });
    // ...and meter 65 is not duplicated (still exactly one entry)
    expect(ids.filter(id => id === 65)).toHaveLength(1);
  });

  it('points the new meter values at valid, correctly-stamped Time rows', () => {
    const eso = parseEso(MINI_ESO_METER_DATA);
    const merged = mergeMeterFile(eso, parseEso(MINI_MTR_DATA));

    // find the appended 1652 value
    let found: { value: number; timeIndex: number } | null = null;
    for (let i = 0; i < merged.data.length; i++) {
      if (merged.data.dictIds[i] === 1652) {
        found = { value: merged.data.values[i], timeIndex: merged.data.timeIndexes[i] };
      }
    }
    expect(found).not.toBeNull();
    expect(found!.value).toBe(777.0);

    // the referenced Time row exists and carries the .mtr stamp (Dec 21, hour 1)
    const t = merged.time.find(r => r.timeIndex === found!.timeIndex);
    expect(t).toMatchObject({ month: 12, day: 21, hour: 1 });
  });

  it('is a no-op when the .mtr adds no new meters', () => {
    const eso = parseEso(MINI_ESO_METER_DATA);
    // merging the .eso with itself contributes no unseen meter ids
    const merged = mergeMeterFile(eso, parseEso(MINI_ESO_METER_DATA));
    expect(merged.dictionary).toHaveLength(eso.dictionary.length);
    expect(merged.data.length).toBe(eso.data.length);
  });
});
