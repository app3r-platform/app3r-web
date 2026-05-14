/**
 * types/settlement.ts — Sub-CMD-6 Wave 2: Settlement API types
 *
 * ★ SOURCE-OF-TRUTH (Lesson #34 / memory #26)
 *   WeeeR import จาก Backend เท่านั้น
 *
 * Settlement flow:
 *   service completed → WeeeR ขอถอน → admin initiate settlement
 *   → bank adapter โอนเงิน → completed (audit log ทุก step)
 */

// ── Enum strings ─────────────────────────────────────────────────────────────
export type SettlementStatus = 'pending' | 'processing' | 'completed' | 'failed'
export type BankAdapterName = 'mock' | 'scb' | 'kbank'
export type AuditAction = 'created' | 'status_changed' | 'bank_response' | 'error'

// ── Settlement DTO ────────────────────────────────────────────────────────────
export interface SettlementDto {
  id: string
  serviceId: string
  weeerUserId: string
  amountThb: string          // numeric → string (JSON safe)
  status: SettlementStatus
  bankAdapter: BankAdapterName
  bankRef: string | null
  initiatedBy: string
  createdAt: string          // ISO-8601
  updatedAt: string          // ISO-8601
}

// ── Audit log DTO ─────────────────────────────────────────────────────────────
export interface SettlementAuditLogDto {
  id: string
  settlementId: string
  action: AuditAction
  actorId: string | null
  oldStatus: string | null
  newStatus: string | null
  detail: string | null
  createdAt: string
}

// ── Settlement with audit trail ───────────────────────────────────────────────
export interface SettlementDetailDto extends SettlementDto {
  auditLog: SettlementAuditLogDto[]
}

// ── Create (POST body) ───────────────────────────────────────────────────────
export interface CreateSettlementDto {
  serviceId: string
  weeerUserId: string
  amountThb: number
  weeerBankAccount: string   // บัญชีปลายทาง WeeeR
  weeerBankName: string      // ชื่อบัญชี
  bankAdapter?: BankAdapterName  // default: 'mock'
}

// ── List response ─────────────────────────────────────────────────────────────
export interface SettlementListDto {
  items: SettlementDto[]
  total: number
}
