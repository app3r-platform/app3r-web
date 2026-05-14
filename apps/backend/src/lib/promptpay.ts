/**
 * promptpay.ts — Sub-CMD-2: PromptPay QR Code Generator
 *
 * ตามมาตรฐาน EMVCo QR Code Specification + ธปท. PromptPay TLV format
 *
 * Format: TLV (Tag-Length-Value)
 *   00: Payload Format Indicator = "01"
 *   01: Point of Initiation Method = "12" (dynamic) | "11" (static, no amount)
 *   29: Merchant Account Info (PromptPay ID = A000000677010111)
 *       00: Globally Unique Identifier = "A000000677010111"
 *       01: Proxy (phone / National ID / TaxID)
 *   53: Transaction Currency = "764" (THB)
 *   54: Transaction Amount (optional — dynamic QR)
 *   58: Country Code = "TH"
 *   59: Merchant Name = "N/A"
 *   60: Merchant City = "Bangkok"
 *   63: CRC (CRC16-CCITT XMODEM over entire string up to "6304")
 *
 * Proxy format:
 *   Phone: 0XXXXXXXXX → +66XXXXXXXXX (10 digits, pad 00 for leading 0)
 *   National ID / TaxID: 13 digits, no transformation
 *
 * Reference:
 *   BoT PromptPay QR spec: https://www.bot.or.th/Thai/PaymentSystems/PSStandard/Pages/StandardQR.aspx
 */

// ── TLV builder ──────────────────────────────────────────────────────────────
function tlv(tag: string, value: string): string {
  const len = value.length.toString().padStart(2, '0')
  return `${tag}${len}${value}`
}

// ── Phone normalizer: 0812345678 → 0066812345678 ────────────────────────────
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('0') && digits.length === 10) {
    return `0066${digits.slice(1)}`
  }
  if (digits.startsWith('66') && digits.length === 11) {
    return `00${digits}`
  }
  return digits
}

// ── CRC16-CCITT XMODEM algorithm ─────────────────────────────────────────────
function crc16(str: string): string {
  let crc = 0xFFFF
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021
      } else {
        crc <<= 1
      }
      crc &= 0xFFFF
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

// ── Main generator ────────────────────────────────────────────────────────────
export interface PromptPayInput {
  phone?: string        // Thai mobile number (0XXXXXXXXX format)
  nationalId?: string   // Thai National ID or Tax ID (13 digits)
  amount?: number       // THB amount (optional — static QR if omitted)
}

/**
 * generatePromptPayQr — สร้าง QR payload string สำหรับ PromptPay
 *
 * ผลลัพธ์: string ที่นำไป encode เป็น QR Code ได้ทันที
 * (ใช้ library อย่าง qrcode หรือ react-qr-code เพื่อ render)
 *
 * @example
 *   const payload = generatePromptPayQr({ phone: '0812345678', amount: 500 })
 *   // → "000201010212..." (EMVCo format)
 */
export function generatePromptPayQr(input: PromptPayInput): string {
  if (!input.phone && !input.nationalId) {
    throw new Error('generatePromptPayQr: must provide phone or nationalId')
  }

  // Determine proxy value
  const proxy = input.phone
    ? normalizePhone(input.phone)
    : input.nationalId!.replace(/\D/g, '')

  // Point of Initiation Method: 12=dynamic (with amount or unique ref), 11=static
  const initiationMethod = input.amount ? '12' : '11'

  // 29: Merchant Account Info (PromptPay)
  const merchantInfo = tlv('29',
    tlv('00', 'A000000677010111') +   // Globally Unique Identifier
    tlv('01', proxy),                 // Proxy (phone or national ID)
  )

  // Amount field (tag 54) — optional
  const amountField = input.amount
    ? tlv('54', input.amount.toFixed(2))
    : ''

  // Build payload (without CRC)
  const payloadWithoutCrc =
    tlv('00', '01') +              // Payload Format Indicator
    tlv('01', initiationMethod) +  // Point of Initiation Method
    merchantInfo +                 // Merchant Account Info
    tlv('53', '764') +             // Transaction Currency = THB
    amountField +                  // Transaction Amount (optional)
    tlv('58', 'TH') +              // Country Code
    tlv('59', 'N/A') +             // Merchant Name
    tlv('60', 'Bangkok') +         // Merchant City
    '6304'                         // CRC tag (value computed next)

  // Compute CRC16 over the whole string including "6304"
  const checksum = crc16(payloadWithoutCrc)

  return payloadWithoutCrc + checksum
}

/**
 * generatePromptPayQrForDeposit — convenience wrapper สำหรับ deposit flow
 * สร้าง ref พร้อม QR payload
 */
export function generatePromptPayQrForDeposit(params: {
  shopPhone: string   // PromptPay phone ของร้าน/Admin (from env)
  amountThb: number
  transferId: string  // bank_transfers.id (สำหรับ trace)
}): { payload: string; promptpayRef: string } {
  const promptpayRef = `PP${params.transferId.slice(0, 8).toUpperCase()}`
  const payload = generatePromptPayQr({
    phone: params.shopPhone,
    amount: params.amountThb,
  })
  return { payload, promptpayRef }
}
