const { app, BrowserWindow, powerSaveBlocker } = require('electron');
const path = require('path');

let mainWindow;
let powerBlockerId;

function createWindow() {
  // Create the desktop window
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "Tuck Shop POS",
    autoHideMenuBar: true, // Hides the annoying top menu bar (File, Edit, View, etc.)
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // Check if we are running in development mode
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    // In dev, load the Vite local server
    mainWindow.loadURL('http://localhost:5173');
  } else {
    // In production, load the built React files
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // 👉 NATIVE SLEEP PREVENTION 
  // This physically blocks the OS from turning off the screen or sleeping
  powerBlockerId = powerSaveBlocker.start('prevent-display-sleep');
  console.log('Power Save Blocker active. ID:', powerBlockerId);

  // Optional: Maximize the window automatically
  mainWindow.maximize();
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
  // Stop blocking sleep when the app is closed
  if (powerBlockerId) {
    powerSaveBlocker.stop(powerBlockerId);
  }
});