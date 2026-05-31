const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktopPhotoPetBubble", {
  onShow: (callback) => {
    const handler = (_event, payload) => {
      if (typeof callback === "function") callback(payload);
    };
    ipcRenderer.on("desktop-photo-pet-bubble:show", handler);
    return () => ipcRenderer.removeListener("desktop-photo-pet-bubble:show", handler);
  },
  onHide: (callback) => {
    const handler = () => {
      if (typeof callback === "function") callback();
    };
    ipcRenderer.on("desktop-photo-pet-bubble:hide", handler);
    return () => ipcRenderer.removeListener("desktop-photo-pet-bubble:hide", handler);
  }
});
