import { useEffect, useState, useCallback } from "react";
import { Note } from "@/types/note";
import { StickyNote } from "@/components/StickyNote";

export default function NotePage() {
  const [note, setNote] = useState<Note | null>(null);

  // Get noteId from URL query string
  const noteId = new URLSearchParams(window.location.search).get("noteId");

  useEffect(() => {
    if (!noteId || !window.electronAPI) return;
    window.electronAPI.getNote(noteId).then((data: Note | null) => {
      if (data) setNote(data);
    });
  }, [noteId]);

  const handleUpdate = useCallback(
    (id: string, updates: Partial<Note>) => {
      if (!window.electronAPI) return;
      setNote((prev) => (prev ? { ...prev, ...updates } : prev));
      window.electronAPI.updateNote(id, updates);
    },
    []
  );

  const handleDelete = useCallback(
    (id: string) => {
      if (!window.electronAPI) return;
      window.electronAPI.deleteNote(id);
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
