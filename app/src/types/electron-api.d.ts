// Type declarations for the contextBridge surface exposed in app/preload.js.
// Keep in sync with that file.

interface OpenDialogOptions {
  title?: string;
  defaultPath?: string;
  buttonLabel?: string;
  filters?: { name: string; extensions: string[] }[];
  properties?: string[];
}

interface OpenDialogResult {
  canceled: boolean;
  filePaths: string[];
}

interface SaveDialogOptions {
  title?: string;
  defaultPath?: string;
  buttonLabel?: string;
  filters?: { name: string; extensions: string[] }[];
}

interface SaveDialogResult {
  canceled: boolean;
  filePath?: string;
}

interface ElectronApi {
  dialog: {
    openFiles(opts: OpenDialogOptions): Promise<OpenDialogResult>;
    saveFile(opts: SaveDialogOptions): Promise<SaveDialogResult>;
  };
  fs: {
    readText(path: string): Promise<string>;
    writeText(path: string, contents: string): Promise<void>;
    exists(path: string): Promise<boolean>;
  };
  db: {
    allRows(file: string, sql: string): Promise<unknown[]>;
  };
  clipboard: {
    writeText(text: string): void;
  };
  shell: {
    openExternal(url: string): Promise<void>;
  };
}

declare global {
  interface Window {
    api: ElectronApi;
  }
}

export {};
