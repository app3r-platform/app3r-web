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
        'admin-primary': '#2C5E8C',
        'admin-dark':    '#1F4566',
        'admin-surface': '#EAF0F6',
        'admin-text':    '#0F2235',
        'brand-success': '#10B981',
        'brand-warning': '#F59E0B',
        'brand-danger':  '#EF4444',
        'brand-info':    '#3B82F6',
      },
    },
  },
  plugins: [],
};

export default config;
