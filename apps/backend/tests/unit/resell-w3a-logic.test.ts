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

  it('F1 (W3b): disputed exits = escrow-mutating → generic /transition 403 → admin-resolve เท่านั้น (กัน deadlock)', () => {
    expect(isEscrowMutatingTransition('disputed', 'cancelled')).toBe(true) // buyer-win refund
    expect(isEscrowMutatingTransition('disputed', 'completed')).toBe(true) // seller-win/split release
  })
})

describe('offer_fee refund-on-cancel gate — shouldRefundOfferFeesOnCancel (W3a F3 + W3b carry#1)', () => {
  it('fires: cancelled · resell/scrap · faultParty≠buyer (รวม selected-offer post-confirm · carry#1)', () => {
    expect(shouldRefundOfferFeesOnCancel('cancelled', 'resell', 'seller')).toBe(true)
    expect(shouldRefundOfferFeesOnCancel('cancelled', 'scrap', 'none')).toBe(true)
    expect(shouldRefundOfferFeesOnCancel('cancelled', 'resell', 'mutual')).toBe(true)
    expect(shouldRefundOfferFeesOnCancel('cancelled', 'resell', undefined)).toBe(true)
  })

  it('does NOT fire: faultParty=buyer (FORFEIT · R9/R4 · ruling 5)', () => {
    expect(shouldRefundOfferFeesOnCancel('cancelled', 'resell', 'buyer')).toBe(false)
  })

  it('does NOT fire: to≠cancelled (completed = seller-win/settle · ไม่คืน offer_fee)', () => {
    expect(shouldRefundOfferFeesOnCancel('completed', 'resell', 'seller')).toBe(false)
    expect(shouldRefundOfferFeesOnCancel('disputed', 'resell', 'seller')).toBe(false)
  })

  it('does NOT fire: non-resell listingType (parts/repair/maintain)', () => {
    expect(shouldRefundOfferFeesOnCancel('cancelled', 'parts', 'seller')).toBe(false)
    expect(shouldRefundOfferFeesOnCancel('cancelled', 'repair', 'none')).toBe(false)
  })
})
