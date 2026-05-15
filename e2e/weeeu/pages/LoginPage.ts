/**
 * e2e/weeeu/pages/LoginPage.ts — Page Object Model
 * Sub-CMD-9 Wave 3 — WeeeU E2E Tests
 *
 * Page: /login
 * Engineering Protocol 11: Page Object Model
 */

import { type Locator, type Page } from '@playwright/test';

export class LoginPage {
  readonly page: Page;

  // Form fields
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;

  // Error displays
  readonly emailError: Locator;
  readonly passwordError: Locator;
  readonly generalError: Locator;
  readonly lockoutBanner: Locator;

  // Links
  readonly signupLink: Locator;
  readonly forgotPasswordLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput    = page.locator('input[type="email"]');
    this.passwordInput = page.locator('input[type="password"]');
    this.submitButton  = page.locator('button[type="submit"]');

    // Error messages (ข้อความภาษาไทย)
    this.emailError       = page.locator('text=กรุณากรอก Email').first();
    this.passwordError    = page.locator('text=กรุณากรอกรหัสผ่าน').first();
    this.generalError     = page.locator('text=อีเมลหรือรหัสผ่านไม่ถูกต้อง').first();
    this.lockoutBanner    = page.locator('text=บัญชีถูกล็อคชั่วคราว').first();

    // Navigation
    this.signupLink         = page.locator('a[href="/signup/method"]');
    this.forgotPasswordLink = page.locator('a[href="/forgot-password"]');
  }

  /** Navigate to login page */
  async goto() {
    await this.page.goto('/login');
  }

  /** Fill and submit the login form */
  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  /** Submit with empty fields to trigger validation */
  async submitEmpty() {
    await this.submitButton.click();
  }

  /** Wait for redirect after successful login */
  async waitForDashboard() {
    await this.page.waitForURL('**/dashboard', { timeout: 10_000 });
  }

  /** Get current URL */
  async currentUrl(): Promise<string> {
    return this.page.url();
  }
}
