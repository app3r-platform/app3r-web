// ── Parts B2B Sync — D81 (Phase D-2 Migration) ────────────────────────────────
// localStorage + BroadcastChannel (ช่องสัญญาณระหว่าง tab) สำหรับ Parts B2B
// SSR-safe (ทำงานได้ทั้ง server และ browser)
//
// ────────────────────────────────────────────────────────────────────────────
// MIGRATION STATUS (Phase D-2):
//   - @needs-backend-sync: Backend Sub-CMD-P1 ยังไม่ expose /api/parts/inventory
//   - STORAGE functions (readStorage, writeStorage, getListings, etc.) จะถูก
//     แทนที่ด้วย DAL apiAdapter calls เมื่อ NEXT_PUBLIC_USE_API_PARTS=true
//   - BroadcastChannel logic (PartsSyncManager, partsSync, usePartsSync) คงอยู่ใน
//     frontend — แต่จะ emit events หลังจาก API call สำเร็จ (ไม่ใช่หลัง localStorage write)
//   - getCurrentShopId / setCurrentShopId → จะเปลี่ยนเป็น auth context Phase D-3
//   - WebSocket listener placeholder เพิ่มแล้ว — wire เมื่อ backend พร้อม
//   - Migration script: migratePartsToBackend() — เรียกครั้งเดียวตอน flag เปิด
// ────────────────────────────────────────────────────────────────────────────

import type { PartListing, PartOrder } from "../../app/(app)/parts/_lib/types";

// ── localStorage Keys ─────────────────────────────────────────────────────────
export const PARTS_STORAGE_KEYS = {
  LISTINGS:        "app3r-parts-listings",     // PartListing[]
  ORDERS:          "app3r-parts-orders",        // PartOrder[]
  SHOP_ID:         "app3r-parts-shop-id",       // string (current shop ID)
  ESCROW:          "app3r-parts-escrow",        // EscrowRecord[]
  FEE_LOG:         "app3r-rounding-log",        // FeeAuditEntry[] (D75 audit)
  MIGRATED_FLAG:   "app3r-parts-migrated-d2",  // "true" เมื่อ migrate แล้ว
} as const;

// ── BroadcastChannel Events (ชนิดข้อความระหว่าง tab) ────────────────────────
export type PartsSyncEvent =
  | { type: "order_placed";    orderId: string; partId: string; buyerShopId: string }
  | { type: "order_shipped";   orderId: string; trackingNumber?: string }
  | { type: "order_received";  orderId: string }
  | { type: "order_cancelled"; orderId: string; partId: string }
  | { type: "listing_updated"; partId: string }
  | { type: "shop_switched";   shopId: string }
  | { type: "refresh_parts" };

const CHANNEL_NAME = "parts-b2b-weeer";
const isBrowser = typeof window !== "undefined";

type PartsSyncListener = (event: PartsSyncEvent) => void;

// ── BroadcastChannel Manager (Frontend sync — คงอยู่ทุก phase) ───────────────
class PartsSyncManager {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<PartsSyncListener> = new Set();

  private getChannel(): BroadcastChannel | null {
    if (!isBrowser) return null;
    if (!this.channel) {
      try {
        this.channel = new BroadcastChannel(CHANNEL_NAME);
        this.channel.onmessage = (e: MessageEvent<PartsSyncEvent>) => {
          this.listeners.forEach((fn) => fn(e.data));
        };
      } catch { return null; }
    }
    return this.channel;
  }

  emit(event: PartsSyncEvent): void {
    this.getChannel()?.postMessage(event);
  }

  subscribe(listener: PartsSyncListener): () => void {
    this.listeners.add(listener);
    this.getChannel();
    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0) {
        this.channel?.close();
        this.channel = null;
      }
    };
  }
}

export const partsSync = new PartsSyncManager();

// ── localStorage Helpers ──────────────────────────────────────────────────────

function readStorage<T>(key: string, fallback: T): T {
  if (!isBrowser) return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch { return fallback; }
}

