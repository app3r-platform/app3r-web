"use client";

// ── WeeeR Resell Listings — 2.2 Mockup (suspended tab + R2/R3 + Q&A count) ──

import { useEffect, useState } from "react";
import Link from "next/link";
import { resellApi } from "../_lib/api";
import type { Listing, ListingStatus } from "../_lib/types";
import { LISTING_STATUS_LABEL, LISTING_STATUS_COLOR } from "../_lib/types";

const TABS: { value: ListingStatus | ""; label: string }[] = [
  { value: "", label: "ทั้งหมด" },
  { value: "announced", label: "ประกาศแล้ว" },
  { value: "receiving_offers", label: "รับข้อเสนอ" },
  { value: "offer_selected", label: "เลือกแล้ว" },
  { value: "in_progress", label: "ดำเนินการ" },
  { value: "delivered", label: "ส่งมอบแล้ว" },
  { value: "inspection_period", label: "ตรวจสอบ" },
  { value: "completed", label: "เสร็จสิ้น" },
  { value: "suspended", label: "🔴 ถูกระงับ" },   // R2/R3
];

// Mock listings data (Mockup 2.2)
const MOCK_LISTINGS: Listing[] = [
  {
    id: "L001", sellerId: "S1", sellerType: "WeeeR", listingType: "used_appliance",
    applianceName: "Samsung Q9 QLED 65\"", price: 18900, deliveryMethods: ["ส่ง Kerry"],
    status: "receiving_offers", expiresAt: "2026-06-01", createdAt: "2026-05-20", updatedAt: "2026-05-20", offerCount: 2,
    terms3: { shipping: "ผู้ขายรับผิดชอบ", usedWarranty: "30 วัน", liability: "ผู้ขายรับผิด" },
  },
  {
    id: "L002", sellerId: "S1", sellerType: "WeeeR", listingType: "used_appliance",
    applianceName: "Dyson V15 Detect", price: 8500, deliveryMethods: ["รับเอง"],
    status: "offer_selected", expiresAt: "2026-06-01", createdAt: "2026-05-18", updatedAt: "2026-05-22", offerCount: 1,
    terms3: { shipping: "ผู้ซื้อรับผิดชอบ", usedWarranty: "7 วัน", liability: "ไม่รับผิด" },
  },
  {
    id: "L003", sellerId: "S1", sellerType: "WeeeR", listingType: "used_appliance",
    applianceName: "iPhone 14 Pro 256GB", price: 22000, deliveryMethods: ["ส่ง Kerry", "รับเอง"],
    status: "suspended", expiresAt: "2026-06-01", createdAt: "2026-05-15", updatedAt: "2026-05-21",
    suspendReason: "รูปภาพไม่ครบตามนโยบาย — แก้ไขและประกาศใหม่",
  },
  {
    id: "L004", sellerId: "S1", sellerType: "WeeeR", listingType: "used_appliance",
    applianceName: "MacBook Air M2", price: 32000, deliveryMethods: ["ส่ง Kerry"],
    status: "in_progress", expiresAt: "2026-06-10", createdAt: "2026-05-10", updatedAt: "2026-05-23",
  },
];

export default function ResellListingsPage() {
  const [listings, setListings] = useState<Listing[]>(() =>
    process.env.NEXT_PUBLIC_DEV_NAV === "true" ? MOCK_LISTINGS : []
  );
  const [loading, setLoading] = useState(() => process.env.NEXT_PUBLIC_DEV_NAV !== "true");
  const [statusFilter, setStatusFilter] = useState<ListingStatus | "">("");

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_DEV_NAV === "true") return;
    resellApi.listingsList({ status: statusFilter || undefined })
      .then(setListings)
      .catch(() => setListings(MOCK_LISTINGS))  // Mockup fallback
      .finally(() => setLoading(false));
  }, [statusFilter]);

  const filtered = statusFilter ? listings.filter(l => l.status === statusFilter) : listings;
  const suspendedCount = listings.filter(l => l.status === "suspended").length;

  if (loading) return <div className="flex items-center justify-center h-48 text-gray-400">กำลังโหลด…</div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/resell" className="text-gray-400 hover:text-gray-600">←</Link>
          <h1 className="text-xl font-bold text-gray-900">ประกาศของฉัน</h1>
        </div>
        <Link href="/resell/listings/new"
          className="bg-[#FF663A] hover:bg-[#D8491F] text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors">
          + ประกาศใหม่
        </Link>
      </div>

      {/* R2/R3 suspended alert */}
      {suspendedCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-2">
          <span>🚫</span>
          <p className="text-xs text-red-700 flex-1">
            มี <span className="font-bold">{suspendedCount} ประกาศถูกระงับ</span> — Admin ขอให้แก้ไข กรุณาตรวจสอบ
          </p>
          <button onClick={() => setStatusFilter("suspended")}
            className="shrink-0 text-xs text-red-600 font-semibold underline">ดู</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map(t => (
          <button key={t.value} onClick={() => setStatusFilter(t.value)}
            className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full transition-colors
              ${statusFilter === t.value ? "bg-[#FF663A] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">ยังไม่มีประกาศ</div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl divide-y divide-gray-50">
          {filtered.map(l => (
            <Link key={l.id} href={`/resell/listings/${l.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-800 truncate">{l.applianceName ?? "—"}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${LISTING_STATUS_COLOR[l.status]}`}>
                    {LISTING_STATUS_LABEL[l.status]}
                  </span>
                  {(l.offerCount ?? 0) > 0 && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">
                      {l.offerCount} ข้อเสนอ
                    </span>
                  )}
                  {l.status === "suspended" && (
                    <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium">⚠️ รอแก้ไข</span>
                  )}
                </div>
              </div>
              <div className="shrink-0 ml-3 text-right">
                <p className="text-sm font-bold text-[#FF663A]">{l.price.toLocaleString()} พอยต์</p>
                <p className="text-xs text-gray-400">
                  {new Date(l.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
