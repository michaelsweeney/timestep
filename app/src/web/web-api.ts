// Browser implementation of the `window.api` bridge that the desktop app
// exposes from app/preload.js. The renderer is identical in both builds and
// only ever touches `window.api`; installing this before the app boots makes
// the whole UI run in a plain browser tab. Surfaces map to web primitives:
//
//   dialog.openFiles -> a hidden <input type=file> picker
//   dialog.saveFile  -> a chosen filename; the actual write is a download
//   fs.readText      -> read a registered File's text (.tss, .bnd)
//   fs.writeText     -> trigger a Blob download (session .tss, CSV export)
//   fs.exists        -> is a File registered under this key (.bnd sibling)
//   db.allRows       -> query the in-tab sql.js database
//   eso.convertToSql -> parse + materialize an .eso to sql.js
//   clipboard/shell  -> navigator.clipboard / window.open
//   getPathForFile   -> register a dropped File, return its name as the key

import {
  registerFile,
  hasFile,
  readFileText,
  allRows,
  convertEso
} from './registry';

interface DialogFilter {
  name: string;
  extensions: string[];
}
interface OpenOpts {
  filters?: DialogFilter[];
  properties?: string[];
}
interface SaveOpts {
  defaultPath?: string;
  filters?: DialogFilter[];
}

// Build an <input accept> string from electron-style filters, skipping the
// "*" catch-all so the picker doesn't over-restrict.
function acceptFromFilters(filters?: DialogFilter[]): string {
  if (!filters) return '';
  const exts = filters
    .flatMap(f => f.extensions)
    .filter(e => e && e !== '*')
    .map(e => `.${e}`);
  return Array.from(new Set(exts)).join(',');
}

function pickFiles(opts: OpenOpts): Promise<{
  canceled: boolean;
  filePaths: string[];
}> {
  return new Promise(resolve => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = acceptFromFilters(opts.filters);
    input.multiple = !!opts.properties?.includes('multiSelections');
    input.style.display = 'none';

    let settled = false;
    const done = (filePaths: string[]) => {
      if (settled) return;
      settled = true;
      input.remove();
      resolve({ canceled: filePaths.length === 0, filePaths });
    };

    input.addEventListener('change', () => {
      const list = input.files ? Array.from(input.files) : [];
      done(list.map(registerFile));
    });
    // Modern browsers fire 'cancel' when the picker is dismissed.
    input.addEventListener('cancel', () => done([]));

    document.body.appendChild(input);
    input.click();
  });
}

// The renderer's two-step save (pick a path, then writeText to it) maps onto
// a single browser download: saveFile just returns a default filename, and
// writeText turns that name + contents into a download.
function defaultSaveName(opts: SaveOpts): string {
  if (opts.defaultPath) return opts.defaultPath.split(/[\\/]/).pop() as string;
  const ext = opts.filters?.[0]?.extensions?.[0] ?? 'txt';
  return `timestep.${ext}`;
}

function downloadText(name: string, contents: string): void {
  const blob = new Blob([contents], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name.split(/[\\/]/).pop() as string;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke after the click has had a chance to start the download.
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function installWebApi(): void {
  const api = {
    dialog: {
      openFiles: (opts: OpenOpts) => pickFiles(opts || {}),
      saveFile: (opts: SaveOpts) =>
        Promise.resolve({ canceled: false, filePath: defaultSaveName(opts || {}) })
    },
    fs: {
      readText: (path: string) => readFileText(path),
      writeText: (path: string, contents: string) => {
        downloadText(path, contents);
        return Promise.resolve();
      },
      exists: (path: string) => Promise.resolve(hasFile(path))
    },
    db: {
      allRows: (file: string, sql: string) => allRows(file, sql)
    },
    eso: {
      convertToSql: (path: string) => convertEso(path)
    },
    clipboard: {
      writeText: (text: string) => {
        navigator.clipboard?.writeText(text);
      }
    },
    shell: {
      openExternal: (url: string) => {
        window.open(url, '_blank', 'noopener,noreferrer');
        return Promise.resolve();
      }
    },
    getPathForFile: (file: File) => registerFile(file)
  };

  (window as unknown as { api: typeof api }).api = api;
}
