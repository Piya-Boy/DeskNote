import { useRef, useState, useCallback, useEffect } from "react";
import { Pin, Trash2, Palette, Minus, ChevronDown } from "lucide-react";
import { Note, NoteColor } from "@/types/note";
import { ColorPicker } from "./ColorPicker";

const colorMap: Record<NoteColor, string> = {
  yellow: "bg-note-yellow",
  blue: "bg-note-blue",
  green: "bg-note-green",
  pink: "bg-note-pink",
  purple: "bg-note-purple",
  orange: "bg-note-orange",
};

interface StickyNoteProps {
  note: Note;
  onUpdate: (id: string, updates: Partial<Note>) => void;
  onDelete: (id: string) => void;
}

export function StickyNote({ note, onUpdate, onDelete }: StickyNoteProps) {
  const [showColors, setShowColors] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const autoGrow = useCallback(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.max(el.scrollHeight, 140) + "px";
    }
  }, []);

  useEffect(() => {
    autoGrow();
  }, [note.text, autoGrow]);

  const handleCollapse = useCallback(() => {
    if (window.electronAPI) {
      window.electronAPI.collapse();
      onUpdate(note.id, { collapsed: true });
    }
  }, [note.id, onUpdate]);

  const handleExpand = useCallback(() => {
    if (window.electronAPI) {
      window.electronAPI.expand();
      onUpdate(note.id, { collapsed: false });
    }
  }, [note.id, onUpdate]);

  // Collapsed view
  if (note.collapsed) {
    return (
      <div
        className={`w-full h-full ${colorMap[note.color as NoteColor]} rounded-xl note-shadow relative flex items-center`}
        style={{ WebkitAppRegion: note.pinned ? "no-drag" : "drag" } as React.CSSProperties}
      >
        <div
          className="flex items-center justify-between w-full px-3"
          style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
        >
          <span className="text-sm text-foreground/70 truncate flex-1 mr-2">
            {note.text || "Empty note"}
          </span>
          <button
            onClick={handleExpand}
            className="p-1.5 rounded-lg text-foreground/40 hover:text-foreground/70 hover:bg-foreground/5 transition-colors duration-150 shrink-0"
            title="Expand"
          >
            <ChevronDown size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`group w-full h-full ${colorMap[note.color as NoteColor]} rounded-xl transition-shadow duration-200 hover:shadow-lg note-shadow relative overflow-hidden flex flex-col`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowColors(false);
        setConfirmDelete(false);
      }}
    >
      {/* Drag handle — header bar with native window drag */}
      <div
        className="flex items-center justify-between px-3 pt-2.5 pb-1"
        style={{ WebkitAppRegion: note.pinned ? "no-drag" : "drag" } as React.CSSProperties}
      >
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200" style={{ WebkitAppRegion: "no-drag", ...(showColors ? { opacity: 1 } : {}) } as React.CSSProperties}>
          <button
            onClick={() => onUpdate(note.id, { pinned: !note.pinned })}
            className={`p-1.5 rounded-lg transition-colors duration-150 ${note.pinned ? "bg-foreground/10 text-foreground" : "text-foreground/40 hover:text-foreground/70 hover:bg-foreground/5"}`}
            title={note.pinned ? "Unpin" : "Pin"}
          >
            <Pin size={14} className={note.pinned ? "fill-current" : ""} />
          </button>
          <button
            onClick={() => setShowColors(!showColors)}
            className="p-1.5 rounded-lg text-foreground/40 hover:text-foreground/70 hover:bg-foreground/5 transition-colors duration-150"
            title="Change color"
          >
            <Palette size={14} />
          </button>
          <button
            onClick={handleCollapse}
            className="p-1.5 rounded-lg text-foreground/40 hover:text-foreground/70 hover:bg-foreground/5 transition-colors duration-150"
            title="Collapse"
          >
            <Minus size={14} />
          </button>
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200" style={{ WebkitAppRegion: "no-drag", ...(confirmDelete ? { opacity: 1 } : {}) } as React.CSSProperties}>
          {confirmDelete ? (
            <div className="flex items-center gap-1 animate-pop-in">
              <button
                onClick={() => onDelete(note.id)}
                className="px-2 py-1 rounded-lg text-xs font-medium bg-destructive/15 text-destructive hover:bg-destructive/25 transition-colors duration-150"
              >
                Delete
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-2 py-1 rounded-lg text-xs font-medium text-foreground/50 hover:text-foreground/70 hover:bg-foreground/5 transition-colors duration-150"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="p-1.5 rounded-lg text-foreground/30 hover:text-destructive hover:bg-destructive/10 transition-colors duration-150"
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Color picker */}
      {showColors && (
        <div className="px-3 pb-1 animate-pop-in">
          <ColorPicker
            current={note.color as NoteColor}
            onChange={(color) => {
              onUpdate(note.id, { color });
              setShowColors(false);
            }}
          />
        </div>
      )}

      {/* Textarea */}
      <div className="px-3 pb-3 flex-1 overflow-hidden">
        <textarea
          ref={textareaRef}
          value={note.text}
          onChange={(e) => onUpdate(note.id, { text: e.target.value })}
          placeholder="Type something..."
          className="w-full h-full bg-transparent resize-none outline-none text-sm leading-relaxed text-foreground placeholder:text-foreground/30 font-sans cursor-text overflow-auto scrollbar-none"
        />
      </div>

      {/* Resize handle (bottom-right corner) */}
      <div
        className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize"
        onMouseDown={(e) => {
          e.preventDefault();
          const startX = e.screenX;
          const startY = e.screenY;
          const startW = window.innerWidth;
          const startH = window.innerHeight;

          const onMouseMove = (ev: MouseEvent) => {
            const newW = Math.max(160, startW + (ev.screenX - startX));
            const newH = Math.max(160, startH + (ev.screenY - startY));
            window.resizeTo(newW, newH);
          };

          const onMouseUp = () => {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
          };

          document.addEventListener("mousemove", onMouseMove);
          document.addEventListener("mouseup", onMouseUp);
        }}
      >
        <svg className="absolute bottom-1 right-1 opacity-30" width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="2" cy="8" r="1" fill="currentColor" />
          <circle cx="5" cy="8" r="1" fill="currentColor" />
          <circle cx="8" cy="8" r="1" fill="currentColor" />
          <circle cx="5" cy="5" r="1" fill="currentColor" />
          <circle cx="8" cy="5" r="1" fill="currentColor" />
          <circle cx="8" cy="2" r="1" fill="currentColor" />
        </svg>
      </div>
    </div>
  );
}
