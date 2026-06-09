/**
 * wave1-auth.ts — Wave1 Auth Adapter for WeeeT
 *
 * Wave1 Deliverable: Tech auth wiring (register/login/OTP/JWT)
 * Contract: apps/backend/docs/wave0/d2-openapi.yaml  (auth paths)
 * Types:    packages/shared/src/api-client.ts         (AuthResponse, Otp*)
 * Fixtures: packages/shared/src/mock-fixtures/auth.fixtures.ts
 *
 * Status: WAVE1 MOCK — aligned with d2 contract.
 *         Real fetch → replace with createApiClient() from @app3r/shared once backend is live.
 *
 * Note: WeeeT has no self-registration (accounts created by WeeeR shop admin).
 *       OTP flow is for email verification on first login / password reset.
 */

// ── Types — aligned with d2-openapi.yaml AuthResponse schema ─────────────────

export interface Wave1AuthResponse {
  access_token: string
  user: {
    id: string
    email: string
    role: string
  }
}

export interface Wave1OtpRequestResponse {
  message: string
  expiresAt: string
  /** Only present in development */
  code?: string
}

export interface Wave1OtpVerifyResponse {
  verified: boolean
}

// ── Storage ───────────────────────────────────────────────────────────────────

const TOKEN_KEY = "weeet_wave1_token"

export function storeToken(token: string): void {
  try { sessionStorage.setItem(TOKEN_KEY, token) } catch {}
}

export function getToken(): string | null {
  try { return sessionStorage.getItem(TOKEN_KEY) } catch { return null }
}

export function clearToken(): void {
  try { sessionStorage.removeItem(TOKEN_KEY) } catch {}
}

// ── Mock Auth (Wave1 — no live backend) ───────────────────────────────────────
//
// Responses aligned with mock-fixtures/auth.fixtures.ts (mockAuthResponseWeeet)
// Replace the `// MOCK:` block with real fetch when backend goes live.

const MOCK_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLXdlZWV0LTAwMSIsInJvbGUiOiJ3ZWVldCIsImlhdCI6MTc0OTQ3MjAwMCwiZXhwIjoxNzQ5NDczMDAwfQ.mock"

/**
 * POST /auth/signin — sign in with email + password
 * Returns null if credentials are empty (client-side guard only in mock).
 */
export async function wave1SignIn(
  email: string,
  _password: string,
): Promise<Wave1AuthResponse | null> {
  if (!email) return null

  // MOCK: simulate ~600ms network round-trip
  await new Promise((r) => setTimeout(r, 600))

  // MOCK: aligned with mockAuthResponseWeeet from auth.fixtures.ts
  const response: Wave1AuthResponse = {
    access_token: MOCK_TOKEN,
    user: { id: "user-weeet-001", email, role: "weeet" },
  }

  storeToken(response.access_token)
  return response
}

/**
 * POST /auth/otp/request — request OTP code (email_verify / password_reset)
 * Used by WeeeT on first login (email verification) and password-reset flow.
 */
export async function wave1RequestOtp(
  email: string,
  type: "email_verify" | "password_reset" | "phone_verify" = "email_verify",
): Promise<Wave1OtpRequestResponse> {
  // MOCK: simulate ~400ms
  await new Promise((r) => setTimeout(r, 400))

  return {
    message: `OTP sent to ${email} (${type})`,
    expiresAt: "2026-06-09T12:10:00Z",
    code: "123456", // dev-only hint — aligned with mockOtpRequestResponse
  }
}

/**
 * POST /auth/otp/verify — verify 6-digit OTP code
 */
export async function wave1VerifyOtp(
  _email: string,
  _code: string,
  _type: "email_verify" | "password_reset" | "phone_verify" = "email_verify",
): Promise<Wave1OtpVerifyResponse> {
  // MOCK: any 6-digit code passes
  await new Promise((r) => setTimeout(r, 400))
  return { verified: true }
}

/**
 * Wave1 sign-out — clear stored token.
 * POST /auth/signout (wave1: local-only, no server invalidation yet)
 */
export function wave1SignOut(): void {
  clearToken()
}
