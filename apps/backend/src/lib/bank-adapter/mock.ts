/**
 * bank-adapter/mock.ts — MockBankAdapter (Sub-CMD-6 Wave 2)
 *
 * ใช้สำหรับ dev/test — simulate bank transfer success
 * ไม่มี real HTTP call — returns immediately with fake bank ref
 *
 * Swap to real adapter:
 *   1. Implement BankAdapter interface สำหรับ SCB / KBank
 *   2. Register ใน bank-adapter/index.ts
 *   3. Set bankAdapter = 'scb' | 'kbank' เมื่อสร้าง settlement
 */
import type { BankAdapter, TransferParams, BankTransferResult, BankTransferStatus } from './interface'

export class MockBankAdapter implements BankAdapter {
  readonly name = 'mock' as const

  async initiateTransfer(params: TransferParams): Promise<BankTransferResult> {
    // Simulate: generate fake bank reference
    const fakeBankRef = `MOCK-${Date.now()}-${params.ref.slice(0, 8).toUpperCase()}`

    const rawResponse = JSON.stringify({
      adapter: 'mock',
      ref: params.ref,
      bankRef: fakeBankRef,
      amount: params.amountThb,
      recipientAccount: params.weeerBankAccount,
      recipientName: params.recipientName,
      timestamp: new Date().toISOString(),
      status: 'completed',
    })

    return {
      success: true,
      bankRef: fakeBankRef,
      rawResponse,
      errorMessage: null,
    }
  }

  async checkStatus(_bankRef: string): Promise<BankTransferStatus> {
    // Mock: always returns completed
    return 'completed'
  }
}

export const mockBankAdapter = new MockBankAdapter()
