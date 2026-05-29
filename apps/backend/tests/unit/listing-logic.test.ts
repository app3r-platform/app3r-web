/**
 * listing-logic.test.ts — W-Round-1 Wave 1.2 [3][4]: pure-logic unit tests
 * (state transitions · D75 rounding · GR-8 visibility) — ไม่แตะ DB
 */
import { describe, it, expect } from 'vitest'
import { canTransition } from '../../src/lib/listing-state'
import { roundD75, calcAdCost } from '../../src/lib/point-service'
import { publicCounters, isListingInsider } from '../../src/lib/listing-counters'

describe('D59 state machine — canTransition (Ruling 1B)', () => {
  it('allows forward happy path', () => {
    expect(canTransition('draft', 'announced')).toBe(true)
    expect(canTransition('announced', 'receiving_offers')).toBe(true)
    expect(canTransition('receiving_offers', 'offer_selected')).toBe(true)
    expect(canTransition('offer_selected', 'buyer_confirmed')).toBe(true)
    expect(canTransition('buyer_confirmed', 'in_progress')).toBe(true)
    expect(canTransition('in_progress', 'delivered')).toBe(true)
    expect(canTransition('delivered', 'inspection_period')).toBe(true)
    expect(canTransition('inspection_period', 'completed')).toBe(true)
  })

  it('allows cancel before completed', () => {
    expect(canTransition('draft', 'cancelled')).toBe(true)
    expect(canTransition('announced', 'cancelled')).toBe(true)
    expect(canTransition('receiving_offers', 'cancelled')).toBe(true)
    expect(canTransition('offer_selected', 'cancelled')).toBe(true)
  })

  it('blocks illegal jumps + terminal exits', () => {
    expect(canTransition('draft', 'offer_selected')).toBe(false)
    expect(canTransition('announced', 'completed')).toBe(false)
    expect(canTransition('completed', 'cancelled')).toBe(false)
    expect(canTransition('completed', 'announced')).toBe(false)
    expect(canTransition('cancelled', 'draft')).toBe(false)
  })
})

describe('D75 rounding', () => {
  it('rounds ≥.5 up, <.5 down', () => {
    expect(roundD75(10.5)).toBe(11)
    expect(roundD75(10.49)).toBe(10)
    expect(roundD75(3)).toBe(3)
  })

  it('calcAdCost = rate/day × days, rounded', () => {
    expect(calcAdCost(3, 7)).toBe(21)
    expect(calcAdCost(2.5, 3)).toBe(8) // 7.5 → 8
    expect(calcAdCost(5, 1)).toBe(5)
  })
})

describe('GR-8 visibility — publicCounters', () => {
  const base = { viewCount: 42, offerCount: 5 }

  it('shows offerCount when not yet offer_selected', () => {
    expect(publicCounters({ ...base, state: 'announced' }, false).offerCount).toBe(5)
    expect(publicCounters({ ...base, state: 'receiving_offers' }, false).offerCount).toBe(5)
  })

  it('hides offerCount from outsider once offer_selected (matched)', () => {
    const r = publicCounters({ ...base, state: 'offer_selected' }, false)
    expect(r.offerCount).toBeNull()
    expect(r.viewCount).toBe(42) // view ยังเห็น
  })

  it('shows offerCount to insider even when offer_selected', () => {
    expect(publicCounters({ ...base, state: 'offer_selected' }, true).offerCount).toBe(5)
  })
})

describe('isListingInsider', () => {
  const listing = { ownerId: 'owner-1' }
  it('owner is insider', () => {
    expect(isListingInsider(listing, { userId: 'owner-1' })).toBe(true)
  })
  it('admin is insider', () => {
    expect(isListingInsider(listing, { userId: 'x', role: 'admin' })).toBe(true)
    expect(isListingInsider(listing, { userId: 'x', role: 'super_admin' })).toBe(true)
  })
  it('outsider / anon is not insider', () => {
    expect(isListingInsider(listing, { userId: 'other' })).toBe(false)
    expect(isListingInsider(listing, { userId: null })).toBe(false)
  })
})
