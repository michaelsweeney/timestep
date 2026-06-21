/** @jest-environment jsdom */
// (jest 25 defaults to jsdom and the config's `testURL` confirms it; the
// directive is belt-and-suspenders so the test survives a future jest bump.)
import { installHttpApi } from './http-api';

function okResponse(value: unknown) {
  return { ok: true, status: 200, json: async () => value, text: async () => JSON.stringify(value) };
}

describe('http-api shim', () => {
  beforeEach(() => {
    document.head.innerHTML = '<meta name="timestep-token" content="tok-1">';
    (global as unknown as { fetch: jest.Mock }).fetch = jest.fn(async () => okResponse([{ x: 1 }])) as unknown as jest.Mock;
    installHttpApi();
  });

  it('db.allRows posts to /api/db/allRows with the token header', async () => {
    const rows = await (window as any).api.db.allRows('/f.sql', 'SELECT 1');
    const [url, opts] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe('/api/db/allRows');
    expect(opts.headers['X-Timestep-Token']).toBe('tok-1');
    expect(JSON.parse(opts.body)).toEqual({ file: '/f.sql', sql: 'SELECT 1' });
    expect(rows).toEqual([{ x: 1 }]);
  });

  it('a non-2xx response rejects (does not resolve to an error object)', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 403, text: async () => 'forbidden' });
    await expect((window as any).api.dialog.openFiles({})).rejects.toThrow(/403/);
  });

  it('getPathForFile throws a clear serve-mode error', () => {
    expect(() => (window as any).api.getPathForFile({})).toThrow(/serve mode/i);
  });

  it('dialog.openFiles posts to /api/dialog/open', async () => {
    await (window as any).api.dialog.openFiles({ filters: [] });
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toBe('/api/dialog/open');
  });
});
