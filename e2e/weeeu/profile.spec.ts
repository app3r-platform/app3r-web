/**
 * e2e/weeeu/profile.spec.ts — Profile Management Flow E2E Tests
 * Sub-CMD-9 Wave 3 — WeeeU
 *
 * Covers:
 * 1. Profile page loads and shows user data
 * 2. Shows membership stats (member since, repair count, appliance count)
 * 3. Shows edit section buttons
 * 4. Can toggle edit personal info section
 * 5. Dashboard page happy path
 *
 * Note: Dev auth bypass ใช้งานอัตโนมัติ (NODE_ENV=development)
 * W5: retry max 2 (configured in playwright.config.ts)
 * W1: existing flows only — no stub future features
 */

import { test, expect } from '@playwright/test';
import { ProfilePage } from './pages/ProfilePage';
import { DashboardPage } from './pages/DashboardPage';

test.describe('Profile management', () => {
  let profilePage: ProfilePage;

  test.beforeEach(async ({ page }) => {
    profilePage = new ProfilePage(page);
    await profilePage.goto();
  });

  // ── 1. Page loads ─────────────────────────────────────────────────────────────

  test('shows profile page with user name', async ({ page }) => {
    // Mock user is "สมชาย ใจดี"
    await expect(page.locator('text=สมชาย').first()).toBeVisible({ timeout: 8_000 });
  });

  test('shows user email', async ({ page }) => {
    await expect(page.locator('text=somchai@email.com').first()).toBeVisible();
  });

  // ── 2. Membership stats ──────────────────────────────────────────────────────

  test('shows member since info', async ({ page }) => {
    await expect(page.locator('text=สมาชิกตั้งแต่').first()).toBeVisible();
  });

  test('shows repair count stat', async ({ page }) => {
    await expect(page.locator('text=งานซ่อม').first()).toBeVisible();
  });

  test('shows appliance count stat', async ({ page }) => {
    await expect(page.locator('text=เครื่องใช้ไฟฟ้า').first()).toBeVisible();
  });

  // ── 3. Section edit buttons ───────────────────────────────────────────────────

  test('shows edit personal info button', async ({ page }) => {
    // Some button/link to trigger editing personal info
    const editBtn = page.locator('button:has-text("แก้ไข"), a:has-text("แก้ไข")').first();
    await expect(editBtn).toBeVisible();
  });

  // ── 4. Edit personal section toggle ─────────────────────────────────────────

  test('can open personal info edit section', async ({ page }) => {
    const editBtn = page.locator('button:has-text("แก้ไขข้อมูลส่วนตัว"), button:has-text("แก้ไข")').first();
    await editBtn.click();
    // Should show an input field for editing
    await expect(
      page.locator('input, select[name], textarea').first()
    ).toBeVisible({ timeout: 3_000 });
  });

  test('can cancel personal info edit', async ({ page }) => {
    const editBtn = page.locator('button:has-text("แก้ไขข้อมูลส่วนตัว"), button:has-text("แก้ไข")').first();
    await editBtn.click();
    // Cancel button should appear
    const cancelBtn = page.locator('button:has-text("ยกเลิก")').first();
    await expect(cancelBtn).toBeVisible({ timeout: 3_000 });
    await cancelBtn.click();
    // Should go back to view mode
    await expect(editBtn).toBeVisible({ timeout: 3_000 });
  });
});

test.describe('Dashboard (happy path)', () => {
  let dashboard: DashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboard = new DashboardPage(page);
    await dashboard.goto();
  });

  test('shows greeting message', async ({ page }) => {
    await expect(page.locator('text=สวัสดี').first()).toBeVisible();
  });

  test('shows Silver Point wallet card', async ({ page }) => {
    await expect(page.locator('text=Silver Point').first()).toBeVisible();
  });

  test('shows quick action buttons (repair, resell, scrap, maintain)', async ({ page }) => {
    await expect(page.locator('text=แจ้งซ่อม').first()).toBeVisible();
    await expect(page.locator('text=ขาย/ซื้อ').first()).toBeVisible();
    await expect(page.locator('text=ทิ้งซาก').first()).toBeVisible();
    await expect(page.locator('text=บำรุงรักษา').first()).toBeVisible();
  });

  test('sidebar shows profile link', async ({ page }) => {
    await expect(page.locator('a[href="/profile"]').first()).toBeVisible();
  });

  test('can navigate from dashboard to profile via sidebar', async ({ page }) => {
    await page.locator('a[href="/profile"]').first().click();
    await expect(page).toHaveURL(/\/profile/);
    await expect(page.locator('text=สมชาย').first()).toBeVisible({ timeout: 8_000 });
  });
});
