// Renderer-side barrel: each engine-needing query gets a thin wrapper that
// injects the IpcEngine (which proxies to window.api). Pure helpers
// (getSeriesKeys, getSeriesLookupObj) re-export directly.
import {
  getSeries as getSeriesCore,
  getAllSeries as getAllSeriesCore,
  getFileSummary as getFileSummaryCore,
  getDataQuality as getDataQualityCore
} from '@timestep/core';
import { ipcEngine } from './engine';

export const getSeries = (filetag: string) => getSeriesCore(ipcEngine, filetag);
export const getAllSeries = (sqlfiles: string[]) =>
  getAllSeriesCore(ipcEngine, sqlfiles);
export const getFileSummary = (sqlfiles: string[]) =>
  getFileSummaryCore(ipcEngine, sqlfiles);
export const getDataQuality = (sqlfiles: string[]) =>
  getDataQualityCore(ipcEngine, sqlfiles);

export { getSeriesKeys, getSeriesLookupObj } from '@timestep/core';
export type { FileDataQuality, DataQualityWarning } from '@timestep/core';
