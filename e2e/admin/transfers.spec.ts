/**
 * e2e/admin/transfers.spec.ts — Sub-CMD-9: Admin Transfer Management E2E
 *
 * Scope: API-level E2E for admin transfer approval workflow
 *        Maps to CMD deliverable: "User approval workflow (WeeeR approval)"
 *        (WeeeR users deposit → admin verifies → credits released)
 *
 * W5: max 2 retries (playwright.config.ts)
 * Pattern: Page Object Model (Protocol item 11)
 *
 * Tests:
 *   1. GET /transfers/history/ — no auth → 401
 *   2. GET /transfers/history/ — admin auth → 200 with list structure
 *   3. GET /transfers/history/ — user auth → 200 (own records only)
 *   4. PATCH /transfers/deposit/:id/verify/ — no auth → 401
 *   5. PATCH /transfers/deposit/:id/verify/ — admin + non-existent id → 404
 *
 * Note on "User approval workflow": Backend TODO D-3 admin role check is pending.
 * These smoke tests verify the endpoint reachability and auth gates.
 * Full approval flow requires a live deposit fixture (integration test scope).
 *
 * Sub-CMD-9: 361813ec-7277-81d3-a2b2-dffb9c71bfe8
 */
import { test, expect } from '@playwright/test'
import { AdminTransfersPage, createAndLoginUser } from './helpers'

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('Admin Transfers — E2E Smoke', () => {

  test('GET /api/v1/transfers/history/ — no auth → 401', async ({ request }) => {
    const transfersPage = new AdminTransfersPage(request) // no token
    const res = await transfersPage.listHistory()
    expect(res.status()).toBe(401)
    const body = await res.json()
    expect(body).toHaveProperty('detail')
  })

  test('GET /api/v1/transfers/history/ — admin token → 200 with list', async ({ request }) => {
    const admin = await createAndLoginUser(request, 'admin')
    const transfersPage = new AdminTransfersPage(request, admin.token)

    const res = await transfersPage.listHistory()
    expect(res.status()).toBe(200)

    const body = await res.json()
    // History returns array of transfers
    expect(Array.isArray(body)).toBe(true)
  })

  test('GET /api/v1/transfers/history/ — regular user → 200 (own records)', async ({ request }) => {
    // Regular WeeeU user can also access their own history
    const user = await createAndLoginUser(request, 'weeeu')
    const transfersPage = new AdminTransfersPage(request, user.token)

    const res = await transfersPage.listHistory()
    // Auth succeeds (own records returned — empty for new user)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
  })

  test('PATCH /api/v1/transfers/deposit/:id/verify/ — no auth → 401', async ({ request }) => {
    const transfersPage = new AdminTransfersPage(request)
    const res = await request.patch('/api/v1/transfers/deposit/nonexistent-id/verify/', {
      data: { approved: true },
    })
    expect(res.status()).toBe(401)
  })

  test('PATCH /api/v1/transfers/deposit/:id/verify/ — admin + non-existent id → 404', async ({
    request,
  }) => {
    const admin = await createAndLoginUser(request, 'admin')
    const transfersPage = new AdminTransfersPage(request, admin.token)

    // Verify a non-existent deposit → 404
    const fakeId = '00000000-0000-0000-0000-000000000000'
    const res = await transfersPage.verifyDeposit(fakeId, {
      approved: true,
      note: 'E2E test approval',
    })

    // Backend returns 404 for non-existent transfer (or 403 if role check added)
    expect([404, 403]).toContain(res.status())
  })
})
