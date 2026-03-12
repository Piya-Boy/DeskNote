import { NoteColor } from "@/types/note";

const colors: { key: NoteColor; className: string }[] = [
  { key: "yellow", className: "bg-note-yellow" },
  { key: "blue", className: "bg-note-blue" },
  { key: "green", className: "bg-note-green" },
  { key: "pink", className: "bg-note-pink" },
  { key: "purple", className: "bg-note-purple" },
];

interface ColorPickerProps {
  current: NoteColor;
  onChange: (color: NoteColor) => void;
}

export function ColorPicker({ current, onChange }: ColorPickerProps) {
  return (
    <div className="flex gap-1.5">
      {colors.map(({ key, className }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`w-5 h-5 rounded-full ${className} border-2 transition-transform duration-150 hover:scale-110 ${
            current === key ? "border-foreground/40 scale-110" : "border-foreground/10"
          }`}
        />
      ))}
    </div>
  );
}
