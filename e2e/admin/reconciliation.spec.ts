/**
 * e2e/admin/reconciliation.spec.ts — Sub-CMD-9: Admin Reconciliation E2E
 *
 * Scope: API-level E2E for admin settlement reconciliation monitoring
 *        Maps to CMD deliverables:
 *          - "Service monitoring" → GET /reconciliation (see stuck settlements)
 *          - "Dispute resolution" → POST /reconciliation/run + PATCH resolve
 *
 * W5: max 2 retries (playwright.config.ts)
 * Pattern: Page Object Model (Protocol item 11)
 *
 * Tests:
 *   1. GET /reconciliation — no auth → 401
 *   2. GET /reconciliation — admin auth → 200 with report shape
 *   3. GET /reconciliation — report has expected fields
 *   4. POST /reconciliation/run — no auth → 401
 *   5. POST /reconciliation/run — admin auth → 200 (worker triggered)
 *   6. PATCH /reconciliation/:id/resolve — non-existent id → 404
 *
 * Sub-CMD-9: 361813ec-7277-81d3-a2b2-dffb9c71bfe8
 */
import { test, expect } from '@playwright/test'
import { AdminReconciliationPage, createAndLoginUser } from './helpers'

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('Admin Reconciliation — E2E Smoke', () => {

  test('GET /api/v1/reconciliation — no auth → 401', async ({ request }) => {
    const recon = new AdminReconciliationPage(request) // no token
    const res = await recon.getReport()
    expect(res.status()).toBe(401)
    const body = await res.json()
    expect(body).toHaveProperty('detail')
  })

  test('GET /api/v1/reconciliation — admin token → 200', async ({ request }) => {
    const admin = await createAndLoginUser(request, 'admin')
    const recon = new AdminReconciliationPage(request, admin.token)

    const res = await recon.getReport()
    expect(res.status()).toBe(200)
  })

  test('GET /api/v1/reconciliation — report has expected shape', async ({ request }) => {
    const admin = await createAndLoginUser(request, 'admin')
    const recon = new AdminReconciliationPage(request, admin.token)

    const res = await recon.getReport()
    expect(res.status()).toBe(200)
    const body = await res.json()

    // Validate reconciliation report shape (matches StuckSettlement / ReconciliationReport types)
    expect(body).toHaveProperty('total_stuck')
    expect(body).toHaveProperty('total_pending')
    expect(body).toHaveProperty('total_processing')
    expect(body).toHaveProperty('total_failed')
    expect(body).toHaveProperty('worker_status')
    expect(body).toHaveProperty('items')
    expect(Array.isArray(body.items)).toBe(true)
    expect(['idle', 'running', 'error']).toContain(body.worker_status)
  })

  test('POST /api/v1/reconciliation/run — no auth → 401', async ({ request }) => {
    const res = await request.post('/api/v1/reconciliation/run', {
      data: {},
    })
    expect(res.status()).toBe(401)
  })

  test('POST /api/v1/reconciliation/run — admin auth → worker triggers', async ({ request }) => {
    const admin = await createAndLoginUser(request, 'admin')
    const recon = new AdminReconciliationPage(request, admin.token)

    const res = await recon.runWorker()
    // Worker triggered — accept 200 (completed immediately) or 202 (async)
    expect([200, 202]).toContain(res.status())

    const body = await res.json()
    // Should return run summary or acknowledgment
    expect(body).toBeTruthy()
  })

  test('PATCH /api/v1/reconciliation/:id/resolve — non-existent id → 404', async ({ request }) => {
    const admin = await createAndLoginUser(request, 'admin')
    const recon = new AdminReconciliationPage(request, admin.token)

    const fakeId = '00000000-0000-0000-0000-000000000000'
    const res = await recon.resolveSettlement(fakeId, {
      action: 'retry',
      note: 'E2E test resolution note',
    })

    // Settlement not found → 404
    expect([404, 400]).toContain(res.status())
  })
})
