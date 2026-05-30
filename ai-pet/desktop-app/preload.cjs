const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("aiPetAppWindow", {
  close: () => ipcRenderer.send("ai-pet-app-window:close"),
  onNavigate: (callback) => {
    const handler = (_event, targetView) => {
      if (typeof callback === "function") callback(targetView);
    };
    ipcRenderer.on("ai-pet:navigate", handler);
    return () => ipcRenderer.removeListener("ai-pet:navigate", handler);
  }
});
