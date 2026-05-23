// Renderer-side barrel: each engine-needing query gets a thin wrapper that
// injects the IpcEngine (which proxies to window.api). Pure helpers
// (getSeriesKeys, getSeriesLookupObj) re-export directly.
import {
  getSeries as getSeriesCore,
  getAllSeries as getAllSeriesCore,
  getFileSummary as getFileSummaryCore
} from '@timestep/core';
import { ipcEngine } from './engine';

export const getSeries = (filetag: string) => getSeriesCore(ipcEngine, filetag);
export const getAllSeries = (sqlfiles: string[]) =>
  getAllSeriesCore(ipcEngine, sqlfiles);
export const getFileSummary = (sqlfiles: string[]) =>
  getFileSummaryCore(ipcEngine, sqlfiles);

export { getSeriesKeys, getSeriesLookupObj } from '@timestep/core';
