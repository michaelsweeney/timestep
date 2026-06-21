import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

type RunFn = (cmd: string, args: string[]) => Promise<string>;

// Default runner: spawn with an ARGUMENT ARRAY (never a shell string) so paths
// and titles can't be injected. Resolves stdout; rejects on nonzero exit.
const defaultRun: RunFn = (cmd, args) =>
  new Promise((resolve, reject) => {
    execFile(cmd, args, { maxBuffer: 1 << 20 }, (err, stdout) => {
      if (err) return reject(err);
      resolve(stdout);
    });
  });

function defaultHasCmd(cmd: string): boolean {
  const dirs = (process.env.PATH || '').split(path.delimiter);
  const exts = process.platform === 'win32' ? ['.exe', '.cmd', '.bat', ''] : [''];
  return dirs.some(dir => exts.some(ext => { try { return existsSync(path.join(dir, cmd + ext)); } catch { return false; } }));
}

// Split on newlines, trim CR/whitespace, drop empties. Handles single- and
// multi-select output uniformly (each tool emits newline-separated paths).
function parsePaths(stdout: string): string[] {
  return stdout.split('\n').map(s => s.replace(/\r$/, '').trim()).filter(Boolean);
}

export function makeDialogs(
  run: RunFn = defaultRun,
  platform: NodeJS.Platform = process.platform,
  hasCmd: (c: string) => boolean = defaultHasCmd
) {
  // Returns chosen paths (possibly several), or [] on cancel. Throws only when
  // no dialog tool exists.
  async function pick(mode: 'open' | 'save', multi: boolean, defaultPath?: string): Promise<string[]> {
    let cmd: string;
    let args: string[];
    if (platform === 'darwin') {
      cmd = 'osascript';
      if (mode === 'save') {
        args = ['-e', 'POSIX path of (choose file name)'];
      } else if (multi) {
        // Return one POSIX path per line for the selected files.
        args = ['-e', 'set fs to choose file with multiple selections allowed', '-e',
          'set out to ""', '-e', 'repeat with f in fs', '-e',
          'set out to out & POSIX path of f & linefeed', '-e', 'end repeat', '-e', 'return out'];
      } else {
        args = ['-e', 'POSIX path of (choose file)'];
      }
    } else if (platform === 'win32') {
      cmd = 'powershell';
      const dlg = mode === 'open' ? 'OpenFileDialog' : 'SaveFileDialog';
      const multiLine = mode === 'open' && multi ? '$f.Multiselect = $true; ' : '';
      const out = mode === 'open' && multi ? '$f.FileNames -join "`n"' : '$f.FileName';
      args = ['-NoProfile', '-Command',
        `Add-Type -AssemblyName System.Windows.Forms; $f = New-Object System.Windows.Forms.${dlg}; ${multiLine}if ($f.ShowDialog() -eq 'OK') { ${out} }`];
    } else if (hasCmd('kdialog')) {
      cmd = 'kdialog';
      if (mode === 'save') args = ['--getsavefilename', defaultPath || ''];
      else args = multi ? ['--getopenfilename', '--multiple', '--separate-output'] : ['--getopenfilename'];
    } else if (hasCmd('zenity')) {
      cmd = 'zenity';
      if (mode === 'save') args = ['--file-selection', '--save', '--confirm-overwrite'];
      else args = multi ? ['--file-selection', '--multiple', '--separator', '\n'] : ['--file-selection'];
    } else {
      throw new Error('No file dialog tool found. Install zenity or kdialog.');
    }
    try {
      return parsePaths(await run(cmd, args));
    } catch {
      return []; // user cancel / nonzero exit
    }
  }

  return {
    async openDialog(opts: unknown) {
      const o = (opts ?? {}) as { properties?: string[] };
      const multi = Array.isArray(o.properties) && o.properties.includes('multiSelections');
      const paths = await pick('open', multi, undefined);
      return paths.length ? { canceled: false, filePaths: paths } : { canceled: true, filePaths: [] };
    },
    async saveDialog(opts: unknown) {
      const o = (opts ?? {}) as { defaultPath?: string };
      const paths = await pick('save', false, o.defaultPath || path.join(os.homedir(), 'timestep.tss'));
      return paths.length ? { canceled: false, filePath: paths[0] } : { canceled: true };
    }
  };
}
