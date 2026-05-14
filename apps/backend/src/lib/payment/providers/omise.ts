/**
 * providers/omise.ts — Omise Skeleton (Phase D-5, reserved)
 *
 * Omise: Thai/Asian payment gateway
 * REMOVED from active config per อ.PP decision (Sub-CMD-1.1 Issue C)
 * Skeleton kept for future use — architecture is ready
 *
 * Phase D-2: Skeleton — throws NotImplementedError
 * Phase D-5: implement if scope confirmed
 *
 * Required env (assertGatewayVar ตอน enable):
 *   OMISE_PUBLIC_KEY, OMISE_SECRET_KEY
 */
import type {
  PaymentProvider, CheckoutInput, CheckoutSession,
  PaymentEvent, RefundResult,
} from '../interface'
import { NotImplementedError } from '../interface'

export const omiseAdapter: PaymentProvider = {
  name: 'omise',

  async createPaymentIntent(_amount: number, _currency: string): Promise<CheckoutSession> {
    throw new NotImplementedError('omise', 'createPaymentIntent')
  },

  async createCheckoutSession(_input: CheckoutInput): Promise<CheckoutSession> {
    // Phase D-5: Omise Payment API (if scope confirmed)
    // const secretKey = assertGatewayVar('OMISE_SECRET_KEY')
    throw new NotImplementedError('omise', 'createCheckoutSession')
  },

  async verifyWebhookSignature(_signature: string, _body: string): Promise<PaymentEvent> {
    throw new NotImplementedError('omise', 'verifyWebhookSignature')
  },

  async refund(_transactionId: string, _amount: number): Promise<RefundResult> {
    throw new NotImplementedError('omise', 'refund')
  },
}
