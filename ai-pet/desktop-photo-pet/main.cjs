const { app, BrowserWindow, ipcMain, screen } = require("electron");
const path = require("node:path");

let petWindow;

function createPetWindow() {
  const workArea = screen.getPrimaryDisplay().workArea;
  const width = 520;
  const height = 520;

  petWindow = new BrowserWindow({
    width,
    height,
    x: Math.max(workArea.x + 20, workArea.x + workArea.width - width - 56),
    y: Math.max(workArea.y + 20, workArea.y + workArea.height - height - 72),
    frame: false,
    transparent: true,
    backgroundColor: "#00000000",
    resizable: false,
    movable: true,
    hasShadow: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    title: "AI Pet Photo Desktop Pet",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  petWindow.setAlwaysOnTop(true, "floating");
  petWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  petWindow.loadFile(path.join(__dirname, "renderer.html"));
}

app.whenReady().then(() => {
  app.dock?.hide();
  createPetWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createPetWindow();
  });
});

ipcMain.on("desktop-photo-pet:close", () => {
  petWindow?.close();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
