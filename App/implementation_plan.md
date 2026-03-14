# Auto Update — Immediate Install

ใช้ `electron-updater` + GitHub Releases — เมื่อมีอัปเดต จะดาวน์โหลดแล้ว **รีสตาร์ทแอปทันที** ไม่ต้องรอปิดเอง

## Flow

```
App opens → Check GitHub Releases → Download update → quitAndInstall() → App restarts with new version
```

## Proposed Changes

### 1. Install dependency

```bash
npm install electron-updater
```

---

### 2. [MODIFY] [electron-builder.json](file:///d:/Develop/CODING/DeskNote/App/electron-builder.json)

เพิ่ม `publish` config:

```diff
+  "publish": [
+    {
+      "provider": "github",
+      "owner": "Piya-Boy",
+      "repo": "DeskNote"
+    }
+  ]
```

---

### 3. [MODIFY] [vite.electron.config.ts](file:///d:/Develop/CODING/DeskNote/App/vite.electron.config.ts)

เพิ่ม `electron-updater` ใน `external` เพื่อไม่ให้ Vite bundle

---

### 4. [MODIFY] [main.ts](file:///d:/Develop/CODING/DeskNote/App/electron/main.ts)

เพิ่ม ~15 บรรทัดใน main process:

```typescript
import { autoUpdater } from "electron-updater";

// ปิดการแนะนำให้อัปเดต เปิดให้ download อัตโนมัติ
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = false; // ไม่รอปิด

// ดาวน์โหลดเสร็จแล้ว → รีสตาร์ททันที
autoUpdater.on("update-downloaded", () => {
  autoUpdater.quitAndInstall(true, true); // silent, forceRunAfter
});

// เช็คอัปเดตหลังแอปพร้อม
app.whenReady().then(() => {
  // ... existing code ...
  autoUpdater.checkForUpdates().catch(() => {});
});
```

## วิธี Release อัปเดตใหม่

1. เพิ่มเวอร์ชันใน [package.json](file:///d:/Develop/CODING/DeskNote/App/package.json) (เช่น `"version": "1.0.1"`)
2. รัน `npm run dist`
3. สร้าง GitHub Release → อัพโหลดไฟล์จาก `release/` (`.exe`, `latest.yml`)
4. ผู้ใช้เปิดแอป → อัปเดตอัตโนมัติ ✅
