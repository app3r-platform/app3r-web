/**
 * apps/weeeu/playwright.config.ts — Sub-CMD-9 Wave 3
 *
 * WeeeU E2E Test configuration (Playwright)
 * Engineering Protocol 11: Page Object Model
 * Engineering Protocol 6: E2E ≤ 5 min total runtime
 * Watch W5: retry max 2 — fail ซ้ำ = block merge
 *
 * หมายเหตุ:
 * - testDir → e2e/weeeu/ (relative จาก repo root)
 * - webServer: start dev server ก่อน run tests
 * - reuseExistingServer: local dev ใช้ server ที่รันอยู่แล้วได้
 * - ห้ามแตะ .github/workflows/ — Backend เป็นเจ้าของ (W4)
 */

import { defineConfig, devices } from '@playwright/test';
import path from 'path';

export default defineConfig({
  // testDir: relative จาก app dir → ไปที่ e2e/weeeu/ ที่ root
  testDir: path.join(__dirname, '../../e2e/weeeu'),

  // W5: retry max 2 — fail ซ้ำ = block merge
  retries: process.env.CI ? 2 : 0,

  // Protocol 6: E2E ≤ 5 min total runtime
  timeout: 30_000,      // 30s per test
  globalTimeout: 300_000, // 5 min total

  // Sequential for stability (avoid race conditions)
  workers: 1,
  fullyParallel: false,

  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }]]
    : [['html', { open: 'on-failure' }], ['list']],

  use: {
    baseURL: 'http://localhost:3002',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Locale ภาษาไทย สำหรับ UI ที่แสดงภาษาไทย
    locale: 'th-TH',
  },

  // Start dev server ก่อน run tests
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3002',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    cwd: __dirname, // apps/weeeu/
    env: {
      NODE_ENV: 'development', // enable dev auth bypass
    },
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
