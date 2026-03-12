import { motion } from "framer-motion";
import { Move, Maximize2, Pin, Save, Palette, Monitor } from "lucide-react";

const features = [
  {
    icon: Move,
    title: "Drag Anywhere",
    description: "Move notes freely on your desktop.",
    color: "text-note-yellow",
    bg: "bg-note-yellow/10",
  },
  {
    icon: Maximize2,
    title: "Resize Notes",
    description: "Adjust note size easily.",
    color: "text-note-blue",
    bg: "bg-note-blue/10",
  },
  {
    icon: Pin,
    title: "Pin Notes",
    description: "Lock important notes in place.",
    color: "text-note-pink",
    bg: "bg-note-pink/10",
  },
  {
    icon: Save,
    title: "Auto Save",
    description: "All notes automatically save.",
    color: "text-note-green",
    bg: "bg-note-green/10",
  },
  {
    icon: Palette,
    title: "Color Notes",
    description: "Choose different colors for each note.",
    color: "text-note-purple",
    bg: "bg-note-purple/10",
  },
  {
    icon: Monitor,
    title: "Start with Windows",
    description: "Launches automatically when your computer starts.",
    color: "text-note-yellow",
    bg: "bg-note-yellow/10",
  },
];

const Features = () => {
  return (
    <section className="py-32 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold font-display tracking-tight mb-4">
            Everything you need
          </h2>
          <p className="text-lg text-muted-foreground font-body max-w-md mx-auto">
            Simple, fast, and built for productivity.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="group rounded-2xl border border-border bg-card p-8 hover:border-primary/30 transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${feature.bg} mb-6`}>
                <feature.icon className={`h-6 w-6 ${feature.color}`} />
              </div>
              <h3 className="text-lg font-semibold font-display mb-2">{feature.title}</h3>
              <p className="text-muted-foreground font-body text-sm">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
