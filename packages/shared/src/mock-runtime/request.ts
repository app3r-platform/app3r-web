/**
 * mock-runtime/request.ts — Mock-First Runtime Standard (CMD #115-V/W)
 *
 * Factory ของ data layer แบบ mock-first — extract จาก Admin pilot (99bf696
 * `apps/admin/lib/api.ts`) ให้ 5 แอพ import ตัวเดียวกัน (กัน divergence · Gen 54 union lesson).
 *
 * พฤติกรรม (RC1/RC2 ของ Mock-First Standard):
 *   1. mock mode → throw BACKEND_UNAVAILABLE ทันที (ไม่ยิง backend = ไม่มี 500)
 *   2. token fetch ต้องไม่ throw — ล้มเหลว = ไม่มี token แล้วไปต่อ (caller ตัดสินใจเอง)
 *   3. network ล่ม / ไม่มี backend → BACKEND_UNAVAILABLE (caller fallback mock)
 *   4. 401 จริงเท่านั้น → UNAUTHORIZED (caller redirect login) · 404/500/อื่น → BACKEND_UNAVAILABLE
 *
 * App-specific (inject ผ่าน config): base path + token provider (dev vs prod) + mockMode
 *
 * ⚠️ mockMode = REQUIRED (CMD #115-AG/AH · config injection): app ต้อง inject เสมอ
 *    shared ไม่อ่าน process.env เอง — env inline deterministic เฉพาะใน app code (build เต็ม)
 *    ข้าม package boundary Next ไม่ inline → DEV browser ได้ false (= BUG-3 regression Phase2)
 *
 * Usage (Phase 3 ต่อแอพ):
 *   import { createMockFirstApi } from '@app3r/shared/src/mock-runtime'
 *   import { getToken } from './auth'
 *   import { getDevTestToken } from './dev-auth'
 *   export const api = createMockFirstApi({
 *     mockMode: process.env.NEXT_PUBLIC_DEV_NAV === 'true',
 *     getToken: () =>
 *       process.env.NODE_ENV === 'development' ? getDevTestToken().catch(() => null) : getToken(),
 *   })
 */

import { ERR_BACKEND_UNAVAILABLE, ERR_UNAUTHORIZED } from './errors'

export interface MockFirstApiConfig {
  /** Base URL prefix ของทุก request (default '/api/v1') */
  base?: string
  /**
   * คืน JWT token (หรือ null ถ้าไม่มี) — รองรับทั้ง sync และ async
   * ต้องไม่ throw: ถ้า throw factory จะกลืน error แล้วไปต่อแบบไม่มี token
   */
  getToken?: () => Promise<string | null> | string | null
  /**
   * mock mode flag — app ต้อง inject (`process.env.NEXT_PUBLIC_DEV_NAV === 'true'`)
   * REQUIRED (CMD #115-AG/AH): shared ไม่อ่าน env เอง → inline ใน app chunk = deterministic
   */
  mockMode: boolean
}

interface ErrorBody {
  detail?: string
}

export function createMockFirstApi(config: MockFirstApiConfig) {
  const base = config.base ?? '/api/v1'

  async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    // (1) mock mode: ห้ามยิง backend → โยน BACKEND_UNAVAILABLE → หน้าเพจ fallback mock
    //     mockMode = inject จาก app (config injection · ไม่อ่าน env ใน shared = กัน BUG-3)
    if (config.mockMode) {
      throw new Error(ERR_BACKEND_UNAVAILABLE)
    }

    // (2) token fetch ต้องไม่ throw
    let token: string | null = null
    if (config.getToken) {
      try {
        token = (await config.getToken()) ?? null
      } catch {
        token = null
      }
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }
    if (token) headers['Authorization'] = `Bearer ${token}`

    // (3) network ล่ม / ไม่มี backend → BACKEND_UNAVAILABLE
    let res: Response
    try {
      res = await fetch(`${base}${path}`, { ...options, headers })
    } catch {
      throw new Error(ERR_BACKEND_UNAVAILABLE)
    }

    if (!res.ok) {
      // (4) redirect login เฉพาะ 401 จริง · อื่นๆ = backend ไม่พร้อม → fallback mock
      if (res.status === 401) throw new Error(ERR_UNAUTHORIZED)
      const err = (await res.json().catch(() => ({ detail: ERR_BACKEND_UNAVAILABLE }))) as ErrorBody
      throw new Error(err.detail ?? ERR_BACKEND_UNAVAILABLE)
    }

    return res.json() as Promise<T>
  }

  return {
    request,
    get: <T>(path: string) => request<T>(path),
    post: <T>(path: string, body: unknown) =>
      request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
    patch: <T>(path: string, body?: unknown) =>
      request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
    put: <T>(path: string, body: unknown) =>
      request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  }
}

export type MockFirstApi = ReturnType<typeof createMockFirstApi>
