/**
 * e2e/weeeu/signup.spec.ts — Signup / Register Flow E2E Tests
 * Sub-CMD-9 Wave 3 — WeeeU
 *
 * Covers:
 * 1. Signup method page — shows options (email enabled, social disabled D12)
 * 2. Click email method → navigate to /signup/email
 * 3. Signup email page — shows form fields
 * 4. Validation on email form
 *
 * W5: retry max 2 (configured in playwright.config.ts)
 * W1: existing flows only — no stub future features
 */

import { test, expect } from '@playwright/test';
import { SignupMethodPage, SignupEmailPage } from './pages/SignupPage';

test.describe('Signup method selection', () => {
  let methodPage: SignupMethodPage;

  test.beforeEach(async ({ page }) => {
    methodPage = new SignupMethodPage(page);
    await methodPage.goto();
  });

  test('shows signup method selection page', async ({ page }) => {
    await expect(page).toHaveURL(/\/signup\/method/);
  });

  test('shows email signup option as enabled link', async () => {
    await expect(methodPage.emailMethodCard).toBeVisible();
    await expect(methodPage.emailMethodCard).toHaveAttribute('href', '/signup/email');
  });

  test('shows social options as disabled (D12 — not yet available)', async ({ page }) => {
    // Social method cards are disabled — shown with "เร็วๆ นี้" badge and cursor-not-allowed
    const disabledBadge = page.locator('text=เร็วๆ นี้').first();
    await expect(disabledBadge).toBeVisible();
  });

  test('navigates to /signup/email when clicking email option', async ({ page }) => {
    await methodPage.clickEmailMethod();
    await expect(page).toHaveURL(/\/signup\/email/);
  });
});

test.describe('Signup email form', () => {
  let emailPage: SignupEmailPage;

  test.beforeEach(async ({ page }) => {
    emailPage = new SignupEmailPage(page);
    await emailPage.goto();
  });

  test('shows email signup page', async ({ page }) => {
    await expect(page).toHaveURL(/\/signup\/email/);
  });

  test('shows email input field', async () => {
    await expect(emailPage.emailInput).toBeVisible();
  });

  test('shows password input field', async () => {
    await expect(emailPage.passwordInput).toBeVisible();
  });

  test('shows submit button', async () => {
    await expect(emailPage.submitButton).toBeVisible();
  });

  test('shows link back to login page', async () => {
    await expect(emailPage.loginLink).toBeVisible();
  });

  test('shows validation error when submitting empty email', async ({ page }) => {
    await emailPage.submitButton.click();
    // Signup email form validates: email format + password strength + terms
    // Error text starts with "รูปแบบ" or "รหัสผ่าน" or "กรุณา"
    await expect(page.locator('text=รูปแบบ Email ไม่ถูกต้อง').first()).toBeVisible({ timeout: 3_000 });
  });
});
