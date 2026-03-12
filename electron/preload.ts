import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  // Note CRUD
  getNote: (id: string) => ipcRenderer.invoke("get-note", id),
  updateNote: (id: string, updates: Record<string, unknown>) =>
    ipcRenderer.invoke("update-note", id, updates),
  deleteNote: (id: string) => ipcRenderer.invoke("delete-note", id),

  // Events from main
  onNewNote: (callback: () => void) => ipcRenderer.on("new-note", callback),
});
