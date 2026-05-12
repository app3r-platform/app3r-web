/**
 * email.ts — D91: Email adapter (Resend primary + AWS SES Y2+ bulk)
 *
 * EmailAdapter interface = abstraction layer
 * → swap to SES / SendGrid ได้โดยไม่แก้ caller
 *
 * Queue pattern (D-2): direct send (KISS Y1)
 * Y2+: BullMQ + Redis worker
 *
 * ตรวจ email_preferences ก่อน send ทุกครั้ง:
 * - marketing_opt_in=false → skip marketing
 * - unsubscribed_at IS NOT NULL → skip all (ยกเว้น critical)
 *
 * SPF + DKIM + DMARC: ต้อง set up ก่อน production deploy
 * Templates: React Email (apps/backend/emails/) — D-2 scaffold text-only
 */
import { Resend } from 'resend'

// ---------------------------------------------------------------------------
// EmailAdapter interface
// ---------------------------------------------------------------------------
export interface SendEmailInput {
  to: string
  subject: string
  html: string
  text?: string
  from?: string
  replyTo?: string
  tags?: Record<string, string>
}

export interface SendEmailResult {
  messageId: string
  success: boolean
  error?: string
}

export interface EmailAdapter {
  send(input: SendEmailInput): Promise<SendEmailResult>
}

// ---------------------------------------------------------------------------
// Resend adapter (primary transactional Y1)
// ---------------------------------------------------------------------------
let _resend: Resend | null = null

function getResend(): Resend {
  if (_resend) return _resend
  _resend = new Resend(process.env.RESEND_API_KEY ?? 're_placeholder')
  return _resend
}

const DEFAULT_FROM = process.env.EMAIL_FROM ?? 'App3R <noreply@app3r.dev>'

export const resendAdapter: EmailAdapter = {
  async send(input: SendEmailInput): Promise<SendEmailResult> {
    const resend = getResend()
    const { data, error } = await resend.emails.send({
      from: input.from ?? DEFAULT_FROM,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
      replyTo: input.replyTo,
      tags: input.tags
        ? Object.entries(input.tags).map(([name, value]) => ({ name, value }))
        : undefined,
    })

    if (error || !data) {
      return {
        messageId: '',
        success: false,
        error: error?.message ?? 'Unknown Resend error',
      }
    }
    return { messageId: data.id, success: true }
  },
}

// ---------------------------------------------------------------------------
// Email template helpers (scaffold — D-2 text-only)
// ---------------------------------------------------------------------------
export function renderSignupVerifyEmail(params: {
  userName: string
  verifyUrl: string
}): { html: string; text: string } {
  return {
    html: `<p>สวัสดี ${params.userName},</p><p><a href="${params.verifyUrl}">ยืนยันอีเมล</a></p>`,
    text: `สวัสดี ${params.userName}, ยืนยันอีเมล: ${params.verifyUrl}`,
  }
}

export function renderPaymentReceiptEmail(params: {
  userName: string
  amount: string
  intentId: string
}): { html: string; text: string } {
  return {
    html: `<p>สวัสดี ${params.userName},</p><p>ชำระเงิน ฿${params.amount} สำเร็จ (REF: ${params.intentId})</p>`,
    text: `ชำระเงิน ฿${params.amount} สำเร็จ (REF: ${params.intentId})`,
  }
}
