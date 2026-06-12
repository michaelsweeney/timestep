// Top-level barrel — env-neutral exports only. Engine impls that import
// Node built-ins (sqlite3, fs) live behind subpath imports:
//   import { Sqlite3Engine } from '@timestep/core/sqlite3';
// so the renderer's barrel import doesn't transitively pull them in.
export type { Engine } from './engine/types';
export { parseEso } from './eso/parseeso';
export type {
  ParsedEso,
  EsoDictEntry,
  EsoTimeRow,
  EsoData
} from './eso/parseeso';
export { readBnd } from './queries/readbnd';
export { getSeries } from './queries/getseries';
export { getSeriesIndex } from './queries/getseriesindex';
export { getAllSeries } from './queries/getallseries';
export { getFileSummary } from './queries/getfilesummary';
export { getSeriesKeys, getSeriesLookupObj } from './queries/formatseries';
export { resolveUnit } from './queries/conversions';
export type { UnitResolution } from './queries/conversions';
export { checkArray } from './queries/checkarray';
