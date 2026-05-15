/**
 * apps/weeet/playwright.config.ts — Sub-CMD-9 Wave 3
 *
 * WeeeT E2E Test configuration (Playwright API testing mode)
 * Engineering Protocol 11: Page Object Model (API variant)
 * Engineering Protocol 6: E2E ≤ 5 min total runtime
 * Watch W5: retry max 2 — fail ซ้ำ = block merge
 * Watch W4: ห้ามแตะ .github/workflows/ — Backend เป็นเจ้าของ
 *
 * หมายเหตุ:
 * - WeeeT E2E ใช้ APIRequestContext (no browser)
 * - ทดสอบ backend API ที่ WeeeT พึ่งพา
 * - baseURL → WeeeT dev server (port 3003) ซึ่ง proxy /api/* → backend:8000
 */

import { defineConfig } from "@playwright/test";
import path from "path";

export default defineConfig({
  // testDir: relative จาก app dir → ไปที่ e2e/weeet/ ที่ repo root
  testDir: path.join(__dirname, "../../e2e/weeet"),

  // W5: retry max 2 — fail ซ้ำ = block merge
  retries: process.env.CI ? 2 : 0,

  // Protocol 6: E2E ≤ 5 min total runtime
  timeout: 30_000, // 30s per test
  globalTimeout: 300_000, // 5 min total

  // Sequential for stability
  workers: 1,
  fullyParallel: false,

  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }]]
    : [["html", { open: "on-failure" }], ["list"]],

  use: {
    // WeeeT dev server — proxies /api/* to backend:8000
    baseURL: "http://localhost:3003",
    extraHTTPHeaders: {
      "Content-Type": "application/json",
    },
  },

  // Start WeeeT dev server before tests
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3003",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    cwd: __dirname, // apps/weeet/
    env: {
      NODE_ENV: "development", // enable dev auth bypass
    },
  },

  projects: [
    {
      name: "api",
      // No browser project needed — API testing only
    },
  ],
});
