import {
  app,
  BrowserWindow,
  Tray,
  Menu,
  nativeImage,
  globalShortcut,
  ipcMain,
  screen,
  clipboard,
} from "electron";
import path from "node:path";
import fs from "node:fs";

// ── Paths ──────────────────────────────────────────────────
// In CJS output, __dirname is available directly
const DIST_ELECTRON = __dirname;
const DIST_RENDERER = path.join(DIST_ELECTRON, "../dist");
const PUBLIC = app.isPackaged
  ? path.join(process.resourcesPath, "public")
  : path.join(DIST_ELECTRON, "../public");

const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

// ── Note type ──────────────────────────────────────────────
interface Note {
  id: string;
  text: string;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
  pinned: boolean;
  collapsed: boolean;
}

const COLORS = ["yellow", "blue", "green", "pink", "purple"];
const COLLAPSED_HEIGHT = 52;

// ── Data storage ───────────────────────────────────────────
const DATA_PATH = path.join(app.getPath("userData"), "notes.json");
const noteWindows = new Map<string, BrowserWindow>();
let notes: Note[] = [];

function loadNotes(): Note[] {
  try {
    if (fs.existsSync(DATA_PATH)) {
      const loaded = JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
      // Ensure collapsed field exists for old data
      return loaded.map((n: Note) => ({ ...n, collapsed: n.collapsed ?? false }));
    }
  } catch {
    // ignore
  }
  return [];
}

function saveNotes() {
  fs.writeFileSync(DATA_PATH, JSON.stringify(notes, null, 2));
}

function createNoteData(text = ""): Note {
  const { width: screenW, height: screenH } =
    screen.getPrimaryDisplay().workAreaSize;
  return {
    id: crypto.randomUUID(),
    text,
    color: COLORS[notes.length % COLORS.length],
    x: Math.round(screenW / 2 - 110 + Math.random() * 80 - 40),
    y: Math.round(screenH / 2 - 110 + Math.random() * 80 - 40),
    width: 260,
    height: 280,
    pinned: false,
    collapsed: false,
  };
}

// ── Helper: find note id from BrowserWindow ─────────────────
function getNoteIdFromWindow(win: BrowserWindow): string | undefined {
  for (const [id, w] of noteWindows) {
    if (w === win) return id;
  }
  return undefined;
}

// ── Note window ────────────────────────────────────────────
function createNoteWindow(note: Note) {
  if (noteWindows.has(note.id)) {
    const existing = noteWindows.get(note.id)!;
    existing.show();
    existing.focus();
    return;
  }

  const win = new BrowserWindow({
    width: note.width,
    height: note.collapsed ? COLLAPSED_HEIGHT : note.height,
    x: note.x,
    y: note.y,
    frame: false,
    transparent: true,
    alwaysOnTop: note.pinned,
    movable: !note.pinned,
    resizable: !note.collapsed,
    skipTaskbar: true,
    hasShadow: false,
    icon: path.join(PUBLIC, "favicon.ico"),
    minWidth: 160,
    minHeight: note.collapsed ? COLLAPSED_HEIGHT : 160,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
    },
  });

  // Load note page
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(`${VITE_DEV_SERVER_URL}/note.html?noteId=${note.id}`);
  } else {
    win.loadFile(path.join(DIST_RENDERER, "note.html"), {
      search: `noteId=${note.id}`,
    });
  }

  // Send note data to renderer once loaded
  win.webContents.on("did-finish-load", () => {
    win.webContents.send("note-data", {
      id: note.id,
      text: note.text,
      color: note.color,
      pinned: note.pinned,
      collapsed: note.collapsed,
      width: note.width,
      height: note.height,
    });
  });

  // Save position on move
  win.on("moved", () => {
    const [x, y] = win.getPosition();
    const n = notes.find((n) => n.id === note.id);
    if (n) {
      n.x = x;
      n.y = y;
      saveNotes();
    }
  });

  // Save size on resize
  win.on("resized", () => {
    const [width, height] = win.getSize();
    const n = notes.find((n) => n.id === note.id);
    if (n && !n.collapsed) {
      n.width = width;
      n.height = height;
      saveNotes();
    }
  });

  win.on("closed", () => {
    noteWindows.delete(note.id);
  });

  noteWindows.set(note.id, win);
}

// ── Tray ───────────────────────────────────────────────────
let tray: Tray | null = null;

function createTray() {
  const icoPath = path.join(PUBLIC, "favicon.ico");
  const pngPath = path.join(PUBLIC, "img/icon/logo.png");
  const iconPath = fs.existsSync(icoPath) ? icoPath : pngPath;
  const icon = nativeImage
    .createFromPath(iconPath)
    .resize({ width: 16, height: 16 });

  tray = new Tray(icon);
  tray.setToolTip("DeskNote");

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "New Note",
      accelerator: "Ctrl+Shift+N",
      click: () => {
        const note = createNoteData();
        notes.push(note);
        saveNotes();
        createNoteWindow(note);
      },
    },
    {
      label: "New Note from Clipboard",
      accelerator: "Ctrl+Shift+V",
      click: () => {
        const text = clipboard.readText().trim();
        const note = createNoteData(text);
        notes.push(note);
        saveNotes();
        createNoteWindow(note);
      },
    },
    { type: "separator" },
    {
      label: "Show All Notes",
      click: () => {
        for (const note of notes) {
          createNoteWindow(note);
        }
      },
    },
    {
      label: "Hide All Notes",
      click: () => {
        for (const [id, win] of noteWindows) {
          const note = notes.find((n) => n.id === id);
          if (note?.pinned) continue; // Skip pinned notes
          win.hide();
        }
      },
    },
    { type: "separator" },
    {
      label: "Launch at Startup",
      type: "checkbox",
      checked: app.getLoginItemSettings().openAtLogin,
      click: (menuItem) => {
        app.setLoginItemSettings({ openAtLogin: menuItem.checked });
      },
    },
    { type: "separator" },
    {
      label: "Clear All Notes",
      click: () => {
        // Close all windows
        for (const [, win] of noteWindows) {
          win.destroy();
        }
        noteWindows.clear();
        notes = [];
        saveNotes();
      },
    },
    { type: "separator" },
    {
      label: "Quit",
      click: () => {
        app.isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);

  // Show context menu on any click (left, right, double)
  tray.on("click", () => {
    tray?.popUpContextMenu(contextMenu);
  });
}

