/**
 * jest.config.ts — Next.js compatible Jest configuration
 * Sub-CMD-2 Wave 1 (App3R-WeeeU)
 * Template: App3R-Backend → HUB → WeeeU
 */
import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  // ชี้ไปที่ root ของ Next.js app (ที่มี next.config.ts)
  dir: "./",
});

const config: Config = {
  // ใช้ jsdom สำหรับ DOM testing (React components)
  testEnvironment: "jsdom",

  // setupFiles รันหลัง test framework init
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],

  // Coverage — ชี้ไปที่ lib/ + components/ (WeeeU ไม่มี src/)
  collectCoverageFrom: [
    "lib/**/*.{ts,tsx}",
    "components/**/*.{ts,tsx}",
    "!lib/**/*.d.ts",
    "!**/__tests__/**",
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
  testMatch: [
    "<rootDir>/tests/**/*.test.{ts,tsx}",
    "<rootDir>/**/__tests__/**/*.{ts,tsx}",
  ],

  // Path alias สำหรับ @/* → root ของ WeeeU app
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
};

export default createJestConfig(config);
