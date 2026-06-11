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
import { createApiClient, type App3RApiClient } from '@app3r/shared/src/api-client'
import { ERR_BACKEND_UNAVAILABLE } from '@app3r/shared/src/mock-runtime'
import { getToken } from './auth'

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8787/api/v1'

// CMD #115-AH §B: mockMode = REQUIRED (inline ใน app chunk · ไม่อ่าน env ใน shared = กัน BUG-3)
const MOCK_MODE = process.env.NEXT_PUBLIC_DEV_NAV === 'true'

/**
 * BUG-3 (Opt1) — mock mode short-circuit.
 * dashboard/wallet/config วิ่งผ่าน createApiClient ตรงๆ (ไม่ผ่าน mock-first api.ts)
 * → mock mode ต้อง reject เร็วก่อน fetch :8787 (ไม่งั้น hang 15-26s รอ timeout).
 * Proxy 2 ชั้น: ทุก namespace.method() → Promise.reject(ERR_BACKEND_UNAVAILABLE)
 * → page `.catch(fallback mock)` ยิงทันที <2s.
 */
function createMockShortCircuitClient(): App3RApiClient {
  const reject = () => Promise.reject(new Error(ERR_BACKEND_UNAVAILABLE))
  const namespace = new Proxy({}, { get: () => reject })
  return new Proxy({}, { get: () => namespace }) as unknown as App3RApiClient
}

/**
 * Returns an api-client bound to the current admin JWT token.
 * Safe to call on every render — createApiClient is a thin factory.
 */
export function getAdminClient(): App3RApiClient {
  if (MOCK_MODE) return createMockShortCircuitClient()
  return createApiClient({
    baseUrl: API_BASE,
    getToken: () =>
      typeof window !== 'undefined' ? (getToken() ?? '') : '',
  })
}
