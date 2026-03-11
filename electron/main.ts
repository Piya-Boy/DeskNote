import { app, Tray, Menu, nativeImage, globalShortcut, BrowserWindow, ipcMain, screen } from 'electron'
import path from 'path'
import fs from 'fs'

let tray: Tray | null = null

const DEV_URL = 'http://localhost:8080'
const isDev = !app.isPackaged

// note windows map: windowId → BrowserWindow
const noteWindows = new Map<number, BrowserWindow>()
// noteId → windowId (for looking up window from note id)
const noteIdToWinId = new Map<string, number>()

// ป้องกันการเปิด instance ซ้ำ
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
}

// ------------------- Persistence -------------------

interface NoteRecord {
  id: string
  text: string
  color: string
  pinned: boolean
  x: number
  y: number
  width: number
  height: number
  createdAt: string
  updatedAt: string
}

function getDbPath() {
  return path.join(app.getPath('userData'), 'notes.json')
}

function loadNotes(): NoteRecord[] {
  try {
    const raw = fs.readFileSync(getDbPath(), 'utf-8')
    return JSON.parse(raw)
  } catch {
    return []
  }
}

function saveNotes(notes: NoteRecord[]) {
  fs.writeFileSync(getDbPath(), JSON.stringify(notes, null, 2), 'utf-8')
}

function getNoteById(id: string): NoteRecord | undefined {
  return loadNotes().find(n => n.id === id)
}

function upsertNote(data: Partial<NoteRecord> & { id: string }) {
  const notes = loadNotes()
  const idx = notes.findIndex(n => n.id === data.id)
  const now = new Date().toISOString()
  if (idx >= 0) {
    notes[idx] = { ...notes[idx], ...data, updatedAt: now }
  } else {
    notes.push({
      id: data.id,
      text: data.text ?? '',
      color: data.color ?? 'yellow',
      pinned: data.pinned ?? false,
      x: data.x ?? 100,
      y: data.y ?? 100,
      width: data.width ?? 287,
      height: data.height ?? 287,
      createdAt: now,
      updatedAt: now,
    })
  }
  saveNotes(notes)
}

function deleteNote(id: string) {
  const notes = loadNotes().filter(n => n.id !== id)
  saveNotes(notes)
}

// noteId lookup from windowId
const winIdToNoteId = new Map<number, string>()

// ------------------- App lifecycle -------------------

app.on('ready', () => {
  if (app.dock) app.dock.hide()
  createTray()
  registerShortcuts()
  setupIPC()
  restoreNotes()
})

function registerShortcuts() {
  globalShortcut.register('CommandOrControl+Shift+N', () => {
    createNoteWindow()
  })
}

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

app.on('window-all-closed', (e: Event) => {
  e.preventDefault()
})

// ------------------- Note Window -------------------

const noteColors = ['yellow', 'blue', 'green', 'pink', 'purple'] as const
let colorIndex = 0

