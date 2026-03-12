import {
  app,
  BrowserWindow,
  Tray,
  Menu,
  nativeImage,
  globalShortcut,
  ipcMain,
  screen,
} from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Paths ──────────────────────────────────────────────────
const DIST_ELECTRON = __dirname;
const DIST_RENDERER = path.join(DIST_ELECTRON, "../dist");
const PUBLIC = app.isPackaged
  ? DIST_RENDERER
  : path.join(DIST_ELECTRON, "../public");

const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

// ── Note type (mirrored from renderer) ─────────────────────
interface Note {
  id: string;
  text: string;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
  pinned: boolean;
}

const COLORS = ["yellow", "blue", "green", "pink", "purple"];

// ── Data storage ───────────────────────────────────────────
const DATA_PATH = path.join(app.getPath("userData"), "notes.json");
const noteWindows = new Map<string, BrowserWindow>();
let notes: Note[] = [];

function loadNotes(): Note[] {
  try {
    if (fs.existsSync(DATA_PATH)) {
      return JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
    }
  } catch {
    // ignore
  }
  return [];
}

function saveNotes() {
  fs.writeFileSync(DATA_PATH, JSON.stringify(notes, null, 2));
}

function createNoteData(): Note {
  const { width: screenW, height: screenH } = screen.getPrimaryDisplay().workAreaSize;
  return {
    id: crypto.randomUUID(),
    text: "",
    color: COLORS[notes.length % COLORS.length],
    x: Math.round(screenW / 2 - 110 + Math.random() * 80 - 40),
    y: Math.round(screenH / 2 - 110 + Math.random() * 80 - 40),
    width: 260,
    height: 280,
    pinned: false,
  };
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
    height: note.height,
    x: note.x,
    y: note.y,
    frame: false,
    transparent: true,
    alwaysOnTop: note.pinned,
    resizable: true,
    skipTaskbar: true,
    hasShadow: false,
    icon: path.join(PUBLIC, "img/icon/logo.png"),
    minWidth: 160,
    minHeight: 160,
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),
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
    if (n) {
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
  const iconPath = path.join(PUBLIC, "img/icon/logo.png");
  const icon = nativeImage
    .createFromPath(iconPath)
    .resize({ width: 16, height: 16 });

  tray = new Tray(icon);
  tray.setToolTip("DeskNote");

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "New Note",
      click: () => {
        const note = createNoteData();
        notes.push(note);
        saveNotes();
        createNoteWindow(note);
      },
    },
    {
      label: "Show All Notes",
      click: () => {
        for (const note of notes) {
          createNoteWindow(note);
        }
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

  tray.on("double-click", () => {
    for (const note of notes) {
      createNoteWindow(note);
    }
  });
}

// ── Global Shortcut ────────────────────────────────────────
function registerShortcuts() {
  globalShortcut.register("CommandOrControl+Shift+N", () => {
    const note = createNoteData();
    notes.push(note);
    saveNotes();
    createNoteWindow(note);
  });
}

// ── IPC handlers ───────────────────────────────────────────
function setupIPC() {
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

      // Sync alwaysOnTop with pinned state
      if ("pinned" in updates) {
        const win = noteWindows.get(id);
        if (win) win.setAlwaysOnTop(!!updates.pinned);
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

// Extension to allow isQuitting
declare global {
  namespace Electron {
    interface App {
      isQuitting?: boolean;
    }
  }
}