function writeStorage<T>(key: string, value: T): void {
  if (!isBrowser) return;
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* quota */ }
}

// ── Listings Storage ──────────────────────────────────────────────────────────

/** @migrate-to-backend-d2 → getAdapter().parts.getListings() */
export function getListings(): PartListing[] {
  return readStorage<PartListing[]>(PARTS_STORAGE_KEYS.LISTINGS, []);
}

/** @migrate-to-backend-d2 → getAdapter().parts.createListing() */
export function saveListings(listings: PartListing[]): void {
  writeStorage(PARTS_STORAGE_KEYS.LISTINGS, listings);
}

/** @migrate-to-backend-d2 → getAdapter().parts.createListing() */
export function upsertListing(listing: PartListing): void {
  const all = getListings();
  const idx = all.findIndex((l) => l.id === listing.id);
  if (idx >= 0) all[idx] = listing; else all.push(listing);
  saveListings(all);
}

/** @migrate-to-backend-d2 → getAdapter().parts.updateListingStock() */
export function updateListingStock(partId: string, delta: number): void {
  const all = getListings();
  const item = all.find((l) => l.id === partId);
  if (item) {
    item.stock = Math.max(0, item.stock + delta);
    saveListings(all);
  }
}

// ── Orders Storage ────────────────────────────────────────────────────────────

/** @migrate-to-backend-d2 → getAdapter().parts.getOrders() */
export function getOrders(): PartOrder[] {
  return readStorage<PartOrder[]>(PARTS_STORAGE_KEYS.ORDERS, []);
}

/** @migrate-to-backend-d2 → getAdapter().parts.createOrder() / updateOrderStage() */
export function saveOrders(orders: PartOrder[]): void {
  writeStorage(PARTS_STORAGE_KEYS.ORDERS, orders);
}

/** @migrate-to-backend-d2 → getAdapter().parts.createOrder() */
export function upsertOrder(order: PartOrder): void {
  const all = getOrders();
  const idx = all.findIndex((o) => o.id === order.id);
  if (idx >= 0) all[idx] = order; else all.push(order);
  saveOrders(all);
}

// ── Shop ID ───────────────────────────────────────────────────────────────────
// @migrate-to-backend-d2 → auth context (Phase D-3)

export function getCurrentShopId(): string {
  if (!isBrowser) return "S001";
  return localStorage.getItem(PARTS_STORAGE_KEYS.SHOP_ID) ?? "S001";
}

export function setCurrentShopId(shopId: string): void {
  if (!isBrowser) return;
  localStorage.setItem(PARTS_STORAGE_KEYS.SHOP_ID, shopId);
  partsSync.emit({ type: "shop_switched", shopId });
}

// ── WebSocket Listener Placeholder (D-2 — @needs-backend-sync) ───────────────
// @needs-backend-sync Backend ยังไม่ expose WebSocket endpoint
// Target: wss://api.app3r.co/ws/parts → emit PartsSyncEvent จาก backend
// เมื่อ backend พร้อม:
//   1. เชื่อม WebSocket ที่นี่
//   2. รับ event { type: "parts.update", payload: PartsSyncEvent }
//   3. เรียก partsSync.emit() เพื่อ broadcast ไปทุก tab

let _wsCleanup: (() => void) | null = null;

/**
 * connectPartsWebSocket — เชื่อม WebSocket สำหรับ real-time parts sync
 *
 * @needs-backend-sync wss://api.app3r.co/ws/parts — Backend Sub-CMD-P1 pending
 * Phase D-2 placeholder: log warning และ return cleanup no-op
 * Phase D-3 target: replaceด้วย actual WebSocket connection
 */
