/**
 * payment.ts — Compatibility barrel (Sub-CMD-1.1 Wave 1 Issue C)
 *
 * Payment logic moved to payment/ directory (pluggable architecture).
 * This file re-exports everything so existing imports don't break.
 *
 * Existing import: `import { getPaymentProvider } from '../lib/payment'`
 * Resolves here → re-exported from ./payment/index
 *
 * @see ./payment/interface.ts  — PaymentProvider interface + types
 * @see ./payment/index.ts      — registry + getPaymentProvider
 * @see ./payment/providers/*.ts — provider implementations (skeletons)
 */
export * from './payment/index'
