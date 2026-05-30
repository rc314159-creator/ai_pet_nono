const { app, BrowserWindow, ipcMain, screen } = require("electron");
const { existsSync } = require("node:fs");
const path = require("node:path");

let petWindow;
let appWindow;
let dragState;
let bundledApiStarted = false;

function configurePackagedRuntime() {
  if (!app.isPackaged) return;

  const dataDir = path.join(app.getPath("userData"), "data");
  process.env.AI_PET_DESKTOP_RUNTIME ||= "desktop/photo-pet";
  process.env.AI_PET_DATA_DIR ||= dataDir;
  process.env.AI_PET_THREAD_STORE_FILE ||= path.join(dataDir, "thread-store.json");
  process.env.AI_PET_KNOWLEDGE_BASE_FILE ||= path.join(dataDir, "knowledge-base.json");
  process.env.AI_PET_MOCHI_ASSET_ROOT ||= path.join(__dirname, "..", "..", "dist", "assets", "pets", "mochi");
  process.env.VITE_AI_PET_API_BASE_URL ||= "http://127.0.0.1:8788";

  const bundledEnvFile = path.join(process.resourcesPath, ".env");
  if (existsSync(bundledEnvFile)) {
    process.env.AI_PET_ENV_FILE ||= bundledEnvFile;
  }
}

function startBundledApi() {
  if (!app.isPackaged || bundledApiStarted || process.env.AI_PET_SKIP_BUNDLED_API === "1") return;

  const serverEntry = path.join(__dirname, "..", "..", "build", "server", "index.cjs");
  if (!existsSync(serverEntry)) {
    console.warn(`AI Pet bundled API entry not found: ${serverEntry}`);
    return;
  }

  bundledApiStarted = true;
  require(serverEntry);
}

function hidePetWindowForAppWindow() {
  if (!petWindow || petWindow.isDestroyed()) return;
  petWindow.hide();
}

function notifyPetWindowAppClosed() {
  if (!petWindow || petWindow.isDestroyed()) return;

  const sendNotice = () => {
    if (!petWindow || petWindow.isDestroyed()) return;
    petWindow.webContents.send("desktop-photo-pet:app-window-closed");
  };

  if (petWindow.webContents.isLoading()) {
    petWindow.webContents.once("did-finish-load", sendNotice);
    return;
  }

  sendNotice();
}

function restorePetWindowAfterAppWindow() {
  if (!petWindow || petWindow.isDestroyed()) createPetWindow();
  if (!petWindow || petWindow.isDestroyed()) return;

  if (petWindow.isMinimized()) petWindow.restore();
  petWindow.setAlwaysOnTop(true, "floating");
  petWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  petWindow.showInactive();
  petWindow.moveTop();
  notifyPetWindowAppClosed();
}

function installAppWindowCloseOverlay(targetWindow) {
  if (!targetWindow || targetWindow.isDestroyed()) return;
  targetWindow.webContents
    .executeJavaScript(`
      (() => {
        if (document.getElementById("ai-pet-window-close-overlay")) return;
        const style = document.createElement("style");
        style.id = "ai-pet-window-close-overlay-style";
        style.textContent = [
          "#ai-pet-window-close-overlay {",
          "  position: fixed;",
          "  top: 18px;",
          "  left: 22px;",
          "  z-index: 2147483647;",
          "  display: grid;",
          "  width: 42px;",
          "  height: 42px;",
          "  place-items: center;",
          "  border: 0;",
          "  border-radius: 50%;",
          "  background: rgba(255, 255, 255, 0.94);",
          "  color: #7d7b75;",
          "  box-shadow: 0 8px 28px rgba(74, 55, 44, 0.12);",
          "  font: 32px/1 Avenir Next, PingFang SC, sans-serif;",
          "  cursor: pointer;",
          "  -webkit-app-region: no-drag;",
          "}",
          "#ai-pet-window-close-overlay:hover { color: #e66e52; }"
        ].join("\\n");
        const button = document.createElement("button");
        button.id = "ai-pet-window-close-overlay";
        button.type = "button";
        button.setAttribute("aria-label", "关闭应用窗口");
        button.textContent = "×";
        button.addEventListener("click", () => window.aiPetAppWindow?.close?.());
        document.head.appendChild(style);
        document.body.appendChild(button);
      })();
    `)
    .catch(() => {
      // The renderer may have navigated or closed between load and injection.
    });
}

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
  return petWindow;
}

function createAppWindow(targetView = "welcome") {
  hidePetWindowForAppWindow();

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
  const appWindowPartition = `ai-pet-app-window-${Date.now()}`;

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
      preload: path.join(__dirname, "app-preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      partition: appWindowPartition
    }
  });

  appWindow.once("ready-to-show", () => {
    hidePetWindowForAppWindow();
    installAppWindowCloseOverlay(appWindow);
    appWindow?.show();
    appWindow?.focus();
  });
  appWindow.webContents.on("did-finish-load", () => installAppWindowCloseOverlay(appWindow));
  appWindow.on("close", () => {
    restorePetWindowAfterAppWindow();
  });
  appWindow.on("hide", () => {
    if (!appWindow || appWindow.isDestroyed()) restorePetWindowAfterAppWindow();
  });
  appWindow.on("closed", () => {
    appWindow = undefined;
    restorePetWindowAfterAppWindow();
  });

  const explicitUrl = process.env.AI_PET_APP_URL;
  const cacheBust = String(Date.now());
  const rendererRoot = "http://127.0.0.1:5180/";
  const devUrl = `http://127.0.0.1:5180/?view=${encodeURIComponent(targetView)}&build=${encodeURIComponent(cacheBust)}`;
  const distIndex = path.join(__dirname, "..", "..", "dist", "index.html");
  const shouldLoadDist = app.isPackaged || process.env.AI_PET_LOAD_DIST === "1";
  const loadDist = () => {
    if (!appWindow || appWindow.isDestroyed()) return Promise.resolve();
    return appWindow.loadFile(distIndex, { query: { view: targetView, build: cacheBust } });
  };
  const loadDev = () => {
    if (!appWindow || appWindow.isDestroyed()) return Promise.resolve();
    return appWindow.loadURL(devUrl);
  };
  const loadDistOrDev = () => (existsSync(distIndex) ? loadDist() : loadDev());

  if (explicitUrl) {
    appWindow.loadURL(
      `${explicitUrl}${explicitUrl.includes("?") ? "&" : "?"}view=${encodeURIComponent(targetView)}&build=${encodeURIComponent(cacheBust)}`
    );
  } else if (shouldLoadDist && existsSync(distIndex)) {
    loadDist();
  } else {
    loadDev().catch(loadDistOrDev);
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
  configurePackagedRuntime();
  startBundledApi();
  app.dock?.hide();
  createPetWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createPetWindow();
    if (!appWindow || appWindow.isDestroyed()) restorePetWindowAfterAppWindow();
  });
});

ipcMain.on("desktop-photo-pet:close", () => {
  petWindow?.close();
});

ipcMain.on("desktop-photo-pet:open-app-window", (_event, targetView) => {
  createAppWindow(typeof targetView === "string" ? targetView : "welcome");
});

ipcMain.on("ai-pet-app-window:close", (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  restorePetWindowAfterAppWindow();
  window?.close();
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
