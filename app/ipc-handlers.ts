import { ipcMain, dialog, BrowserWindow } from 'electron';
import fs from 'fs';
import { Sqlite3Engine } from '@timestep/core/sqlite3';

const engine = new Sqlite3Engine();

export function registerIpcHandlers(): void {
  ipcMain.handle('dialog:openFiles', async (event, opts) => {
    const sender = BrowserWindow.fromWebContents(event.sender) || undefined;
    return dialog.showOpenDialog(sender as BrowserWindow, opts);
  });

  ipcMain.handle('dialog:saveFile', async (event, opts) => {
    const sender = BrowserWindow.fromWebContents(event.sender) || undefined;
    return dialog.showSaveDialog(sender as BrowserWindow, opts);
  });

  ipcMain.handle('fs:readText', async (_event, path: string) => {
    return fs.promises.readFile(path, 'utf8');
  });

  ipcMain.handle(
    'fs:writeText',
    async (_event, path: string, contents: string) => {
      await fs.promises.writeFile(path, contents);
    }
  );

  ipcMain.handle('fs:exists', async (_event, path: string) => {
    try {
      await fs.promises.access(path);
      return true;
    } catch {
      return false;
    }
  });

  ipcMain.handle('db:allRows', async (_event, file: string, sql: string) => {
    return engine.allRows(file, sql);
  });
}
