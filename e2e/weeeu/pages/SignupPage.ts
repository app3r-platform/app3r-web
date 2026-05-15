/**
 * e2e/weeeu/pages/SignupPage.ts — Page Object Model
 * Sub-CMD-9 Wave 3 — WeeeU E2E Tests
 *
 * Pages: /signup/method, /signup/email
 * Engineering Protocol 11: Page Object Model
 */

import { type Locator, type Page } from '@playwright/test';

export class SignupMethodPage {
  readonly page: Page;

  readonly heading: Locator;
  readonly emailMethodCard: Locator;
  readonly googleMethodCard: Locator;
  readonly facebookMethodCard: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading           = page.locator('h2, h1').filter({ hasText: /สมัคร|เลือก/ }).first();
    this.emailMethodCard   = page.locator('a[href="/signup/email"]');
    // Social methods are disabled (D12)
    this.googleMethodCard   = page.locator('[title*="เร็วๆ นี้"]').first();
    this.facebookMethodCard = page.locator('[title*="เร็วๆ นี้"]').last();
  }

  async goto() {
    await this.page.goto('/signup/method');
  }

  async clickEmailMethod() {
    await this.emailMethodCard.click();
  }
}

export class SignupEmailPage {
  readonly page: Page;

  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly loginLink: Locator;

  constructor(page: Page) {
    this.page = page;

    // Use placeholders/labels for resilient selectors
    this.emailInput    = page.locator('input[type="email"]');
    this.passwordInput = page.locator('input[type="password"]').first();
    this.submitButton  = page.locator('button[type="submit"]');
    this.loginLink     = page.locator('a[href="/login"]');

    // Personal info fields (may be on personal step)
    this.firstNameInput = page.locator('input[name="first_name"], input[placeholder*="ชื่อ"]').first();
    this.lastNameInput  = page.locator('input[name="last_name"], input[placeholder*="นามสกุล"]').first();
  }

  async goto() {
    await this.page.goto('/signup/email');
  }

  async fillEmail(email: string) {
    await this.emailInput.fill(email);
  }

  async fillPassword(password: string) {
    await this.passwordInput.fill(password);
  }

  async submit() {
    await this.submitButton.click();
  }
}
