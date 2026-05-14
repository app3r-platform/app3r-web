/**
 * jest.config.js — Next.js compatible Jest configuration
 * Sub-CMD-2 Wave 1 (App3R-Backend Template → Admin)
 *
 * ใช้ SWC transformer (เร็วกว่า babel-jest) สำหรับ TypeScript + TSX
 * Admin app: @/* → ./* (root, ไม่มี src/)
 * หมายเหตุ: ใช้ .js แทน .ts เพราะ jest 30 ต้องการ ts-node สำหรับ .ts config
 */
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],

  collectCoverageFrom: [
    'lib/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  coverageThresholds: {
    global: {
      lines: 60,
      functions: 60,
      statements: 60,
      branches: 50,
    },
  },

  testMatch: [
    '<rootDir>/tests/**/*.test.{ts,tsx}',
  ],

  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
}

module.exports = createJestConfig(config)
