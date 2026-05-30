const { app, BrowserWindow, ipcMain, screen } = require("electron");
const { existsSync } = require("node:fs");
const path = require("node:path");

let petWindow;
let appWindow;
let dragState;

function createPetWindow() {
  const workArea = screen.getPrimaryDisplay().workArea;
  const width = 320;
  const height = 320;

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

function createAppWindow(targetView = "chat") {
  if (appWindow && !appWindow.isDestroyed()) {
    if (appWindow.isMinimized()) appWindow.restore();
    appWindow.show();
    appWindow.focus();
    appWindow.webContents.send("ai-pet:navigate", targetView);
    return;
  }

  const workArea = screen.getPrimaryDisplay().workArea;
  const width = 430;
  const height = Math.min(932, workArea.height - 40);

  appWindow = new BrowserWindow({
    width,
    height,
    minWidth: 390,
    minHeight: 760,
    x: Math.max(workArea.x + 20, workArea.x + workArea.width - width - 36),
    y: Math.max(workArea.y + 20, workArea.y + 24),
    title: "AI Pet",
    backgroundColor: "#fff7ef",
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  appWindow.once("ready-to-show", () => {
    appWindow?.show();
    appWindow?.focus();
  });
  appWindow.on("closed", () => {
    appWindow = undefined;
  });

  const explicitUrl = process.env.AI_PET_APP_URL;
  const devUrl = `http://127.0.0.1:5180/?view=${encodeURIComponent(targetView)}`;
  const distIndex = path.join(__dirname, "..", "dist", "index.html");

  if (explicitUrl) {
    appWindow.loadURL(`${explicitUrl}${explicitUrl.includes("?") ? "&" : "?"}view=${encodeURIComponent(targetView)}`);
  } else if (existsSync(distIndex)) {
    appWindow.loadFile(distIndex, { query: { view: targetView } });
  } else {
    appWindow.loadURL(devUrl);
  }
}

function startDrag(point) {
  if (!petWindow || petWindow.isDestroyed()) return;
  dragState = {
    pointer: point,
    bounds: petWindow.getBounds()
  };
}

function moveDrag(point) {
  if (!petWindow || petWindow.isDestroyed() || !dragState) return;

  const dx = Math.round(point.x - dragState.pointer.x);
  const dy = Math.round(point.y - dragState.pointer.y);
  petWindow.setBounds({
    ...dragState.bounds,
    x: dragState.bounds.x + dx,
    y: dragState.bounds.y + dy
  });
}

function endDrag() {
  dragState = undefined;
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

ipcMain.on("desktop-photo-pet:open-app-window", (_event, targetView) => {
  createAppWindow(typeof targetView === "string" ? targetView : "chat");
});

ipcMain.on("desktop-photo-pet:drag-start", (_event, point) => {
  startDrag(point);
});

ipcMain.on("desktop-photo-pet:drag-move", (_event, point) => {
  moveDrag(point);
});

ipcMain.on("desktop-photo-pet:drag-end", () => {
  endDrag();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
