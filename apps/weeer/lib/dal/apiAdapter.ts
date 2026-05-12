// ── WeeeR apiAdapter skeleton — D84 (Phase D-1) ───────────────────────────────
// ⚠️  D-1 SKELETON ONLY — ทุก method throw NotImplementedError
// D-2 จะ implement ด้วย fetch() call ไป /api/v1/*
// @migrate-to-backend-d2 markers ครบทุก method

import type { IWeeerDAL } from "@app3r/dal";
import { NotImplementedError } from "@app3r/dal";

const SCOPE = "D-2 scope";

/** @migrate-to-backend-d2 ทั้งไฟล์ */
export const weeerApiAdapter: IWeeerDAL = {
  adapterType: "api",
  isReady: () => false, // D-1: ยังไม่พร้อม

  offer: {
    /** @migrate-to-backend-d2 GET /api/v1/offers?shopId= */
    async getOffers(_shopId)          { throw new NotImplementedError(SCOPE); },
    /** @migrate-to-backend-d2 GET /api/v1/offers/:id */
    async getOffer(_id)               { throw new NotImplementedError(SCOPE); },
    /** @migrate-to-backend-d2 POST /api/v1/offers */
    async createOffer(_data)          { throw new NotImplementedError(SCOPE); },
    /** @migrate-to-backend-d2 PATCH /api/v1/offers/:id/status */
    async updateOfferStatus(_id, _s)  { throw new NotImplementedError(SCOPE); },
  },

  repairJob: {
    /** @migrate-to-backend-d2 GET /api/v1/repair/jobs */
    async getJobs(_shopId, _filter)   { throw new NotImplementedError(SCOPE); },
    /** @migrate-to-backend-d2 GET /api/v1/repair/jobs/:id */
    async getJob(_id)                 { throw new NotImplementedError(SCOPE); },
    /** @migrate-to-backend-d2 PATCH /api/v1/repair/jobs/:id */
    async updateJobStatus(_id, _s, _m){ throw new NotImplementedError(SCOPE); },
  },

  maintenance: {
    /** @migrate-to-backend-d2 GET /api/v1/maintain/jobs */
    async getJobs(_shopId, _filter)   { throw new NotImplementedError(SCOPE); },
    /** @migrate-to-backend-d2 GET /api/v1/maintain/jobs/:id */
    async getJob(_id)                 { throw new NotImplementedError(SCOPE); },
    /** @migrate-to-backend-d2 POST /api/v1/maintain/jobs/:id/assign */
    async assignTechnician(_id, _t)   { throw new NotImplementedError(SCOPE); },
  },

  resellListing: {
    /** @migrate-to-backend-d2 GET /api/v1/resell/listings?shopId= */
    async getListings(_shopId)        { throw new NotImplementedError(SCOPE); },
    /** @migrate-to-backend-d2 GET /api/v1/resell/listings/:id */
    async getListing(_id)             { throw new NotImplementedError(SCOPE); },
    /** @migrate-to-backend-d2 POST /api/v1/resell/listings */
    async createListing(_data)        { throw new NotImplementedError(SCOPE); },
    /** @migrate-to-backend-d2 PATCH /api/v1/resell/listings/:id */
    async updateListing(_id, _data)   { throw new NotImplementedError(SCOPE); },
  },

  scrapListing: {
    /** @migrate-to-backend-d2 GET /api/v1/scrap/listings */
    async getListings(_filter)        { throw new NotImplementedError(SCOPE); },
    /** @migrate-to-backend-d2 GET /api/v1/scrap/listings/:id */
    async getListing(_id)             { throw new NotImplementedError(SCOPE); },
    /** @migrate-to-backend-d2 POST /api/v1/scrap/listings/:id/reserve */
    async reserveListing(_id, _b)     { throw new NotImplementedError(SCOPE); },
  },

  parts: {
    // Listings
    /** @migrate-to-backend-d2 GET /api/v1/parts/listings */
    async getListings(_filter)        { throw new NotImplementedError(SCOPE); },
    /** @migrate-to-backend-d2 GET /api/v1/parts/listings/:id */
    async getListing(_id)             { throw new NotImplementedError(SCOPE); },
    /** @migrate-to-backend-d2 POST /api/v1/parts/listings */
    async createListing(_data)        { throw new NotImplementedError(SCOPE); },
    /** @migrate-to-backend-d2 PATCH /api/v1/parts/listings/:id/stock */
    async updateListingStock(_id, _d) { throw new NotImplementedError(SCOPE); },

    // Orders
    /** @migrate-to-backend-d2 GET /api/v1/parts/orders */
    async getOrders(_filter)          { throw new NotImplementedError(SCOPE); },
    /** @migrate-to-backend-d2 GET /api/v1/parts/orders/:id */
    async getOrder(_id)               { throw new NotImplementedError(SCOPE); },
    /**
     * @migrate-to-backend-d2 POST /api/v1/parts/orders
     * NOTE: escrow hold logic อยู่ parts-escrow.ts (frontend domain) — จะ wire ผ่าน backend D-2
     */
    async createOrder(_data)          { throw new NotImplementedError(SCOPE); },
    /**
     * @migrate-to-backend-d2 PATCH /api/v1/parts/orders/:id/stage
     * NOTE: escrow release/refund logic อยู่ parts-escrow.ts — จะ wire ผ่าน backend D-2
     */
    async updateOrderStage(_id, _s, _m){ throw new NotImplementedError(SCOPE); },

    // Escrow storage
    /**
     * @migrate-to-backend-d2 GET /api/v1/parts/escrow?buyerShopId=
     * NOTE: escrow calculation logic (roundPoint, hold/release/refund) อยู่ parts-escrow.ts
     * D-2 จะ migrate escrow service ไป backend — ไม่ใช่แค่ storage
     */
    async getEscrowRecords(_buyerShopId){ throw new NotImplementedError(SCOPE); },
    /** @migrate-to-backend-d2 POST /api/v1/parts/escrow */
    async saveEscrowRecord(_record)   { throw new NotImplementedError(SCOPE); },
  },
};
