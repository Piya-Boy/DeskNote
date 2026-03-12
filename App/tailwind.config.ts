import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}", "./index.html", "./note.html"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Nunito", "sans-serif"],
      },
      colors: {
        foreground: "hsl(var(--foreground))",
        destructive: "hsl(var(--destructive))",
        note: {
          yellow: "hsl(var(--note-yellow))",
          blue: "hsl(var(--note-blue))",
          green: "hsl(var(--note-green))",
          pink: "hsl(var(--note-pink))",
          purple: "hsl(var(--note-purple))",
        },
      },
      keyframes: {
        "pop-in": {
          "0%": { transform: "scale(0.8)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "pop-in": "pop-in 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "fade-in": "fade-in 0.2s ease-out",
      },
    },
  },
  plugins: [],
} satisfies Config;