// ── Global Shortcuts ──────────────────────────────────────
function registerShortcuts() {
  globalShortcut.register("CommandOrControl+Shift+N", () => {
    const note = createNoteData();
    notes.push(note);
    saveNotes();
    createNoteWindow(note);
  });

  globalShortcut.register("CommandOrControl+Shift+V", () => {
    const text = clipboard.readText().trim();
    const note = createNoteData(text);
    notes.push(note);
    saveNotes();
    createNoteWindow(note);
  });
}

// ── IPC handlers ───────────────────────────────────────────
function setupIPC() {
  // ── Note CRUD (per-window, uses sender to identify note) ──

  ipcMain.handle("update-note-self", (event, updates: Partial<Note>) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return;
    const noteId = getNoteIdFromWindow(win);
    if (!noteId) return;

    const note = notes.find((n) => n.id === noteId);
    if (!note) return;

    Object.assign(note, updates);
    saveNotes();

    // Sync alwaysOnTop and movable with pinned state
    if ("pinned" in updates) {
      win.setAlwaysOnTop(!!updates.pinned);
      win.setMovable(!updates.pinned);
    }
  });

  ipcMain.handle("delete-note-self", (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return;
    const noteId = getNoteIdFromWindow(win);
    if (!noteId) return;

    notes = notes.filter((n) => n.id !== noteId);
    saveNotes();
    noteWindows.delete(noteId);
    win.destroy();
  });

  // ── Window control ──

  ipcMain.handle("bring-to-front", (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
      win.moveTop();
    }
  });

  ipcMain.handle("start-drag", (event) => {
    // Not needed — using CSS -webkit-app-region: drag instead
  });

  ipcMain.handle("collapse-note", (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return;
    const noteId = getNoteIdFromWindow(win);
    if (!noteId) return;

    const note = notes.find((n) => n.id === noteId);
    if (!note) return;

    // Save current height before collapsing
    const [w] = win.getSize();
    note.collapsed = true;
    saveNotes();

    win.setResizable(false);
    win.setMinimumSize(160, COLLAPSED_HEIGHT);
    win.setSize(w, COLLAPSED_HEIGHT);
  });

  ipcMain.handle("expand-note", (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return;
    const noteId = getNoteIdFromWindow(win);
    if (!noteId) return;

    const note = notes.find((n) => n.id === noteId);
    if (!note) return;

    note.collapsed = false;
    saveNotes();

    win.setMinimumSize(160, 160);
    win.setSize(note.width, note.height);
    win.setResizable(true);
  });

  ipcMain.handle("resize-start", (_event, _startW: number, _startH: number) => {
    // Placeholder — resize is handled by OS via resizable:true
  });

  ipcMain.handle("resize-stop", () => {
    // Placeholder
  });

  // ── Legacy handlers (keep for compatibility) ──

  ipcMain.handle("get-note", (_event, id: string) => {
    return notes.find((n) => n.id === id) || null;
  });

  ipcMain.handle(
    "update-note",
    (_event, id: string, updates: Partial<Note>) => {
      const note = notes.find((n) => n.id === id);
      if (!note) return;
      Object.assign(note, updates);
      saveNotes();

      if ("pinned" in updates) {
        const win = noteWindows.get(id);
        if (win) {
          win.setAlwaysOnTop(!!updates.pinned);
          win.setMovable(!updates.pinned);
        }
      }
    }
  );

  ipcMain.handle("delete-note", (_event, id: string) => {
    notes = notes.filter((n) => n.id !== id);
    saveNotes();
    const win = noteWindows.get(id);
    if (win) {
      win.destroy();
      noteWindows.delete(id);
    }
  });
}

// ── Single instance lock ───────────────────────────────────
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    // Show all note windows when a second instance is attempted
    for (const note of notes) {
      createNoteWindow(note);
    }
  });

  // ── App lifecycle ──────────────────────────────────────────
  app.whenReady().then(() => {
    notes = loadNotes();
    setupIPC();
    createTray();
    registerShortcuts();

    // Open all saved notes on start
    for (const note of notes) {
      createNoteWindow(note);
    }
  });

  app.on("window-all-closed", () => {
    // Keep running in tray
  });

  app.on("will-quit", () => {
    globalShortcut.unregisterAll();
  });
}

// Extension to allow isQuitting
declare global {
  namespace Electron {
    interface App {
      isQuitting?: boolean;
    }
  }
}
