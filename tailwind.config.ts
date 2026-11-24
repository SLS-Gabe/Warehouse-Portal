import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        green: {
          DEFAULT: "#2e7d52",
          light: "#e8f5ee",
          mid: "#c4e4d2",
          dark: "#1f5a3a",
        },
        bg: "#f2f2f0",
        surface: "#ffffff",
        border: "#e4e4e0",
        text: {
          DEFAULT: "#1a1a18",
          muted: "#6b6b66",
          light: "#9b9b96",
        },
      },
      fontFamily: {
        sans: ["'DM Sans'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
      borderRadius: {
        card: "10px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.07)",
      },
    },
  },
  plugins: [],
};

export default config;
