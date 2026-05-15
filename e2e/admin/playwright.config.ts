/**
 * e2e/admin/playwright.config.ts — Admin-specific Playwright config
 *
 * Standalone config for running admin E2E tests independently.
 * Used BEFORE Backend's root playwright.config.ts is merged.
 *
 * After Backend merges:
 *   → Root playwright.config.ts takes over (testDir: './e2e')
 *   → This config is redundant but harmless
 *
 * Usage:
 *   cd D:\ClaudeCode\App3R\web
 *   pnpm exec playwright test --config=e2e/admin/playwright.config.ts
 *
 * W5: retries: 2 (fail twice = block merge)
 * CI: flagged for Backend to add to playwright-tests.yml (W4)
 *
 * Sub-CMD-9: 361813ec-7277-81d3-a2b2-dffb9c71bfe8
 */
import { defineConfig } from '@playwright/test'

export default defineConfig({
  // Only admin specs
  testDir: '.',
  testMatch: '**/*.spec.ts',

  // W5: max 2 retries
  retries: process.env.CI ? 2 : 0,

  workers: process.env.CI ? 2 : undefined,
  timeout: 30_000,

  reporter: process.env.CI
    ? [['github'], ['html', { outputFolder: '../../playwright-report/admin', open: 'never' }]]
    : [['html', { open: 'on-failure' }]],

  use: {
    // Backend API URL (admin E2E tests are API-level, not browser)
    baseURL: process.env.API_BASE_URL ?? 'http://localhost:8787',
    extraHTTPHeaders: { Accept: 'application/json' },
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'admin-api-tests',
      use: {},
    },
  ],
})
