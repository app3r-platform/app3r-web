/**
 * mock-runtime/dev-token.ts — Mock-First Runtime Standard (CMD #115-V/W)
 *
 * Dev auth bypass แบบ mock-first — extract จาก Admin pilot (99bf696
 * `apps/admin/lib/dev-auth.ts`). ❗ TODO: REMOVE BEFORE PROD — dev-only bypass.
 *
 * พฤติกรรม:
 *   - guard: throw ถ้า NODE_ENV !== 'development'
 *   - mock mode (NEXT_PUBLIC_DEV_NAV) → ใช้ bypass token ทันที (ไม่ยิง /_dev endpoint = ไม่มี 404)
 *   - มี backend → ยิง endpoint ขอ test token · ล้มเหลว → fallback bypass token (ไม่ throw ให้ caller พัง)
 *   - cache token ใน memory + persist ผ่าน saveToken (inject ต่อแอพ)
 *
 * App-specific (inject ผ่าน config): token storage (saveToken/removeToken),
 * endpoint, request payload (เช่น role), mockMode — ส่วนที่เหลือ generic ทุกแอพ
 *
 * ⚠️ mockMode = REQUIRED (CMD #115-AG/AH · config injection): app ต้องส่ง
 *    `process.env.NEXT_PUBLIC_DEV_NAV === 'true'` · shared ไม่อ่าน env เอง (กัน BUG-3)
 */

export interface DevTokenConfig {
  /**
   * mock mode flag — app ต้อง inject (`process.env.NEXT_PUBLIC_DEV_NAV === 'true'`)
   * REQUIRED (CMD #115-AG/AH): shared ไม่อ่าน env เอง → inline ใน app chunk = deterministic
   */
  mockMode: boolean
  /** persist token ลง storage ของแอพ (เช่น localStorage) ให้ isAuthenticated() ใช้ได้ */
  saveToken: (token: string) => void
  /** ล้าง token ออกจาก storage ของแอพ */
  removeToken: () => void
  /** endpoint ขอ test token (default '/api/v1/_dev/get-test-token') */
  endpoint?: string
  /** payload ที่ส่งไป endpoint (เช่น { user_id, role }) — ต่างกันต่อแอพ */
  payload?: unknown
  /** token ที่ใช้ตอน bypass (default 'dev-jwt-bypass') */
  bypassToken?: string
}

interface TestTokenResponse {
  token: string
}

export function createDevTokenProvider(config: DevTokenConfig) {
  const endpoint = config.endpoint ?? '/api/v1/_dev/get-test-token'
  const bypassToken = config.bypassToken ?? 'dev-jwt-bypass'
  const payload = config.payload ?? { user_id: 1, role: 'admin' }
  let cachedToken: string | null = null

  async function getDevTestToken(): Promise<string> {
    // guard: dev only
    if (process.env.NODE_ENV !== 'development') {
      throw new Error('Dev auth bypass disabled in non-dev environment')
    }

    if (cachedToken) return cachedToken

    // mock mode → bypass token ทันที (ไม่ยิง endpoint ที่ไม่มี = ไม่รก console)
    //   mockMode = inject จาก app (config injection · ไม่อ่าน env ใน shared = กัน BUG-3)
    if (config.mockMode) {
      cachedToken = bypassToken
      config.saveToken(cachedToken)
      return cachedToken
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(`Failed to get test token: ${response.status}`)
      }

      const data = (await response.json()) as TestTokenResponse
      cachedToken = data.token
      config.saveToken(cachedToken)
      return cachedToken
    } catch {
      // mock-first: token fetch ล้มเหลว → bypass แทน (ไม่ throw ให้ caller พัง)
      cachedToken = bypassToken
      config.saveToken(cachedToken)
      return cachedToken
    }
  }

  function clearDevToken(): void {
    cachedToken = null
    config.removeToken()
  }

  return { getDevTestToken, clearDevToken }
}
