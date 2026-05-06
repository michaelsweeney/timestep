// Preload script. Runs in an isolated context with Node access; the renderer
// runs with nodeIntegration: false and contextIsolation: true. This is the
// only bridge between them — keep the surface narrow.
//
// Plain JS on purpose so no extra build step is needed; the renderer-side
// type definitions live in app/src/types/electron-api.d.ts.

const {
  contextBridge,
  ipcRenderer,
  clipboard,
  shell,
  webUtils
} = require('electron');

contextBridge.exposeInMainWorld('api', {
  dialog: {
    openFiles: opts => ipcRenderer.invoke('dialog:openFiles', opts),
    saveFile: opts => ipcRenderer.invoke('dialog:saveFile', opts)
  },
  fs: {
    readText: path => ipcRenderer.invoke('fs:readText', path),
    writeText: (path, contents) =>
      ipcRenderer.invoke('fs:writeText', path, contents),
    exists: path => ipcRenderer.invoke('fs:exists', path)
  },
  db: {
    allRows: (file, sql) => ipcRenderer.invoke('db:allRows', file, sql)
  },
  clipboard: {
    writeText: text => clipboard.writeText(text)
  },
  shell: {
    openExternal: url => shell.openExternal(url)
  },
  // Replaces File.path (removed in Electron 32+). Pass a File object,
  // get its absolute filesystem path back synchronously.
  getPathForFile: file => webUtils.getPathForFile(file)
});
