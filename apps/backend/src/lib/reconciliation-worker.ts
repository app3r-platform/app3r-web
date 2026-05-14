/**
 * lib/reconciliation-worker.ts — Sub-CMD-7 Wave 2: Reconciliation Worker
 *
 * Background job ตรวจ settlement ที่ค้างใน 'pending' หรือ 'processing'
 * เกิน STUCK_TIMEOUT_MINUTES (30 นาที) และ auto-resolve เป็น 'failed'
 *
 * R3 Mitigation (Idempotency):
 *   - ตรวจ isReconciliationRunning() ก่อนทุกครั้ง
 *   - ถ้ามี run กำลัง running อยู่ → skip ทันที (return null)
 *   - ป้องกัน cron ที่ซ้อนกัน / double-reconcile
 *
 * Security Rule #5:
 *   - ทุก auto-resolve → เขียน settlement_audit_log (ใน autoResolveStuckSettlement)
 *
 * Engineering Rule #6 (Performance):
 *   - ทำงานใน async function → ไม่ block main thread
 *   - Error ของแต่ละ settlement ไม่หยุด loop ทั้งหมด
 */
import {
  isReconciliationRunning,
  getStuckSettlements,
  createReconciliationRun,
  completeReconciliationRun,
  autoResolveStuckSettlement,
} from '../dal/reconciliation'
import type { ReconciliationWorkerResult } from '../types/reconciliation'

/**
 * runReconciliationWorker — main entry point
 *
 * @param triggeredBy  null = cron | UUID string = admin ที่กด manual
 * @returns            ReconciliationWorkerResult | null ถ้า already running
 */
export async function runReconciliationWorker(
  triggeredBy: string | null = null,
): Promise<ReconciliationWorkerResult | null> {
  // ── R3: Idempotency check ──────────────────────────────────────────────────
  const alreadyRunning = await isReconciliationRunning()
  if (alreadyRunning) {
    // Reconciliation อยู่ระหว่าง run → skip (caller จะได้รับ null)
    return null
  }

  // ── สร้าง run record (status: 'running') ──────────────────────────────────
  const run = await createReconciliationRun(triggeredBy)

  let stuckCount = 0
  let resolvedCount = 0
  let failedCount = 0
  const resolvedIds: string[] = []
  const errors: Array<{ id: string; error: string }> = []

  try {
    // ── หา settlement ที่ค้าง ──────────────────────────────────────────────
    const stuckSettlements = await getStuckSettlements()
    stuckCount = stuckSettlements.length

    // ── auto-resolve ทีละรายการ ────────────────────────────────────────────
    for (const settlement of stuckSettlements) {
      try {
        await autoResolveStuckSettlement(settlement.id, settlement.status)
        resolvedIds.push(settlement.id)
        resolvedCount++
      } catch (err) {
        // Error ของ settlement เดียวไม่หยุด loop ทั้งหมด (Rule #6)
        errors.push({ id: settlement.id, error: String(err) })
        failedCount++
      }
    }

    // ── บันทึกผล run (completed) ───────────────────────────────────────────
    await completeReconciliationRun(run.id, {
      status: 'completed',
      stuckCount,
      resolvedCount,
      failedCount,
      detail: {
        resolvedIds,
        errors,
        summary: `Reconciliation complete: ${stuckCount} stuck, ${resolvedCount} resolved, ${failedCount} failed`,
      },
    })
  } catch (workerError) {
    // Worker-level error (e.g. DB connection) → mark run as 'failed'
    await completeReconciliationRun(run.id, {
      status: 'failed',
      stuckCount,
      resolvedCount,
      failedCount,
      detail: { error: String(workerError) },
    }).catch(() => {
      // สุดท้ายแล้ว ถ้า update run ไม่ได้ก็แค่ log — ไม่ throw ต่อ
      console.error('[ReconciliationWorker] Failed to update run status:', workerError)
    })

    throw workerError
  }

  return { runId: run.id, stuckCount, resolvedCount, failedCount }
}
