// ── WeeeR localStorageAdapter — D84 (Phase D-1) ───────────────────────────────
// localStorage implementation ของ IWeeerDAL
// ใช้ในทุก Phase C feature — Phase D-2 จะแทนที่ด้วย apiAdapter

import type {
  IWeeerDAL,
  IOfferDAL, OfferRecord,
  IRepairJobDAL, RepairJobRecord,
  IMaintenanceDAL, MaintenanceJobRecord,
  IResellListingDAL, ResellListingRecord,
  IScrapListingDAL, ScrapListingRecord,
  IPartsDAL, PartListingRecord, PartOrderRecord,
  Result,
} from "@app3r/dal";

// ── SSR-safe localStorage ─────────────────────────────────────────────────────
const isBrowser = typeof window !== "undefined";

function lsGet<T>(key: string, fallback: T): T {
  if (!isBrowser) return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch { return fallback; }
}

function lsSet<T>(key: string, value: T): void {
  if (!isBrowser) return;
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* quota */ }
}

function ok<T>(data: T): Result<T> { return { ok: true, data }; }
function fail<T>(msg: string): Result<T> { return { ok: false, error: msg }; }

// ── Storage Keys (ต้อง match กับ Phase C ที่มีอยู่) ───────────────────────────
const KEYS = {
  OFFERS:           "app3r-weeer-offers",
  REPAIR_JOBS:      "app3r-weeer-repair-jobs",
  MAINTENANCE_JOBS: "app3r-weeer-maintenance-jobs",
  RESELL_LISTINGS:  "app3r-weeer-resell-listings",
  SCRAP_LISTINGS:   "app3r-weeer-scrap-listings",
  // Parts keys — Phase C ใช้ keys เหล่านี้ (ต้องตรงกัน!)
  PARTS_LISTINGS:   "app3r-parts-listings",
  PARTS_ORDERS:     "app3r-parts-orders",
  PARTS_ESCROW:     "app3r-parts-escrow",
  PARTS_SHOP_ID:    "app3r-parts-shop-id",
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// Offer DAL (ข้อเสนองาน)
// ═══════════════════════════════════════════════════════════════════════════════
const offerDAL: IOfferDAL = {
  async getOffers(shopId) {
    const all = lsGet<OfferRecord[]>(KEYS.OFFERS, []);
    return ok(all.filter((o) => o.weeerShopId === shopId));
  },
  async getOffer(id) {
    const found = lsGet<OfferRecord[]>(KEYS.OFFERS, []).find((o) => o.id === id);
    return found ? ok(found) : fail(`Offer ${id} not found`);
  },
  async createOffer(data) {
    const record: OfferRecord = { ...data, id: `OF${Date.now()}`, createdAt: new Date().toISOString() };
    const all = lsGet<OfferRecord[]>(KEYS.OFFERS, []);
    all.push(record);
    lsSet(KEYS.OFFERS, all);
    return ok(record);
  },
  async updateOfferStatus(id, status) {
    const all = lsGet<OfferRecord[]>(KEYS.OFFERS, []);
    const idx = all.findIndex((o) => o.id === id);
    if (idx < 0) return fail(`Offer ${id} not found`);
    all[idx] = { ...all[idx], status };
    lsSet(KEYS.OFFERS, all);
    return ok(all[idx]);
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// Repair Job DAL (งานซ่อม)
// ═══════════════════════════════════════════════════════════════════════════════
const repairJobDAL: IRepairJobDAL = {
  async getJobs(shopId, filter) {
    let all = lsGet<RepairJobRecord[]>(KEYS.REPAIR_JOBS, []).filter((j) => j.shopId === shopId);
    if (filter?.status) all = all.filter((j) => j.status === filter.status);
    return ok(all);
  },
  async getJob(id) {
    const found = lsGet<RepairJobRecord[]>(KEYS.REPAIR_JOBS, []).find((j) => j.id === id);
    return found ? ok(found) : fail(`RepairJob ${id} not found`);
  },
  async updateJobStatus(id, status, meta) {
    const all = lsGet<RepairJobRecord[]>(KEYS.REPAIR_JOBS, []);
    const idx = all.findIndex((j) => j.id === id);
    if (idx < 0) return fail(`RepairJob ${id} not found`);
    all[idx] = { ...all[idx], status, ...meta, updatedAt: new Date().toISOString() };
    lsSet(KEYS.REPAIR_JOBS, all);
    return ok(all[idx]);
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// Maintenance DAL (งานบำรุงรักษา)
// ═══════════════════════════════════════════════════════════════════════════════
const maintenanceDAL: IMaintenanceDAL = {
  async getJobs(shopId, filter) {
    let all = lsGet<MaintenanceJobRecord[]>(KEYS.MAINTENANCE_JOBS, []).filter((j) => j.shopId === shopId);
    if (filter?.status) all = all.filter((j) => j.status === filter.status);
    return ok(all);
  },
  async getJob(id) {
    const found = lsGet<MaintenanceJobRecord[]>(KEYS.MAINTENANCE_JOBS, []).find((j) => j.id === id);
    return found ? ok(found) : fail(`MaintenanceJob ${id} not found`);
  },
  async assignTechnician(jobId, technicianId) {
    const all = lsGet<MaintenanceJobRecord[]>(KEYS.MAINTENANCE_JOBS, []);
    const idx = all.findIndex((j) => j.id === jobId);
    if (idx < 0) return fail(`MaintenanceJob ${jobId} not found`);
    all[idx] = { ...all[idx], technicianId, updatedAt: new Date().toISOString() };
    lsSet(KEYS.MAINTENANCE_JOBS, all);
    return ok(all[idx]);
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// Resell Listing DAL (รายการขายต่อ)
// ═══════════════════════════════════════════════════════════════════════════════
const resellListingDAL: IResellListingDAL = {
  async getListings(shopId) {
    return ok(lsGet<ResellListingRecord[]>(KEYS.RESELL_LISTINGS, []).filter((l) => l.shopId === shopId));
  },
  async getListing(id) {
    const found = lsGet<ResellListingRecord[]>(KEYS.RESELL_LISTINGS, []).find((l) => l.id === id);
    return found ? ok(found) : fail(`ResellListing ${id} not found`);
  },
  async createListing(data) {
    const record: ResellListingRecord = { ...data, id: `RL${Date.now()}`, createdAt: new Date().toISOString() };
    const all = lsGet<ResellListingRecord[]>(KEYS.RESELL_LISTINGS, []);
    all.push(record);
    lsSet(KEYS.RESELL_LISTINGS, all);
    return ok(record);
  },
  async updateListing(id, data) {
    const all = lsGet<ResellListingRecord[]>(KEYS.RESELL_LISTINGS, []);
    const idx = all.findIndex((l) => l.id === id);
    if (idx < 0) return fail(`ResellListing ${id} not found`);
    all[idx] = { ...all[idx], ...data };
    lsSet(KEYS.RESELL_LISTINGS, all);
    return ok(all[idx]);
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// Scrap Listing DAL (รายการซาก)
// ═══════════════════════════════════════════════════════════════════════════════
const scrapListingDAL: IScrapListingDAL = {
  async getListings(filter) {
    let all = lsGet<ScrapListingRecord[]>(KEYS.SCRAP_LISTINGS, []);
    if (filter?.grade)  all = all.filter((s) => s.grade  === filter.grade);
    if (filter?.status) all = all.filter((s) => s.status === filter.status);
    return ok(all);
  },
  async getListing(id) {
    const found = lsGet<ScrapListingRecord[]>(KEYS.SCRAP_LISTINGS, []).find((s) => s.id === id);
    return found ? ok(found) : fail(`ScrapListing ${id} not found`);
  },
  async reserveListing(id, _buyerShopId) {
    const all = lsGet<ScrapListingRecord[]>(KEYS.SCRAP_LISTINGS, []);
    const idx = all.findIndex((s) => s.id === id);
    if (idx < 0) return fail(`ScrapListing ${id} not found`);
    all[idx] = { ...all[idx], status: "reserved" };
    lsSet(KEYS.SCRAP_LISTINGS, all);
    return ok(all[idx]);
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// Parts DAL (อะไหล่ B2B D81)
// ═══════════════════════════════════════════════════════════════════════════════
// NOTE: storage layer เท่านั้น — business logic (escrow, fee) อยู่ parts-escrow.ts
// @migrate-to-backend-d2 — ทั้ง section นี้จะย้ายไป backend API ตอน D-2

/**
 * @migrate-to-backend-d2
 * partsDAL localStorage implementation
 * D-2: replace ด้วย fetch() call ไป /api/v1/parts/*
 * business logic (roundPoint, escrowHold/Release/Refund) อยู่ parts-escrow.ts — ไม่ย้าย D-1
 */
const partsDAL: IPartsDAL = {
  async getListings(filter) {
    let all = lsGet<PartListingRecord[]>(KEYS.PARTS_LISTINGS, []);
    if (filter?.shopId)    all = all.filter((l) => l.shopId    === filter.shopId);
    if (filter?.category)  all = all.filter((l) => l.category  === filter.category);
    if (filter?.condition) all = all.filter((l) => l.condition === filter.condition);
    return ok(all);
  },
  async getListing(id) {
    const found = lsGet<PartListingRecord[]>(KEYS.PARTS_LISTINGS, []).find((l) => l.id === id);
    return found ? ok(found) : fail(`PartListing ${id} not found`);
  },
  async createListing(data) {
    const record: PartListingRecord = { ...data, id: `P${Date.now()}`, createdAt: new Date().toISOString() };
    const all = lsGet<PartListingRecord[]>(KEYS.PARTS_LISTINGS, []);
    all.push(record);
    lsSet(KEYS.PARTS_LISTINGS, all);
    return ok(record);
  },
  async updateListingStock(id, delta) {
    const all = lsGet<PartListingRecord[]>(KEYS.PARTS_LISTINGS, []);
    const idx = all.findIndex((l) => l.id === id);
    if (idx < 0) return fail(`PartListing ${id} not found`);
    all[idx] = { ...all[idx], stock: Math.max(0, all[idx].stock + delta) };
    lsSet(KEYS.PARTS_LISTINGS, all);
    return ok(all[idx]);
  },
  async getOrders(filter) {
    let all = lsGet<PartOrderRecord[]>(KEYS.PARTS_ORDERS, []);
    if (filter?.shopId && filter.role === "buyer")  all = all.filter((o) => o.buyerShopId  === filter.shopId);
    if (filter?.shopId && filter.role === "seller") all = all.filter((o) => o.sellerShopId === filter.shopId);
    if (filter?.stage)  all = all.filter((o) => o.stage === filter.stage);
    return ok(all);
  },
  async getOrder(id) {
    const found = lsGet<PartOrderRecord[]>(KEYS.PARTS_ORDERS, []).find((o) => o.id === id);
    return found ? ok(found) : fail(`PartOrder ${id} not found`);
  },
  async createOrder(data) {
    const record: PartOrderRecord = { ...data, id: `O${Date.now()}`, orderedAt: new Date().toISOString() };
    const all = lsGet<PartOrderRecord[]>(KEYS.PARTS_ORDERS, []);
    all.push(record);
    lsSet(KEYS.PARTS_ORDERS, all);
    return ok(record);
  },
  async updateOrderStage(id, stage, meta) {
    const all = lsGet<PartOrderRecord[]>(KEYS.PARTS_ORDERS, []);
    const idx = all.findIndex((o) => o.id === id);
    if (idx < 0) return fail(`PartOrder ${id} not found`);
    all[idx] = { ...all[idx], stage, ...meta };
    lsSet(KEYS.PARTS_ORDERS, all);
    return ok(all[idx]);
  },
  /** @migrate-to-backend-d2 */
  async getEscrowRecords(buyerShopId) {
    const all = lsGet<unknown[]>(KEYS.PARTS_ESCROW, []);
    if (!buyerShopId) return ok(all);
    return ok((all as Array<{ buyerShopId?: string }>).filter((r) => r.buyerShopId === buyerShopId));
  },
  /** @migrate-to-backend-d2 */
  async saveEscrowRecord(record) {
    const all = lsGet<unknown[]>(KEYS.PARTS_ESCROW, []);
    const r = record as { orderId?: string };
    const idx = all.findIndex((e) => (e as { orderId?: string }).orderId === r.orderId);
    if (idx >= 0) all[idx] = record; else all.push(record);
    lsSet(KEYS.PARTS_ESCROW, all);
    return ok(undefined);
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// Composite WeeeR DAL (localStorage)
// ═══════════════════════════════════════════════════════════════════════════════

export const weeerLocalStorageAdapter: IWeeerDAL = {
  adapterName: "localStorage",
  isAvailable: () => isBrowser,
  offer: offerDAL,
  repairJob: repairJobDAL,
  maintenance: maintenanceDAL,
  resellListing: resellListingDAL,
  scrapListing: scrapListingDAL,
  parts: partsDAL,
};
