/**
 * e2e/weeeu/login.spec.ts — Login Flow E2E Tests
 * Sub-CMD-9 Wave 3 — WeeeU
 *
 * Covers:
 * 1. Login page renders correctly
 * 2. Validation: empty fields
 * 3. Validation: invalid email format
 * 4. Error: wrong credentials
 * 5. Success: correct credentials → redirect to /dashboard
 *
 * W5: retry max 2 (configured in playwright.config.ts)
 * W1: existing flows only — no stub future features
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';

test.describe('Login flow', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  // ── 1. Page renders ──────────────────────────────────────────────────────────

  test('shows login heading', async ({ page }) => {
    await expect(page.locator('h2:has-text("เข้าสู่ระบบ")')).toBeVisible();
  });

  test('shows email and password inputs', async () => {
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
  });

  test('shows submit button', async () => {
    await expect(loginPage.submitButton).toBeVisible();
    await expect(loginPage.submitButton).toContainText('เข้าสู่ระบบ');
  });

  test('shows signup link', async () => {
    await expect(loginPage.signupLink).toBeVisible();
  });

  test('shows forgot password link', async () => {
    await expect(loginPage.forgotPasswordLink).toBeVisible();
  });

  // ── 2. Validation: empty fields ─────────────────────────────────────────────

  test('shows email error when email is empty on submit', async ({ page }) => {
    await loginPage.submitEmpty();
    await expect(page.locator('text=กรุณากรอก Email')).toBeVisible();
  });

  test('shows password error when password is empty on submit', async ({ page }) => {
    await loginPage.emailInput.fill('test@example.com');
    await loginPage.submitEmpty();
    await expect(page.locator('text=กรุณากรอกรหัสผ่าน')).toBeVisible();
  });

  // ── 3. Validation: invalid email format ─────────────────────────────────────

  test('shows email format error for invalid email', async ({ page }) => {
    await loginPage.emailInput.fill('not-an-email');
    await loginPage.submitButton.click();
    await expect(page.locator('text=รูปแบบ Email ไม่ถูกต้อง')).toBeVisible();
  });

  // ── 4. Wrong credentials ─────────────────────────────────────────────────────

  test('shows error message for wrong password', async ({ page }) => {
    await loginPage.login('test@example.com', 'wrongpassword');
    // Wait for simulated async delay
    await expect(page.locator('text=อีเมลหรือรหัสผ่านไม่ถูกต้อง')).toBeVisible({ timeout: 5_000 });
  });

  test('shows attempt count in error message', async ({ page }) => {
    await loginPage.login('test@example.com', 'wrongpassword');
    // Should show "ครั้งที่ 1/5"
    await expect(page.locator('text=/ครั้งที่ \\d+\\/\\d+/')).toBeVisible({ timeout: 5_000 });
  });

  // ── 5. Successful login ──────────────────────────────────────────────────────

  test('redirects to /dashboard on successful login', async ({ page }) => {
    await loginPage.login('test@example.com', 'Correct1');
    // Wait for redirect
    await page.waitForURL('**/dashboard', { timeout: 10_000 });
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
