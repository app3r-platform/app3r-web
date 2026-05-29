import type { Config } from "tailwindcss";

/**
 * W-Round-1 Wave 2: brand token system
 *
 * website-brand = #1E9E5A (เขียว-eco เข้ม) per Brand v1 Gen 100 update
 * (เปลี่ยนจาก #3A7CB8 ตามคำสั่ง อ.PP "เขียว" ≥6 ครั้ง — HUB Gen 36 Two-eyes ชี้)
 * Source: 366813ec-7277-8196-a1c6-d6ba8f2438d9
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "website-brand": {
          50: "#E8F7EE",
          100: "#C7EBD4",
          200: "#9ADCB4",
          300: "#6DCD93",
          400: "#3FBE73",
          500: "#1E9E5A", // brand primary (eco green per Brand v1 Gen 100)
          600: "#188048",
          700: "#136337",
          800: "#0E4626",
          900: "#082A16",
        },
      },
    },
  },
  plugins: [],
};

export default config;
