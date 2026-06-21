import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeDialogs } from './dialog.ts';

test('linux uses kdialog when present, sanitizes output', async () => {
  const seen: { cmd: string; args: string[] }[] = [];
  const run = async (cmd: string, args: string[]) => { seen.push({ cmd, args }); return '/home/me/run/eplusout.sql\n'; };
  const d = makeDialogs(run, 'linux', c => c === 'kdialog');
  const res = await d.openDialog({ properties: ['openFile'] });
  assert.deepEqual(res, { canceled: false, filePaths: ['/home/me/run/eplusout.sql'] });
  assert.equal(seen[0].cmd, 'kdialog');
});

test('linux falls back to zenity when kdialog absent', async () => {
  const run = async () => '/x/a.sql';
  const d = makeDialogs(run, 'linux', c => c === 'zenity');
  assert.equal((await d.openDialog({})).filePaths[0], '/x/a.sql');
});

test('user cancel (empty output / nonzero) -> canceled', async () => {
  const run = async () => { throw Object.assign(new Error('cancel'), { code: 1 }); };
  const d = makeDialogs(run, 'linux', () => true);
  assert.deepEqual(await d.openDialog({}), { canceled: true, filePaths: [] });
});

test('no dialog tool -> structured error', async () => {
  const d = makeDialogs(async () => '', 'linux', () => false);
  await assert.rejects(d.openDialog({}), /no file dialog tool/i);
});

test('macOS uses osascript', async () => {
  const seen: string[] = [];
  const run = async (cmd: string) => { seen.push(cmd); return '/Users/me/x.sql'; };
  const d = makeDialogs(run, 'darwin', () => true);
  await d.openDialog({});
  assert.equal(seen[0], 'osascript');
});

test('multiSelections returns all chosen paths', async () => {
  const run = async () => '/x/a.sql\n/x/b.sql\n';
  const d = makeDialogs(run, 'linux', c => c === 'zenity');
  const res = await d.openDialog({ properties: ['multiSelections'] });
  assert.deepEqual(res.filePaths, ['/x/a.sql', '/x/b.sql']);
});

test('windows uses powershell', async () => {
  const seen: string[] = [];
  const run = async (cmd: string) => { seen.push(cmd); return 'C:\\Users\\me\\x.sql'; };
  const d = makeDialogs(run, 'win32', () => true);
  const res = await d.openDialog({});
  assert.match(seen[0], /powershell|pwsh/);
  assert.equal(res.filePaths[0], 'C:\\Users\\me\\x.sql');
});
