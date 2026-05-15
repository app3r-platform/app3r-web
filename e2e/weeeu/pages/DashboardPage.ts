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
    // Quick action links
    this.repairQuickAction  = page.locator('a[href="/modules/repair"], a:has-text("แจ้งซ่อม")').first();
    this.resellQuickAction  = page.locator('a[href="/modules/resell"], a:has-text("ขาย/ซื้อ")').first();
    this.scrапQuickAction   = page.locator('a[href="/modules/scrap"], a:has-text("ทิ้งซาก")').first();
    this.maintainQuickAction = page.locator('a[href="/modules/maintain"], a:has-text("บำรุงรักษา")').first();
    // Profile link in sidebar
    this.profileLink        = page.locator('a[href="/profile"]');
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
