import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  // ── Note data from main → renderer ──
  onNoteData: (cb: (data: unknown) => void) => {
    ipcRenderer.on("note-data", (_event, data) => cb(data));
  },

  // ── Note CRUD (renderer → main) ──
  updateNote: (updates: Record<string, unknown>) =>
    ipcRenderer.invoke("update-note-self", updates),
  deleteNote: () => ipcRenderer.invoke("delete-note-self"),

  // ── Window control ──
  startDrag: () => ipcRenderer.invoke("start-drag"),
  bringToFront: () => ipcRenderer.invoke("bring-to-front"),
  collapse: () => ipcRenderer.invoke("collapse-note"),
  expand: () => ipcRenderer.invoke("expand-note"),
  resizeStart: (startW: number, startH: number) =>
    ipcRenderer.invoke("resize-start", startW, startH),
  resizeStop: () => ipcRenderer.invoke("resize-stop"),
});
