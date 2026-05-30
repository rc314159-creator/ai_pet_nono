const { contextBridge, ipcRenderer } = require("electron");
const { existsSync } = require("node:fs");
const fs = require("node:fs/promises");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

function getMochiAssetRoot() {
  const candidates = [
    process.env.AI_PET_MOCHI_ASSET_ROOT,
    path.join(__dirname, "..", "public", "assets", "pets", "mochi"),
    path.join(__dirname, "..", "dist", "assets", "pets", "mochi")
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (existsSync(path.join(candidate, "motions", "manifest.json"))) return candidate;
  }

  return path.join(__dirname, "..", "dist", "assets", "pets", "mochi");
}

contextBridge.exposeInMainWorld("desktopPhotoPet", {
  close: () => ipcRenderer.send("desktop-photo-pet:close"),
  openAppWindow: (targetView = "chat") => ipcRenderer.send("desktop-photo-pet:open-app-window", targetView),
  dragStart: (point) => ipcRenderer.send("desktop-photo-pet:drag-start", point),
  dragMove: (point) => ipcRenderer.send("desktop-photo-pet:drag-move", point),
  dragEnd: () => ipcRenderer.send("desktop-photo-pet:drag-end"),
  onAppWindowClosed: (callback) => {
    const handler = () => {
      if (typeof callback === "function") callback();
    };
    ipcRenderer.on("desktop-photo-pet:app-window-closed", handler);
    return () => ipcRenderer.removeListener("desktop-photo-pet:app-window-closed", handler);
  },
  loadMotionManifest: async () => {
    const mochiAssetRoot = getMochiAssetRoot();
    const manifestPath = path.join(mochiAssetRoot, "motions", "manifest.json");
    const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
    return {
      manifest,
      assetRootUrl: pathToFileURL(`${mochiAssetRoot}${path.sep}`).href
    };
  }
});
