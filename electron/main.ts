import { app, Tray, Menu, nativeImage, globalShortcut, BrowserWindow, ipcMain, screen } from 'electron'
import path from 'path'

let tray: Tray | null = null

const DEV_URL = 'http://localhost:8080'
const isDev = !app.isPackaged

// note windows map: windowId → BrowserWindow
const noteWindows = new Map<number, BrowserWindow>()

// ป้องกันการเปิด instance ซ้ำ
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
}

// ไม่แสดง main window — รันใน background เท่านั้น
app.on('ready', () => {
  if (app.dock) app.dock.hide() // macOS
  createTray()
  registerShortcuts()
  setupIPC()
})

function registerShortcuts() {
  globalShortcut.register('CommandOrControl+Shift+N', () => {
    createNoteWindow()
  })
}

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

// ป้องกัน app ปิดเมื่อไม่มี window เปิดอยู่
app.on('window-all-closed', (e: Event) => {
  e.preventDefault()
})

// ------------------- Note Window -------------------

let nextNoteId = 1
const noteColors = ['yellow', 'blue', 'green', 'pink', 'purple'] as const
let colorIndex = 0

function createNoteWindow() {
  const { x: cursorX, y: cursorY } = screen.getCursorScreenPoint()
  const display = screen.getDisplayNearestPoint({ x: cursorX, y: cursorY })

  // วางตรงกลางจอ หรือใกล้ cursor
  const winX = Math.min(cursorX, display.workArea.x + display.workArea.width - 240)
  const winY = Math.min(cursorY, display.workArea.y + display.workArea.height - 260)

  const preloadPath = path.join(__dirname, 'preload.cjs')

  const win = new BrowserWindow({
    x: winX,
    y: winY,
    width: 240,
    height: 260,
    minWidth: 160,
    minHeight: 160,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: true,
    skipTaskbar: true,
    hasShadow: false,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  const noteId = String(nextNoteId++)
  const color = noteColors[colorIndex % noteColors.length]
  colorIndex++

  const noteData = {
    id: noteId,
    text: '',
    color,
    pinned: false,
    width: 240,
    height: 260,
  }

  if (isDev) {
    win.loadURL(`${DEV_URL}/note.html`)
  } else {
    win.loadFile(path.join(__dirname, '../dist/note.html'))
  }

  win.webContents.on('did-finish-load', () => {
    win.webContents.send('note-data', noteData)
  })

  noteWindows.set(win.id, win)
  win.on('closed', () => {
    noteWindows.delete(win.id)
  })

  return win
}

// ------------------- IPC -------------------

function setupIPC() {
  ipcMain.on('note-update', (event, updates) => {
    // Phase 6 — จะ persist ลง SQLite ที่นี่
    console.log('note-update', updates)
  })

  ipcMain.on('note-delete', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    win?.close()
  })

  ipcMain.on('note-start-drag', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) win.webContents.startDrag({ file: '', icon: nativeImage.createEmpty() })
  })

  ipcMain.on('note-resize-to', (event, { width, height }) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) {
      const [x, y] = win.getPosition()
      win.setBounds({ x, y, width: Math.max(160, width), height: Math.max(160, height) })
    }
  })

  ipcMain.on('note-start-resize', (event, { startW, startH }) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return

    const startCursor = screen.getCursorScreenPoint()

    const interval = setInterval(() => {
      const cur = screen.getCursorScreenPoint()
      const newW = Math.max(160, startW + cur.x - startCursor.x)
      const newH = Math.max(160, startH + cur.y - startCursor.y)
      const [x, y] = win.getPosition()
      win.setBounds({ x, y, width: newW, height: newH })
    }, 16)

    const stopHandler = (e: Electron.IpcMainEvent) => {
      if (BrowserWindow.fromWebContents(e.sender)?.id === win.id) {
        clearInterval(interval)
        ipcMain.removeListener('note-stop-resize', stopHandler)
      }
    }
    ipcMain.on('note-stop-resize', stopHandler)
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
