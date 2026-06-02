/**
 * e2e/weeeu/pages/DashboardPage.ts — Page Object Model
 * Sub-CMD-9 Wave 3 — WeeeU E2E Tests
 *
 * Page: /dashboard
 * Engineering Protocol 11: Page Object Model
 */

import { type Locator, type Page } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;

  readonly greeting: Locator;
  readonly walletSilver: Locator;
  readonly repairQuickAction: Locator;
  readonly resellQuickAction: Locator;
  readonly scrапQuickAction: Locator;
  readonly maintainQuickAction: Locator;
  readonly profileLink: Locator;

  constructor(page: Page) {
    this.page = page;
    // Greeting contains สวัสดี
    this.greeting           = page.locator('text=สวัสดี');
    // Silver Point wallet card
    this.walletSilver       = page.locator('text=Silver Point');
    // Batch1 redesign: quickActions removed → service feed cards (hasActivity) + bottom nav tabs
    // feed cards: "ซื้อ-ขายมือสอง" (href=/listings), "งานซ่อม" (href=/repair)
    this.repairQuickAction  = page.locator('a[href="/repair"], a:has-text("งานซ่อม"), text=งานซ่อม').first();
    this.resellQuickAction  = page.locator('a[href="/listings"], a:has-text("ซื้อ-ขายมือสอง"), text=ซื้อ-ขายมือสอง').first();
    this.scrапQuickAction   = page.locator('text=ซากเครื่อง').first(); // bottom nav tab
    this.maintainQuickAction = page.locator('text=บำรุงรักษา').first(); // bottom nav tab
    // Profile: accessible via URL (no direct link in bottom nav — nav goes /dashboard as account hub)
    this.profileLink        = page.locator('a[href="/dashboard"]:has-text("บัญชีของฉัน")').first();
  }

  async goto() {
    await this.page.goto('/dashboard');
  }

  async isLoaded(): Promise<boolean> {
    await this.greeting.waitFor({ timeout: 10_000 });
    return true;
  }

  async clickProfileLink() {
    await this.profileLink.click();
  }
}
