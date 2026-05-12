// ── Parts B2B Sync — D81 (Phase C-6) ─────────────────────────────────────────
// localStorage + BroadcastChannel (ช่องสัญญาณระหว่าง tab) สำหรับ Parts B2B
// SSR-safe (ทำงานได้ทั้ง server และ browser)
//
// @migrate-to-backend-d2
// ────────────────────────────────────────────────────────────────────────────
// MIGRATION NOTE (Phase D-2):
//   - localStorage read/write functions (readStorage, writeStorage, getListings,
//     saveListings, upsertListing, updateListingStock, getOrders, saveOrders,
//     upsertOrder) จะถูกแทนที่ด้วย DAL adapter calls (weeerLocalStorageAdapter → weeerApiAdapter)
//   - BroadcastChannel logic (PartsSyncManager, partsSync, usePartsSync) จะยังคงอยู่
//     ใน frontend — แต่จะ emit events หลังจาก API call สำเร็จ ไม่ใช่หลัง localStorage write
//   - getCurrentShopId / setCurrentShopId จะเปลี่ยนเป็น auth context D-2
// ────────────────────────────────────────────────────────────────────────────

import type { PartListing, PartOrder } from "../../app/(app)/parts/_lib/types";

// ── localStorage Keys ─────────────────────────────────────────────────────────
export const PARTS_STORAGE_KEYS = {
  LISTINGS:  "app3r-parts-listings",   // PartListing[]
  ORDERS:    "app3r-parts-orders",     // PartOrder[]
  SHOP_ID:   "app3r-parts-shop-id",    // string (current shop ID)
  ESCROW:    "app3r-parts-escrow",     // EscrowRecord[]
  FEE_LOG:   "app3r-rounding-log",     // FeeAuditEntry[] (D75 audit)
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

export function getListings(): PartListing[] {
  return readStorage<PartListing[]>(PARTS_STORAGE_KEYS.LISTINGS, []);
}

export function saveListings(listings: PartListing[]): void {
  writeStorage(PARTS_STORAGE_KEYS.LISTINGS, listings);
}

export function upsertListing(listing: PartListing): void {
  const all = getListings();
  const idx = all.findIndex((l) => l.id === listing.id);
  if (idx >= 0) all[idx] = listing; else all.push(listing);
  saveListings(all);
}

export function updateListingStock(partId: string, delta: number): void {
  const all = getListings();
  const item = all.find((l) => l.id === partId);
  if (item) {
    item.stock = Math.max(0, item.stock + delta);
    saveListings(all);
  }
}

// ── Orders Storage ────────────────────────────────────────────────────────────

export function getOrders(): PartOrder[] {
  return readStorage<PartOrder[]>(PARTS_STORAGE_KEYS.ORDERS, []);
}

export function saveOrders(orders: PartOrder[]): void {
  writeStorage(PARTS_STORAGE_KEYS.ORDERS, orders);
}

export function upsertOrder(order: PartOrder): void {
  const all = getOrders();
  const idx = all.findIndex((o) => o.id === order.id);
  if (idx >= 0) all[idx] = order; else all.push(order);
  saveOrders(all);
}

// ── Shop ID ───────────────────────────────────────────────────────────────────

export function getCurrentShopId(): string {
  if (!isBrowser) return "S001";
  return localStorage.getItem(PARTS_STORAGE_KEYS.SHOP_ID) ?? "S001";
}

export function setCurrentShopId(shopId: string): void {
  if (!isBrowser) return;
  localStorage.setItem(PARTS_STORAGE_KEYS.SHOP_ID, shopId);
  partsSync.emit({ type: "shop_switched", shopId });
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
