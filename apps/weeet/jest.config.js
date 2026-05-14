/**
 * jest.config.js — WeeeT Next.js Jest configuration
 * Sub-CMD-2 Wave 1 (based on Backend Lead template)
 *
 * ใช้ .js แทน .ts เพราะ jest 30 ต้องการ ts-node สำหรับ .ts config
 * WeeeT tsconfig: "@/*" → "./*" (root, ไม่มี src/)
 */
const nextJest = require("next/jest");

const createJestConfig = nextJest({ dir: "./" });

/** @type {import('jest').Config} */
const config = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],

  collectCoverageFrom: [
    "lib/**/*.{ts,tsx}",
    "components/**/*.{ts,tsx}",
    "!**/*.d.ts",
    "!**/node_modules/**",
    "!lib/dal/errors.ts",
  ],
  coverageThreshold: {
    global: { lines: 60, functions: 60, statements: 60, branches: 50 },
  },

  testMatch: ["<rootDir>/tests/**/*.test.{ts,tsx}"],

  // WeeeT: @/* → ./* (root)
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
};

module.exports = createJestConfig(config);
