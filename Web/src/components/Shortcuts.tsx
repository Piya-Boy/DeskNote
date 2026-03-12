import { motion } from "framer-motion";
import { Keyboard } from "lucide-react";

const shortcuts = [
  {
    keys: ["Ctrl", "Shift", "N"],
    description: "Create a new note",
  },
  {
    keys: ["Ctrl", "Shift", "V"],
    description: "New note from clipboard",
  },
  {
    keys: ["Ctrl", "Shift", "H"],
    description: "Toggle show / hide all notes",
  },
];

const Key = ({ children }: { children: string }) => (
  <kbd className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 rounded-lg border border-border bg-secondary text-foreground text-xs font-mono font-semibold shadow-sm">
    {children}
  </kbd>
);

const Shortcuts = () => {
  return (
    <section className="py-32 px-6">
      <div className="max-w-3xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold font-display tracking-tight mb-4">
            Keyboard shortcuts
          </h2>
          <p className="text-lg text-muted-foreground font-body max-w-md mx-auto">
            Quick actions at your fingertips.
          </p>
        </motion.div>

        <motion.div
          className="rounded-2xl border border-border bg-card p-8 shadow-card"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
              <Keyboard className="h-5 w-5 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground font-body">
              Global shortcuts — works from anywhere on your desktop
            </span>
          </div>

          <div className="space-y-5">
            {shortcuts.map((shortcut, index) => (
              <motion.div
                key={shortcut.description}
                className="flex items-center justify-between gap-4"
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.15 + index * 0.08 }}
              >
                <span className="text-sm md:text-base text-muted-foreground font-body">
                  {shortcut.description}
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  {shortcut.keys.map((key, i) => (
                    <span key={i} className="flex items-center gap-1.5">
                      <Key>{key}</Key>
                      {i < shortcut.keys.length - 1 && (
                        <span className="text-muted-foreground/50 text-xs">+</span>
                      )}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Shortcuts;
