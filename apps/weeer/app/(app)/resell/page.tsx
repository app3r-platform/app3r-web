"use client";

// ── WeeeR Resell Dashboard — 2.2 Mockup ──────────────────────────────────────

import { useEffect, useState } from "react";
import Link from "next/link";
import { resellApi } from "./_lib/api";
import type { Listing } from "./_lib/types";
import { LISTING_STATUS_LABEL, LISTING_STATUS_COLOR } from "./_lib/types";
import { MockAnnoOrigin } from "@/components/MockAnno";

interface Dashboard {
  total_inventory: number;
  total_listings_active: number;
  total_offers_pending: number;
  total_revenue: number;
  recent_listings: Listing[];
}

// Mock dashboard data (Mockup 2.2)
const MOCK_DASHBOARD: Dashboard = {
  total_inventory: 8,
  total_listings_active: 3,
  total_offers_pending: 2,
  total_revenue: 42500,
  recent_listings: [
    {
      id: "L001", sellerId: "S1", sellerType: "WeeeR", listingType: "used_appliance",
      applianceName: "Samsung Q9 QLED 65\"", price: 18900, deliveryMethods: ["ส่ง Kerry"],
      status: "receiving_offers", expiresAt: "2026-06-01", createdAt: "2026-05-20", updatedAt: "2026-05-20", offerCount: 2,
    },
    {
      id: "L002", sellerId: "S1", sellerType: "WeeeR", listingType: "used_appliance",
      applianceName: "Dyson V15 Detect", price: 8500, deliveryMethods: ["รับเอง"],
      status: "offer_selected", expiresAt: "2026-06-01", createdAt: "2026-05-18", updatedAt: "2026-05-22", offerCount: 1,
    },
    {
      id: "L003", sellerId: "S1", sellerType: "WeeeR", listingType: "used_appliance",
      applianceName: "iPhone 14 Pro 256GB", price: 22000, deliveryMethods: ["ส่ง Kerry", "รับเอง"],
      status: "suspended", expiresAt: "2026-06-01", createdAt: "2026-05-15", updatedAt: "2026-05-21",
      suspendReason: "รูปภาพไม่ครบตามนโยบาย — แก้ไขและประกาศใหม่",
    },
  ],
};

export default function ResellDashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    resellApi.dashboard()
      .then(setData)
      .catch(() => setData(MOCK_DASHBOARD))  // Mockup fallback
      .finally(() => setLoading(false));
  }, []);

  const d = data ?? MOCK_DASHBOARD;

  if (loading) return <div className="flex items-center justify-center h-48 text-gray-400">กำลังโหลด…</div>;

  return (
    <div className="space-y-6">
      <MockAnnoOrigin from="R-01" />
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">💸 ขายมือสอง (Resell)</h1>
        <div className="flex gap-2">
          <Link href="/resell/buy"
            className="bg-[#FF663A] hover:bg-[#D8491F] text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors">
            📥 รับซื้อ
          </Link>
          <Link href="/resell/listings/new"
            className="bg-[#FF663A] hover:bg-[#D8491F] text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors">
            📢 ประกาศขาย
          </Link>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "สินค้าในสต๊อก",   value: d.total_inventory,            color: "bg-[#FCEAE3]", text: "text-[#FF663A]" },
          { label: "ประกาศใช้งาน",     value: d.total_listings_active,       color: "bg-orange-50", text: "text-orange-700" },
          { label: "ข้อเสนอรอตอบ",    value: d.total_offers_pending,        color: "bg-amber-50",  text: "text-amber-700" },
          { label: "รายได้รวม (พอยต์)", value: d.total_revenue.toLocaleString(), color: "bg-[#FFF1ED]", text: "text-[#D63B12]" },
        ].map(k => (
          <div key={k.label} className={`${k.color} rounded-xl p-4 text-center`}>
            <p className={`text-2xl font-bold ${k.text}`}>{k.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {[
          { href: "/resell/inventory",   icon: "📦", label: "คลังสินค้า" },
          { href: "/resell/listings",    icon: "📢", label: "ประกาศของฉัน" },
          { href: "/resell/marketplace", icon: "🛒", label: "ตลาดซื้อขาย" },
          { href: "/resell/offers",      icon: "🤝", label: "ข้อเสนอ" },
          { href: "/resell/transactions",icon: "🔄", label: "รายการซื้อขาย" },
          { href: "/resell/buy",         icon: "📥", label: "รับซื้อ B6" },
        ].map(q => (
          <Link key={q.href} href={q.href}
            className="bg-white border border-gray-100 rounded-xl p-3 text-center hover:border-[#FFD5C4] hover:shadow-sm transition-all">
            <p className="text-xl mb-1">{q.icon}</p>
            <p className="text-xs font-medium text-gray-700">{q.label}</p>
          </Link>
        ))}
      </div>

      {/* Recent listings */}
      <div className="bg-white border border-gray-100 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">ประกาศล่าสุด</p>
          <Link href="/resell/listings" className="text-xs text-[#FF663A] hover:underline">ดูทั้งหมด</Link>
        </div>
        {!d.recent_listings?.length ? (
          <p className="text-sm text-gray-400 text-center py-4">ยังไม่มีประกาศ</p>
        ) : (
          <div className="space-y-2">
            {d.recent_listings.map(l => (
              <Link key={l.id} href={`/resell/listings/${l.id}`}
                className="flex items-center justify-between hover:bg-gray-50 rounded-lg px-2 py-2 transition-colors">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{l.applianceName ?? "—"}</p>
                  <p className="text-xs text-gray-400">{new Date(l.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${LISTING_STATUS_COLOR[l.status]}`}>
                    {LISTING_STATUS_LABEL[l.status]}
                  </span>
                  <span className="text-sm font-bold text-[#FF663A]">{l.price.toLocaleString()} พอยต์</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
