/**
 * providers/manualBankTransfer.ts — Primary payment method Phase D-2
 *
 * อ.PP decision: โอนตรง (manual bank transfer) เป็น primary ระยะแรก
 * Phase D-5: replace with gateway (2C2P / TrueMoney)
 *
 * Flow: user โอนตรง → upload slip → admin verify → confirm payment_intent
 * Slip upload: POST /api/v1/files/presign (purpose='document')
 */
import type {
  PaymentProvider, CheckoutInput, CheckoutSession,
  PaymentEvent, RefundResult,
} from '../interface'

export const manualBankTransferAdapter: PaymentProvider = {
  name: 'manual_bank_transfer',

  async createPaymentIntent(amount: number, currency: string): Promise<CheckoutSession> {
    return this.createCheckoutSession({
      amount,
      currency,
      purposeRef: `manual-${Date.now()}`,
      description: 'Manual bank transfer',
      returnUrl: '',
      cancelUrl: '',
    })
  },

  async createCheckoutSession(input: CheckoutInput): Promise<CheckoutSession> {
    // Manual transfer: no external checkout URL — return instruction page URL
    // Phase D-2: frontend shows bank account details + QR code
    const ref = `MANUAL-${input.purposeRef.slice(0, 8).toUpperCase()}`
    return {
      checkoutUrl: `/payment/manual?ref=${ref}&amount=${input.amount}`,
      providerRef: ref,
      provider: 'manual_bank_transfer',
    }
  },

  async verifyWebhookSignature(_signature: string, body: string): Promise<PaymentEvent> {
    // Manual transfer: no webhook — admin manually confirms via admin panel
    // This method is called when admin marks payment as received
    const parsed = JSON.parse(body) as { intentRef?: string; adminRef?: string }
    return {
      provider: 'manual_bank_transfer',
      eventType: 'manual.payment_confirmed',
      providerEventId: parsed.adminRef ?? `manual-${Date.now()}`,
      intentRef: parsed.intentRef ?? '',
      status: 'succeeded',
      raw: parsed,
    }
  },

  async refund(_transactionId: string, _amount: number): Promise<RefundResult> {
    // Manual transfer: refund requires manual bank transfer back
    // TODO D-3: admin UI for refund tracking
    return {
      success: false,
      error: 'Manual bank transfer refund requires manual processing — contact admin',
    }
  },
}
