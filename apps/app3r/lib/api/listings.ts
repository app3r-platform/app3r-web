// ============================================================
// lib/api/listings.ts — Mock API functions for listings
// ============================================================
import type {
  ResellListing,
  ScrapListing,
  PublicListing,
  ResellFilter,
  ScrapFilter,
  UnifiedFilter,
  PaginatedResult,
} from "../types";
import { mockResellListings } from "../mock/resell";
import { mockScrapListings } from "../mock/scrap";

const PAGE_SIZE = 9;

// ============================================================
// Resell API
// ============================================================

export function getResellListings(
  filter: ResellFilter = {},
  page = 1
): PaginatedResult<ResellListing> {
  let items = [...mockResellListings];

  if (filter.province) {
    items = items.filter((l) => l.province === filter.province);
  }
  if (filter.brand) {
    items = items.filter((l) =>
      l.brand.toLowerCase().includes(filter.brand!.toLowerCase())
    );
  }
  if (filter.condition) {
    items = items.filter((l) => l.condition === filter.condition);
  }
  if (filter.category) {
    items = items.filter((l) => l.category === filter.category);
  }
  if (filter.priceMin !== undefined) {
    items = items.filter((l) => l.price >= filter.priceMin!);
  }
  if (filter.priceMax !== undefined) {
    items = items.filter((l) => l.price <= filter.priceMax!);
  }

  // Sort
  if (filter.sort === "price-asc") {
    items.sort((a, b) => a.price - b.price);
  } else if (filter.sort === "price-desc") {
    items.sort((a, b) => b.price - a.price);
  } else if (filter.sort === "popular") {
    items.sort((a, b) => b.viewCount - a.viewCount);
  } else {
    // latest (default)
    items.sort((a, b) => a.postedDaysAgo - b.postedDaysAgo);
  }

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const start = (page - 1) * PAGE_SIZE;
  const paged = items.slice(start, start + PAGE_SIZE);

  return { items: paged, total, page, pageSize: PAGE_SIZE, totalPages };
}

export function getResellListing(id: string): ResellListing | undefined {
  return mockResellListings.find((l) => l.id === id);
}

// ============================================================
// Scrap API
// ============================================================

export function getScrapListings(
  filter: ScrapFilter = {},
  page = 1
): PaginatedResult<ScrapListing> {
  let items = [...mockScrapListings];

  if (filter.province) {
    items = items.filter((l) => l.province === filter.province);
  }
  if (filter.material) {
    items = items.filter((l) => l.material === filter.material);
  }
  if (filter.weightMin !== undefined) {
    items = items.filter((l) => l.totalWeight >= filter.weightMin!);
  }
  if (filter.weightMax !== undefined) {
    items = items.filter((l) => l.totalWeight <= filter.weightMax!);
  }
  if (filter.pricePerKgMin !== undefined) {
    items = items.filter((l) => l.pricePerKg >= filter.pricePerKgMin!);
  }
  if (filter.pricePerKgMax !== undefined) {
    items = items.filter((l) => l.pricePerKg <= filter.pricePerKgMax!);
  }

  // Sort
  if (filter.sort === "weight-asc") {
    items.sort((a, b) => a.totalWeight - b.totalWeight);
  } else if (filter.sort === "weight-desc") {
    items.sort((a, b) => b.totalWeight - a.totalWeight);
  } else if (filter.sort === "price-asc") {
    items.sort((a, b) => a.pricePerKg - b.pricePerKg);
  } else if (filter.sort === "price-desc") {
    items.sort((a, b) => b.pricePerKg - a.pricePerKg);
  } else {
    items.sort((a, b) => a.postedDaysAgo - b.postedDaysAgo);
  }

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const start = (page - 1) * PAGE_SIZE;
  const paged = items.slice(start, start + PAGE_SIZE);

  return { items: paged, total, page, pageSize: PAGE_SIZE, totalPages };
}

export function getScrapListing(id: string): ScrapListing | undefined {
  return mockScrapListings.find((l) => l.id === id);
}

// ============================================================
// Unified API (all types)
// ============================================================

export function getAllListings(
  filter: UnifiedFilter = {},
  page = 1
): PaginatedResult<PublicListing> {
  let resellItems: PublicListing[] = [...mockResellListings];
  let scrapItems: PublicListing[] = [...mockScrapListings];

  // Type filter
  let items: PublicListing[] = [];
  if (!filter.type || filter.type === "all") {
    items = [...resellItems, ...scrapItems];
  } else if (filter.type === "resell") {
    items = resellItems;
  } else {
    items = scrapItems;
  }

  // Province filter
  if (filter.province) {
    items = items.filter((l) => l.province === filter.province);
  }

  // Sort
  if (filter.sort === "popular") {
    items.sort((a, b) => b.viewCount - a.viewCount);
  } else {
    items.sort((a, b) => a.postedDaysAgo - b.postedDaysAgo);
  }

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const start = (page - 1) * PAGE_SIZE;
  const paged = items.slice(start, start + PAGE_SIZE);

  return { items: paged, total, page, pageSize: PAGE_SIZE, totalPages };
}

export function getFeaturedListings(count = 4): ResellListing[] {
  return mockResellListings
    .filter((l) => l.status === "active")
    .sort((a, b) => b.viewCount - a.viewCount)
    .slice(0, count);
}
