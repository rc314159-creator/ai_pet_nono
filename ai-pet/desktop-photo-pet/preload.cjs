const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktopPhotoPet", {
  close: () => ipcRenderer.send("desktop-photo-pet:close")
});
