/// <reference types="vite/client" />

interface Window {
  electronAPI: {
    onNoteData: (cb: (data: unknown) => void) => void;
    updateNote: (updates: Partial<import("./types/note").Note>) => Promise<void>;
    deleteNote: () => Promise<void>;
    startDrag: () => Promise<void>;
    bringToFront: () => Promise<void>;
    collapse: () => Promise<void>;
    expand: () => Promise<void>;
    resizeStart: (startW: number, startH: number) => Promise<void>;
    resizeStop: () => Promise<void>;
  };
}
