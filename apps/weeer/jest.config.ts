/**
 * jest.config.ts — WeeeR Next.js Jest Configuration
 * Sub-CMD-2 Wave 1 (Template: App3R-Backend → HUB → WeeeR)
 *
 * ใช้ SWC transformer + next/jest สำหรับ:
 *  - TypeScript + TSX
 *  - Next.js path aliases (@/*)
 *  - CSS/image mocks
 */
import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  // ชี้ไปที่ root ของ WeeeR Next.js app
  dir: "./",
});

const config: Config = {
  // ใช้ jsdom สำหรับ DOM testing (React components)
  testEnvironment: "jsdom",

  // setupFiles ที่รันหลัง test framework init
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],

  // Coverage — WeeeR ไม่มี src/ folder ใช้ components/ + lib/ แทน
  collectCoverageFrom: [
    "components/**/*.{ts,tsx}",
    "lib/**/*.{ts,tsx}",
    "!**/*.d.ts",
    "!**/*.stories.{ts,tsx}",
  ],
  coverageThreshold: {
    global: {
      lines: 60,
      functions: 60,
      statements: 60,
      branches: 50,
    },
  },

  // Test file patterns
  testMatch: ["<rootDir>/tests/**/*.test.{ts,tsx}"],

  // Module name mapper — @/* → project root (WeeeR ไม่มี src/ folder)
  // next/jest.js auto-inject จาก tsconfig แต่ WeeeR ใช้ "./*" ไม่ใช่ "src/*"
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
};

export default createJestConfig(config);
