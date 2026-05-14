/**
 * providers/stripe.ts — Stripe Skeleton (Phase D-5)
 *
 * Stripe: international payments + subscription (WeeeR subscription plan)
 * Phase D-2: Skeleton — throws NotImplementedError
 * Phase D-5: implement full Stripe Checkout Session API
 *
 * Required env (assertGatewayVar ตอน enable):
 *   STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
 *
 * PCI-DSS SAQ-A: hosted checkout only — บัตรไม่แตะ server เรา
 */
import type {
  PaymentProvider, CheckoutInput, CheckoutSession,
  PaymentEvent, RefundResult,
} from '../interface'
import { NotImplementedError } from '../interface'

export const stripeAdapter: PaymentProvider = {
  name: 'stripe',

  async createPaymentIntent(_amount: number, _currency: string): Promise<CheckoutSession> {
    throw new NotImplementedError('stripe', 'createPaymentIntent')
  },

  async createCheckoutSession(_input: CheckoutInput): Promise<CheckoutSession> {
    // Phase D-5: implement stripe.checkout.sessions.create(...)
    // const stripe = new Stripe(assertGatewayVar('STRIPE_SECRET_KEY'), { apiVersion: '...' })
    throw new NotImplementedError('stripe', 'createCheckoutSession')
  },

  async verifyWebhookSignature(_signature: string, _body: string): Promise<PaymentEvent> {
    // Phase D-5: stripe.webhooks.constructEvent(body, signature, webhookSecret)
    throw new NotImplementedError('stripe', 'verifyWebhookSignature')
  },

  async refund(_transactionId: string, _amount: number): Promise<RefundResult> {
    // Phase D-5: stripe.refunds.create({ payment_intent, amount })
    throw new NotImplementedError('stripe', 'refund')
  },
}
