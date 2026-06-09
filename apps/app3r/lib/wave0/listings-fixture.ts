// Wave0-compatible listing mock data
// Mirrors: packages/shared/src/mock-fixtures/listings.fixtures.ts
// Aligned with: d2-openapi.yaml#/components/schemas/ListingMetaResponse
// TODO: Replace with live API call when Wave1 quality gate passes.

export type ListingType = "repair" | "maintain" | "resell" | "scrap";
export type ListingState = "announced" | "receiving_offers" | "completed";

export interface ListingMeta {
  listingId: string;
  listingType: ListingType;
  ownerId: string;
  state: ListingState;
  viewCount: number;
  offerCount: number;
  tambonId: number | null;
  createdAt: string;
  updatedAt: string;
}

export const WAVE0_LISTINGS: ListingMeta[] = [
  {
    listingId: "listing-repair-001",
    listingType: "repair",
    ownerId: "user-weeeu-001",
    state: "announced",
    viewCount: 12,
    offerCount: 0,
    tambonId: 100101,
    createdAt: "2026-06-08T09:00:00Z",
    updatedAt: "2026-06-09T10:00:00Z",
  },
  {
    listingId: "listing-repair-002",
    listingType: "repair",
    ownerId: "user-weeeu-001",
    state: "receiving_offers",
    viewCount: 45,
    offerCount: 3,
    tambonId: 100101,
    createdAt: "2026-06-05T08:00:00Z",
    updatedAt: "2026-06-09T11:00:00Z",
  },
  {
    listingId: "listing-maintain-001",
    listingType: "maintain",
    ownerId: "user-weeeu-001",
    state: "announced",
    viewCount: 8,
    offerCount: 1,
    tambonId: 100201,
    createdAt: "2026-06-08T14:00:00Z",
    updatedAt: "2026-06-09T08:00:00Z",
  },
  {
    listingId: "listing-resell-001",
    listingType: "resell",
    ownerId: "user-weeer-001",
    state: "announced",
    viewCount: 22,
    offerCount: 0,
    tambonId: 100301,
    createdAt: "2026-06-07T10:00:00Z",
    updatedAt: "2026-06-09T09:00:00Z",
  },
  {
    listingId: "listing-scrap-001",
    listingType: "scrap",
    ownerId: "user-weeeu-001",
    state: "announced",
    viewCount: 5,
    offerCount: 0,
    tambonId: null,
    createdAt: "2026-06-09T07:00:00Z",
    updatedAt: "2026-06-09T07:00:00Z",
  },
];
