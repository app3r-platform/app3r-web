/**
 * bank-adapter/index.ts — Registry (Sub-CMD-6 Wave 2)
 *
 * Swap-ready registry: เมื่อ bank contract จริงมา
 *   1. implement BankAdapter interface
 *   2. เพิ่มใน bankAdapters record
 *   3. ตั้ง DEFAULT_BANK_ADAPTER = 'scb' | 'kbank'
 *
 * เหมือน payment/index.ts pattern (Sub-CMD-1.1)
 */
import type { BankAdapter, BankAdapterName } from './interface'
import { mockBankAdapter } from './mock'

export { type BankAdapter, type BankAdapterName } from './interface'
export { type TransferParams, type BankTransferResult, type BankTransferStatus } from './interface'

// Default adapter (ปัจจุบัน = mock รอ bank contract)
export const DEFAULT_BANK_ADAPTER: BankAdapterName = 'mock'

// Registry — เพิ่ม real adapter เมื่อ contract มา
const bankAdapters: Record<BankAdapterName, BankAdapter> = {
  mock: mockBankAdapter,
  scb: mockBankAdapter,   // TODO: swap → new SCBAdapter() เมื่อ contract จริงมา
  kbank: mockBankAdapter, // TODO: swap → new KBankAdapter() เมื่อ contract จริงมา
}

export function getBankAdapter(name: BankAdapterName = DEFAULT_BANK_ADAPTER): BankAdapter {
  const adapter = bankAdapters[name]
  if (!adapter) throw new Error(`Unknown bank adapter: ${name}`)
  return adapter
}
