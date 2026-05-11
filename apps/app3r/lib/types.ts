// ============================================================
// lib/types.ts — Public Listing types for Phase C-4.1a
// ============================================================

export type ListingType = "resell" | "scrap" | "repair" | "maintain";

export type ConditionType = "มือสอง-ดีมาก" | "มือสอง-ดี" | "มือสอง-พอใช้" | "ชำรุด";

export type ScrapMaterial = "อลูมิเนียม" | "ทองแดง" | "เหล็ก" | "พลาสติก" | "อื่นๆ";

export type ListingStatus = "active" | "sold" | "reserved" | "closed";

export interface SellerInfo {
  id: string;
  displayName: string;
  rating: number; // 1-5
  totalSales: number;
  verified: boolean;
  joinedYear: number;
}

export interface ResellListing {
  id: string;
  type: "resell";
  title: string;
  description: string;
  price: number; // THB
  priceLabel: string;
  location: string;
  province: string;
  brand: string;
  condition: ConditionType;
  category: string;
  images: string[]; // Lorem Picsum URLs
  seller: SellerInfo;
  status: ListingStatus;
  postedAt: string;
  postedDaysAgo: number;
  viewCount: number;
  sponsored?: boolean;
  featured?: boolean;
}

export interface ScrapListing {
  id: string;
  type: "scrap";
  title: string;
  description: string;
  pricePerKg: number; // THB/kg
  pricePerKgLabel: string;
  totalWeight: number; // kg
  totalWeightLabel: string;
  estimatedValue: number; // THB
  estimatedValueLabel: string;
  location: string;
  province: string;
  material: ScrapMaterial;
  images: string[]; // Lorem Picsum URLs
  seller: SellerInfo;
  status: ListingStatus;
  postedAt: string;
  postedDaysAgo: number;
  viewCount: number;
  sponsored?: boolean;
  featured?: boolean;
}

export type PublicListing = ResellListing | ScrapListing;

// ============================================================
// Filter / Sort types
// ============================================================

export interface ResellFilter {
  province?: string;
  priceMin?: number;
  priceMax?: number;
  brand?: string;
  condition?: ConditionType;
  category?: string;
  sort?: "latest" | "price-asc" | "price-desc" | "popular";
}

export interface ScrapFilter {
  province?: string;
  material?: ScrapMaterial;
  weightMin?: number;
  weightMax?: number;
  pricePerKgMin?: number;
  pricePerKgMax?: number;
  sort?: "latest" | "weight-asc" | "weight-desc" | "price-asc" | "price-desc";
}

export interface UnifiedFilter {
  type?: "all" | "resell" | "scrap";
  province?: string;
  priceMin?: number;
  priceMax?: number;
  sort?: "latest" | "price-asc" | "price-desc" | "popular";
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