function createNoteWindow(savedNote?: NoteRecord) {
  let winX: number, winY: number

  if (savedNote) {
    winX = savedNote.x
    winY = savedNote.y
  } else {
    const { x: cursorX, y: cursorY } = screen.getCursorScreenPoint()
    const display = screen.getDisplayNearestPoint({ x: cursorX, y: cursorY })
    winX = Math.min(cursorX, display.workArea.x + display.workArea.width - 287)
    winY = Math.min(cursorY, display.workArea.y + display.workArea.height - 287)
  }

  const preloadPath = path.join(__dirname, 'preload.cjs')

  const win = new BrowserWindow({
    x: winX,
    y: winY,
    width: savedNote?.width ?? 287,
    height: savedNote?.height ?? 287,
    minWidth: 168,
    minHeight: 168,
    frame: false,
    transparent: true,
    alwaysOnTop: false,
    resizable: true,
    skipTaskbar: true,
    hasShadow: false,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  let noteId: string
  let noteData: NoteRecord

  if (savedNote) {
    noteId = savedNote.id
    noteData = savedNote
  } else {
    noteId = `${Date.now()}`
    const color = noteColors[colorIndex % noteColors.length]
    colorIndex++
    const [x, y] = win.getPosition()
    noteData = {
      id: noteId,
      text: '',
      color,
      pinned: false,
      x,
      y,
      width: 287,
      height: 287,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    upsertNote(noteData)
  }

  winIdToNoteId.set(win.id, noteId)
  noteIdToWinId.set(noteId, win.id)

  if (isDev) {
    win.loadURL(`${DEV_URL}/note.html`)
  } else {
    win.loadFile(path.join(__dirname, '../dist/note.html'))
  }

  win.webContents.on('did-finish-load', () => {
    win.webContents.send('note-data', noteData)
  })

  // Save position on move
  win.on('moved', () => {
    const [x, y] = win.getPosition()
    const id = winIdToNoteId.get(win.id)
    if (id) upsertNote({ id, x, y })
  })

  noteWindows.set(win.id, win)
  win.on('closed', () => {
    const id = winIdToNoteId.get(win.id)
    if (id) noteIdToWinId.delete(id)
    winIdToNoteId.delete(win.id)
    noteWindows.delete(win.id)
  })

  return win
}

function restoreNotes() {
  const notes = loadNotes()
  for (const note of notes) {
    createNoteWindow(note)
  }
  // seed color index after restore
  colorIndex = notes.length
}

// ------------------- IPC -------------------

function setupIPC() {
  ipcMain.on('note-update', (event, updates: Partial<NoteRecord>) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return
    const id = winIdToNoteId.get(win.id)
    if (id) upsertNote({ id, ...updates })
  })

  ipcMain.on('note-delete', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return
    const id = winIdToNoteId.get(win.id)
    if (id) deleteNote(id)
    win.close()
  })

  ipcMain.on('note-bring-to-front', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    win?.moveTop()
  })

  const expandedHeights = new Map<number, number>()

  ipcMain.on('note-collapse', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) {
      const [x, y] = win.getPosition()
      const [w, h] = win.getSize()
      expandedHeights.set(win.id, h)
      win.setMinimumSize(160, 40)
      win.setBounds({ x, y, width: w, height: 48 })
    }
  })

  ipcMain.on('note-expand', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) {
      const [x, y] = win.getPosition()
      const [w] = win.getSize()
      const h = expandedHeights.get(win.id) ?? 287
      win.setMinimumSize(160, 160)
      win.setBounds({ x, y, width: w, height: h })
    }
  })

  ipcMain.on('note-start-drag', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) win.webContents.startDrag({ file: '', icon: nativeImage.createEmpty() })
  })

  ipcMain.on('note-resize-start', (event, { startW, startH }) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return
    const startCursor = screen.getCursorScreenPoint()

    const interval = setInterval(() => {
      const cur = screen.getCursorScreenPoint()
      const newW = Math.max(168, startW + cur.x - startCursor.x)
      const newH = Math.max(168, startH + cur.y - startCursor.y)
      const [x, y] = win.getPosition()
      win.setBounds({ x, y, width: newW, height: newH })
    }, 16)

    const stopHandler = (e: Electron.IpcMainEvent) => {
      if (BrowserWindow.fromWebContents(e.sender)?.id === win.id) {
        clearInterval(interval)
        ipcMain.removeListener('note-resize-stop', stopHandler)
        // Save size after resize
        const [x, y] = win.getPosition()
        const [w, h] = win.getSize()
        const id = winIdToNoteId.get(win.id)
        if (id) upsertNote({ id, x, y, width: w, height: h })
      }
    }
    ipcMain.on('note-resize-stop', stopHandler)
  })
}

// ------------------- Tray -------------------

function createTray() {
  const iconPath = app.isPackaged
    ? path.join(process.resourcesPath, 'img/icon/logo.png')
    : path.join(__dirname, '../public/img/icon/logo.png')
  const icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 })

  tray = new Tray(icon)
  tray.setToolTip('DeskNote')

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'New Note',
      click: () => createNoteWindow(),
    },
    {
      label: 'Show All Notes',
      click: () => {
        noteWindows.forEach((win) => win.show())
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => app.exit(0),
    },
  ])

  tray.setContextMenu(contextMenu)
  tray.on('click', () => tray?.popUpContextMenu())
}
