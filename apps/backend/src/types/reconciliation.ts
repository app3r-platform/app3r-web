/**
 * types/reconciliation.ts — Sub-CMD-7 Wave 2: Reconciliation Worker types
 *
 * ★ SOURCE-OF-TRUTH (Lesson #34 / memory #26)
 *   Admin + FE chats import จาก Backend เท่านั้น
 *
 * Reconciliation flow:
 *   cron/manual trigger → scan stuck settlements (pending/processing > 30 min)
 *   → auto-resolve to 'failed' → audit log → run summary
 *   Admin can also manually resolve via PATCH /:id/resolve
 */

// ── Enum strings ──────────────────────────────────────────────────────────────
export type ReconciliationRunStatus = 'running' | 'completed' | 'failed'

// ── Reconciliation Run DTO ────────────────────────────────────────────────────
export interface ReconciliationRunDto {
  id: string
  triggeredBy: string | null    // null = cron
  status: ReconciliationRunStatus
  stuckCount: number
  resolvedCount: number
  failedCount: number
  detail: string | null         // JSON summary
  startedAt: string             // ISO-8601
  completedAt: string | null    // ISO-8601 | null ถ้ายัง running
}

// ── Stuck Settlement DTO ──────────────────────────────────────────────────────
// settlement ที่ค้างอยู่ใน pending/processing เกิน STUCK_TIMEOUT_MINUTES
export interface StuckSettlementDto {
  id: string
  serviceId: string
  weeerUserId: string
  amountThb: string
  status: 'pending' | 'processing'
  bankAdapter: string
  bankRef: string | null
  initiatedBy: string
  stuckMinutes: number          // จำนวนนาทีที่ค้าง (คำนวณจาก updatedAt)
  createdAt: string             // ISO-8601
  updatedAt: string             // ISO-8601
}

// ── Reconciliation Report DTO (GET /api/v1/reconciliation) ───────────────────
export interface ReconciliationReportDto {
  stuckSettlements: StuckSettlementDto[]
  recentRuns: ReconciliationRunDto[]
  lastRunAt: string | null      // ISO-8601 | null ถ้ายังไม่เคย run
}

// ── Manual Resolve Input (PATCH /api/v1/reconciliation/:id/resolve) ──────────
export interface ResolveSettlementInput {
  resolution: 'completed' | 'failed'
  reason: string                // admin ต้องระบุเหตุผล (audit trail)
}

// ── Worker Result ─────────────────────────────────────────────────────────────
export interface ReconciliationWorkerResult {
  runId: string
  stuckCount: number
  resolvedCount: number
  failedCount: number
}
