import { useEffect, useState, useCallback } from "react";
import { Note } from "@/types/note";
import { StickyNote } from "@/components/StickyNote";

export default function NotePage() {
  const [note, setNote] = useState<Note | null>(null);

  useEffect(() => {
    if (!window.electronAPI) return;
    // Receive note data pushed from main process
    window.electronAPI.onNoteData((data: unknown) => {
      setNote(data as Note);
    });
  }, []);

  const handleUpdate = useCallback(
    (_id: string, updates: Partial<Note>) => {
      if (!window.electronAPI) return;
      setNote((prev) => (prev ? { ...prev, ...updates } : prev));
      window.electronAPI.updateNote(updates);
    },
    []
  );

  const handleDelete = useCallback(
    (_id: string) => {
      if (!window.electronAPI) return;
      window.electronAPI.deleteNote();
    },
    []
  );

  if (!note) {
    return null;
  }

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        background: "transparent",
      }}
    >
      <StickyNote
        note={note}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />
    </div>
  );
}
