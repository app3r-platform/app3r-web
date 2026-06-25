/**
 * resell-w3a-logic.test.ts — D2 Resell W3a pure-logic units (ไม่แตะ DB)
 *   - isEscrowMutatingTransition: S1 boundary ครบสำหรับ flow W3a (ship/deliver=ปลอด · inspect/cancel-locked=guarded)
 *   - shouldRefundOfferFeesOnCancel: F3 gate (receiving_offers · resell|scrap · faultParty≠buyer)
 */
import { describe, it, expect } from 'vitest'
import { isEscrowMutatingTransition, shouldRefundOfferFeesOnCancel } from '../../src/lib/listing-state'

describe('W3a S1 boundary — isEscrowMutatingTransition', () => {
  it('RELEASE-flow non-money transitions = NOT mutating (generic /transition ปล่อยผ่าน · แต่ใช้ guarded เพื่อ fulfillment)', () => {
    expect(isEscrowMutatingTransition('buyer_confirmed', 'in_progress')).toBe(false) // ship
    expect(isEscrowMutatingTransition('in_progress', 'delivered')).toBe(false) // deliver step1
    expect(isEscrowMutatingTransition('delivered', 'inspection_period')).toBe(false) // deliver step2
  })

  it('inspect-confirm (→completed = release) = MUST be guarded (S1 block generic)', () => {
    expect(isEscrowMutatingTransition('inspection_period', 'completed')).toBe(true)
  })

  it('cancel from locked (→refund) = guarded · cancel from receiving_offers (no escrow) = NOT mutating', () => {
    expect(isEscrowMutatingTransition('buyer_confirmed', 'cancelled')).toBe(true) // refund → guarded
    expect(isEscrowMutatingTransition('receiving_offers', 'cancelled')).toBe(false) // F3 offer_fee only
    expect(isEscrowMutatingTransition('announced', 'cancelled')).toBe(false)
  })
})

describe('W3a F3 gate — shouldRefundOfferFeesOnCancel', () => {
  it('fires: receiving_offers → cancelled · resell/scrap · faultParty≠buyer', () => {
    expect(shouldRefundOfferFeesOnCancel('receiving_offers', 'cancelled', 'resell', 'seller')).toBe(true)
    expect(shouldRefundOfferFeesOnCancel('receiving_offers', 'cancelled', 'scrap', 'none')).toBe(true)
    expect(shouldRefundOfferFeesOnCancel('receiving_offers', 'cancelled', 'resell', undefined)).toBe(true)
  })

  it('does NOT fire: faultParty=buyer (ริบ · ruling 5)', () => {
    expect(shouldRefundOfferFeesOnCancel('receiving_offers', 'cancelled', 'resell', 'buyer')).toBe(false)
  })

  it('does NOT fire: from≠receiving_offers (locked = refundEscrow path) / to≠cancelled', () => {
    expect(shouldRefundOfferFeesOnCancel('buyer_confirmed', 'cancelled', 'resell', 'seller')).toBe(false)
    expect(shouldRefundOfferFeesOnCancel('offer_selected', 'cancelled', 'resell', 'seller')).toBe(false)
    expect(shouldRefundOfferFeesOnCancel('receiving_offers', 'receiving_offers', 'resell', 'seller')).toBe(false)
  })

  it('does NOT fire: non-resell listingType (parts/repair/maintain)', () => {
    expect(shouldRefundOfferFeesOnCancel('receiving_offers', 'cancelled', 'parts', 'seller')).toBe(false)
    expect(shouldRefundOfferFeesOnCancel('receiving_offers', 'cancelled', 'repair', 'none')).toBe(false)
  })
})
