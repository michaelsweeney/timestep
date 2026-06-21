import path from 'node:path';

// Dedupe concurrent conversions of the same .eso path. convertEsoCached
// (packages/core/src/eso/esocache.ts) is not atomic across calls — two
// concurrent requests for the same uncached file race on the shared
// `<sql>.building` temp. Sharing one in-flight promise per resolved path
// serializes same-file work while leaving different files concurrent.
export function makeEsoConverter(
  convertFn: (esoPath: string) => Promise<string>
): (esoPath: string) => Promise<string> {
  const inflight = new Map<string, Promise<string>>();
  return (esoPath: string) => {
    const key = path.resolve(esoPath);
    let p = inflight.get(key);
    if (!p) {
      p = Promise.resolve()
        .then(() => convertFn(esoPath))
        .finally(() => inflight.delete(key));
      inflight.set(key, p);
    }
    return p;
  };
}
