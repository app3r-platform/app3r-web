/**
 * payment/interface.ts — Sub-CMD-1.1 Wave 1 Issue C: Payment Provider Interface
 *
 * Pluggable payment architecture (Advisor decision — D89):
 *   Phase D-2: โอนตรง (manual bank transfer) เป็น primary
 *   Phase D-5: เชื่อม gateway จริง (2C2P / Stripe / TrueMoney / Omise)
 *
 * Provider registry ใน index.ts
 * Skeleton providers ใน providers/*.ts
 *
 * PCI-DSS SAQ-A: hosted checkout only — บัตรไม่แตะ server เรา
 */

// ── Input / Output shapes ────────────────────────────────────────────────────
export interface CheckoutInput {
  amount: number        // สตางค์ / smallest unit (not THB directly)
  currency: string      // 'THB'
  purposeRef: string    // payment_intent.id (internal reference)
  description: string
  returnUrl: string
  cancelUrl: string
  metadata?: Record<string, string>
}

export interface CheckoutSession {
  checkoutUrl: string
  providerRef: string
  provider: PaymentProviderName
}

export interface PaymentEvent {
  provider: PaymentProviderName
  eventType: string
  providerEventId: string
  intentRef: string
  status: 'succeeded' | 'failed' | 'refunded' | 'disputed'
  raw: unknown
}

export interface RefundResult {
  success: boolean
  refundId?: string
  error?: string
}

// ── Provider name union ──────────────────────────────────────────────────────
export type PaymentProviderName =
  | '2c2p'
  | 'stripe'
  | 'truemoney'
  | 'omise'
  | 'manual_bank_transfer'

// ── PaymentProvider interface ────────────────────────────────────────────────
export interface PaymentProvider {
  name: PaymentProviderName

  /**
   * สร้าง checkout session / payment URL
   * Phase D-5: connect real gateway
   * Phase D-2: throws NotImplementedError (except manualBankTransfer)
   */
  createPaymentIntent(amount: number, currency: string): Promise<CheckoutSession>

  /**
   * Alias ที่เดิม routes/payment.ts ใช้ — kept for backward compat
   */
  createCheckoutSession(input: CheckoutInput): Promise<CheckoutSession>

  /**
   * Verify webhook signature + parse event
   */
  verifyWebhookSignature(signature: string, body: string): Promise<PaymentEvent>

  /**
   * Issue refund
   */
  refund(transactionId: string, amount: number): Promise<RefundResult>
}

// ── NotImplementedError ──────────────────────────────────────────────────────
export class NotImplementedError extends Error {
  constructor(provider: PaymentProviderName, method: string) {
    super(`[Payment] ${provider}.${method} not implemented (Phase D-5 — gateway skeleton)`)
    this.name = 'NotImplementedError'
  }
}
