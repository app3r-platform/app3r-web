/**
 * listings.fixtures.ts — Mock listing_meta data
 * Aligned with: d2-openapi.yaml#/components/schemas/ListingMetaResponse
 */
import type { ListingMetaResponse, ListingListResponse, OfferResponse } from '../api-client'

export const mockListingRepairAnnounced: ListingMetaResponse = {
  listingId: 'listing-repair-001',
  listingType: 'repair',
  ownerId: 'user-weeeu-001',
  state: 'announced',
  viewCount: 12,
  offerCount: 0,
  tambonId: 100101, // Bangkok, Phra Nakhon
  createdAt: '2026-06-08T09:00:00Z',
  updatedAt: '2026-06-09T10:00:00Z',
}

export const mockListingRepairReceivingOffers: ListingMetaResponse = {
  listingId: 'listing-repair-002',
  listingType: 'repair',
  ownerId: 'user-weeeu-001',
  state: 'receiving_offers',
  viewCount: 45,
  offerCount: 3,
  tambonId: 100101,
  createdAt: '2026-06-05T08:00:00Z',
  updatedAt: '2026-06-09T11:00:00Z',
}

export const mockListingMaintainAnnounced: ListingMetaResponse = {
  listingId: 'listing-maintain-001',
  listingType: 'maintain',
  ownerId: 'user-weeeu-001',
  state: 'announced',
  viewCount: 8,
  offerCount: 1,
  tambonId: 100201, // Bangkok, Samphanthawong
  createdAt: '2026-06-08T14:00:00Z',
  updatedAt: '2026-06-09T08:00:00Z',
}

export const mockListingResellAnnounced: ListingMetaResponse = {
  listingId: 'listing-resell-001',
  listingType: 'resell',
  ownerId: 'user-weeer-001',
  state: 'announced',
  viewCount: 22,
  offerCount: 0,
  tambonId: 100301,
  createdAt: '2026-06-07T10:00:00Z',
  updatedAt: '2026-06-09T09:00:00Z',
}

export const mockListingScrapAnnounced: ListingMetaResponse = {
  listingId: 'listing-scrap-001',
  listingType: 'scrap',
  ownerId: 'user-weeeu-001',
  state: 'announced',
  viewCount: 5,
  offerCount: 0,
  tambonId: null,
  createdAt: '2026-06-09T07:00:00Z',
  updatedAt: '2026-06-09T07:00:00Z',
}

export const mockListingCompleted: ListingMetaResponse = {
  listingId: 'listing-repair-003',
  listingType: 'repair',
  ownerId: 'user-weeeu-001',
  state: 'completed',
  viewCount: 30,
  offerCount: 2,
  tambonId: 100101,
  createdAt: '2026-05-20T08:00:00Z',
  updatedAt: '2026-06-01T16:00:00Z',
}

export const mockListingList: ListingListResponse = {
  items: [
    mockListingRepairReceivingOffers,
    mockListingMaintainAnnounced,
    mockListingRepairAnnounced,
    mockListingResellAnnounced,
    mockListingScrapAnnounced,
  ],
  total: 5,
}
