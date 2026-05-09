"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { resellApi } from "./_lib/api";
import type { Listing } from "./_lib/types";
import { LISTING_STATUS_LABEL, LISTING_STATUS_COLOR } from "./_lib/types";

interface Dashboard {
  total_inventory: number;
  total_listings_active: number;
  total_offers_pending: number;
  total_revenue: number;
  recent_listings: Listing[];
}

export default function ResellDashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    resellApi.dashboard()
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-48 text-gray-400">กำลังโหลด…</div>;
  if (error) return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-yellow-700 text-sm">
      ⚠️ ระบบขายมือสองกำลังพัฒนา — {error}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">💸 ขายมือสอง (Resell)</h1>
        <div className="flex gap-2">
          <Link href="/resell/inventory/new"
            className="bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors">
            + เพิ่มสินค้า
          </Link>
          <Link href="/resell/listings/new"
            className="bg-green-700 hover:bg-green-800 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors">
            📢 ประกาศขาย
          </Link>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "สินค้าในสต๊อก", value: data?.total_inventory ?? 0, color: "bg-blue-50", text: "text-blue-700" },
          { label: "ประกาศ active", value: data?.total_listings_active ?? 0, color: "bg-indigo-50", text: "text-indigo-700" },
          { label: "ข้อเสนอรอตอบ", value: data?.total_offers_pending ?? 0, color: "bg-amber-50", text: "text-amber-700" },
          { label: "รายได้รวม (pts)", value: (data?.total_revenue ?? 0).toLocaleString(), color: "bg-green-50", text: "text-green-700" },
        ].map(k => (
          <div key={k.label} className={`${k.color} rounded-xl p-4 text-center`}>
            <p className={`text-2xl font-bold ${k.text}`}>{k.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { href: "/resell/inventory", icon: "📦", label: "คลังสินค้า" },
          { href: "/resell/listings", icon: "📢", label: "ประกาศของฉัน" },
          { href: "/resell/marketplace", icon: "🛒", label: "Marketplace" },
          { href: "/resell/transactions", icon: "🔄", label: "รายการซื้อขาย" },
        ].map(q => (
          <Link key={q.href} href={q.href}
            className="bg-white border border-gray-100 rounded-xl p-4 text-center hover:shadow-sm transition-shadow">
            <p className="text-2xl mb-1">{q.icon}</p>
            <p className="text-xs font-medium text-gray-700">{q.label}</p>
          </Link>
        ))}
      </div>

      {/* Recent listings */}
      <div className="bg-white border border-gray-100 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">ประกาศล่าสุด</p>
          <Link href="/resell/listings" className="text-xs text-blue-600 hover:underline">ดูทั้งหมด</Link>
        </div>
        {!data?.recent_listings?.length ? (
          <p className="text-sm text-gray-400 text-center py-4">ยังไม่มีประกาศ</p>
        ) : (
          <div className="space-y-2">
            {data.recent_listings.map(l => (
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
                  <span className="text-sm font-bold text-green-700">{l.price.toLocaleString()} pts</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
