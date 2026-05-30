const { contextBridge, ipcRenderer } = require("electron");
const fs = require("node:fs/promises");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const mochiAssetRoot = path.join(__dirname, "..", "public", "assets", "pets", "mochi");

contextBridge.exposeInMainWorld("desktopPhotoPet", {
  close: () => ipcRenderer.send("desktop-photo-pet:close"),
  openAppWindow: (targetView = "chat") => ipcRenderer.send("desktop-photo-pet:open-app-window", targetView),
  dragStart: (point) => ipcRenderer.send("desktop-photo-pet:drag-start", point),
  dragMove: (point) => ipcRenderer.send("desktop-photo-pet:drag-move", point),
  dragEnd: () => ipcRenderer.send("desktop-photo-pet:drag-end"),
  loadMotionManifest: async () => {
    const manifestPath = path.join(mochiAssetRoot, "motions", "manifest.json");
    const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
    return {
      manifest,
      assetRootUrl: pathToFileURL(`${mochiAssetRoot}${path.sep}`).href
    };
  }
});
