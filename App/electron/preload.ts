import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  onNoteData: (cb: (data: unknown) => void) => {
    ipcRenderer.on('note-data', (_event, data) => cb(data))
  },
  updateNote: (updates: unknown) => {
    ipcRenderer.send('note-update', updates)
  },
  deleteNote: () => {
    ipcRenderer.send('note-delete')
  },
  startDrag: () => {
    ipcRenderer.send('note-start-drag')
  },
  bringToFront: () => {
    ipcRenderer.send('note-bring-to-front')
  },
  resizeStart: (startW: number, startH: number) => {
    ipcRenderer.send('note-resize-start', { startW, startH })
  },
  resizeStop: () => {
    ipcRenderer.send('note-resize-stop')
  },
  collapse: () => {
    ipcRenderer.send('note-collapse')
  },
  expand: () => {
    ipcRenderer.send('note-expand')
  },
})
