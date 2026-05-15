/**
 * playwright.config.ts — Sub-CMD-9: E2E Test Suite (Wave 3)
 *
 * Scope: e2e/shared/ + e2e/parts-b2b/ (Backend-owned per W4)
 * Retry: max 2 per W5 (fail twice = block merge)
 *
 * Tests target the Hono backend API directly (API-level E2E).
 * No browser UI tests in this phase — Playwright is used in API test mode.
 *
 * CI: playwright-tests.yml (Backend sole owner — W4)
 */
import { defineConfig } from '@playwright/test'

export default defineConfig({
  // Test directories
  testDir: './e2e',
  testMatch: '**/*.spec.ts',

  // W5: max 2 retries on failure — 3rd fail = block merge
  retries: process.env.CI ? 2 : 0,

  // Parallel workers
  workers: process.env.CI ? 2 : undefined,

  // Timeout per test
  timeout: 30_000,

  // Reporter
  reporter: process.env.CI
    ? [['github'], ['html', { outputFolder: 'playwright-report', open: 'never' }]]
    : [['html', { open: 'on-failure' }]],

  use: {
    // Backend base URL — set via env or default
    baseURL: process.env.API_BASE_URL ?? 'http://localhost:8787',

    // Extra HTTP headers
    extraHTTPHeaders: {
      Accept: 'application/json',
    },

    // Trace on retry (for debugging flaky tests)
    trace: 'on-first-retry',
  },

  // No browser launch needed for API tests — use APIRequestContext directly
  projects: [
    {
      name: 'api-tests',
      use: {},
    },
  ],
})
