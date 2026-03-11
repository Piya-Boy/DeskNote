import { useState, useRef, useCallback, useEffect } from 'react'
import { Pin, Trash2, Palette, X } from 'lucide-react'
import { ColorPicker } from './ColorPicker'
import { NoteColor } from '@/types/note'

declare global {
  interface Window {
    electronAPI: {
      onNoteData: (cb: (data: NoteData) => void) => void
      updateNote: (updates: Partial<NoteData>) => void
      deleteNote: () => void
      startDrag: () => void
      resizeTo: (width: number, height: number) => void
      startResize: (startW: number, startH: number) => void
      stopResize: () => void
    }
  }
}

interface NoteData {
  id: string
  text: string
  color: NoteColor
  pinned: boolean
  width: number
  height: number
}

const colorMap: Record<NoteColor, string> = {
  yellow: 'bg-note-yellow',
  blue: 'bg-note-blue',
  green: 'bg-note-green',
  pink: 'bg-note-pink',
  purple: 'bg-note-purple',
}

export function NoteApp() {
  const [note, setNote] = useState<NoteData | null>(null)
  const [showColors, setShowColors] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    window.electronAPI?.onNoteData((data) => {
      setNote(data)
    })
  }, [])

  const autoGrow = useCallback(() => {
    const el = textareaRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = Math.max(el.scrollHeight, 120) + 'px'
    }
  }, [])

  useEffect(() => {
    autoGrow()
  }, [note?.text, autoGrow])

  const update = useCallback((updates: Partial<NoteData>) => {
    setNote((prev) => prev ? { ...prev, ...updates } : prev)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      window.electronAPI?.updateNote(updates)
    }, 300)
  }, [])

  const handleDelete = useCallback(() => {
    window.electronAPI?.deleteNote()
  }, [])

  if (!note) {
    return (
      <div className="w-full h-full bg-note-yellow flex items-center justify-center">
        <span className="text-foreground/30 text-sm">Loading...</span>
      </div>
    )
  }

  return (
    <div className="w-full h-full relative select-none" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
    <div
      className={`w-full h-full ${colorMap[note.color]} flex flex-col rounded-xl overflow-hidden`}
      style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
    >
      {/* Header / drag handle */}
      <div
        className="flex items-center justify-between px-3 pt-2.5 pb-1 cursor-grab active:cursor-grabbing"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
        onMouseDown={() => window.electronAPI?.startDrag()}
      >
        <div className="flex gap-1" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <button
            onClick={() => update({ pinned: !note.pinned })}
            className={`p-1.5 rounded-lg transition-colors duration-150 ${note.pinned ? 'bg-foreground/10 text-foreground' : 'text-foreground/40 hover:text-foreground/70 hover:bg-foreground/5'}`}
            title={note.pinned ? 'Unpin' : 'Pin'}
          >
            <Pin size={14} className={note.pinned ? 'fill-current' : ''} />
          </button>
          <button
            onClick={() => setShowColors(!showColors)}
            className="p-1.5 rounded-lg text-foreground/40 hover:text-foreground/70 hover:bg-foreground/5 transition-colors duration-150"
            title="Change color"
          >
            <Palette size={14} />
          </button>
        </div>

        <div style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <button
                onClick={handleDelete}
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
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Color picker */}
      {showColors && (
        <div className="px-3 pb-1">
          <ColorPicker
            current={note.color}
            onChange={(color) => { update({ color }); setShowColors(false) }}
          />
        </div>
      )}

      {/* Textarea */}
      <div className="px-3 pb-3 flex-1 overflow-hidden">
        <textarea
          ref={textareaRef}
          value={note.text}
          onChange={(e) => update({ text: e.target.value })}
          placeholder="Type something..."
          className="w-full h-full bg-transparent resize-none outline-none text-sm leading-relaxed text-foreground placeholder:text-foreground/30 font-sans cursor-text overflow-auto scrollbar-none"
        />
      </div>

    </div>

    {/* Resize handle — outside overflow-hidden */}
    <div
      className="absolute bottom-0 right-0 w-8 h-8 cursor-nwse-resize z-10"
      style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      onMouseDown={(e) => {
        e.preventDefault()
        window.electronAPI?.startResize(window.innerWidth, window.innerHeight)
        const onUp = () => {
          window.electronAPI?.stopResize()
          window.removeEventListener('mouseup', onUp)
        }
        window.addEventListener('mouseup', onUp)
      }}
    >
      <svg
        className="absolute bottom-1.5 right-1.5 text-foreground/25 pointer-events-none"
        width="12" height="12" viewBox="0 0 12 12"
      >
        <line x1="11" y1="1" x2="1" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="11" y1="5" x2="5" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="11" y1="9" x2="9" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </div>
    </div>
  )
}
