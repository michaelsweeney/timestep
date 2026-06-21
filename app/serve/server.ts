import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import type { AddressInfo } from 'node:net';

export interface ServeDeps {
  engine: { allRows(file: string, sql: string): Promise<unknown[]> };
  convertEso: (esoPath: string) => Promise<string>;
  openDialog: (opts: unknown) => Promise<{ canceled: boolean; filePaths: string[] }>;
  saveDialog: (opts: unknown) => Promise<{ canceled: boolean; filePath?: string }>;
  staticDir: string;
  token: string;
}

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', c => (data += c));
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

function sendJson(res: http.ServerResponse, status: number, value: unknown): void {
  const body = JSON.stringify(value);
  // No Access-Control-Allow-Origin: the page is same-origin; CORS would
  // defeat the Origin guard.
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(body);
}

// Authenticate from headers BEFORE reading the body (an unauthenticated page
// must not be able to force a large POST body as a local DoS).
function authorized(req: http.IncomingMessage, expectedHost: string, token: string): boolean {
  if (req.headers.host !== expectedHost) return false;
  const origin = req.headers.origin;
  if (origin && origin !== `http://${expectedHost}`) return false;
  if (req.headers['x-timestep-token'] !== token) return false;
  return true;
}

export function createServer(deps: ServeDeps): http.Server {
  const server = http.createServer(async (req, res) => {
    const url = (req.url || '/').split('?')[0];
    const expectedHost = `127.0.0.1:${(server.address() as AddressInfo)?.port}`;

    if (url.startsWith('/api/')) {
      if (req.headers.upgrade) return sendJson(res, 400, { error: 'upgrade not supported' });
      if (!authorized(req, expectedHost, deps.token)) return sendJson(res, 403, { error: 'forbidden' });
      try {
        const body = await readBody(req);
        const p = body ? JSON.parse(body) : {};
        return await route(url, p, deps, res);
      } catch (e) {
        return sendJson(res, 500, { error: (e as Error).message });
      }
    }
    return serveStatic(url, deps, res);
  });

  // Reject all WebSocket upgrades outright (the renderer uses fetch).
  server.on('upgrade', (_req, socket) => socket.destroy());
  return server;
}

async function route(url: string, p: Record<string, unknown>, deps: ServeDeps, res: http.ServerResponse): Promise<void> {
  switch (url) {
    case '/api/db/allRows':
      return sendJson(res, 200, await deps.engine.allRows(p.file as string, p.sql as string));
    case '/api/fs/readText':
      return sendJson(res, 200, await fs.promises.readFile(p.path as string, 'utf8'));
    case '/api/fs/writeText':
      await fs.promises.writeFile(p.path as string, p.contents as string);
      return sendJson(res, 200, { ok: true });
    case '/api/fs/exists':
      return sendJson(res, 200, await fs.promises.access(p.path as string).then(() => true, () => false));
    case '/api/dialog/open':
      return sendJson(res, 200, await deps.openDialog(p));
    case '/api/dialog/save':
      return sendJson(res, 200, await deps.saveDialog(p));
    case '/api/eso/convert':
      return sendJson(res, 200, await deps.convertEso(p.path as string));
    default:
      return sendJson(res, 404, { error: 'not found' });
  }
}

// Static serving + per-request token injection into index.html. Placeholder
// is replaced at response time so the on-disk file never holds a live token.
function serveStatic(url: string, deps: ServeDeps, res: http.ServerResponse): void {
  const rel = url === '/' ? 'index.html' : decodeURIComponent(url);
  const file = path.join(deps.staticDir, rel);
  // Prefix match alone would approve a sibling like `<staticDir>-evil`; require
  // an exact dir match or a real path-separator boundary.
  if (file !== deps.staticDir && !file.startsWith(deps.staticDir + path.sep)) {
    res.writeHead(403);
    res.end();
    return;
  }
  fs.readFile(file, (err, buf) => {
    if (err) {
      res.writeHead(404);
      res.end('not found');
      return;
    }
    const ext = path.extname(file);
    const mime: Record<string, string> = {
      '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
      '.ttf': 'font/ttf', '.woff': 'font/woff', '.woff2': 'font/woff2',
      '.svg': 'image/svg+xml', '.map': 'application/json'
    };
    let out: Buffer | string = buf;
    if (rel === 'index.html') out = buf.toString('utf8').replace('__TIMESTEP_TOKEN__', deps.token);
    res.writeHead(200, { 'content-type': mime[ext] || 'application/octet-stream' });
    res.end(out);
  });
}
