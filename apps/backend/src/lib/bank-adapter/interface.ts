/**
 * bank-adapter/interface.ts — Sub-CMD-6 Wave 2
 *
 * Interface-based bank adapter (R1 Mitigation):
 *   ปัจจุบัน: MockBankAdapter (dev/test)
 *   อนาคต: SCBAdapter, KBankAdapter — swap โดยไม่ต้อง touch business logic
 *
 * Registry pattern: ลงทะเบียน adapter ใน index.ts
 * เมื่อ bank contract จริงมา → implement interface + register
 */

export type BankAdapterName = 'mock' | 'scb' | 'kbank'

export interface TransferParams {
  ref: string              // settlement ID (สำหรับ trace)
  weeerBankAccount: string // หมายเลขบัญชีปลายทาง (WeeeR)
  amountThb: number        // จำนวนเงิน THB
  recipientName: string    // ชื่อผู้รับ
}

export interface BankTransferResult {
  success: boolean
  bankRef: string | null     // reference จากธนาคาร (null ถ้า failed)
  rawResponse: string        // JSON string ของ response ดิบ
  errorMessage: string | null
}

export type BankTransferStatus = 'pending' | 'completed' | 'failed'

export interface BankAdapter {
  readonly name: BankAdapterName
  initiateTransfer(params: TransferParams): Promise<BankTransferResult>
  checkStatus(bankRef: string): Promise<BankTransferStatus>
}
