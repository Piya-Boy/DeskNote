import { Plus } from "lucide-react";

interface FloatingToolbarProps {
  onNewNote: () => void;
}

export function FloatingToolbar({ onNewNote }: FloatingToolbarProps) {
  return (
    <div className="fixed bottom-6 right-6 z-[9999]">
      <button
        onClick={onNewNote}
        className="toolbar-glass rounded-full w-12 h-12 flex items-center justify-center text-foreground/80 hover:text-foreground transition-all duration-200 hover:scale-105 active:scale-95 note-shadow"
        title="New Note"
      >
        <Plus size={20} strokeWidth={2.5} />
      </button>
    </div>
  );
}
