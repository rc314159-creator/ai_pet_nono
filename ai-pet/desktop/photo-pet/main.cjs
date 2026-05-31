const { app, BrowserWindow, ipcMain, screen } = require("electron");
const { existsSync } = require("node:fs");
const path = require("node:path");

let petWindow;
let appWindow;
let bubbleWindow;
let dragState;
let bundledApiStarted = false;
let activeBubblePayload;

function configurePackagedRuntime() {
  if (!app.isPackaged) return;

  const dataDir = path.join(app.getPath("userData"), "data");
  const runtimePathParts = ["/opt/homebrew/bin", "/usr/local/bin", process.env.PATH]
    .filter(Boolean)
    .flatMap((value) => String(value).split(path.delimiter))
    .filter(Boolean);
  process.env.PATH = Array.from(new Set(runtimePathParts)).join(path.delimiter);
  process.env.AI_PET_DESKTOP_RUNTIME ||= "desktop/photo-pet";
  process.env.AI_PET_DATA_DIR ||= dataDir;
  process.env.AI_PET_SETTINGS_FILE ||= path.join(dataDir, "settings.json");
  process.env.AI_PET_THREAD_STORE_FILE ||= path.join(dataDir, "thread-store.json");
  process.env.AI_PET_KNOWLEDGE_BASE_FILE ||= path.join(dataDir, "knowledge-base.json");
  process.env.AI_PET_MOCHI_ASSET_ROOT ||= path.join(__dirname, "..", "..", "dist", "assets", "pets", "mochi");
  process.env.VITE_AI_PET_API_BASE_URL ||= "http://127.0.0.1:8788";

  const bundledEnvFile = path.join(process.resourcesPath, ".env");
  if (existsSync(bundledEnvFile)) {
    process.env.AI_PET_ENV_FILE ||= bundledEnvFile;
  }
  if (existsSync(path.join(process.resourcesPath, "opencode.json"))) {
    process.env.AI_PET_OPENCODE_PROJECT_ROOT ||= process.resourcesPath;
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
  hideSpeechBubbleWindow();
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
  petWindow.on("move", syncBubbleWindowPosition);
  petWindow.on("closed", () => {
    if (bubbleWindow && !bubbleWindow.isDestroyed()) bubbleWindow.close();
    bubbleWindow = undefined;
    activeBubblePayload = undefined;
  });
  petWindow.loadFile(path.join(__dirname, "renderer.html"));
  return petWindow;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function textDisplayUnits(text) {
  return Array.from(String(text || "")).reduce((sum, char) => {
    return sum + (/[\x00-\x7F]/.test(char) ? 0.55 : 1);
  }, 0);
}

function estimateBubbleSize(text) {
  const units = textDisplayUnits(text);
  const width = clamp(Math.round(236 + Math.min(units, 56) * 2.1), 260, 340);
  const unitsPerLine = Math.max(13, Math.floor((width - 44) / 15));
  const lineCount = clamp(Math.ceil(Math.max(units, 1) / unitsPerLine), 1, 6);
  const height = clamp(44 + lineCount * 24, 82, 190);
  return { width, height };
}

function getBubbleBounds(text) {
  if (!petWindow || petWindow.isDestroyed()) return undefined;

  const petBounds = petWindow.getBounds();
  const workArea = screen.getDisplayMatching(petBounds).workArea;
  const margin = 12;
  const gap = 8;
  const size = estimateBubbleSize(text);
  const centerX = petBounds.x + petBounds.width / 2;
  const aboveY = petBounds.y - size.height - gap;
  const leftSpace = petBounds.x - workArea.x;
  const rightSpace = workArea.x + workArea.width - (petBounds.x + petBounds.width);

  if (aboveY >= workArea.y + margin) {
    return {
      ...size,
      placement: "above",
      x: Math.round(clamp(centerX - size.width / 2, workArea.x + margin, workArea.x + workArea.width - size.width - margin)),
      y: Math.round(aboveY)
    };
  }

  if (leftSpace >= size.width + gap + margin) {
    return {
      ...size,
      placement: "left",
      x: Math.round(petBounds.x - size.width - gap),
      y: Math.round(clamp(petBounds.y + 22, workArea.y + margin, workArea.y + workArea.height - size.height - margin))
    };
  }

  if (rightSpace >= size.width + gap + margin) {
    return {
      ...size,
      placement: "right",
      x: Math.round(petBounds.x + petBounds.width + gap),
      y: Math.round(clamp(petBounds.y + 22, workArea.y + margin, workArea.y + workArea.height - size.height - margin))
    };
  }

  return {
    ...size,
    placement: "below",
    x: Math.round(clamp(centerX - size.width / 2, workArea.x + margin, workArea.x + workArea.width - size.width - margin)),
    y: Math.round(clamp(petBounds.y + petBounds.height + gap, workArea.y + margin, workArea.y + workArea.height - size.height - margin))
  };
}

function ensureBubbleWindow() {
  if (bubbleWindow && !bubbleWindow.isDestroyed()) return bubbleWindow;

  bubbleWindow = new BrowserWindow({
    width: 320,
    height: 120,
    frame: false,
    transparent: true,
    backgroundColor: "#00000000",
    resizable: false,
    movable: false,
    hasShadow: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    focusable: false,
    show: false,
    title: "AI Pet Speech Bubble",
    webPreferences: {
      preload: path.join(__dirname, "bubble-preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  bubbleWindow.setIgnoreMouseEvents(true, { forward: true });
  bubbleWindow.setAlwaysOnTop(true, "floating");
  bubbleWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  bubbleWindow.webContents.on("did-finish-load", syncBubbleWindowPosition);
  bubbleWindow.on("closed", () => {
    bubbleWindow = undefined;
  });
  bubbleWindow.loadFile(path.join(__dirname, "bubble.html"));
  return bubbleWindow;
}

function syncBubbleWindowPosition() {
  if (!activeBubblePayload?.text || !petWindow || petWindow.isDestroyed() || !petWindow.isVisible()) return;

  const targetWindow = ensureBubbleWindow();
  const bounds = getBubbleBounds(activeBubblePayload.text);
  if (!bounds) return;

  targetWindow.setBounds({
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height
  });

  if (targetWindow.webContents.isLoading()) return;
  targetWindow.webContents.send("desktop-photo-pet-bubble:show", {
    text: activeBubblePayload.text,
    placement: bounds.placement
  });
  targetWindow.showInactive();
  targetWindow.moveTop();
}

function showSpeechBubbleWindow(payload) {
  const text = typeof payload?.text === "string" ? payload.text.trim() : "";
  if (!text || !petWindow || petWindow.isDestroyed() || !petWindow.isVisible()) return;

  activeBubblePayload = { text };
  syncBubbleWindowPosition();
}

function hideSpeechBubbleWindow() {
  activeBubblePayload = undefined;
  if (!bubbleWindow || bubbleWindow.isDestroyed()) return;
  if (!bubbleWindow.webContents.isLoading()) {
    bubbleWindow.webContents.send("desktop-photo-pet-bubble:hide");
  }
  bubbleWindow.hide();
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
  syncBubbleWindowPosition();
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

ipcMain.on("desktop-photo-pet:show-bubble", (_event, payload) => {
  showSpeechBubbleWindow(payload);
});

ipcMain.on("desktop-photo-pet:hide-bubble", () => {
  hideSpeechBubbleWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