export function connectPartsWebSocket(token: string): () => void {
  if (_wsCleanup) return _wsCleanup;

  // @needs-backend-sync: Uncomment เมื่อ backend expose WebSocket endpoint
  //
  // const wsUrl = `${process.env.NEXT_PUBLIC_WS_BASE_URL ?? "wss://api.app3r.co"}/ws/parts`;
  // const ws = new WebSocket(`${wsUrl}?token=${token}`);
  //
  // ws.onmessage = (e) => {
  //   try {
  //     const msg = JSON.parse(e.data) as { type: string; payload: PartsSyncEvent };
  //     if (msg.type === "parts.update") {
  //       partsSync.emit(msg.payload);
  //     }
  //   } catch { /* invalid JSON */ }
  // };
  //
  // ws.onerror = () => console.error("[parts-ws] Connection error");
  // ws.onclose = () => { _wsCleanup = null; };
  //
  // _wsCleanup = () => { ws.close(); _wsCleanup = null; };
  // return _wsCleanup;

  // D-2 PLACEHOLDER: backend ยังไม่พร้อม
  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.info("[parts-ws] @needs-backend-sync — WebSocket pending backend Sub-CMD-P1");
  }
  void token; // suppress unused warning
  _wsCleanup = () => { _wsCleanup = null; };
  return _wsCleanup;
}

// ── Migration Script: localStorage → Backend ─────────────────────────────────

/**
 * migratePartsToBackend — ย้ายข้อมูล parts จาก localStorage ไป backend
 *
 * @needs-backend-sync POST /api/v1/parts/listings (bulk), POST /api/v1/parts/orders (bulk)
 * เรียกครั้งเดียวตอนเปิด NEXT_PUBLIC_USE_API_PARTS=true
 * ตรวจ MIGRATED_FLAG ก่อน — ไม่ migrate ซ้ำ
 *
 * Phase D-2 status: PLACEHOLDER — backend endpoint ยังไม่พร้อม
 */
export async function migratePartsToBackend(): Promise<{
  ok: boolean;
  message: string;
  listingsMigrated: number;
  ordersMigrated: number;
}> {
  if (!isBrowser) return { ok: false, message: "SSR — skip migration", listingsMigrated: 0, ordersMigrated: 0 };

  // ตรวจ flag ว่า migrate แล้วหรือยัง
  if (localStorage.getItem(PARTS_STORAGE_KEYS.MIGRATED_FLAG) === "true") {
    return { ok: true, message: "Already migrated", listingsMigrated: 0, ordersMigrated: 0 };
  }

  const listings = getListings();
  const orders = getOrders();

  if (listings.length === 0 && orders.length === 0) {
    localStorage.setItem(PARTS_STORAGE_KEYS.MIGRATED_FLAG, "true");
    return { ok: true, message: "Nothing to migrate", listingsMigrated: 0, ordersMigrated: 0 };
  }

  // @needs-backend-sync: implement จริงเมื่อ Backend Sub-CMD-P1 expose bulk endpoints
  // const { apiFetch } = await import("../api-client");
  //
  // // migrate listings
  // for (const listing of listings) {
  //   await apiFetch("/api/v1/parts/listings", { method: "POST", body: JSON.stringify(listing) });
  // }
  //
  // // migrate orders
  // for (const order of orders) {
  //   await apiFetch("/api/v1/parts/orders", { method: "POST", body: JSON.stringify(order) });
  // }
  //
  // localStorage.setItem(PARTS_STORAGE_KEYS.MIGRATED_FLAG, "true");
  // return { ok: true, message: "Migration complete", listingsMigrated: listings.length, ordersMigrated: orders.length };

  // D-2 PLACEHOLDER
  return {
    ok: false,
    message: "@needs-backend-sync — Backend endpoint not ready (Sub-CMD-P1 pending)",
    listingsMigrated: 0,
    ordersMigrated: 0,
  };
}

// ── React Hook ────────────────────────────────────────────────────────────────

import { useEffect } from "react";

export function usePartsSync(
  listener: PartsSyncListener,
  deps: React.DependencyList = [],
): void {
  useEffect(() => {
    const unsub = partsSync.subscribe(listener);
    const onVisible = () => {
      if (document.visibilityState === "visible") listener({ type: "refresh_parts" });
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => { unsub(); document.removeEventListener("visibilitychange", onVisible); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
