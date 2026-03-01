const { app, BrowserWindow, powerSaveBlocker } = require("electron");
const path = require("path");

let mainWindow;
let powerBlockerId;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "Tuck Shop POS",
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // ✅ AUTO-APPROVE USB SERIAL DEVICES (Scanner)
  mainWindow.webContents.session.on(
    "select-serial-port",
    (event, portList, webContents, callback) => {
      event.preventDefault();

      if (portList && portList.length > 0) {
        callback(portList[0].portId);
      } else {
        callback("");
      }
    }
  );

  mainWindow.webContents.session.setPermissionCheckHandler(() => {
    return true;
  });

  mainWindow.webContents.session.setDevicePermissionHandler(() => {
    return true;
  });

  // ✅ DEV vs PRODUCTION
  if (!app.isPackaged) {
    // Vite dev server
    mainWindow.loadURL("http://localhost:5173");
  } else {
    // Built app
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  // ✅ Prevent system sleep (POS machines shouldn't sleep)
  powerBlockerId = powerSaveBlocker.start("prevent-display-sleep");

  mainWindow.maximize();
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (powerBlockerId) {
    powerSaveBlocker.stop(powerBlockerId);
  }

  if (process.platform !== "darwin") {
    app.quit();
  }
});
