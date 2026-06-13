/* eslint global-require: off, no-console: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `yarn build` or `yarn build-main`, this file is compiled to
 * `./app/main.prod.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { app, BrowserWindow } from 'electron';
import MenuBuilder from './menu';
import { registerIpcHandlers } from './ipc-handlers';
import installExtension, {
  REDUX_DEVTOOLS,
  REACT_DEVELOPER_TOOLS
} from 'electron-devtools-installer';

let mainWindow: BrowserWindow | null = null;

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDevBuild =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

const installExtensions = async () => {
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = [REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS];

  return Promise.all(
    extensions.map(name => installExtension(name, { forceDownload }))
  ).catch(console.log);
};

const createWindow = async () => {
  if (
    process.env.NODE_ENV === 'development' ||
    process.env.DEBUG_PROD === 'true'
  ) {
    await installExtensions();
  }

  mainWindow = new BrowserWindow({
    title: 'timestep',
    show: false,
    width: 1024,
    height: 728,
    minWidth: 400,
    minHeight: 400,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      // sandbox: false is the current default. Kept explicit because the
      // preload uses webUtils.getPathForFile which is unavailable in a
      // sandboxed context. Tightening to true is a future hardening step.
      sandbox: false,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: __dirname + '/resources/Icon.icns'
  });

  // Pass dev-mode info to the HTML via query string — the renderer can no
  // longer read process.env directly with contextIsolation: true.
  const isDev =
    process.env.NODE_ENV === 'development' || !!process.env.START_HOT;
  const port = process.env.PORT || 1212;
  const search = isDev ? `?dev=1&port=${port}` : '';
  // In dev, load app.html from the dev server so the document and the
  // renderer bundle share the http://localhost:PORT origin. Chromium's
  // Local Network Access blocks file:// → http://localhost script loads,
  // which 403's the renderer in DevTools. Prod loads both HTML and
  // renderer.prod.js via file:// from inside the asar (same origin).
  const targetUrl = isDev
    ? `http://localhost:${port}/app.html${search}`
    : `file://${__dirname}/app.html`;
  mainWindow.loadURL(targetUrl);

  // @TODO: Use 'ready-to-show' event
  //        https://github.com/electron/electron/blob/master/docs/api/browser-window.md#using-ready-to-show-event
  mainWindow.webContents.on('did-finish-load', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
      mainWindow.focus();
      if (isDevBuild) {
        mainWindow.webContents.openDevTools();
      }
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();
};

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

registerIpcHandlers();

app.on('ready', createWindow);

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) createWindow();
});
