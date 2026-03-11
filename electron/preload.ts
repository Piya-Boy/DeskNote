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
  resizeTo: (width: number, height: number) => {
    ipcRenderer.send('note-resize-to', { width, height })
  },
  startResize: (startW: number, startH: number) => {
    ipcRenderer.send('note-start-resize', { startW, startH })
  },
  stopResize: () => {
    ipcRenderer.send('note-stop-resize')
  },
})
