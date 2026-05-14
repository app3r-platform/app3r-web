/**
 * config.ts — Sub-CMD-1.1 Wave 1 Issue B: Boot-time Config Validator
 *
 * ตรวจ required env vars ตอน app start — ถ้าหาย → throw + ไม่ start
 * Pattern: fail-fast at startup (เหมือน env.ts แต่ครอบ SDK adapter vars)
 *
 * Required vars (SDK Adapters — ห้ามมี hardcoded values ใน prod):
 *   R2_ENDPOINT       — Cloudflare R2 endpoint
 *   R2_ACCESS_KEY_ID  — R2 credentials
 *   R2_SECRET_ACCESS_KEY
 *   R2_BUCKET         — target bucket name
 *   MAPS_API_KEY      — Google Maps API key
 *   RESEND_API_KEY    — Resend email API key
 *   TWILIO_SMS_FROM   — Twilio sender phone number ('+66XXXXXXXXX')
 *
 * Gateway vars (Payment providers — skipped: Phase D-5 full integration):
 *   TWOC2P_MERCHANT_ID, TWOC2P_SECRET_KEY, STRIPE_SECRET_KEY,
 *   STRIPE_WEBHOOK_SECRET — validated separately when gateway is enabled
 *
 * Hardcoded fallbacks found in SDK adapters (audit Issue B):
 *   r2.ts: R2_ENDPOINT ?? 'placeholder', R2_ACCESS_KEY_ID ?? 'placeholder-key', etc.
 *   maps.ts: MAPS_API_KEY ?? '' (returns empty string silently)
 *   email.ts: RESEND_API_KEY ?? 're_placeholder'
 *   payment.ts: TWOC2P_MERCHANT_ID ?? 'sandbox-merchant', STRIPE_SECRET_KEY ?? 'sk_test_placeholder'
 *   cron.ts: no hardcoded secrets (safe)
 *
 * PDPA: ห้าม log actual values — log variable names เท่านั้น
 */

// ── Required SDK adapter vars ────────────────────────────────────────────────
const REQUIRED_SDK_VARS: readonly string[] = [
  'R2_ENDPOINT',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_BUCKET',
  'MAPS_API_KEY',
  'RESEND_API_KEY',
  'TWILIO_SMS_FROM',
]

// ── Gateway vars (validated when provider is enabled, not at startup) ────────
export const GATEWAY_VARS: readonly string[] = [
  'TWOC2P_MERCHANT_ID',
  'TWOC2P_SECRET_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
]

// ── Config Validator ─────────────────────────────────────────────────────────
export interface ConfigValidationResult {
  valid: boolean
  missing: string[]
  warnings: string[]
}

/**
 * validateSdkConfig — ตรวจ required SDK env vars
 * ใช้ใน development mode: log warning แล้วดำเนินต่อ
 * ใช้ใน production mode: throw Error → app ไม่ start
 */
export function validateSdkConfig(nodeEnv: string = process.env.NODE_ENV ?? 'development'): ConfigValidationResult {
  const missing: string[] = []
  const warnings: string[] = []

  for (const varName of REQUIRED_SDK_VARS) {
    const value = process.env[varName]
    if (!value) {
      missing.push(varName)
    } else if (
      value.includes('placeholder') ||
      value.includes('sandbox') ||
      value.startsWith('re_placeholder')
    ) {
      // Placeholder value detected (not empty, but not real)
      warnings.push(`${varName} appears to be a placeholder value`)
    }
  }

  const valid = missing.length === 0

  if (!valid && nodeEnv === 'production') {
    const msg = [
      '❌ Config Validator: Missing required environment variables',
      `   Missing: ${missing.join(', ')}`,
      '   App will not start until all required vars are set.',
    ].join('\n')
    throw new Error(msg)
  }

  if (!valid && nodeEnv !== 'production') {
    console.warn('⚠️  Config Validator (development): Missing SDK env vars:')
    console.warn(`   Missing: ${missing.join(', ')}`)
    console.warn('   App will start in development mode with placeholder values.')
    console.warn('   Set these vars before production deploy.\n')
  }

  if (warnings.length > 0 && nodeEnv !== 'production') {
    console.warn('⚠️  Config Validator (development): Placeholder values detected:')
    for (const w of warnings) console.warn(`   - ${w}`)
    console.warn('')
  }

  if (warnings.length > 0 && nodeEnv === 'production') {
    const msg = [
      '❌ Config Validator: Placeholder values detected in production',
      ...warnings.map((w) => `   - ${w}`),
    ].join('\n')
    throw new Error(msg)
  }

  return { valid, missing, warnings }
}

/**
 * assertGatewayConfig — ตรวจ payment gateway vars ตอนใช้งานจริง
 * เรียกจาก provider.createCheckoutSession ก่อน connect
 */
export function assertGatewayVar(varName: string): string {
  const value = process.env[varName]
  if (!value) {
    throw new Error(`Payment gateway config missing: ${varName} is required to use this provider`)
  }
  return value
}
