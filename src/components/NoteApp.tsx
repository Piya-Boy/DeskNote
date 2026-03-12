import { useState, useRef, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Pin, Palette, Trash2, Minus } from 'lucide-react'
import { ColorPicker } from './ColorPicker'
import { NoteColor } from '@/types/note'

declare global {
  interface Window {
    electronAPI: {
      onNoteData: (cb: (data: NoteData) => void) => void
      updateNote: (updates: Partial<NoteData>) => void
      deleteNote: () => void
      startDrag: () => void
      bringToFront: () => void
      collapse: () => void
      expand: () => void
      resizeStart: (startW: number, startH: number) => void
      resizeStop: () => void
    }
  }
}

interface NoteData {
  id: string
  text: string
  color: NoteColor
  pinned: boolean
  collapsed: boolean
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
  const [collapsed, setCollapsed] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    window.electronAPI?.onNoteData((data) => {
      setNote(data)
      setCollapsed(!!data.collapsed)
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
    // padding 4px รอบ — เป็น transparent border ให้ OS จับ resize ได้
    <div
      className="w-full h-full select-none relative"
      style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      onMouseDown={() => window.electronAPI?.bringToFront()}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); if (!showColors && !confirmDelete) { /* allow hide */ } }}
    >
      <div
        className={`w-full h-full ${colorMap[note.color]} flex flex-col rounded-xl`}
      >
        {/* Header / drag handle */}
        <div
          className="flex items-center justify-between px-3 pt-2.5 pb-1 cursor-grab active:cursor-grabbing shrink-0"
          style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
        >
          <div
            className={`flex gap-1 transition-opacity duration-200 ${isHovered || showColors ? 'opacity-100' : 'opacity-0'}`}
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          >
            <motion.button
              onClick={() => update({ pinned: !note.pinned })}
              className={`p-1.5 rounded-lg transition-colors duration-150 ${note.pinned ? 'bg-foreground/10 text-foreground' : 'text-foreground/40 hover:text-foreground/70 hover:bg-foreground/5'}`}
              title={note.pinned ? 'Unpin' : 'Pin'}
              whileTap={{ scale: 0.85 }}
              animate={note.pinned ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 0.2 }}
            >
              <Pin size={14} className={note.pinned ? 'fill-current' : ''} />
            </motion.button>
            <button
              onClick={() => setShowColors(!showColors)}
              className="p-1.5 rounded-lg text-foreground/40 hover:text-foreground/70 hover:bg-foreground/5 transition-colors duration-150"
              title="Change color"
            >
              <Palette size={14} />
            </button>
          </div>

          <div
            className={`flex items-center gap-0.5 transition-opacity duration-200 ${isHovered || confirmDelete ? 'opacity-100' : 'opacity-0'}`}
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          >
            <button
              onClick={() => {
                if (collapsed) {
                  window.electronAPI?.expand()
                  setCollapsed(false)
                  update({ collapsed: false })
                } else {
                  window.electronAPI?.collapse()
                  setCollapsed(true)
                  update({ collapsed: true })
                  setShowColors(false)
                  setConfirmDelete(false)
                }
              }}
              className="p-1.5 rounded-lg text-foreground/30 hover:text-foreground/60 hover:bg-foreground/5 transition-colors duration-150"
              title={collapsed ? 'Expand' : 'Collapse'}
            >
              <Minus size={14} />
            </button>

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
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Color picker */}
        {!collapsed && showColors && (
          <div className="px-3 pb-1 shrink-0">
            <ColorPicker
              current={note.color}
              onChange={(color) => { update({ color }); setShowColors(false) }}
            />
          </div>
        )}

        {/* Textarea */}
        {!collapsed && (
          <div className="px-3 pb-3 flex-1 overflow-hidden">
            <textarea
              ref={textareaRef}
              value={note.text}
              onChange={(e) => update({ text: e.target.value })}
              placeholder="Type something..."
              className="w-full h-full bg-transparent resize-none outline-none text-sm leading-relaxed text-foreground placeholder:text-foreground/30 font-sans cursor-text overflow-auto scrollbar-none"
            />
          </div>
        )}
      </div>

      {/* Resize handle */}
      {!collapsed && (
        <div
          className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize z-20"
          onPointerDown={(e) => {
            e.preventDefault()
            e.stopPropagation()
              // setPointerCapture ทำให้ element รับ pointermove/pointerup แม้ cursor ออกนอก window
              ; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
            window.electronAPI?.resizeStart(window.innerWidth, window.innerHeight)
          }}
          onPointerUp={(e) => {
            ; (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
            window.electronAPI?.resizeStop()
          }}
        >
          <svg
            className="absolute bottom-1 right-1 text-foreground/25 pointer-events-none"
            width="12" height="12" viewBox="0 0 12 12"
          >
            <line x1="11" y1="1" x2="1" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="11" y1="5" x2="5" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="11" y1="9" x2="9" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      )}
    </div>
  )
}
