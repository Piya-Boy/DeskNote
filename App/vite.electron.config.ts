import { defineConfig } from 'vite'
import path from 'path'

// Config สำหรับ build Electron main process และ preload
export default defineConfig({
  build: {
    lib: {
      entry: {
        main: path.resolve(__dirname, 'electron/main.ts'),
        preload: path.resolve(__dirname, 'electron/preload.ts'),
      },
      formats: ['cjs'],
      fileName: (_, entryName) => `${entryName}.cjs`,
    },
    outDir: 'dist-electron',
    emptyOutDir: false,
    rollupOptions: {
      external: ['electron', 'path', 'fs', 'os', 'url', 'child_process'],
    },
  },
})
