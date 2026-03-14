export type NoteColor = "yellow" | "blue" | "green" | "pink" | "purple" | "orange";

export interface Note {
  id: string;
  text: string;
  color: NoteColor;
  x: number;
  y: number;
  width: number;
  height: number;
  pinned: boolean;
  collapsed: boolean;
}
