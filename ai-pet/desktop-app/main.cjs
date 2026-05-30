const { app, BrowserWindow } = require("electron");
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

async function createMainWindow() {
  const rendererUrl = process.env.AI_PET_RENDERER_URL || DEFAULT_RENDERER_URL;

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
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });
  mainWindow.setAspectRatio(430 / 932);

  const revealWindow = () => {
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
  mainWindow.webContents.on("did-fail-load", (_event, code, description, url) => {
    console.error(`AI Pet application window failed to load ${url}: ${code} ${description}`);
  });

  if (process.env.AI_PET_LOAD_DIST === "1") {
    console.log("AI Pet application window loading built renderer.");
    await mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
    return;
  }

  const ready = await waitForRenderer(rendererUrl);
  if (!ready) {
    console.error(`AI Pet renderer did not become ready at ${rendererUrl}`);
  }
  console.log(`AI Pet application window loading renderer ${rendererUrl}`);
  await mainWindow.loadURL(rendererUrl);
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

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
