/**
 * providers/twoC2P.ts — 2C2P Skeleton (Phase D-5)
 *
 * 2C2P: Thai payment gateway (card + PromptPay + internet banking)
 * Phase D-2: Skeleton — throws NotImplementedError
 * Phase D-5: ใช้ Payment Token API (JWT-signed)
 *   POST https://sandbox-pgw.2c2p.com/payment/4.1/paymentToken
 *
 * Required env (assertGatewayVar ตอน enable):
 *   TWOC2P_MERCHANT_ID, TWOC2P_SECRET_KEY
 */
import type {
  PaymentProvider, CheckoutInput, CheckoutSession,
  PaymentEvent, RefundResult,
} from '../interface'
import { NotImplementedError } from '../interface'

export const twoCTwoPAdapter: PaymentProvider = {
  name: '2c2p',

  async createPaymentIntent(_amount: number, _currency: string): Promise<CheckoutSession> {
    throw new NotImplementedError('2c2p', 'createPaymentIntent')
  },

  async createCheckoutSession(_input: CheckoutInput): Promise<CheckoutSession> {
    // Phase D-5: implement 2C2P Payment Token API
    // const merchantId = assertGatewayVar('TWOC2P_MERCHANT_ID')
    // const secretKey = assertGatewayVar('TWOC2P_SECRET_KEY')
    throw new NotImplementedError('2c2p', 'createCheckoutSession')
  },

  async verifyWebhookSignature(_signature: string, _body: string): Promise<PaymentEvent> {
    // Phase D-5: verify HMAC-SHA256 signature from 2C2P
    throw new NotImplementedError('2c2p', 'verifyWebhookSignature')
  },

  async refund(_transactionId: string, _amount: number): Promise<RefundResult> {
    // Phase D-5: 2C2P Void/Refund API
    throw new NotImplementedError('2c2p', 'refund')
  },
}
