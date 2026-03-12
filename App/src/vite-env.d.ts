/// <reference types="vite/client" />

interface Window {
  electronAPI: {
    getNote: (id: string) => Promise<import("./types/note").Note | null>;
    updateNote: (id: string, updates: Partial<import("./types/note").Note>) => Promise<void>;
    deleteNote: (id: string) => Promise<void>;
    onNewNote: (callback: () => void) => void;
  };
}
