import { useRef, useState, useCallback, useEffect } from "react";
import { motion, useMotionValue, useDragControls } from "framer-motion";
import { Pin, Trash2, Palette } from "lucide-react";
import { Note, NoteColor } from "@/types/note";
import { ColorPicker } from "./ColorPicker";

const colorMap: Record<NoteColor, string> = {
  yellow: "bg-note-yellow",
  blue: "bg-note-blue",
  green: "bg-note-green",
  pink: "bg-note-pink",
  purple: "bg-note-purple",
};

interface StickyNoteProps {
  note: Note;
  onUpdate: (id: string, updates: Partial<Note>) => void;
  onDelete: (id: string) => void;
  onBringToFront: (id: string) => void;
  zIndex: number;
}

export function StickyNote({ note, onUpdate, onDelete, onBringToFront, zIndex }: StickyNoteProps) {
  const [showColors, setShowColors] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [size, setSize] = useState({ width: note.width || 220, height: note.height || 220 });
  const [pos, setPos] = useState({ x: note.x || 0, y: note.y || 0 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dragControls = useDragControls();
  

  const motionX = useMotionValue(0);
  const motionY = useMotionValue(0);

  useEffect(() => {
    setPos({ x: note.x || 0, y: note.y || 0 });
    motionX.set(0);
    motionY.set(0);
  }, [note.x, note.y, motionX, motionY]);

  useEffect(() => {
    setSize({ width: note.width || 220, height: note.height || 220 });
  }, [note.width, note.height]);

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

  const handleResizePointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);

    const startX = e.clientX;
    const startY = e.clientY;
    const startW = size.width || 220;
    const startH = size.height || 220;

    const onMove = (ev: PointerEvent) => {
      const newW = Math.max(160, startW + ev.clientX - startX);
      const newH = Math.max(160, startH + ev.clientY - startY);
      setSize({ width: newW, height: newH });
    };

    const onUp = () => {
      target.releasePointerCapture(e.pointerId);
      target.removeEventListener("pointermove", onMove);
      target.removeEventListener("pointerup", onUp);
      setSize((s) => {
        onUpdate(note.id, { width: s.width, height: s.height });
        return s;
      });
    };

    target.addEventListener("pointermove", onMove);
    target.addEventListener("pointerup", onUp);
  }, [size.width, size.height, note.id, onUpdate]);

  return (
    <div
      style={{
        position: "absolute",
        left: pos.x,
        top: pos.y,
        width: size.width,
        height: size.height,
        zIndex,
      }}
      onPointerDown={() => onBringToFront(note.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setShowColors(false); }}
      className="select-none"
    >
      <motion.div
        drag={!note.pinned}
        dragControls={dragControls}
        dragListener={false}
        dragMomentum={false}
        dragElastic={0}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.6, opacity: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        style={{ x: motionX, y: motionY }}
        onDragEnd={() => {
          const newX = pos.x + motionX.get();
          const newY = pos.y + motionY.get();
          onUpdate(note.id, { x: newX, y: newY });
        }}
        className={`w-full h-full ${colorMap[note.color]} rounded-xl transition-shadow duration-200 ${isHovered ? "note-shadow-hover" : "note-shadow"} relative overflow-hidden flex flex-col`}
      >
        {/* Drag handle — header bar */}
        <div
          className="flex items-center justify-between px-3 pt-2.5 pb-1 cursor-grab active:cursor-grabbing"
          onPointerDown={(e) => {
            if (!note.pinned) dragControls.start(e);
          }}
        >
          <div className="flex gap-1">
            <button
              onClick={() => onUpdate(note.id, { pinned: !note.pinned })}
              onPointerDown={(e) => e.stopPropagation()}
              className={`p-1.5 rounded-lg transition-colors duration-150 ${note.pinned ? "bg-foreground/10 text-foreground" : "text-foreground/40 hover:text-foreground/70 hover:bg-foreground/5"}`}
              title={note.pinned ? "Unpin" : "Pin"}
            >
              <Pin size={14} className={note.pinned ? "fill-current" : ""} />
            </button>
            <button
              onClick={() => setShowColors(!showColors)}
              onPointerDown={(e) => e.stopPropagation()}
              className="p-1.5 rounded-lg text-foreground/40 hover:text-foreground/70 hover:bg-foreground/5 transition-colors duration-150"
              title="Change color"
            >
              <Palette size={14} />
            </button>
          </div>
          {confirmDelete ? (
            <div className="flex items-center gap-1 animate-pop-in" onPointerDown={(e) => e.stopPropagation()}>
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
              onPointerDown={(e) => e.stopPropagation()}
              className="p-1.5 rounded-lg text-foreground/30 hover:text-destructive hover:bg-destructive/10 transition-colors duration-150"
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>

        {/* Color picker */}
        {showColors && (
          <div className="px-3 pb-1 animate-pop-in">
            <ColorPicker
              current={note.color}
              onChange={(color) => { onUpdate(note.id, { color }); setShowColors(false); }}
            />
          </div>
        )}

        {/* Textarea */}
        <div className="px-3 pb-3 flex-1 overflow-hidden">
          <textarea
            ref={textareaRef}
            value={note.text}
            onChange={(e) => onUpdate(note.id, { text: e.target.value })}
            onPointerDown={(e) => e.stopPropagation()}
            placeholder="Type something..."
            className="w-full h-full bg-transparent resize-none outline-none text-sm leading-relaxed text-foreground placeholder:text-foreground/30 font-sans cursor-text overflow-auto scrollbar-none"
          />
        </div>
      </motion.div>

      {/* Resize handle — outside motion.div */}
      <div
        onPointerDown={handleResizePointerDown}
        className="absolute bottom-0 right-0 w-8 h-8 cursor-nwse-resize group touch-none z-10"
      >
        <svg
          className="absolute bottom-1.5 right-1.5 text-foreground/25 group-hover:text-foreground/50 transition-colors pointer-events-none"
          width="12"
          height="12"
          viewBox="0 0 12 12"
        >
          <line x1="11" y1="1" x2="1" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="11" y1="5" x2="5" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="11" y1="9" x2="9" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}
