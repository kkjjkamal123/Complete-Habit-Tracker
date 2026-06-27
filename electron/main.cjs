// DailyTrack desktop (Electron) main process.
//
// Loads the same web build that ships to web/Android, but in a native window.
// All data lives in localStorage, which Electron persists to the app's own
// user-data folder on disk — so the desktop app is fully local-first and works
// offline; cloud sync stays optional (your own Firebase).
//
// Why a tiny local HTTP server instead of loadFile()? Firebase Authentication
// refuses to run over file:// (auth/operation-not-supported-in-this-environment),
// so Google sign-in was dead in the desktop build. Serving the build over
// http://localhost gives it a real web origin — and `localhost` is an
// authorised domain in Firebase by default — so popup/redirect sign-in works.
const { app, BrowserWindow, shell } = require('electron');
const http = require('node:http');
const path = require('node:path');
const fs = require('node:fs');

const DIST = path.join(__dirname, '..', 'dist');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.txt': 'text/plain; charset=utf-8',
};

function serveFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
      return;
    }
    const type = MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type });
    res.end(data);
  });
}

/** Start a loopback static server for dist/. Resolves with the chosen port.
 *  Unknown routes fall back to index.html so BrowserRouter deep links and the
 *  Firebase OAuth redirect return both resolve. */
function startServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
      const filePath = path.join(DIST, urlPath);

      // Never serve anything outside dist/.
      if (filePath !== DIST && !filePath.startsWith(DIST + path.sep)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('Forbidden');
        return;
      }

      fs.stat(filePath, (err, stat) => {
        if (!err && stat.isFile()) serveFile(res, filePath);
        else serveFile(res, path.join(DIST, 'index.html')); // SPA fallback
      });
    });
    server.on('error', reject);
    // Bind to loopback only; connect via `localhost` so the page origin's
    // hostname is `localhost` (Firebase's default authorised domain).
    server.listen(0, '127.0.0.1', () => {
      resolve(server.address().port);
    });
  });
}

function createWindow(port) {
  const win = new BrowserWindow({
    width: 1180,
    height: 820,
    minWidth: 380,
    minHeight: 560,
    backgroundColor: '#0e0e12',
    title: 'DailyTrack',
    autoHideMenuBar: true,
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadURL(`http://localhost:${port}/`);

  // Let a Firebase Google sign-in popup open as a child window; send every
  // other external link to the user's real browser instead of trapping it.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/accounts\.google\.com|firebaseapp\.com|\/__\/auth/.test(url)) {
      return { action: 'allow' };
    }
    void shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(async () => {
  let port;
  try {
    port = await startServer();
  } catch (err) {
    console.error('Failed to start local server:', err);
    app.quit();
    return;
  }
  createWindow(port);
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow(port);
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
