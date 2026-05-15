/**
 * e2e/weeeu/pages/ProfilePage.ts — Page Object Model
 * Sub-CMD-9 Wave 3 — WeeeU E2E Tests
 *
 * Page: /profile
 * Engineering Protocol 11: Page Object Model
 */

import { type Locator, type Page } from '@playwright/test';

export class ProfilePage {
  readonly page: Page;

  // Profile display elements
  readonly memberSince: Locator;
  readonly repairCountStat: Locator;
  readonly applianceCountStat: Locator;

  // Section edit buttons
  readonly editPersonalButton: Locator;
  readonly editAddressButton: Locator;
  readonly editPhoneButton: Locator;
  readonly editEmailButton: Locator;

  // Personal info section fields (when editing)
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;

  // Save/Cancel buttons (in edit sections)
  readonly saveButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Stats display
    this.memberSince       = page.locator('text=สมาชิกตั้งแต่').first();
    this.repairCountStat   = page.locator('text=งานซ่อม').first();
    this.applianceCountStat = page.locator('text=เครื่องใช้ไฟฟ้า').first();

    // Edit section buttons
    this.editPersonalButton = page.locator('button:has-text("แก้ไขข้อมูลส่วนตัว"), button:has-text("แก้ไข")').first();
    this.editAddressButton  = page.locator('button:has-text("แก้ไขที่อยู่")').first();
    this.editPhoneButton    = page.locator('button:has-text("เปลี่ยนเบอร์โทร")').first();
    this.editEmailButton    = page.locator('button:has-text("เปลี่ยน Email")').first();

    // Edit form fields
    this.firstNameInput = page.locator('input[name="first_name"], input[placeholder*="ชื่อ"]').first();
    this.lastNameInput  = page.locator('input[name="last_name"], input[placeholder*="นามสกุล"]').first();

    // Action buttons
    this.saveButton   = page.locator('button[type="submit"]:has-text("บันทึก"), button:has-text("บันทึก")').first();
    this.cancelButton = page.locator('button:has-text("ยกเลิก")').first();
  }

  async goto() {
    await this.page.goto('/profile');
  }

  async isLoaded(): Promise<boolean> {
    // Profile page shows mock user name
    await this.page.locator('text=สมชาย').waitFor({ timeout: 10_000 });
    return true;
  }

  async clickEditPersonal() {
    await this.editPersonalButton.click();
  }

  async clickCancel() {
    await this.cancelButton.click();
  }
}
