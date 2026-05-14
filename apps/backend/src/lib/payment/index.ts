/**
 * payment/index.ts — Payment Provider Registry
 *
 * Sub-CMD-1.1 Wave 1 Issue C: Pluggable Payment Architecture
 *
 * Phase D-2 primary: manual_bank_transfer (โอนตรง — อ.PP decision)
 * Phase D-5: enable real gateways (2C2P primary Thai, Stripe international)
 *
 * Registry pattern: getPaymentProvider(name) → throws if unknown/disabled
 */
export type { PaymentProvider, PaymentProviderName, CheckoutInput, CheckoutSession, PaymentEvent, RefundResult } from './interface'
export { NotImplementedError } from './interface'

import type { PaymentProvider, PaymentProviderName } from './interface'
import { manualBankTransferAdapter } from './providers/manualBankTransfer'
import { twoCTwoPAdapter } from './providers/twoC2P'
import { stripeAdapter } from './providers/stripe'
import { trueMoneyAdapter } from './providers/truemoney'
import { omiseAdapter } from './providers/omise'

// ── Registry ─────────────────────────────────────────────────────────────────
export const paymentProviders: Record<PaymentProviderName, PaymentProvider> = {
  manual_bank_transfer: manualBankTransferAdapter,
  '2c2p': twoCTwoPAdapter,
  stripe: stripeAdapter,
  truemoney: trueMoneyAdapter,
  omise: omiseAdapter,
}

// ── Default provider (Phase D-2) ─────────────────────────────────────────────
export const DEFAULT_PAYMENT_PROVIDER: PaymentProviderName = 'manual_bank_transfer'

// ── Lookup ────────────────────────────────────────────────────────────────────
export function getPaymentProvider(name: string): PaymentProvider {
  const provider = paymentProviders[name as PaymentProviderName]
  if (!provider) {
    throw new Error(`Unknown payment provider: "${name}". Valid: ${Object.keys(paymentProviders).join(', ')}`)
  }
  return provider
}
