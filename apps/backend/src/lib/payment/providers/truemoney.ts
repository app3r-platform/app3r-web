/**
 * providers/truemoney.ts — TrueMoney Wallet Skeleton (Phase D-5)
 *
 * TrueMoney: Thai e-wallet (popular for small payments)
 * Phase D-2: Skeleton — throws NotImplementedError
 * Phase D-5: TrueMoney Wallet SDK / REST API
 *
 * Required env (assertGatewayVar ตอน enable):
 *   TRUEMONEY_APP_ID, TRUEMONEY_SECRET
 */
import type {
  PaymentProvider, CheckoutInput, CheckoutSession,
  PaymentEvent, RefundResult,
} from '../interface'
import { NotImplementedError } from '../interface'

export const trueMoneyAdapter: PaymentProvider = {
  name: 'truemoney',

  async createPaymentIntent(_amount: number, _currency: string): Promise<CheckoutSession> {
    throw new NotImplementedError('truemoney', 'createPaymentIntent')
  },

  async createCheckoutSession(_input: CheckoutInput): Promise<CheckoutSession> {
    // Phase D-5: TrueMoney Checkout redirect URL
    throw new NotImplementedError('truemoney', 'createCheckoutSession')
  },

  async verifyWebhookSignature(_signature: string, _body: string): Promise<PaymentEvent> {
    // Phase D-5: verify TrueMoney webhook signature
    throw new NotImplementedError('truemoney', 'verifyWebhookSignature')
  },

  async refund(_transactionId: string, _amount: number): Promise<RefundResult> {
    // Phase D-5: TrueMoney refund API
    throw new NotImplementedError('truemoney', 'refund')
  },
}
