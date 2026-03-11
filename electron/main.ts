import { app, BrowserWindow, Tray, Menu, nativeImage } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Paths ──────────────────────────────────────────────────
const DIST_ELECTRON = path.join(__dirname);
const DIST_RENDERER = path.join(DIST_ELECTRON, "../dist");
const PUBLIC = app.isPackaged
  ? DIST_RENDERER
  : path.join(DIST_ELECTRON, "../public");

const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

let tray: Tray | null = null;
let mainWindow: BrowserWindow | null = null;

// ── Window setup ───────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    show: false, // Start hidden
    icon: path.join(PUBLIC, "img/icon/logo.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),
    },
  });

  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(DIST_RENDERER, "index.html"));
  }

  // Instead of closing, just hide the window
  mainWindow.on("close", (e) => {
    if (!app.isQuitting) {
      e.preventDefault();
      mainWindow?.hide();
    }
  });
}

// ── Tray setup ─────────────────────────────────────────────
function createTray() {
  const iconPath = path.join(PUBLIC, "img/icon/logo.png");
  const icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });

  tray = new Tray(icon);
  tray.setToolTip("DeskNote");

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "New Note",
      click: () => {
        mainWindow?.show();
        mainWindow?.webContents.send("new-note");
      },
    },
    {
      label: "Show All Notes",
      click: () => {
        mainWindow?.show();
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
  
  // Double-click tray icon to show window
  tray.on("double-click", () => {
    mainWindow?.show();
  });
}

// ── App lifecycle ──────────────────────────────────────────
app.whenReady().then(() => {
  createWindow();
  createTray();
});

app.on("window-all-closed", () => {
  // Keep running in tray
});

// Extension to avoid closing
declare global {
  namespace Electron {
    interface App {
      isQuitting?: boolean;
    }
  }
}
