// ── @app3r/dal — WeeeR DAL Types — D84 (Phase D-1) ───────────────────────────
// ⚠️  FILE OWNERSHIP: Sub-CMD-P4 (App3R-WeeeR) เป็นเจ้าของไฟล์นี้เท่านั้น
// DO NOT EDIT unless you are P4 (App3R-WeeeR)
// Reference: D84 Migration Adapter (Critical) + D81 Parts B2B

import type { IDataAccessLayer, Result } from "./primitives";
// NOTE: Result และ Primitive types อยู่ใน primitives.ts (P3 จะ define ใน index.ts)

// ═══════════════════════════════════════════════════════════════════════════════
// OFFER DAL (ข้อเสนองาน)
// ═══════════════════════════════════════════════════════════════════════════════

export interface OfferRecord {
  id: string;
  announcementId: string;
  weeerShopId: string;
  weeeTId: string;
  proposedPrice: number;
  note?: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
}

export interface IOfferDAL {
  getOffers(shopId: string): Promise<Result<OfferRecord[]>>;
  getOffer(id: string): Promise<Result<OfferRecord>>;
  createOffer(data: Omit<OfferRecord, "id" | "createdAt">): Promise<Result<OfferRecord>>;
  updateOfferStatus(id: string, status: OfferRecord["status"]): Promise<Result<OfferRecord>>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// REPAIR JOB DAL (งานซ่อม)
// ═══════════════════════════════════════════════════════════════════════════════

export interface RepairJobRecord {
  id: string;
  shopId: string;
  weeeTId: string;
  status: string;
  applianceName: string;
  customerName: string;
  customerAddress: string;
  originalPrice: number;
  finalPrice?: number;
  scheduledAt: string;
  source?: { type: "customer" | "purchased_scrap"; refId?: string };
  updatedAt: string;
}

export interface IRepairJobDAL {
  getJobs(shopId: string, filter?: { status?: string }): Promise<Result<RepairJobRecord[]>>;
  getJob(id: string): Promise<Result<RepairJobRecord>>;
  updateJobStatus(id: string, status: string, meta?: Partial<RepairJobRecord>): Promise<Result<RepairJobRecord>>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAINTENANCE DAL (งานบำรุงรักษา)
// ═══════════════════════════════════════════════════════════════════════════════

export interface MaintenanceJobRecord {
  id: string;
  shopId: string;
  technicianId?: string;
  status: string;
  applianceType: "AC" | "WashingMachine";
  cleaningType: "general" | "deep" | "sanitize";
  scheduledAt: string;
  totalPrice: number;
  address: { lat: number; lng: number; address: string };
  updatedAt: string;
}

export interface IMaintenanceDAL {
  getJobs(shopId: string, filter?: { status?: string }): Promise<Result<MaintenanceJobRecord[]>>;
  getJob(id: string): Promise<Result<MaintenanceJobRecord>>;
  assignTechnician(jobId: string, technicianId: string): Promise<Result<MaintenanceJobRecord>>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// RESELL LISTING DAL (รายการขายต่อ)
// ═══════════════════════════════════════════════════════════════════════════════

export interface ResellListingRecord {
  id: string;
  shopId: string;
  title: string;
  description?: string;
  pricePoints: number;
  status: "active" | "sold" | "cancelled";
  imageUrls: string[];
  createdAt: string;
}

export interface IResellListingDAL {
  getListings(shopId: string): Promise<Result<ResellListingRecord[]>>;
  getListing(id: string): Promise<Result<ResellListingRecord>>;
  createListing(data: Omit<ResellListingRecord, "id" | "createdAt">): Promise<Result<ResellListingRecord>>;
  updateListing(id: string, data: Partial<ResellListingRecord>): Promise<Result<ResellListingRecord>>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCRAP LISTING DAL (รายการซาก)
// ═══════════════════════════════════════════════════════════════════════════════

export interface ScrapListingRecord {
  id: string;
  shopId: string;
  itemDescription: string;
  grade: "A" | "B" | "C";
  pricePoints: number;
  status: "available" | "reserved" | "sold";
  imageUrls: string[];
  createdAt: string;
}

export interface IScrapListingDAL {
  getListings(filter?: { grade?: string; status?: string }): Promise<Result<ScrapListingRecord[]>>;
  getListing(id: string): Promise<Result<ScrapListingRecord>>;
  reserveListing(id: string, buyerShopId: string): Promise<Result<ScrapListingRecord>>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PARTS DAL (อะไหล่ — B2B Marketplace D81)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @migrate-to-backend-d2
 * Parts storage DAL — ปัจจุบัน backend คือ localStorage (D-1)
 * D-2 จะ migrate storage layer นี้ไป backend API
 * business logic (escrow, fee calc) อยู่ใน parts-escrow.ts — แยกออกจาก DAL แล้ว
 */
export interface PartListingRecord {
  id: string;
  shopId: string;
  shopName: string;
  category: string;
  name: string;
  brand: string;
  condition: string;
  pricePoints: number;
  stock: number;
  images: string[];
  description?: string;
  createdAt: string;
}

/**
 * @migrate-to-backend-d2
 * PartOrder storage — backend คือ localStorage (D-1)
 * D-2 จะ migrate ไป backend API (escrow logic อยู่ parts-escrow.ts)
 */
export interface PartOrderRecord {
  id: string;
  partId: string;
  partName: string;
  sellerShopId: string;
  buyerShopId: string;
  quantity: number;
  pricePoints: number;
  totalPoints: number;
  platformFee: number;
  netToSeller: number;
  deliveryMethod: string;
  trackingNumber?: string;
  stage: "ordered" | "shipped" | "received" | "cancelled";
  orderedAt: string;
  shippedAt?: string;
  receivedAt?: string;
  cancelledAt?: string;
}

export interface IPartsDAL {
  // Listings
  getListings(filter?: { shopId?: string; category?: string; condition?: string }): Promise<Result<PartListingRecord[]>>;
  getListing(id: string): Promise<Result<PartListingRecord>>;
  createListing(data: Omit<PartListingRecord, "id" | "createdAt">): Promise<Result<PartListingRecord>>;
  updateListingStock(id: string, delta: number): Promise<Result<PartListingRecord>>;

