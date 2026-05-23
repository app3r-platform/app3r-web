/**
 * tailwind.config.ts — WeeeU
 * Brand Color System v1 (2026-05-20)
 * Token source: BC Brand Color System v1 (Notion 366813ec-7277-8196-a1c6-d6ba8f2438d9)
 *
 * Role colors:
 *   weeeu-surface  #E1F7EC — พื้นการ์ด/แบนเนอร์อ่อน
 *   weeeu-primary  #0DC36C — สีหลัก ปุ่ม/header/ไอคอน
 *   weeeu-dark     #0A9B55 — hover/active/เส้นขอบเข้ม
 *   weeeu-text     #04331C — ข้อความบนพื้นสีอ่อน
 *
 * Semantic colors (ห้ามปนกับ role-primary):
 *   semantic-success  #10B981
 *   semantic-warning  #F59E0B
 *   semantic-danger   #EF4444
 *   semantic-info     #3B82F6
 */
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
        // ── WeeeU Role Colors ──────────────────────────────────────
        weeeu: {
          surface: "#E1F7EC",
          primary: "#0DC36C",
          dark:    "#0A9B55",
          text:    "#04331C",
        },
        // ── Semantic Colors (shared across all roles) ──────────────
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
