import { AnimatePresence } from "framer-motion";
import { Note } from "@/types/note";
import { StickyNote } from "./StickyNote";

interface NotesLayerProps {
  notes: Note[];
  order: string[];
  onUpdate: (id: string, updates: Partial<Note>) => void;
  onDelete: (id: string) => void;
  onBringToFront: (id: string) => void;
}

export function NotesLayer({ notes, order, onUpdate, onDelete, onBringToFront }: NotesLayerProps) {
  return (
    <div className="fixed inset-0">
      <AnimatePresence>
        {notes.map((note) => (
          <StickyNote
            key={note.id}
            note={note}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onBringToFront={onBringToFront}
            zIndex={order.indexOf(note.id) + 1}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
