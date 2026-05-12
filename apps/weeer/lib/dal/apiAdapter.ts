// ── WeeeR apiAdapter — D-2 (Phase D-2 Wire) ────────────────────────────────────
// ⚠️  D-2 ACTIVE — implement fetch() calls ไป /api/v1/*
// Parts endpoints ที่ Backend ยังไม่ expose → @needs-backend-sync marker
// ใช้ Feature Flag (NEXT_PUBLIC_USE_API_*) เปิด/ปิด per-module

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
import { apiGet, apiPost, apiPatch } from "../api-client";

// ═══════════════════════════════════════════════════════════════════════════════
// Offer API (ข้อเสนองาน)
// ═══════════════════════════════════════════════════════════════════════════════

const offerApi: IOfferDAL = {
  /** GET /api/v1/offers?shopId= */
  async getOffers(shopId) {
    return apiGet<OfferRecord[]>(`/api/v1/offers?shopId=${encodeURIComponent(shopId)}`);
  },
  /** GET /api/v1/offers/:id */
  async getOffer(id) {
    return apiGet<OfferRecord>(`/api/v1/offers/${encodeURIComponent(id)}`);
  },
  /** POST /api/v1/offers */
  async createOffer(data) {
    return apiPost<OfferRecord>("/api/v1/offers", data);
  },
  /** PATCH /api/v1/offers/:id/status */
  async updateOfferStatus(id, status) {
    return apiPatch<OfferRecord>(`/api/v1/offers/${encodeURIComponent(id)}/status`, { status });
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// Repair Job API (งานซ่อม)
// ═══════════════════════════════════════════════════════════════════════════════

const repairJobApi: IRepairJobDAL = {
  /** GET /api/v1/repair/jobs?shopId=&status= */
  async getJobs(shopId, filter) {
    const params = new URLSearchParams({ shopId });
    if (filter?.status) params.set("status", filter.status);
    return apiGet<RepairJobRecord[]>(`/api/v1/repair/jobs?${params.toString()}`);
  },
  /** GET /api/v1/repair/jobs/:id */
  async getJob(id) {
    return apiGet<RepairJobRecord>(`/api/v1/repair/jobs/${encodeURIComponent(id)}`);
  },
  /** PATCH /api/v1/repair/jobs/:id */
  async updateJobStatus(id, status, meta) {
    return apiPatch<RepairJobRecord>(`/api/v1/repair/jobs/${encodeURIComponent(id)}`, { status, ...meta });
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// Maintenance API (งานบำรุงรักษา)
// ═══════════════════════════════════════════════════════════════════════════════

const maintenanceApi: IMaintenanceDAL = {
  /** GET /api/v1/maintain/jobs?shopId=&status= */
  async getJobs(shopId, filter) {
    const params = new URLSearchParams({ shopId });
    if (filter?.status) params.set("status", filter.status);
    return apiGet<MaintenanceJobRecord[]>(`/api/v1/maintain/jobs?${params.toString()}`);
  },
  /** GET /api/v1/maintain/jobs/:id */
  async getJob(id) {
    return apiGet<MaintenanceJobRecord>(`/api/v1/maintain/jobs/${encodeURIComponent(id)}`);
  },
  /** POST /api/v1/maintain/jobs/:id/assign */
  async assignTechnician(jobId, technicianId) {
    return apiPost<MaintenanceJobRecord>(
      `/api/v1/maintain/jobs/${encodeURIComponent(jobId)}/assign`,
      { technicianId },
    );
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// Resell Listing API (รายการขายต่อ)
// ═══════════════════════════════════════════════════════════════════════════════

const resellListingApi: IResellListingDAL = {
  /** GET /api/v1/resell/listings?shopId= */
  async getListings(shopId) {
    return apiGet<ResellListingRecord[]>(`/api/v1/resell/listings?shopId=${encodeURIComponent(shopId)}`);
  },
  /** GET /api/v1/resell/listings/:id */
  async getListing(id) {
    return apiGet<ResellListingRecord>(`/api/v1/resell/listings/${encodeURIComponent(id)}`);
  },
  /** POST /api/v1/resell/listings */
  async createListing(data) {
    return apiPost<ResellListingRecord>("/api/v1/resell/listings", data);
  },
  /** PATCH /api/v1/resell/listings/:id */
  async updateListing(id, data) {
    return apiPatch<ResellListingRecord>(`/api/v1/resell/listings/${encodeURIComponent(id)}`, data);
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// Scrap Listing API (รายการซาก)
// ═══════════════════════════════════════════════════════════════════════════════

const scrapListingApi: IScrapListingDAL = {
  /** GET /api/v1/scrap/listings?grade=&status= */
  async getListings(filter) {
    const params = new URLSearchParams();
    if (filter?.grade)  params.set("grade",  filter.grade);
    if (filter?.status) params.set("status", filter.status);
    const qs = params.toString();
    return apiGet<ScrapListingRecord[]>(`/api/v1/scrap/listings${qs ? `?${qs}` : ""}`);
  },
  /** GET /api/v1/scrap/listings/:id */
  async getListing(id) {
    return apiGet<ScrapListingRecord>(`/api/v1/scrap/listings/${encodeURIComponent(id)}`);
  },
  /** POST /api/v1/scrap/listings/:id/reserve */
  async reserveListing(id, buyerShopId) {
    return apiPost<ScrapListingRecord>(
      `/api/v1/scrap/listings/${encodeURIComponent(id)}/reserve`,
      { buyerShopId },
    );
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// Parts API (อะไหล่ B2B — D81)
// ═══════════════════════════════════════════════════════════════════════════════
// @needs-backend-sync Sub-CMD-P1 ต้อง expose endpoints ก่อน
// Backend endpoints: GET/POST /api/v1/parts/listings, PATCH /api/v1/parts/listings/:id/stock
//                    GET/POST /api/v1/parts/orders, PATCH /api/v1/parts/orders/:id/stage
//                    GET/POST /api/v1/parts/escrow
// escrow business logic (roundPoint, hold/release/refund) อยู่ parts-escrow.ts — ไม่ย้าย D-2

const partsApi: IPartsDAL = {
  /**
   * @needs-backend-sync GET /api/v1/parts/listings — Backend Sub-CMD-P1 pending
   * ใช้ได้เมื่อ NEXT_PUBLIC_USE_API_PARTS=true + backend expose แล้ว
   */
  async getListings(filter) {
    const params = new URLSearchParams();
    if (filter?.shopId)    params.set("shopId",    filter.shopId);
    if (filter?.category)  params.set("category",  filter.category);
    if (filter?.condition) params.set("condition", filter.condition);
    const qs = params.toString();
    return apiGet<PartListingRecord[]>(`/api/v1/parts/listings${qs ? `?${qs}` : ""}`);
  },

  /**
   * @needs-backend-sync GET /api/v1/parts/listings/:id
   */
  async getListing(id) {
    return apiGet<PartListingRecord>(`/api/v1/parts/listings/${encodeURIComponent(id)}`);
  },

  /**
   * @needs-backend-sync POST /api/v1/parts/listings
   */
  async createListing(data) {
    return apiPost<PartListingRecord>("/api/v1/parts/listings", data);
  },

  /**
   * @needs-backend-sync PATCH /api/v1/parts/listings/:id/stock
   */
  async updateListingStock(id, delta) {
    return apiPatch<PartListingRecord>(`/api/v1/parts/listings/${encodeURIComponent(id)}/stock`, { delta });
  },

  /**
   * @needs-backend-sync GET /api/v1/parts/orders — Backend Sub-CMD-P1 pending
   */
  async getOrders(filter) {
    const params = new URLSearchParams();
    if (filter?.shopId) params.set("shopId", filter.shopId);
    if (filter?.role)   params.set("role",   filter.role);
    if (filter?.stage)  params.set("stage",  filter.stage);
    const qs = params.toString();
    return apiGet<PartOrderRecord[]>(`/api/v1/parts/orders${qs ? `?${qs}` : ""}`);
  },

  /**
   * @needs-backend-sync GET /api/v1/parts/orders/:id
   */
  async getOrder(id) {
    return apiGet<PartOrderRecord>(`/api/v1/parts/orders/${encodeURIComponent(id)}`);
  },

  /**
   * @needs-backend-sync POST /api/v1/parts/orders
   * NOTE: escrow hold logic อยู่ parts-escrow.ts (frontend domain) — backend จะ atomic transaction D-2
   */
  async createOrder(data) {
    return apiPost<PartOrderRecord>("/api/v1/parts/orders", data);
  },

  /**
   * @needs-backend-sync PATCH /api/v1/parts/orders/:id/stage
   * NOTE: escrow release/refund อยู่ parts-escrow.ts — backend จะรวมเป็น atomic D-2
   */
  async updateOrderStage(id, stage, meta) {
    return apiPatch<PartOrderRecord>(
      `/api/v1/parts/orders/${encodeURIComponent(id)}/stage`,
      { stage, ...meta },
    );
  },

  /**
   * @needs-backend-sync GET /api/v1/parts/escrow?buyerShopId=
   * escrow storage migration — D-2 wire ไป backend escrow service
   */
  async getEscrowRecords(buyerShopId) {
    const qs = buyerShopId ? `?buyerShopId=${encodeURIComponent(buyerShopId)}` : "";
    return apiGet<unknown[]>(`/api/v1/parts/escrow${qs}`);
  },

  /**
   * @needs-backend-sync POST /api/v1/parts/escrow
   */
  async saveEscrowRecord(record) {
    const res = await apiPost<void>("/api/v1/parts/escrow", record);
    return res;
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// Composite WeeeR API Adapter (D-2)
// ═══════════════════════════════════════════════════════════════════════════════

export const weeerApiAdapter: IWeeerDAL = {
  adapterName: "api",
  isAvailable: () => typeof window !== "undefined",

  offer: offerApi,
  repairJob: repairJobApi,
  maintenance: maintenanceApi,
  resellListing: resellListingApi,
  scrapListing: scrapListingApi,
  parts: partsApi,
};
