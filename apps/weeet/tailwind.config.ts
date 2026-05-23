import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── WeeeT role colors (Brand Color System v1 — Advisor Gen 70) ──────
        // Source: D:\ClaudeCode\App3R\logo\WeeeT.png (ฟ้าสด)
        // Notion: 366813ec-7277-8196-a1c6-d6ba8f2438d9
        weeet: {
          surface: "#E4F1FD", // card/banner bg (light)
          primary: "#1696F9", // main button / header / icon
          dark:    "#0F76CC", // hover / active / border
          text:    "#042C53", // text on light bg
        },
        // ── Semantic colors — ใช้ร่วมทุกบทบาท (ห้ามใช้แทน weeet role) ────
        semantic: {
          success: "#10B981",
          warning: "#F59E0B",
          danger:  "#EF4444",
          info:    "#3B82F6",
        },
      },
    },
  },
  plugins: [],
};

export default config;
