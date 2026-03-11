# DeskNote Roadmap

## Project Overview
DeskNote is a lightweight desktop sticky notes application.
Users can instantly place sticky notes anywhere on the desktop without opening a main application window.

Tech Stack:
- React
- Vite
- Tailwind CSS
- Electron
- SQLite

---

# Phase 1 — Background Application ✅

### Goal
Run DeskNote in the background instead of opening a main window.

### Tasks
- [x] Start Electron without showing a main UI window.
- [x] Initialize the application in the system tray.
- [x] Ensure the app runs quietly in the background.

### Result
DeskNote runs automatically and stays in the system tray.

---

# Phase 2 — System Tray Controls ✅

### Goal
Control DeskNote from the system tray.

### Tasks
- [x] Add a tray icon.
- [x] Add tray menu options:
- [x] New Note
- [x] Show All Notes
- [x] Quit

### Result
Users can create new notes from the tray menu.

---

# Phase 3 — Global Shortcut ✅

### Goal
Allow users to create notes instantly using keyboard shortcuts.

### Tasks
- [x] Register a global shortcut: CTRL + SHIFT + N → Create new note

### Result
Users can create a sticky note anywhere instantly.

---

# Phase 4 — Independent Note Windows ✅

### Goal
Each note should behave like its own desktop widget.

### Tasks
- [x] Create a new Electron BrowserWindow for each note.
- [x] Window settings: frameless, transparent, resizable
- [x] Load the StickyNote React component in each window.
- [x] Color cycling for new notes (yellow → blue → green → pink → purple)
- [x] Pin toggle
- [x] Color picker
- [x] Collapse / expand
- [x] Delete with confirmation
- [x] Bring to front on click
- [x] Custom resize handle (bottom-right)
- [x] Default size: 287 × 287 px (≈ 76 × 76 mm at 96 DPI)

### Result
Each note becomes an independent floating window.

---

# Phase 5 — Drag and Resize ✅

### Goal
Allow users to place notes anywhere.

### Tasks
- [x] Implement drag movement (via -webkit-app-region: drag)
- [x] Implement resize handle (setPointerCapture + cursor polling in main)
- [ ] Save position (x, y) — pending persistence
- [ ] Save size (width, height) — pending persistence

### Result
Notes can be freely moved and resized.

---

# Phase 6 — Persistence

### Goal
Store notes permanently.

### Tasks
Use SQLite database.

Table structure:

id
text
color
x
y
width
height
pinned
zIndex
createdAt
updatedAt

### Result
Notes remain after restarting the application or computer.

---

# Phase 7 — Start With Windows

### Goal
DeskNote starts automatically with the operating system.

### Tasks
- Enable auto start on Windows login

### Result
Notes appear immediately after logging into Windows.

---

# Phase 8 — Quality Improvements

### Tasks
- Smooth drag animations
- Clipboard quick note
- Keyboard shortcuts
- Improved UI polish

---

# Final Product

DeskNote becomes a lightweight desktop sticky notes widget where users can:

- Create notes instantly
- Place notes anywhere on the desktop
- Drag and resize notes
- Persist notes across restarts
- Launch automatically with Windows
