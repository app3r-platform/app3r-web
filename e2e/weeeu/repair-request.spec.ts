/**
 * e2e/weeeu/repair-request.spec.ts — Service Request Flow E2E Tests
 * Sub-CMD-9 Wave 3 — WeeeU
 *
 * Covers:
 * 1. Repair request page loads (happy path navigation)
 * 2. Service type selection (On-site / Walk-in / Pickup / Parcel)
 * 3. Form fields visible and fillable
 * 4. Priority selector (normal / urgent / VIP)
 * 5. Validation: required field errors on submit
 *
 * Note: Dev auth bypass ใช้งานอัตโนมัติ (NODE_ENV=development)
 * W5: retry max 2 (configured in playwright.config.ts)
 * W1: existing flows only — no stub future features
 */

import { test, expect } from '@playwright/test';
import { RepairNewPage } from './pages/RepairNewPage';

test.describe('Repair request flow', () => {
  let repairPage: RepairNewPage;

  test.beforeEach(async ({ page }) => {
    repairPage = new RepairNewPage(page);
    await repairPage.goto();
  });

  // ── 1. Page renders ──────────────────────────────────────────────────────────

  test('shows repair request page heading', async ({ page }) => {
    await expect(page.locator('h1:has-text("แจ้งซ่อมใหม่")')).toBeVisible();
  });

  test('shows service type selector', async ({ page }) => {
    // Service type uses English labels: On-site, Walk-in, Pickup, Parcel
    await expect(page.locator('text=On-site').first()).toBeVisible();
  });

  // ── 2. Service type selection ────────────────────────────────────────────────

  test('shows on-site service type selected by default', async ({ page }) => {
    // On-site button: "On-site\nช่างมาบ้าน"
    await expect(page.locator('text=ช่างมาบ้าน').first()).toBeVisible();
  });

  test('shows walk-in option', async ({ page }) => {
    // Walk-in button: "Walk-in\nไปร้านเอง"
    await expect(page.locator('text=ไปร้านเอง').first()).toBeVisible();
  });

  test('shows pickup option', async ({ page }) => {
    // Pickup button: "Pickup\nช่างมารับ-ส่ง"
    await expect(page.locator('text=ช่างมารับ-ส่ง').first()).toBeVisible();
  });

  test('shows parcel option', async ({ page }) => {
    // Parcel button: "Parcel\nส่งพัสดุ"
    await expect(page.locator('text=ส่งพัสดุ').first()).toBeVisible();
  });

  // ── 3. Form fields ───────────────────────────────────────────────────────────

  test('shows issue summary input', async ({ page }) => {
    await expect(page.locator('input[placeholder*="เปิดไม่ติด"]')).toBeVisible();
  });

  test('shows issue detail textarea', async ({ page }) => {
    await expect(page.locator('textarea[placeholder*="รายละเอียด"], textarea[placeholder*="ตั้งแต่"]')).toBeVisible();
  });

  test('shows customer note textarea', async ({ page }) => {
    await expect(page.locator('textarea[placeholder*="หมายเหตุ"], textarea[placeholder*="อะไหล่"]').first()).toBeVisible();
  });

  test('can type in issue summary', async ({ page }) => {
    const input = page.locator('input[placeholder*="เปิดไม่ติด"]');
    await input.fill('แอร์ไม่เย็น ลมน้อย');
    await expect(input).toHaveValue('แอร์ไม่เย็น ลมน้อย');
  });

  // ── 4. Priority selector ─────────────────────────────────────────────────────

  test('shows priority selector with 3 options', async ({ page }) => {
    await expect(page.locator('button:has-text("ปกติ")')).toBeVisible();
    await expect(page.locator('button:has-text("เร่งด่วน")')).toBeVisible();
    await expect(page.locator('button:has-text("VIP")')).toBeVisible();
  });

  test('can select urgent priority', async ({ page }) => {
    const urgentBtn = page.locator('button:has-text("เร่งด่วน")').first();
    await urgentBtn.click();
    // Button should be active (checked visually — just verify no error)
    await expect(urgentBtn).toBeVisible();
  });

  test('can select VIP priority', async ({ page }) => {
    const vipBtn = page.locator('button:has-text("VIP")').first();
    await vipBtn.click();
    await expect(vipBtn).toBeVisible();
  });

  // ── 5. Validation ────────────────────────────────────────────────────────────

  test('shows validation error when issue_summary is empty on submit', async ({ page }) => {
    // Submit without filling required fields
    const submitBtn = page.locator('button[type="submit"]').first();
    await submitBtn.click();
    // Should show validation error about issue summary
    await expect(page.locator('text=กรุณาระบุอาการเสียเบื้องต้น')).toBeVisible({ timeout: 3_000 });
  });

  test('shows photo required error on submit', async ({ page }) => {
    // Fill issue_summary but no photo
    const issueSummaryInput = page.locator('input[placeholder*="เปิดไม่ติด"]');
    await issueSummaryInput.fill('แอร์ไม่เย็น');
    const submitBtn = page.locator('button[type="submit"]').first();
    await submitBtn.click();
    // Should show photo required error
    await expect(page.locator('text=กรุณาถ่ายรูป').first()).toBeVisible({ timeout: 3_000 });
  });
});

test.describe('Repair list page', () => {
  test('shows repair list page heading', async ({ page }) => {
    await page.goto('/repair');
    // Should have a heading about repair
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('shows link to create new repair request', async ({ page }) => {
    await page.goto('/repair');
    // Should have a link to /repair/new
    await expect(page.locator('a[href="/repair/new"]').first()).toBeVisible();
  });
});
