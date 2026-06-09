/**
 * auth-client.ts — Wave1 Shell: typed API client singleton for Admin
 *
 * Source: packages/shared/src/api-client.ts (D5 · Wave0)
 * Contract: apps/backend/docs/wave0/d2-openapi.yaml (D2 · Wave0)
 *
 * Usage: client components only (requires browser for token read).
 * Call getAdminClient() per component — token can rotate between calls.
 *
 * TODO: REMOVE getToken fallback when real auth middleware is live (TD-Wave1)
 */
import { createApiClient } from '@app3r/shared/src/api-client'
import { getToken } from './auth'

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8787/api/v1'

/**
 * Returns an api-client bound to the current admin JWT token.
 * Safe to call on every render — createApiClient is a thin factory.
 */
export function getAdminClient() {
  return createApiClient({
    baseUrl: API_BASE,
    getToken: () =>
      typeof window !== 'undefined' ? (getToken() ?? '') : '',
  })
}
