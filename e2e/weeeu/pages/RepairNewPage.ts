/**
 * e2e/weeeu/pages/RepairNewPage.ts — Page Object Model
 * Sub-CMD-9 Wave 3 — WeeeU E2E Tests
 *
 * Page: /repair/new
 * Engineering Protocol 11: Page Object Model
 */

import { type Locator, type Page } from '@playwright/test';

export class RepairNewPage {
  readonly page: Page;

  // Service type selector buttons
  readonly onSiteButton: Locator;
  readonly walkInButton: Locator;
  readonly pickupButton: Locator;
  readonly parcelButton: Locator;

  // Form fields
  readonly issueSummaryInput: Locator;
  readonly issueDetailInput: Locator;
  readonly customerNoteInput: Locator;
  readonly scheduledAtInput: Locator;
  readonly budgetMaxInput: Locator;

  // Priority buttons
  readonly priorityNormalButton: Locator;
  readonly priorityUrgentButton: Locator;
  readonly priorityVipButton: Locator;

  // Actions
  readonly submitButton: Locator;
  readonly backLink: Locator;

  // Validation errors
  readonly issueSummaryError: Locator;

  constructor(page: Page) {
    this.page = page;

    // Service type = button/div containing the label text
    this.onSiteButton  = page.locator('button:has-text("เรียกช่าง"), [role="button"]:has-text("เรียกช่าง")').first();
    this.walkInButton  = page.locator('button:has-text("นำเข้าร้าน"), [role="button"]:has-text("นำเข้าร้าน")').first();
    this.pickupButton  = page.locator('button:has-text("รับ-ส่ง"), [role="button"]:has-text("รับ-ส่ง")').first();
    this.parcelButton  = page.locator('button:has-text("ส่งพัสดุ"), [role="button"]:has-text("ส่งพัสดุ")').first();

    // Form fields by placeholder or name
    this.issueSummaryInput = page.locator('input[name="issue_summary"], input[placeholder*="ปัญหา"], input[placeholder*="สรุป"]').first();
    this.issueDetailInput  = page.locator('textarea[name="issue_detail"], textarea[placeholder*="รายละเอียด"]').first();
    this.customerNoteInput = page.locator('textarea[name="customer_note"], textarea[placeholder*="หมายเหตุ"]').first();
    this.scheduledAtInput  = page.locator('input[name="scheduled_at"], input[type="datetime-local"]').first();
    this.budgetMaxInput    = page.locator('input[name="budget_max"], input[placeholder*="งบ"]').first();

    // Priority buttons
    this.priorityNormalButton = page.locator('button:has-text("ปกติ")').first();
    this.priorityUrgentButton = page.locator('button:has-text("เร่งด่วน")').first();
    this.priorityVipButton    = page.locator('button:has-text("VIP")').first();

    // Submit/Back
    this.submitButton = page.locator('button[type="submit"]:has-text("ส่งคำขอ"), button:has-text("ส่งคำขอ"), button:has-text("ถัดไป")').first();
    this.backLink     = page.locator('a[href="/repair"], a:has-text("ย้อนกลับ")').first();

    // Validation
    this.issueSummaryError = page.locator('text=กรุณา').first();
  }

  async goto() {
    await this.page.goto('/repair/new');
  }

  async fillIssueSummary(text: string) {
    await this.issueSummaryInput.fill(text);
  }

  async fillIssueDetail(text: string) {
    await this.issueDetailInput.fill(text);
  }

  async fillCustomerNote(text: string) {
    await this.customerNoteInput.fill(text);
  }

  async selectPriority(priority: 'normal' | 'urgent' | 'vip') {
    const btn = {
      normal: this.priorityNormalButton,
      urgent: this.priorityUrgentButton,
      vip:    this.priorityVipButton,
    }[priority];
    await btn.click();
  }

  async submit() {
    await this.submitButton.click();
  }
}
