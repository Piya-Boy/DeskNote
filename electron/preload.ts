import { contextBridge, ipcRenderer } from "electron";

// Expose IPC to the renderer process
contextBridge.exposeInMainWorld("electronAPI", {
  onNewNote: (callback: () => void) => ipcRenderer.on("new-note", callback),
});
