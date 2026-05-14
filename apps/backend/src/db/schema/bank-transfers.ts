/**
 * bank-transfers.ts — Sub-CMD-2: Manual Bank Transfer Module
 *
 * อ.PP decision (Decision Record C: 360813ec-7277-8143-9011-ca6cd91b621d):
 * โอนตรง (manual bank transfer) เป็น primary payment method Phase D-2
 *
 * Flow — Deposit:
 *   1. User POST /api/v1/transfers/deposit/ + upload slip (R2)
 *   2. Admin PATCH /api/v1/transfers/deposit/:id/verify/ → อนุมัติ/ปฏิเสธ
 *   3. หาก verified → @needs-point-review: credit user wallet/point_ledger
 *
 * Flow — Withdraw:
 *   1. User POST /api/v1/transfers/withdraw/ + ระบุบัญชีปลายทาง
 *   2. Admin PATCH /api/v1/transfers/withdraw/:id/confirm/ → โอนแล้ว → ลดแต้ม
 *   3. หากยืนยัน → @needs-point-review: debit user wallet/point_ledger
 *
 * PromptPay QR: GET /api/v1/transfers/qr/ → EMVCo format
 *
 * PDPA: slip images contain financial data — access control enforced in routes
 *   → only owner + admin can view slip
 */
import {
  pgTable,
  uuid,
  text,
  numeric,
  timestamp,
  index,
} from 'drizzle-orm/pg-core'
import { users } from './users'

export const bankTransfers = pgTable(
  'bank_transfers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // ผู้ใช้ที่ทำรายการ
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    // 'deposit' | 'withdraw'
    type: text('type').notNull(),
    // จำนวนเงิน THB
    amountThb: numeric('amount_thb', { precision: 12, scale: 2 }).notNull(),
    // R2 key ของสลิปโอนเงิน (deposit: required | withdraw: null)
    slipR2Key: text('slip_r2_key'),
    // เลข ref จากธนาคาร (user fills in)
    refNo: text('ref_no'),
    // PromptPay QR reference ที่ gen ไว้ (for deposit)
    promptpayRef: text('promptpay_ref'),
    // 'pending' | 'verified' | 'rejected' | 'completed' | 'failed'
    status: text('status').notNull().default('pending'),
    // Admin note (reason for reject / confirm note)
    adminNote: text('admin_note'),
    // Admin ที่อนุมัติ/ปฏิเสธ
    verifiedBy: uuid('verified_by').references(() => users.id),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
    // ข้อมูลบัญชีปลายทาง (withdraw — encrypted at rest: D-5)
    bankName: text('bank_name'),
    accountNumber: text('account_number'),
    accountName: text('account_name'),
    // @needs-point-review: link ไป point_ledger row ที่เกี่ยวข้อง
    pointLedgerId: uuid('point_ledger_id'), // FK ไม่ hard-code ก่อน Point chat confirm
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_bank_transfers_user').on(table.userId, table.createdAt),
    index('idx_bank_transfers_status').on(table.status),
    index('idx_bank_transfers_type').on(table.type),
  ],
)

export type BankTransfer = typeof bankTransfers.$inferSelect
export type NewBankTransfer = typeof bankTransfers.$inferInsert
