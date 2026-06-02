"use client";
// Screen ID Badge — Phase 3 dev tool (ปิดพร้อม NEXT_PUBLIC_DEV_NAV)
// D15 wire: maps current WeeeR route → R-xx (SCREEN_MAP source of truth) แล้ว
// delegate ไป shared @app3r/ui <ScreenIdBadge> branded ส้ม WeeeR (#FF663A).
import { usePathname } from "next/navigation";
import { ScreenIdBadge } from "@app3r/ui";

type ScreenInfo = { num: string; code: string };

const SCREEN_MAP: Array<{ pattern: string; info: ScreenInfo }> = [
  { pattern: "/dashboard",                          info: { num: "R-01", code: "DASHBOARD" } },
  { pattern: "/listings/[id]",                      info: { num: "R-42", code: "LISTING-META-DETAIL" } },
  { pattern: "/repair/announcements/[id]/offer/success", info: { num: "R-38", code: "REPAIR-BID-SUCCESS" } },
  { pattern: "/repair/announcements/[id]/offer",    info: { num: "R-03", code: "REPAIR-BID" } },
  { pattern: "/repair/announcements/[id]",          info: { num: "R-04", code: "REPAIR-ANNOUNCE-DETAIL" } },
  { pattern: "/repair/announcements",               info: { num: "R-02", code: "REPAIR-ANNOUNCE-LIST" } },
  { pattern: "/repair/walk-in/queue",               info: { num: "R-05", code: "REPAIR-WALKIN-QUEUE" } },
  { pattern: "/repair/walk-in/[id]",                info: { num: "R-06", code: "REPAIR-C1-WALKIN" } },
  { pattern: "/repair/parcel/queue",                info: { num: "R-07", code: "REPAIR-PARCEL-QUEUE" } },
  { pattern: "/repair/parcel/[id]",                 info: { num: "R-08", code: "REPAIR-C3-PARCEL" } },
  { pattern: "/repair/pickup/queue",                info: { num: "R-07b", code: "REPAIR-PICKUP-QUEUE" } },
  { pattern: "/repair/jobs/[id]/assign",            info: { num: "R-10", code: "REPAIR-ASSIGN-TECH" } },
  { pattern: "/repair/jobs/[id]",                   info: { num: "R-11", code: "REPAIR-JOB-DETAIL" } },
  { pattern: "/repair/jobs",                        info: { num: "R-09", code: "REPAIR-JOBS" } },
  { pattern: "/maintain/queue/[id]/offer/success",   info: { num: "R-39", code: "MAINTAIN-OFFER-SUCCESS" } },
  { pattern: "/maintain/jobs/[id]/assign/weeet",    info: { num: "R-13b", code: "MAINTAIN-ASSIGN-WEEET" } },
  { pattern: "/maintain/jobs/[id]/assign",          info: { num: "R-13", code: "MAINTAIN-ASSIGN-TECH" } },
  { pattern: "/maintain/jobs/[id]",                 info: { num: "R-14", code: "MAINTAIN-JOB-DETAIL" } },
  { pattern: "/maintain/jobs",                      info: { num: "R-12", code: "MAINTAIN-JOBS" } },
  { pattern: "/resell/buy/wizard",                  info: { num: "R-15b", code: "RESELL-B6-WIZARD" } },
  { pattern: "/resell/buy",                         info: { num: "R-15c", code: "RESELL-BUY" } },
  { pattern: "/resell/listings/[id]",               info: { num: "R-16", code: "RESELL-LISTING-DETAIL" } },
  { pattern: "/resell/listings",                    info: { num: "R-15", code: "RESELL-LISTINGS" } },
  { pattern: "/resell/marketplace/[id]/offer",      info: { num: "R-18", code: "RESELL-PAIR3-OFFER" } },
  { pattern: "/resell/marketplace/[id]",            info: { num: "R-19", code: "RESELL-C2C-DETAIL" } },
  { pattern: "/resell/marketplace",                 info: { num: "R-17", code: "RESELL-C2C-LIST" } },
  { pattern: "/resell/purchases/[id]/inspect",      info: { num: "R-21", code: "RESELL-R1-INSPECT" } },
  { pattern: "/resell/purchases/[id]/dispute",      info: { num: "R-22", code: "RESELL-R8-DISPUTE" } },
  { pattern: "/resell/purchases/[id]",              info: { num: "R-23", code: "RESELL-PURCHASE-DETAIL" } },
  { pattern: "/resell/purchases",                   info: { num: "R-20", code: "RESELL-PURCHASES" } },
  { pattern: "/scrap/announcements/[id]/offer",     info: { num: "R-25", code: "SCRAP-BID" } },
  { pattern: "/scrap/announcements/[id]",           info: { num: "R-26", code: "SCRAP-ANNOUNCE-DETAIL" } },
  { pattern: "/scrap/announcements",                info: { num: "R-24", code: "SCRAP-ANNOUNCE-LIST" } },
  { pattern: "/scrap/jobs/[id]/resell-as-scrap",    info: { num: "R-28b", code: "SCRAP-S1-DECISION" } },
  { pattern: "/scrap/jobs/[id]/resell-parts",       info: { num: "R-28c", code: "SCRAP-S2-DECISION" } },
  { pattern: "/scrap/jobs/[id]/repair-and-sell",    info: { num: "R-28d", code: "SCRAP-S3-DECISION" } },
  { pattern: "/scrap/jobs/[id]/dispose",            info: { num: "R-28e", code: "SCRAP-S4-DECISION" } },
  { pattern: "/scrap/jobs/[id]",                    info: { num: "R-28", code: "SCRAP-JOB-DETAIL" } },
  { pattern: "/scrap/jobs",                         info: { num: "R-27", code: "SCRAP-JOBS" } },
  { pattern: "/parts/new/success",                   info: { num: "R-40", code: "PARTS-NEW-SUCCESS" } },
  { pattern: "/resell/listings/new/success",        info: { num: "R-41", code: "RESELL-NEW-SUCCESS" } },
  { pattern: "/parts/my-listings/new",              info: { num: "R-29b", code: "PARTS-NEW-LISTING" } },
  { pattern: "/parts/my-listings/[id]",             info: { num: "R-29c", code: "PARTS-LISTING-DETAIL" } },
  { pattern: "/parts/my-listings",                  info: { num: "R-29", code: "PARTS-MY-LISTINGS" } },
  { pattern: "/parts/marketplace/[id]/smart-pick",  info: { num: "R-30b", code: "PARTS-SMART-PICKER" } },
  { pattern: "/parts/marketplace/[id]",             info: { num: "R-30c", code: "PARTS-ITEM-DETAIL" } },
  { pattern: "/parts/marketplace",                  info: { num: "R-30", code: "PARTS-MARKETPLACE" } },
  { pattern: "/parts/orders/[id]",                  info: { num: "R-32", code: "PARTS-ORDER-DETAIL" } },
  { pattern: "/parts/orders",                       info: { num: "R-31", code: "PARTS-ORDERS" } },
  { pattern: "/parts/my-orders/new",                info: { num: "R-33b", code: "PARTS-NEW-ORDER" } },
  { pattern: "/parts/my-orders/[id]",               info: { num: "R-34", code: "PARTS-BUYER-ORDER" } },
  { pattern: "/parts/my-orders",                    info: { num: "R-33", code: "PARTS-MY-ORDERS" } },
  { pattern: "/staff",                              info: { num: "R-35", code: "STAFF-MGMT" } },
  { pattern: "/wallet",                             info: { num: "R-36", code: "WALLET" } },
  { pattern: "/profile",                            info: { num: "R-37", code: "PROFILE" } },

  // ── Gen 109 Screen-ID expansion (R-43+) — main screens เดินเลขต่อจาก R-42 ──
  // หมายเหตุ: รหัส R-01..R-42 เดิม "ห้ามเปลี่ยนเลข" · variant ของจอเดิมใช้ฐานเดิม + ป้ายสถานะ (ไม่แตกเลขใหม่)
  // (auth) routes = badge ไม่ mount ใน (auth) layout → นอก scope · /modules/[module] = stub (ไม่มีป้าย)

  // Jobs board
  { pattern: "/jobs/listings",                      info: { num: "R-43", code: "JOBS-LISTINGS" } },
  { pattern: "/jobs/queue",                         info: { num: "R-44", code: "JOBS-QUEUE" } },
  // Service listings (maintain/repair)
  { pattern: "/listings/maintain/[id]",             info: { num: "R-45b", code: "LISTINGS-MAINTAIN-DETAIL" } },
  { pattern: "/listings/maintain",                  info: { num: "R-45", code: "LISTINGS-MAINTAIN" } },
  { pattern: "/listings/repair/[id]",               info: { num: "R-46b", code: "LISTINGS-REPAIR-DETAIL" } },
  { pattern: "/listings/repair",                    info: { num: "R-46", code: "LISTINGS-REPAIR" } },
  // Maintain queue + offer form (offer/success = R-39 เดิม)
  { pattern: "/maintain/queue/[id]/offer",          info: { num: "R-48", code: "MAINTAIN-OFFER" } },
  { pattern: "/maintain/queue",                     info: { num: "R-47", code: "MAINTAIN-QUEUE" } },
  // Maintain job-detail variants (ฐาน R-14)
  { pattern: "/maintain/jobs/[id]/mockup/m6-withdraw", info: { num: "R-14", code: "MAINTAIN-JOB-WITHDRAW-MOCK" } },
  { pattern: "/maintain/jobs/[id]/withdraw",        info: { num: "R-14", code: "MAINTAIN-JOB-WITHDRAW" } },
  { pattern: "/maintain/jobs/[id]/progress",        info: { num: "R-14", code: "MAINTAIN-JOB-PROGRESS" } },
  // Hub / misc
  { pattern: "/manage-technicians",                 info: { num: "R-49", code: "MANAGE-TECHNICIANS" } },
  { pattern: "/notifications",                      info: { num: "R-50", code: "NOTIFICATIONS" } },
  // Parts (Type E)
  { pattern: "/parts/dashboard",                    info: { num: "R-52", code: "PARTS-DASHBOARD" } },
  { pattern: "/parts/inventory",                    info: { num: "R-53", code: "PARTS-INVENTORY" } },
  { pattern: "/parts/cart",                         info: { num: "R-54", code: "PARTS-CART" } },
  { pattern: "/parts/checkout",                     info: { num: "R-55", code: "PARTS-CHECKOUT" } },
  { pattern: "/parts/disassemble",                  info: { num: "R-56", code: "PARTS-DISASSEMBLE" } },
  { pattern: "/parts/new",                          info: { num: "R-57", code: "PARTS-NEW" } },
  { pattern: "/parts/reservations",                 info: { num: "R-58", code: "PARTS-RESERVATIONS" } },
  { pattern: "/parts/movements/[id]",               info: { num: "R-59b", code: "PARTS-MOVEMENT-DETAIL" } },
  { pattern: "/parts/movements",                    info: { num: "R-59", code: "PARTS-MOVEMENTS" } },
  { pattern: "/parts/requests/inbox",               info: { num: "R-60", code: "PARTS-REQUESTS-INBOX" } },
  { pattern: "/parts/requests/my",                  info: { num: "R-61", code: "PARTS-REQUESTS-MY" } },
  { pattern: "/parts/requests/new",                 info: { num: "R-62", code: "PARTS-REQUESTS-NEW" } },
  { pattern: "/parts/[id]/stock-adjust",            info: { num: "R-63d", code: "PARTS-STOCK-ADJUST" } },
  { pattern: "/parts/[id]/stock-in",                info: { num: "R-63c", code: "PARTS-STOCK-IN" } },
  { pattern: "/parts/[id]/edit",                    info: { num: "R-63b", code: "PARTS-ITEM-EDIT" } },
  { pattern: "/parts/[id]",                         info: { num: "R-63", code: "PARTS-ITEM-DETAIL" } },
  // Parts order variants (ฐาน R-32 / R-34)
  { pattern: "/parts/orders/[id]/dispute",          info: { num: "R-32", code: "PARTS-ORDER-DISPUTE" } },
  { pattern: "/parts/orders/[id]/rate",             info: { num: "R-32", code: "PARTS-ORDER-RATE" } },
  { pattern: "/parts/my-orders/[id]/return",        info: { num: "R-34", code: "PARTS-BUYER-ORDER-RETURN" } },
  { pattern: "/parts/my-orders/[id]/warranty",      info: { num: "R-34", code: "PARTS-BUYER-ORDER-WARRANTY" } },
  { pattern: "/parts",                              info: { num: "R-51", code: "PARTS-HUB" } },
  // Repair dashboard + job/parcel/walk-in/pickup variants
  { pattern: "/repair/dashboard",                   info: { num: "R-64", code: "REPAIR-DASHBOARD" } },
  { pattern: "/repair/jobs/[id]/approve",           info: { num: "R-11", code: "REPAIR-JOB-APPROVE" } },
  { pattern: "/repair/jobs/[id]/dispute",           info: { num: "R-11", code: "REPAIR-JOB-DISPUTE" } },
  { pattern: "/repair/jobs/[id]/progress",          info: { num: "R-11", code: "REPAIR-JOB-PROGRESS" } },
  { pattern: "/repair/parcel/[id]/dispatch-tech",   info: { num: "R-08", code: "REPAIR-PARCEL-DISPATCH" } },
  { pattern: "/repair/parcel/[id]/inspect",         info: { num: "R-08", code: "REPAIR-PARCEL-INSPECT" } },
  { pattern: "/repair/parcel/[id]/receive",         info: { num: "R-08", code: "REPAIR-PARCEL-RECEIVE" } },
  { pattern: "/repair/parcel/[id]/ship-back",       info: { num: "R-08", code: "REPAIR-PARCEL-SHIPBACK" } },
  { pattern: "/repair/parcel/[id]/shipping-details", info: { num: "R-08", code: "REPAIR-PARCEL-SHIPPING" } },
  { pattern: "/repair/walk-in/[id]/abandoned",      info: { num: "R-06", code: "REPAIR-WALKIN-ABANDONED" } },
  { pattern: "/repair/walk-in/[id]/in-progress",    info: { num: "R-06", code: "REPAIR-WALKIN-INPROGRESS" } },
  { pattern: "/repair/walk-in/[id]/inspect",        info: { num: "R-06", code: "REPAIR-WALKIN-INSPECT" } },
  { pattern: "/repair/walk-in/[id]/ready",          info: { num: "R-06", code: "REPAIR-WALKIN-READY" } },
  { pattern: "/repair/walk-in/[id]/receive",        info: { num: "R-06", code: "REPAIR-WALKIN-RECEIVE" } },
  // Pickup flow (C2) — base R-65 (ไม่มีหน้า /repair/pickup/[id] เดี่ยว · steps ใช้ฐาน R-65)
  { pattern: "/repair/pickup/[id]/diagnose",        info: { num: "R-65", code: "REPAIR-C2-PICKUP-DIAGNOSE" } },
  { pattern: "/repair/pickup/[id]/dispatch",        info: { num: "R-65", code: "REPAIR-C2-PICKUP-DISPATCH" } },
  { pattern: "/repair/pickup/[id]/intake",          info: { num: "R-65", code: "REPAIR-C2-PICKUP-INTAKE" } },
  { pattern: "/repair/pickup/[id]/ready-to-deliver", info: { num: "R-65", code: "REPAIR-C2-PICKUP-READY" } },
  { pattern: "/repair/pickup/[id]/track",           info: { num: "R-65", code: "REPAIR-C2-PICKUP-TRACK" } },
  // Resell hub / inventory / offers / transactions
  { pattern: "/resell/inventory/new",               info: { num: "R-67b", code: "RESELL-INVENTORY-NEW" } },
  { pattern: "/resell/inventory/[id]",              info: { num: "R-67c", code: "RESELL-INVENTORY-DETAIL" } },
  { pattern: "/resell/inventory",                   info: { num: "R-67", code: "RESELL-INVENTORY" } },
  { pattern: "/resell/offers",                      info: { num: "R-68", code: "RESELL-OFFERS" } },
  { pattern: "/resell/transactions/[id]",           info: { num: "R-69b", code: "RESELL-TRANSACTION-DETAIL" } },
  { pattern: "/resell/transactions",                info: { num: "R-69", code: "RESELL-TRANSACTIONS" } },
  { pattern: "/resell",                             info: { num: "R-66", code: "RESELL-HUB" } },
  // Scrap hub / item / browse
  { pattern: "/scrap/browse/[id]",                  info: { num: "R-72b", code: "SCRAP-BROWSE-DETAIL" } },
  { pattern: "/scrap/browse",                       info: { num: "R-72", code: "SCRAP-BROWSE" } },
  { pattern: "/scrap/[id]",                         info: { num: "R-71", code: "SCRAP-ITEM-DETAIL" } },
  { pattern: "/scrap",                              info: { num: "R-70", code: "SCRAP-HUB" } },
  // Services
  { pattern: "/services/[id]/edit",                 info: { num: "R-73c", code: "SERVICES-EDIT" } },
  { pattern: "/services/new",                       info: { num: "R-73b", code: "SERVICES-NEW" } },
  { pattern: "/services",                           info: { num: "R-73", code: "SERVICES" } },
  // Wallet sub-screens (ฐาน R-36)
  { pattern: "/wallet/deposit",                     info: { num: "R-36", code: "WALLET-DEPOSIT" } },
  { pattern: "/wallet/history",                     info: { num: "R-36", code: "WALLET-HISTORY" } },
  { pattern: "/wallet/settlements",                 info: { num: "R-36", code: "WALLET-SETTLEMENTS" } },
  { pattern: "/wallet/withdraw",                    info: { num: "R-36", code: "WALLET-WITHDRAW" } },
];

function matchScreen(pathname: string): ScreenInfo | null {
  const sorted = [...SCREEN_MAP].sort((a, b) => b.pattern.length - a.pattern.length);
  for (const { pattern, info } of sorted) {
    const regexStr =
      "^" +
      pattern
        .replace(/\[id\]/g, "[^/]+")
        .replace(/\//g, "\\/") +
      "$";
    if (new RegExp(regexStr).test(pathname)) return info;
  }
  return null;
}

export function ScreenBadge() {
  const pathname = usePathname();
  if (process.env.NEXT_PUBLIC_DEV_NAV !== "true") return null;
  const info = matchScreen(pathname);
  if (!info) return null;

  return (
    <ScreenIdBadge
      screenId={info.num}
      roleTheme={{ primary: "#FF663A" }}
      position="top-left"
    />
  );
}
