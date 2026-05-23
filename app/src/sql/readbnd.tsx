import { readBnd as readBndCore } from '@timestep/core';
import { ipcEngine } from './engine';

export function readBnd(bnd: string): Promise<Record<string, string>> {
  return readBndCore(ipcEngine, bnd);
}
