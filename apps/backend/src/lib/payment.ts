/**
 * payment.ts — D89: Payment adapter (2C2P primary + Stripe/TrueMoney scaffolding)
 *
 * PCI-DSS SAQ-A: hosted checkout เท่านั้น — บัตรไม่แตะ server เรา
 *
 * Phase D-2: 2C2P primary (Thai card + promptpay + internet banking)
 * Phase D-2: Stripe scaffolding (subscription WeeeR + international)
 * Phase D-2: TrueMoney scaffolding (e-wallet Thai)
 * Phase D-5: multi-provider full integration
 *
 * NOTE-D89-2: D-2 ไม่มี withdrawal UI — manual process Phase D-5
 * NOTE-M3: Reconciliation cron daily 02:00 → flag stale >24h → ดู cron.ts
 *
 * payment_intents ↔ wallets/point_ledger sync: @needs-point-review
 */
import Stripe from 'stripe'
type StripeInstance = InstanceType<typeof Stripe>

// ---------------------------------------------------------------------------
// PaymentProvider interface (Adapter Pattern D89)
// ---------------------------------------------------------------------------
export interface CheckoutInput {
  amount: number        // satang (not THB directly) or smallest unit
  currency: string      // 'THB'
  purposeRef: string    // internal reference (payment_intent.id)
  description: string
  returnUrl: string
  cancelUrl: string
  metadata?: Record<string, string>
}

export interface CheckoutSession {
  checkoutUrl: string
  providerRef: string
  provider: '2c2p' | 'truemoney' | 'stripe'
}

export interface PaymentEvent {
  provider: '2c2p' | 'truemoney' | 'stripe'
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

export interface PaymentProvider {
  name: '2c2p' | 'truemoney' | 'stripe'
  createCheckoutSession(input: CheckoutInput): Promise<CheckoutSession>
  verifyWebhookSignature(signature: string, body: string): Promise<PaymentEvent>
  refund(transactionId: string, amount: number): Promise<RefundResult>
}

// ---------------------------------------------------------------------------
// 2C2P Adapter (primary — REST-based, no official SDK)
// ---------------------------------------------------------------------------
// @needs-point-review: payment → point_ledger sync logic
export const twoCTwoPAdapter: PaymentProvider = {
  name: '2c2p',

  async createCheckoutSession(input: CheckoutInput): Promise<CheckoutSession> {
    // TODO D-2: 2C2P Payment Token API
    // POST https://sandbox-pgw.2c2p.com/payment/4.1/paymentToken
    const merchantId = process.env.TWOC2P_MERCHANT_ID ?? 'sandbox-merchant'
    const secretKey = process.env.TWOC2P_SECRET_KEY ?? 'sandbox-secret'

    // Scaffold only — real implementation requires 2C2P JWT token generation
    console.log('[2C2P] createCheckoutSession scaffold', { merchantId, secretKey: '***', input })
    return {
      checkoutUrl: `https://sandbox-pgw.2c2p.com/payment/checkout?token=stub-${input.purposeRef}`,
      providerRef: `2c2p-stub-${Date.now()}`,
      provider: '2c2p',
    }
  },

  async verifyWebhookSignature(signature: string, body: string): Promise<PaymentEvent> {
    // TODO D-2: verify HMAC-SHA256 signature from 2C2P
    console.log('[2C2P] verifyWebhookSignature scaffold', { signature: '***' })
    const parsed = JSON.parse(body)
    return {
      provider: '2c2p',
      eventType: parsed.paymentStatus ?? 'unknown',
      providerEventId: parsed.invoiceNo ?? `stub-${Date.now()}`,
      intentRef: parsed.merchantDefined1 ?? '',
      status: parsed.paymentStatus === '000' ? 'succeeded' : 'failed',
      raw: parsed,
    }
  },

  async refund(_transactionId: string, _amount: number): Promise<RefundResult> {
    // TODO D-2: 2C2P Void/Refund API
    console.log('[2C2P] refund scaffold')
    return { success: false, error: '2C2P refund not yet implemented (D-2 scaffold)' }
  },
}

// ---------------------------------------------------------------------------
// Stripe Adapter (scaffolding — subscription + international)
// ---------------------------------------------------------------------------
let _stripe: StripeInstance | null = null

function getStripe(): StripeInstance {
  if (_stripe) return _stripe
  _stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? 'sk_test_placeholder', {
    apiVersion: '2026-04-22.dahlia',
  })
  return _stripe
}

