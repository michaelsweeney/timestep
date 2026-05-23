import fs from 'fs';
import sqlite3 from 'sqlite3';
import type { Engine } from './types';

// Caches one read-only Database handle per file path so repeated queries
// against the same .sql don't reopen the file. Handles live for the
// process lifetime — fine for the current "open file, view it, quit"
// usage; revisit if/when we add a Close button.
export class Sqlite3Engine implements Engine {
  private dbs = new Map<string, sqlite3.Database>();

  private getDb(file: string): sqlite3.Database {
    let db = this.dbs.get(file);
    if (!db) {
      db = new sqlite3.Database(file, sqlite3.OPEN_READONLY);
      this.dbs.set(file, db);
    }
    return db;
  }

  allRows(file: string, sql: string): Promise<unknown[]> {
    return new Promise((resolve, reject) => {
      this.getDb(file).all(sql, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  readText(path: string): Promise<string> {
    return fs.promises.readFile(path, 'utf8');
  }
}
