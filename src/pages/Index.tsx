import { FloatingToolbar } from "@/components/FloatingToolbar";
import { NotesLayer } from "@/components/NotesLayer";
import { useNotes } from "@/hooks/useNotes";
import { useEffect } from "react";

const Index = () => {
  const { notes, order, addNote, updateNote, deleteNote, bringToFront } = useNotes();

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.onNewNote(() => {
        addNote();
      });
    }
  }, [addNote]);

  return (
    <div className="min-h-screen bg-transparent">
      <NotesLayer
        notes={notes}
        order={order}
        onUpdate={updateNote}
        onDelete={deleteNote}
        onBringToFront={bringToFront}
      />
      <FloatingToolbar onNewNote={addNote} />
    </div>
  );
};

export default Index;
