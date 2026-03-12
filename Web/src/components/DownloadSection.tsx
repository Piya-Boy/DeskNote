import { motion } from "framer-motion";
import { Download, FileText, Calendar, HardDrive } from "lucide-react";
import { Button } from "@/components/ui/button";

const DownloadSection = () => {
  return (
    <section id="download" className="py-32 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold font-display tracking-tight mb-4">
            Download DeskNote
          </h2>
          <p className="text-lg text-muted-foreground font-body mb-12">
            Get started in seconds. Free forever.
          </p>
        </motion.div>

        <motion.div
          className="rounded-2xl border border-border bg-card p-10 shadow-card"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Button
            size="lg"
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-10 py-7 text-lg font-display font-semibold shadow-glow mb-8"
            asChild
          >
            <a href="https://github.com/Piya-Boy/DeskNote/releases/download/v1.0.0/DeskNote.Setup.1.0.0.exe">
              <Download className="mr-3 h-6 w-6" />
              Download for Windows
            </a>
          </Button>

          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground font-body">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>DeskNote Setup 1.0.0.exe</span>
            </div>
            <div className="flex items-center gap-2">
              <HardDrive className="h-4 w-4" />
              <span>~99 MB</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>v1.0.0 · March 2026</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default DownloadSection;