export const stripeAdapter: PaymentProvider = {
  name: 'stripe',

  async createCheckoutSession(input: CheckoutInput): Promise<CheckoutSession> {
    const stripe = getStripe()
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: input.currency.toLowerCase(),
            product_data: { name: input.description },
            unit_amount: Math.round(input.amount * 100), // Stripe uses smallest unit
          },
          quantity: 1,
        },
      ],
      success_url: input.returnUrl,
      cancel_url: input.cancelUrl,
      metadata: { purposeRef: input.purposeRef, ...input.metadata },
    })
    return {
      checkoutUrl: session.url ?? '',
      providerRef: session.id,
      provider: 'stripe',
    }
  },

  async verifyWebhookSignature(signature: string, body: string): Promise<PaymentEvent> {
    const stripe = getStripe()
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? ''
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)

    let status: PaymentEvent['status'] = 'failed'
    if (event.type === 'checkout.session.completed') status = 'succeeded'
    else if (event.type === 'charge.refunded') status = 'refunded'
    else if (event.type === 'charge.dispute.created') status = 'disputed'

    const session = event.data.object as { metadata?: Record<string, string> | null }
    return {
      provider: 'stripe',
      eventType: event.type,
      providerEventId: event.id,
      intentRef: (session.metadata?.['purposeRef'] as string) ?? '',
      status,
      raw: event,
    }
  },

  async refund(transactionId: string, amount: number): Promise<RefundResult> {
    const stripe = getStripe()
    const refund = await stripe.refunds.create({
      payment_intent: transactionId,
      amount: Math.round(amount * 100),
    })
    return { success: refund.status === 'succeeded', refundId: refund.id }
  },
}

// ---------------------------------------------------------------------------
// TrueMoney Adapter (scaffolding — e-wallet Thai)
// ---------------------------------------------------------------------------
export const trueMoneyAdapter: PaymentProvider = {
  name: 'truemoney',

  async createCheckoutSession(input: CheckoutInput): Promise<CheckoutSession> {
    // TODO D-2: TrueMoney Wallet SDK / REST API
    console.log('[TrueMoney] createCheckoutSession scaffold', input)
    return {
      checkoutUrl: `https://checkout.truemoney.com/stub?ref=${input.purposeRef}`,
      providerRef: `tm-stub-${Date.now()}`,
      provider: 'truemoney',
    }
  },

  async verifyWebhookSignature(_signature: string, body: string): Promise<PaymentEvent> {
    console.log('[TrueMoney] verifyWebhookSignature scaffold')
    const parsed = JSON.parse(body)
    return {
      provider: 'truemoney',
      eventType: parsed.status ?? 'unknown',
      providerEventId: parsed.transaction_id ?? `stub-${Date.now()}`,
      intentRef: parsed.reference ?? '',
      status: parsed.status === 'success' ? 'succeeded' : 'failed',
      raw: parsed,
    }
  },

  async refund(_transactionId: string, _amount: number): Promise<RefundResult> {
    console.log('[TrueMoney] refund scaffold')
    return { success: false, error: 'TrueMoney refund not yet implemented (D-2 scaffold)' }
  },
}

// ---------------------------------------------------------------------------
// Provider registry
// ---------------------------------------------------------------------------
export const paymentProviders: Record<string, PaymentProvider> = {
  '2c2p': twoCTwoPAdapter,
  truemoney: trueMoneyAdapter,
  stripe: stripeAdapter,
}

export function getPaymentProvider(name: string): PaymentProvider {
  const provider = paymentProviders[name]
  if (!provider) throw new Error(`Unknown payment provider: ${name}`)
  return provider
}
