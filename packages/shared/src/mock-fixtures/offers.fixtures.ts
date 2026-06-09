/**
 * offers.fixtures.ts — Mock offer data
 * Aligned with: d2-openapi.yaml#/components/schemas/OfferResponse
 */
import type { OfferResponse } from '../api-client'

export const mockOfferPending: OfferResponse = {
  id: 'offer-001',
  listingId: 'listing-repair-002',
  buyerId: 'user-weeer-001',
  price: 850,
  status: 'pending',
  message: 'รับซ่อมได้เลย มีประสบการณ์ซ่อมรุ่นนี้มาก่อน',
  createdAt: '2026-06-09T09:30:00Z',
  updatedAt: '2026-06-09T09:30:00Z',
}

export const mockOfferPending2: OfferResponse = {
  id: 'offer-002',
  listingId: 'listing-repair-002',
  buyerId: 'user-weeer-002',
  price: 700,
  status: 'pending',
  message: 'ราคาถูก งานคุณภาพ รับประกัน 3 เดือน',
  createdAt: '2026-06-09T10:00:00Z',
  updatedAt: '2026-06-09T10:00:00Z',
}

export const mockOfferAccepted: OfferResponse = {
  id: 'offer-003',
  listingId: 'listing-repair-003',
  buyerId: 'user-weeer-001',
  price: 1200,
  status: 'accepted',
  message: null,
  createdAt: '2026-05-21T08:00:00Z',
  updatedAt: '2026-05-21T12:00:00Z',
}

export const mockOfferWithdrawn: OfferResponse = {
  id: 'offer-004',
  listingId: 'listing-repair-002',
  buyerId: 'user-weeer-003',
  price: 950,
  status: 'withdrawn',
  message: 'ขอถอนออก',
  createdAt: '2026-06-08T11:00:00Z',
  updatedAt: '2026-06-09T08:00:00Z',
}
