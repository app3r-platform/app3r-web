/**
 * cron.ts โ€” NOTE-M3: Reconciliation cron job
 *
 * Daily 02:00 ICT โ’ flag payment_intents status='pending'|'authorized' เธเธฒเธ >24h
 * โ’ set status='stale' + log เนเธ admin (Phase D-5: full settlement report API)
 *
 * NOTE-M3 scope D-2:
 * - webhook-as-source-of-truth
 * - flag stale >24h เธงเนเธฒ 'stale'
 * - settlement report API เธเธญเธ 2C2P/TrueMoney/Stripe เน€เธฅเธทเนเธญเธเนเธ D-5
 *
 * ClamAV scan worker (file_uploads):
 * Poll เธ—เธธเธ 30s เธชเธณเธซเธฃเธฑเธ scan_status='pending' (NOTE-M2)
 *
 * Email queue worker (email_log):
 * Poll เธ—เธธเธ 30s เธชเธณเธซเธฃเธฑเธ status='pending' (D-2 direct send pattern)
 */
import { schedule } from 'node-cron'
import { db } from '../db/client'
import { paymentIntents } from '../db/schema'
import { and, eq, lt, or } from 'drizzle-orm'

// ---------------------------------------------------------------------------
// NOTE-M3: Reconciliation job โ€” daily 02:00 ICT (UTC+7 = 19:00 UTC prev day)
// ---------------------------------------------------------------------------
export function startReconciliationCron(): void {
  // '0 19 * * *' = 02:00 ICT (UTC+7)
  schedule('0 19 * * *', async () => {
    const now = new Date()
    const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000) // 24h ago

    try {
      const staleIntents = await db
        .update(paymentIntents)
        .set({ status: 'stale', updatedAt: now })
        .where(
          and(
            or(
              eq(paymentIntents.status, 'pending'),
              eq(paymentIntents.status, 'processing'),
            ),
            lt(paymentIntents.createdAt, cutoff),
          ),
        )
        .returning({ id: paymentIntents.id, provider: paymentIntents.provider })

      if (staleIntents.length > 0) {
        console.warn(
          `[Reconciliation] Flagged ${staleIntents.length} stale payment_intents:`,
          staleIntents.map((i: { id: string; provider: string }) => i.id).join(', '),
        )
      } else {
        console.log('[Reconciliation] No stale intents found')
      }
    } catch (err) {
      console.error('[Reconciliation] Error:', err)
    }
  })

  console.log('[Cron] Reconciliation job scheduled: daily 02:00 ICT (UTC 19:00)')
}

// ---------------------------------------------------------------------------
// ClamAV scan worker โ€” every 30s (NOTE-M2)
// ---------------------------------------------------------------------------
export function startScanWorker(): void {
  schedule('*/30 * * * * *', async () => {
    // TODO D-2: call ClamAV daemon via clamd protocol
    // SELECT * FROM file_uploads WHERE scan_status='pending' LIMIT 10
    // โ’ send to ClamAV โ’ update scan_status + scanned_at
    // Placeholder: log only
    // console.debug('[ScanWorker] polling for pending scans...')
  })
  console.log('[Cron] ClamAV scan worker scheduled: every 30s')
}

// ---------------------------------------------------------------------------
// Start all cron jobs
// ---------------------------------------------------------------------------
export function startAllCronJobs(): void {
  startReconciliationCron()
  startScanWorker()
}

