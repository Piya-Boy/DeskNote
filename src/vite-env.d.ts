/// <reference types="vite/client" />

interface Window {
  electronAPI: {
    onNewNote: (callback: () => void) => void;
  };
}
