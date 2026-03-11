import { useState, useCallback } from "react";
import { Note, NoteColor } from "@/types/note";

const COLORS: NoteColor[] = ["yellow", "blue", "green", "pink", "purple"];

function createNote(index: number): Note {
  return {
    id: crypto.randomUUID(),
    text: "",
    color: COLORS[index % COLORS.length],
    x: 80 + (index % 4) * 240 + Math.random() * 40,
    y: 60 + Math.floor(index / 4) * 240 + Math.random() * 40,
    width: 220,
    height: 220,
    pinned: false,
  };
}

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>(() => {
    const saved = localStorage.getItem("sticky-notes");
    if (saved) return JSON.parse(saved);
    return [createNote(0)];
  });

  const [order, setOrder] = useState<string[]>(() => notes.map((n) => n.id));

  const save = useCallback((updated: Note[]) => {
    localStorage.setItem("sticky-notes", JSON.stringify(updated));
  }, []);

  const addNote = useCallback(() => {
    const note = createNote(notes.length);
    const updated = [...notes, note];
    setNotes(updated);
    setOrder((o) => [...o, note.id]);
    save(updated);
  }, [notes, save]);

  const updateNote = useCallback((id: string, updates: Partial<Note>) => {
    setNotes((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, ...updates } : n));
      save(updated);
      return updated;
    });
  }, [save]);

  const deleteNote = useCallback((id: string) => {
    setNotes((prev) => {
      const updated = prev.filter((n) => n.id !== id);
      save(updated);
      return updated;
    });
    setOrder((o) => o.filter((oid) => oid !== id));
  }, [save]);

  const bringToFront = useCallback((id: string) => {
    setOrder((o) => [...o.filter((oid) => oid !== id), id]);
  }, []);

  return { notes, order, addNote, updateNote, deleteNote, bringToFront };
}
