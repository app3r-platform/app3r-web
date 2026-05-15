/**
 * e2e/admin/helpers.ts — Sub-CMD-9: Admin E2E Helpers
 *
 * Standalone auth + API helpers for admin E2E tests.
 * Does NOT depend on e2e/shared/ (which is Backend-owned) — ensures admin
 * tests run independently on sub-9-wave3/admin branch.
 *
 * After Backend merges, these tests will also be discovered by the root
 * playwright.config.ts → playwright-tests.yml workflow.
 *
 * Endpoints tested (all real — Protocol item 4):
 *   POST /api/v1/auth/signup
 *   POST /api/v1/auth/signin
 *   GET  /api/v1/auth/me
 *   GET  /api/v1/transfers/history/
 *   PATCH /api/v1/transfers/deposit/:id/verify/
 *   GET  /api/v1/reconciliation
 *   POST /api/v1/reconciliation/run
 *
 * W5: Retry configured in playwright.config.ts (max 2)
 * Pattern: Page Object Model (Protocol item 11)
 *
 * Sub-CMD-9: 361813ec-7277-81d3-a2b2-dffb9c71bfe8
 */
import type { APIRequestContext } from '@playwright/test'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AdminAuthContext {
  token: string
  userId: string
  email: string
  role: string
}

// ── Auth Helpers ──────────────────────────────────────────────────────────────

/**
 * Create and sign in a test user with the given role.
 * Uses timestamp suffix to avoid email collisions between test runs.
 */
export async function createAndLoginUser(
  api: APIRequestContext,
  role: 'admin' | 'weeeu' | 'weeer' | 'weeet' = 'admin',
  password = 'AdminTest@9999',
): Promise<AdminAuthContext> {
  const email = `e2e-admin-${role}-${Date.now()}@test.local`

  // Register
  await api.post('/api/v1/auth/signup', {
    data: { email, password, role },
  })

  // Signin
  const loginRes = await api.post('/api/v1/auth/signin', {
    data: { email, password },
  })
  const body = await loginRes.json()

  return {
    token: body.access_token ?? '',
    userId: body.user?.id ?? '',
    email,
    role: body.user?.role ?? role,
  }
}

// ── Request Helpers ────────────────────────────────────────────────────────────

export async function adminGet(
  api: APIRequestContext,
  path: string,
  token: string,
  params?: Record<string, string>,
) {
  const url = params ? `${path}?${new URLSearchParams(params).toString()}` : path
  return api.get(url, {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function adminPost(
  api: APIRequestContext,
  path: string,
  token: string,
  data: unknown = {},
) {
  return api.post(path, {
    headers: { Authorization: `Bearer ${token}` },
    data,
  })
}

export async function adminPatch(
  api: APIRequestContext,
  path: string,
  token: string,
  data: unknown = {},
) {
  return api.patch(path, {
    headers: { Authorization: `Bearer ${token}` },
    data,
  })
}

// ── Page Object Models ─────────────────────────────────────────────────────────

/**
 * AdminAuthPage — Page Object for /api/v1/auth/* (admin flow)
 * Protocol item 11: Page Object Model
 */
export class AdminAuthPage {
  constructor(
    private api: APIRequestContext,
    private token?: string,
  ) {}

  async signup(email: string, password: string, role = 'admin') {
    return this.api.post('/api/v1/auth/signup', {
      data: { email, password, role },
    })
  }

  async signin(email: string, password: string) {
    return this.api.post('/api/v1/auth/signin', {
      data: { email, password },
    })
  }

  async me() {
    if (!this.token) {
      return this.api.get('/api/v1/auth/me')
    }
    return adminGet(this.api, '/api/v1/auth/me', this.token)
  }

  setToken(token: string) {
    this.token = token
  }
}

/**
 * AdminTransfersPage — Page Object for /api/v1/transfers/* (admin operations)
 */
export class AdminTransfersPage {
  constructor(
    private api: APIRequestContext,
    private token?: string,
  ) {}

  async listHistory(params?: Record<string, string>) {
    if (!this.token) {
      return this.api.get('/api/v1/transfers/history/')
    }
    return adminGet(this.api, '/api/v1/transfers/history/', this.token, params)
  }

  async verifyDeposit(
    id: string,
    payload: { approved: boolean; note?: string },
  ) {
    if (!this.token) throw new Error('Token required for admin operation')
    return adminPatch(
      this.api,
      `/api/v1/transfers/deposit/${id}/verify/`,
      this.token,
      payload,
    )
  }

  async confirmWithdrawal(id: string, payload: { confirmed: boolean; note?: string }) {
    if (!this.token) throw new Error('Token required for admin operation')
    return adminPatch(
      this.api,
      `/api/v1/transfers/withdraw/${id}/confirm/`,
      this.token,
      payload,
    )
  }
}

/**
 * AdminReconciliationPage — Page Object for /api/v1/reconciliation/* (admin)
 */
export class AdminReconciliationPage {
  constructor(
    private api: APIRequestContext,
    private token?: string,
  ) {}

  async getReport() {
    if (!this.token) {
      return this.api.get('/api/v1/reconciliation')
    }
    return adminGet(this.api, '/api/v1/reconciliation', this.token)
  }

  async runWorker() {
    if (!this.token) throw new Error('Token required for admin operation')
    return adminPost(this.api, '/api/v1/reconciliation/run', this.token, {})
  }

  async resolveSettlement(
    id: string,
    payload: { action: 'retry' | 'force_complete' | 'force_fail'; note: string },
  ) {
    if (!this.token) throw new Error('Token required for admin operation')
    return adminPatch(
      this.api,
      `/api/v1/reconciliation/${id}/resolve`,
      this.token,
      payload,
    )
  }
}
