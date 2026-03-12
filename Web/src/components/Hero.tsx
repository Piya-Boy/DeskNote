import { motion } from "framer-motion";
import { Download, Github } from "lucide-react";
import { Button } from "@/components/ui/button";

const FloatingNote = ({
  color,
  className,
  delay = 0,
}: {
  color: string;
  className: string;
  delay?: number;
}) => (
  <motion.div
    className={`absolute rounded-lg opacity-20 ${className}`}
    style={{ backgroundColor: color }}
    animate={{
      y: [0, -20, 0],
      rotate: [0, 3, -2, 0],
    }}
    transition={{
      duration: 6,
      repeat: Infinity,
      delay,
      ease: "easeInOut",
    }}
  />
);

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Glow effect */}
      <div className="absolute inset-0 gradient-glow" />

      {/* Floating sticky notes */}
      <FloatingNote color="hsl(48 96% 53%)" className="w-20 h-20 top-[15%] left-[10%]" delay={0} />
      <FloatingNote color="hsl(217 91% 60%)" className="w-16 h-16 top-[25%] right-[15%]" delay={1} />
      <FloatingNote color="hsl(330 81% 60%)" className="w-14 h-14 bottom-[30%] left-[20%]" delay={2} />
      <FloatingNote color="hsl(142 71% 45%)" className="w-18 h-18 bottom-[20%] right-[10%]" delay={3} />
      <FloatingNote color="hsl(263 70% 50%)" className="w-12 h-12 top-[40%] left-[5%]" delay={1.5} />

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-1.5 mb-8">
            <div className="w-2 h-2 rounded-full bg-note-green" />
            <span className="text-sm text-muted-foreground font-body">Free & Open Source</span>
          </div>
        </motion.div>

        <motion.div
          className="flex justify-center mb-6"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
        >
          <img
            src="/img/icon/logo.png"
            alt="DeskNote Logo"
            className="w-24 h-24 md:w-32 md:h-32 drop-shadow-2xl"
          />
        </motion.div>

        <motion.h1
          className="text-6xl md:text-8xl font-bold font-display tracking-tight mb-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          Desk
          <span className="text-primary">Note</span>
        </motion.h1>

        <motion.p
          className="text-xl md:text-2xl text-muted-foreground mb-4 font-body"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          Simple sticky notes for your desktop.
        </motion.p>

        <motion.p
          className="text-base md:text-lg text-muted-foreground/70 max-w-xl mx-auto mb-12 font-body"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          Create notes anywhere on your desktop.
          Drag, resize, pin and organize your thoughts instantly.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <Button
            size="lg"
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-8 py-6 text-base font-display font-semibold shadow-glow"
            asChild
          >
            <a href="#download">
              <Download className="mr-2 h-5 w-5" />
              Download for Windows
            </a>
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="border-border text-foreground hover:bg-secondary rounded-xl px-8 py-6 text-base font-display"
            asChild
          >
            <a href="https://github.com/Piya-Boy/DeskNote/tree/main/App" target="_blank" rel="noopener noreferrer">
              <Github className="mr-2 h-5 w-5" />
              GitHub
            </a>
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
