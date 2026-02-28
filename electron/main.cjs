const { app, BrowserWindow, powerSaveBlocker } = require('electron');
const path = require('path');

let mainWindow;
let powerBlockerId;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280, height: 800, title: "Tuck Shop POS", autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // 👉 AUTOMATICALLY APPROVE USB SCANNER REQUESTS
  mainWindow.webContents.session.on('select-serial-port', (event, portList, webContents, callback) => {
    event.preventDefault();
    if (portList && portList.length > 0) {
      callback(portList[0].portId); // Auto-connect to the first USB serial device
    } else {
      callback(''); // Fail if no scanner is plugged in
    }
  });

  mainWindow.webContents.session.setPermissionCheckHandler((webContents, permission) => {
    return true; // Allow serial permissions
  });

  mainWindow.webContents.session.setDevicePermissionHandler((details) => {
    return true; // Allow serial device access
  });

  const isDev = process.env.NODE_ENV !== 'production';
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // 👉 PREVENT SLEEP
  powerBlockerId = powerSaveBlocker.start('prevent-display-sleep');
  mainWindow.maximize();
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
  if (powerBlockerId) powerSaveBlocker.stop(powerBlockerId);
});