  // Orders
  /** @migrate-to-backend-d2 placeOrder — escrow logic อยู่ parts-escrow.ts (frontend domain) */
  getOrders(filter?: { shopId?: string; role?: "buyer" | "seller"; stage?: string }): Promise<Result<PartOrderRecord[]>>;
  getOrder(id: string): Promise<Result<PartOrderRecord>>;
  createOrder(data: Omit<PartOrderRecord, "id" | "orderedAt">): Promise<Result<PartOrderRecord>>;
  updateOrderStage(id: string, stage: PartOrderRecord["stage"], meta?: Partial<PartOrderRecord>): Promise<Result<PartOrderRecord>>;

  // Escrow storage (key-value — business logic อยู่ parts-escrow.ts)
  /** @migrate-to-backend-d2 escrow storage — D-2 จะ wire ไป backend escrow service */
  getEscrowRecords(buyerShopId?: string): Promise<Result<unknown[]>>;
  saveEscrowRecord(record: unknown): Promise<Result<void>>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// WeeeR Composite DAL interface
// ═══════════════════════════════════════════════════════════════════════════════

export interface IWeeerDAL extends IDataAccessLayer {
  offer: IOfferDAL;
  repairJob: IRepairJobDAL;
  maintenance: IMaintenanceDAL;
  resellListing: IResellListingDAL;
  scrapListing: IScrapListingDAL;
  parts: IPartsDAL;
}

// ── Feature Flags (ฟีเจอร์เปิด/ปิด per module) ───────────────────────────────
// Default: ทุกตัว OFF — เปิดผ่าน .env.local

export type WeeerFeatureFlag =
  | "NEXT_PUBLIC_USE_API_AUTH"
  | "NEXT_PUBLIC_USE_API_POINTS"
  | "NEXT_PUBLIC_USE_API_OFFER"
  | "NEXT_PUBLIC_USE_API_REPAIR"
  | "NEXT_PUBLIC_USE_API_MAINTAIN"
  | "NEXT_PUBLIC_USE_API_PARTS"
  | "NEXT_PUBLIC_USE_API_SCRAP"
  | "NEXT_PUBLIC_USE_API_RESELL";
