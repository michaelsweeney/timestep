// Browser shim installing window.api by fetching the loopback server's /api/*
// endpoints — the parallel of app/src/web/web-api.ts, but the SQL runs in the
// server's native sqlite3, not in-tab sql.js. The per-startup token is read
// from the <meta> tag the server injected at response time.

function token(): string {
  const el = document.querySelector('meta[name="timestep-token"]');
  return (el?.getAttribute('content')) || '';
}

async function post<T>(endpoint: string, payload: unknown): Promise<T> {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Timestep-Token': token() },
    body: JSON.stringify(payload)
  });
  // A non-2xx (403 forbidden, 500 server error) must REJECT, not silently
  // resolve to a parsed error object — the renderer's FileHandler treats a
  // resolved openFiles result as a real path list.
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`serve ${endpoint} failed (${res.status})${detail ? `: ${detail}` : ''}`);
  }
  return res.json() as Promise<T>;
}

export function installHttpApi(): void {
  const api = {
    dialog: {
      openFiles: (opts: unknown) => post('/api/dialog/open', opts),
      saveFile: (opts: unknown) => post('/api/dialog/save', opts)
    },
    fs: {
      readText: (path: string) => post<string>('/api/fs/readText', { path }),
      writeText: (path: string, contents: string) => post('/api/fs/writeText', { path, contents }),
      exists: (path: string) => post<boolean>('/api/fs/exists', { path })
    },
    db: {
      allRows: (file: string, sql: string) => post<unknown[]>('/api/db/allRows', { file, sql })
    },
    eso: {
      convertToSql: (path: string) => post<string>('/api/eso/convert', { path })
    },
    clipboard: {
      writeText: (text: string) => { navigator.clipboard?.writeText(text); }
    },
    shell: {
      openExternal: (url: string) => { window.open(url, '_blank', 'noopener,noreferrer'); return Promise.resolve(); }
    },
    // Drag-and-drop can't yield a server-openable path in a browser; the
    // button/dialog flow never calls this. Present-but-throwing so a stray
    // drop fails loudly instead of crashing on an undefined function.
    getPathForFile: (_file: File) => {
      throw new Error('Drag-and-drop is not available in serve mode — use the Load Files button.');
    }
  };
  (window as unknown as { api: typeof api }).api = api;
}
