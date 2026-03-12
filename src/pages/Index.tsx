import { useEffect } from "react";

const Index = () => {
  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center p-8">
      <div className="text-center space-y-4 max-w-md animate-pop-in">
        <h1 className="text-2xl font-bold text-foreground/80">DeskNote is running</h1>
        <p className="text-muted-foreground">
          Use <kbd className="px-2 py-1 bg-muted rounded border text-xs font-sans">Ctrl + Shift + N</kbd> to create a new sticky note.
        </p>
        <p className="text-sm text-muted-foreground/60 italic">
          You can also manage notes from the system tray.
        </p>
      </div>
    </div>
  );
};

export default Index;
