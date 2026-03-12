import { motion } from "framer-motion";
import previewMain from "@/assets/preview-main.jpg";
import previewDrag from "@/assets/preview-drag.jpg";
import previewMulti from "@/assets/preview-multi.jpg";

const previews = [
  { src: previewMain, alt: "DeskNote main desktop view with multiple sticky notes", label: "Desktop View" },
  { src: previewDrag, alt: "Dragging a sticky note on the desktop", label: "Drag & Drop" },
  { src: previewMulti, alt: "Multiple organized sticky notes with pins", label: "Organize Notes" },
];

const Preview = () => {
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
            See it in action
          </h2>
          <p className="text-lg text-muted-foreground font-body max-w-md mx-auto">
            Clean, minimal notes right on your desktop.
          </p>
        </motion.div>

        {/* Large main preview */}
        <motion.div
          className="mb-8 rounded-2xl overflow-hidden border border-border shadow-card"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <img
            src={previews[0].src}
            alt={previews[0].alt}
            className="w-full h-auto"
            loading="lazy"
          />
        </motion.div>

        {/* Two smaller previews */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {previews.slice(1).map((preview, index) => (
            <motion.div
              key={preview.label}
              className="rounded-2xl overflow-hidden border border-border shadow-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
            >
              <img
                src={preview.src}
                alt={preview.alt}
                className="w-full h-auto"
                loading="lazy"
              />
              <div className="p-4 bg-card border-t border-border">
                <p className="text-sm font-display text-muted-foreground">{preview.label}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Preview;
