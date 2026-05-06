import { ipcMain, dialog, BrowserWindow } from 'electron';
import fs from 'fs';
import sqlite3 from 'sqlite3';

// Keep one Database handle per file so we don't re-open on every query.
const dbCache = new Map<string, sqlite3.Database>();

function getDb(file: string): sqlite3.Database {
  let db = dbCache.get(file);
  if (!db) {
    db = new sqlite3.Database(file, sqlite3.OPEN_READONLY);
    dbCache.set(file, db);
  }
  return db;
}

function allRows(file: string, sql: string): Promise<unknown[]> {
  return new Promise((resolve, reject) => {
    getDb(file).all(sql, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

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
    return allRows(file, sql);
  });
}
