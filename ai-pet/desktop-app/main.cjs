const { app, BrowserWindow, ipcMain } = require("electron");
const { existsSync } = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const DEFAULT_RENDERER_URL = "http://127.0.0.1:5180";
let mainWindow;

app.setName("AI Pet Application Window");
app.setPath("userData", path.join(os.tmpdir(), "ai-pet-application-window"));

async function waitForRenderer(url, attempts = 80) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return true;
    } catch {
      // Vite is still booting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  return false;
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

async function createMainWindow() {
  const rendererUrl = process.env.AI_PET_RENDERER_URL || DEFAULT_RENDERER_URL;
  const distIndex = path.join(__dirname, "../dist/index.html");

  mainWindow = new BrowserWindow({
    width: 430,
    height: 932,
    minWidth: 390,
    minHeight: 844,
    title: "AI Pet",
    frame: false,
    backgroundColor: "#eef4f1",
    show: true,
    center: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      partition: `ai-pet-application-window-${Date.now()}`
    }
  });
  mainWindow.setAspectRatio(430 / 932);

  const revealWindow = () => {
    installAppWindowCloseOverlay(mainWindow);
    mainWindow?.show();
    mainWindow?.focus();
    console.log("AI Pet application window visible", {
      visible: mainWindow?.isVisible(),
      focused: mainWindow?.isFocused(),
      bounds: mainWindow?.getBounds()
    });
  };

  mainWindow.once("ready-to-show", revealWindow);
  mainWindow.webContents.once("did-finish-load", revealWindow);
  mainWindow.webContents.on("did-finish-load", () => installAppWindowCloseOverlay(mainWindow));
  mainWindow.webContents.on("did-fail-load", (_event, code, description, url) => {
    console.error(`AI Pet application window failed to load ${url}: ${code} ${description}`);
  });

  const loadBuiltRenderer = async () => {
    console.log("AI Pet application window loading built renderer.");
    await mainWindow.loadFile(distIndex, { query: { build: String(Date.now()) } });
  };

  if (process.env.AI_PET_LOAD_DIST === "1") {
    await loadBuiltRenderer();
    return;
  }

  const ready = await waitForRenderer(rendererUrl);
  if (!ready) {
    console.error(`AI Pet renderer did not become ready at ${rendererUrl}`);
    if (existsSync(distIndex)) {
      await loadBuiltRenderer();
      return;
    }
  }
  console.log(`AI Pet application window loading renderer ${rendererUrl}`);
  try {
    await mainWindow.loadURL(rendererUrl);
  } catch (error) {
    if (!existsSync(distIndex)) throw error;
    await loadBuiltRenderer();
    return;
  }
  console.log("AI Pet application window loaded", {
    windows: BrowserWindow.getAllWindows().length,
    visible: mainWindow.isVisible(),
    bounds: mainWindow.getBounds()
  });
}

app.whenReady().then(() => {
  void createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) void createMainWindow();
  });
});

ipcMain.on("ai-pet-app-window:close", (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  window?.close();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
