import { app, Tray, Menu, nativeImage, globalShortcut, BrowserWindow, ipcMain, screen, clipboard } from 'electron'
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
  collapsed: boolean
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
      collapsed: data.collapsed ?? false,
      x: data.x ?? 100,
      y: data.y ?? 100,
      width: data.width ?? 320,
      height: data.height ?? 350,
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
// track which windows are currently collapsed (to prevent saving height=48)
const collapsedWinIds = new Set<number>()
// track whether notes are currently visible (for hide/show toggle)
let notesVisible = true

// ------------------- Auto-launch -------------------

function getAutoLaunch(): boolean {
  return app.getLoginItemSettings().openAtLogin
}

function setAutoLaunch(enable: boolean) {
  if (!app.isPackaged) return // skip registry writes in dev
  app.setLoginItemSettings({ openAtLogin: enable })
}

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
  globalShortcut.register('CommandOrControl+Shift+V', () => {
    const text = clipboard.readText().trim()
    createNoteWindow(undefined, text || undefined)
  })
  globalShortcut.register('CommandOrControl+Shift+H', () => {
    toggleNotesVisibility()
  })
}

function toggleNotesVisibility() {
  if (notesVisible) {
    noteWindows.forEach((win) => win.hide())
  } else {
    noteWindows.forEach((win) => win.show())
  }
  notesVisible = !notesVisible
  // Rebuild tray menu to reflect current state
  rebuildTrayMenu()
}

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

app.on('window-all-closed', () => {
  // Intentionally empty — keeps app alive when all notes are closed
})

// ------------------- Note Window -------------------

const noteColors = ['yellow', 'blue', 'green', 'pink', 'purple'] as const
let colorIndex = 0

function createNoteWindow(savedNote?: NoteRecord, initialText?: string) {
  let winX: number, winY: number

  if (savedNote) {
    winX = savedNote.x
    winY = savedNote.y
  } else {
    const { x: cursorX, y: cursorY } = screen.getCursorScreenPoint()
    const display = screen.getDisplayNearestPoint({ x: cursorX, y: cursorY })
    winX = Math.min(cursorX, display.workArea.x + display.workArea.width - 320)
    winY = Math.min(cursorY, display.workArea.y + display.workArea.height - 350)
  }

  const preloadPath = path.join(__dirname, 'preload.cjs')

  const isCollapsed = savedNote?.collapsed ?? false
  const winWidth = savedNote?.width ?? 320
  const winHeight = isCollapsed ? 48 : (savedNote?.height ?? 350)

  const win = new BrowserWindow({
    x: winX,
    y: winY,
    width: winWidth,
    height: winHeight,
    minWidth: 168,
    minHeight: isCollapsed ? 40 : 168,
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
      text: initialText ?? '',
      color,
      pinned: false,
      collapsed: false,
      x,
      y,
      width: 320,
      height: 350,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    upsertNote(noteData)
  }

  if (isCollapsed) collapsedWinIds.add(win.id)

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
    collapsedWinIds.delete(win.id)
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

  ipcMain.on('note-collapse', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) {
      const [x, y] = win.getPosition()
      const [w, h] = win.getSize()
      const id = winIdToNoteId.get(win.id)
      if (id) upsertNote({ id, height: h, collapsed: true })
      collapsedWinIds.add(win.id)
      win.setMinimumSize(160, 40)
      win.setBounds({ x, y, width: w, height: 48 })
    }
  })

  ipcMain.on('note-expand', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) {
      const [x, y] = win.getPosition()
      const [w] = win.getSize()
      const id = winIdToNoteId.get(win.id)
      const saved = id ? getNoteById(id) : undefined
      const h = saved?.height ?? 350
      collapsedWinIds.delete(win.id)
      if (id) upsertNote({ id, collapsed: false })
      win.setMinimumSize(168, 168)
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
        // Save size after resize (but never save collapsed height)
        if (!collapsedWinIds.has(win.id)) {
          const [x, y] = win.getPosition()
          const [w, h] = win.getSize()
          const id = winIdToNoteId.get(win.id)
          if (id) upsertNote({ id, x, y, width: w, height: h })
        }
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

  tray.setContextMenu(buildTrayMenu())
  tray.on('click', () => tray?.popUpContextMenu())
}

function rebuildTrayMenu() {
  tray?.setContextMenu(buildTrayMenu())
}

function buildTrayMenu() {
  return Menu.buildFromTemplate([
    {
      label: 'New Note',
      accelerator: 'CommandOrControl+Shift+N',
      click: () => createNoteWindow(),
    },
    {
      label: 'New Note from Clipboard',
      accelerator: 'CommandOrControl+Shift+V',
      click: () => {
        const text = clipboard.readText().trim()
        createNoteWindow(undefined, text || undefined)
      },
    },
    { type: 'separator' },
    {
      label: 'Show All Notes',
      click: () => {
        noteWindows.forEach((win) => win.show())
        notesVisible = true
        rebuildTrayMenu()
      },
    },
    {
      label: 'Hide All Notes',
      click: () => {
        noteWindows.forEach((win) => win.hide())
        notesVisible = false
        rebuildTrayMenu()
      },
    },
    { type: 'separator' },
    {
      label: 'Launch at Startup',
      type: 'checkbox',
      checked: getAutoLaunch(),
      click: (menuItem) => {
        setAutoLaunch(menuItem.checked)
        rebuildTrayMenu()
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => app.exit(0),
    },
  ])
}
