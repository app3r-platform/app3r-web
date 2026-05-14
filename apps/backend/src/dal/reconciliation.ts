/**
 * dal/reconciliation.ts — Sub-CMD-7 Wave 2: Reconciliation DAL
 *
 * Security Rule #5: resolve action ทุกตัว → appendAuditLog ใน settlement_audit_log
 * R3 Mitigation: isReconciliationRunning() → ป้องกัน double-reconcile
 *
 * STUCK_TIMEOUT_MINUTES = 30 — settlement ค้าง pending/processing เกิน 30 นาที
 *   ถือว่า stuck และ eligible for reconciliation
 */
import { db } from '../db/client'
import { reconciliationRuns } from '../db/schema/reconciliation'
import { settlements, settlementAuditLog } from '../db/schema/settlements'
import { eq, inArray, lt, sql, desc } from 'drizzle-orm'
import type {
  ReconciliationRunDto,
  StuckSettlementDto,
  ReconciliationReportDto,
} from '../types/reconciliation'

// ── Constants ─────────────────────────────────────────────────────────────────
export const STUCK_TIMEOUT_MINUTES = 30

// ── Mappers ───────────────────────────────────────────────────────────────────
export function mapRunToDto(row: typeof reconciliationRuns.$inferSelect): ReconciliationRunDto {
  return {
    id: row.id,
    triggeredBy: row.triggeredBy ?? null,
    status: row.status as ReconciliationRunDto['status'],
    stuckCount: row.stuckCount,
    resolvedCount: row.resolvedCount,
    failedCount: row.failedCount,
    detail: row.detail ?? null,
    startedAt: row.startedAt.toISOString(),
    completedAt: row.completedAt ? row.completedAt.toISOString() : null,
  }
}

export function mapStuckSettlementToDto(
  row: typeof settlements.$inferSelect,
  nowMs: number,
): StuckSettlementDto {
  const stuckMs = nowMs - row.updatedAt.getTime()
  return {
    id: row.id,
    serviceId: row.serviceId,
    weeerUserId: row.weeerUserId,
    amountThb: String(row.amountThb),
    status: row.status as StuckSettlementDto['status'],
    bankAdapter: row.bankAdapter,
    bankRef: row.bankRef ?? null,
    initiatedBy: row.initiatedBy,
    stuckMinutes: Math.floor(stuckMs / 60_000),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

// ── R3 Idempotency check ──────────────────────────────────────────────────────
export async function isReconciliationRunning(): Promise<boolean> {
  const rows = await db
    .select({ id: reconciliationRuns.id })
    .from(reconciliationRuns)
    .where(eq(reconciliationRuns.status, 'running'))
    .limit(1)
  return rows.length > 0
}

// ── Get stuck settlements ─────────────────────────────────────────────────────
export async function getStuckSettlements(): Promise<typeof settlements.$inferSelect[]> {
  const cutoff = new Date(Date.now() - STUCK_TIMEOUT_MINUTES * 60_000)
  return db
    .select()
    .from(settlements)
    .where(
      sql`${settlements.status} IN ('pending', 'processing') AND ${settlements.updatedAt} < ${cutoff}`,
    )
}

// ── Create reconciliation run ─────────────────────────────────────────────────
export async function createReconciliationRun(
  triggeredBy: string | null,
): Promise<typeof reconciliationRuns.$inferSelect> {
  const [row] = await db
    .insert(reconciliationRuns)
    .values({ triggeredBy: triggeredBy ?? null })
    .returning()
  return row
}

// ── Complete reconciliation run ───────────────────────────────────────────────
export async function completeReconciliationRun(
  runId: string,
  result: {
    status: 'completed' | 'failed'
    stuckCount: number
    resolvedCount: number
    failedCount: number
    detail: unknown
  },
): Promise<void> {
  await db
    .update(reconciliationRuns)
    .set({
      status: result.status,
      stuckCount: result.stuckCount,
      resolvedCount: result.resolvedCount,
      failedCount: result.failedCount,
      detail: JSON.stringify(result.detail),
      completedAt: new Date(),
    })
    .where(eq(reconciliationRuns.id, runId))
}

// ── Auto-resolve stuck settlement to 'failed' (worker) ───────────────────────
export async function autoResolveStuckSettlement(
  settlementId: string,
  oldStatus: string,
): Promise<void> {
  await db
    .update(settlements)
    .set({ status: 'failed', updatedAt: new Date() })
    .where(eq(settlements.id, settlementId))

  // Security Rule #5: audit log บังคับ
  await db.insert(settlementAuditLog).values({
    settlementId,
    action: 'error',
    actorId: null,             // system action
    oldStatus,
    newStatus: 'failed',
    detail: JSON.stringify({ reason: 'reconciliation_timeout', stuckTimeoutMinutes: STUCK_TIMEOUT_MINUTES }),
  })
}

// ── Manual resolve by admin (PATCH /:id/resolve) ─────────────────────────────
export async function manualResolveSettlement(
  settlementId: string,
  resolution: 'completed' | 'failed',
  reason: string,
  resolvedBy: string,
): Promise<typeof settlements.$inferSelect | null> {
  const [current] = await db
    .select()
    .from(settlements)
    .where(eq(settlements.id, settlementId))

  if (!current) return null
  if (!['pending', 'processing'].includes(current.status)) return null

  const [updated] = await db
    .update(settlements)
    .set({ status: resolution, updatedAt: new Date() })
    .where(eq(settlements.id, settlementId))
    .returning()

  // Security Rule #5: audit log บังคับ
  await db.insert(settlementAuditLog).values({
    settlementId,
    action: 'status_changed',
    actorId: resolvedBy,
    oldStatus: current.status,
    newStatus: resolution,
    detail: JSON.stringify({ reason, resolvedBy, source: 'manual_reconciliation' }),
  })

  return updated
}

// ── Get reconciliation report ─────────────────────────────────────────────────
export async function getReconciliationReport(): Promise<ReconciliationReportDto> {
  const now = Date.now()
  const stuckRows = await getStuckSettlements()
  const recentRunRows = await db
    .select()
    .from(reconciliationRuns)
    .orderBy(desc(reconciliationRuns.startedAt))
    .limit(10)

  const lastRun = recentRunRows.find((r) => r.completedAt)

  return {
    stuckSettlements: stuckRows.map((r) => mapStuckSettlementToDto(r, now)),
    recentRuns: recentRunRows.map(mapRunToDto),
    lastRunAt: lastRun?.completedAt?.toISOString() ?? null,
  }
}
