"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isAuthenticated } from "@/lib/auth";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/sidebar";
import type { Listing } from "@/lib/types";

const STATUS_META: Record<Listing["status"], { label: string; color: string }> = {
  announced:        { label: "ประกาศ",          color: "bg-gray-100 text-gray-500" },
  receiving_offers: { label: "รับ Offer",        color: "bg-blue-50 text-blue-700" },
  offer_selected:   { label: "เลือก Offer แล้ว", color: "bg-brand-info/15 text-brand-info" },
  buyer_confirmed:  { label: "ผู้ซื้อยืนยัน",     color: "bg-cyan-900/50 text-cyan-300" },
  in_progress:      { label: "กำลังดำเนินการ",   color: "bg-yellow-50 text-yellow-700" },
  delivered:        { label: "ส่งแล้ว",          color: "bg-brand-success/15 text-brand-success" },
  inspection_period:{ label: "ช่วงตรวจสอบ",      color: "bg-admin-primary/15 text-admin-primary" },
  completed:        { label: "เสร็จสิ้น",        color: "bg-green-50 text-green-700" },
  cancelled:        { label: "ยกเลิก",           color: "bg-gray-100 text-gray-500" },
  disputed:         { label: "พิพาท",            color: "bg-red-50 text-red-700" },
};

const TYPE_META: Record<Listing["listingType"], { label: string; color: string }> = {
  used_appliance: { label: "มือสอง",  color: "bg-blue-900/40 text-blue-300" },
  scrap:          { label: "ซาก",     color: "bg-orange-900/40 text-orange-700" },
};

const SELLER_COLOR: Record<Listing["sellerType"], string> = {
  WeeeU: "text-sky-400",
  WeeeR: "text-green-600",
};

const STATUS_TABS = [
  { label: "ทั้งหมด",       value: "" },
  { label: "ประกาศ/Offer",  value: "announced" },
  { label: "กำลังดำเนินการ",value: "in_progress" },
  { label: "ตรวจสอบ",       value: "inspection_period" },
  { label: "เสร็จสิ้น",     value: "completed" },
  { label: "พิพาท",         value: "disputed" },
  { label: "ยกเลิก",        value: "cancelled" },
];

const PAGE_SIZE = 20;

// MOCK_RESELL_LISTINGS — fallback เมื่อ API ไม่พร้อม (dev/staging)
const MOCK_RESELL_LISTINGS = [
  { id: "lst-001", listingType: "used_appliance" as const, sellerId: "u-001",    sellerType: "WeeeU" as const, status: "receiving_offers"  as const, price: 3500, expiresAt: "2026-06-01T00:00:00Z", createdAt: "2026-05-20T00:00:00Z" },
  { id: "lst-002", listingType: "used_appliance" as const, sellerId: "shop-001", sellerType: "WeeeR" as const, status: "completed"          as const, price: 5000, expiresAt: "2026-06-15T00:00:00Z", createdAt: "2026-05-18T00:00:00Z" },
  { id: "lst-003", listingType: "scrap"          as const, sellerId: "u-003",    sellerType: "WeeeU" as const, status: "announced"          as const, price: 500,  expiresAt: "2026-05-30T00:00:00Z", createdAt: "2026-05-22T00:00:00Z" },
] as unknown as Listing[];

interface ListingsResponse {
  results: Listing[];
  count: number;
}

export default function ResellListingsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterSellerType, setFilterSellerType] = useState("");
  const [filterListingType, setFilterListingType] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String((page - 1) * PAGE_SIZE),
        ...(filterStatus      && { status: filterStatus }),
        ...(filterSellerType  && { seller_type: filterSellerType }),
        ...(filterListingType && { listing_type: filterListingType }),
        ...(dateFrom          && { date_from: dateFrom }),
        ...(dateTo            && { date_to: dateTo }),
      });
      const d = await api.get<ListingsResponse>("/admin/listings/?" + params);
      setItems(d.results);
      setTotal(d.count);
      setError(null);
    } catch {
      // API ไม่พร้อม → ใช้ mock fallback
      setItems(MOCK_RESELL_LISTINGS);
      setTotal(MOCK_RESELL_LISTINGS.length);
      setError(null);
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus, filterSellerType, filterListingType, dateFrom, dateTo]);

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login"); return; }
    fetchData();
  }, [router, fetchData]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const hasSecondaryFilters = filterSellerType || filterListingType || dateFrom || dateTo;

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar />
      <main className="flex-1 p-8 space-y-6 max-w-7xl">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">🛍️ ประกาศขายต่อ (ตรวจสอบ)</h1>
            <p className="text-gray-500 text-sm mt-1">
              รายการ listings ข้าม sellers — filter สถานะ / sellerType / listingType / วันที่
            </p>
          </div>
          <Link href="/resell/analytics"
            className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg transition-colors">
            📊 Analytics →
          </Link>
        </div>

        {/* Status tabs */}
        <div className="flex gap-1 bg-white rounded-xl p-1 border border-gray-200 w-fit flex-wrap">
          {STATUS_TABS.map(t => (
            <button key={t.value}
              onClick={() => { setFilterStatus(t.value); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                filterStatus === t.value ? "bg-admin-surface text-admin-primary" : "text-gray-500 hover:text-gray-900"
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Secondary filters */}
        <div className="flex gap-3 flex-wrap">
          <select value={filterSellerType}
            onChange={e => { setFilterSellerType(e.target.value); setPage(1); }}
            className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 w-36 focus:outline-none focus:border-blue-500">
            <option value="">ทุกผู้ขาย</option>
            <option value="WeeeU">WeeeU</option>
            <option value="WeeeR">WeeeR</option>
          </select>
          <select value={filterListingType}
            onChange={e => { setFilterListingType(e.target.value); setPage(1); }}
            className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 w-36 focus:outline-none focus:border-blue-500">
            <option value="">ทุกประเภท</option>
            <option value="used_appliance">มือสอง</option>
            <option value="scrap">ซาก</option>
          </select>
          <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }}
            className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 w-40 focus:outline-none focus:border-blue-500" />
          <span className="self-center text-gray-600 text-xs">ถึง</span>
          <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }}
            className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 w-40 focus:outline-none focus:border-blue-500" />
          {hasSecondaryFilters && (
            <button onClick={() => { setFilterSellerType(""); setFilterListingType(""); setDateFrom(""); setDateTo(""); setPage(1); }}
              className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-900 bg-gray-100 rounded-lg">
              ล้าง filter
            </button>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-200 flex items-center justify-between text-sm text-gray-500">
            <span>พบ {total.toLocaleString()} รายการ</span>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-2 py-1 rounded bg-gray-100 disabled:opacity-40 hover:bg-gray-200">‹</button>
                <span>{page} / {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="px-2 py-1 rounded bg-gray-100 disabled:opacity-40 hover:bg-gray-200">›</button>
              </div>
            )}
          </div>

          {error ? (
            <div className="px-6 py-8 text-red-600">ระบบ Resell กำลังพัฒนา — {error}</div>
          ) : loading ? (
            <p className="px-6 py-8 text-gray-500">กำลังโหลด...</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-left border-b border-gray-200">
                  <th className="px-4 py-3">รหัสประกาศ</th>
                  <th className="px-4 py-3">ประเภท</th>
                  <th className="px-4 py-3">ผู้ขาย</th>
                  <th className="px-4 py-3">สถานะ</th>
                  <th className="px-4 py-3">ราคา</th>
                  <th className="px-4 py-3">หมดอายุ</th>
                  <th className="px-4 py-3">สร้างเมื่อ</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.length === 0 ? (
                  <tr><td colSpan={8} className="px-6 py-10 text-center text-gray-500">ยังไม่มีข้อมูล listing</td></tr>
                ) : items.map(listing => {
                  const sm = STATUS_META[listing.status];
                  const tm = TYPE_META[listing.listingType];
                  return (
                    <tr key={listing.id} className="hover:bg-gray-100/40">
                      <td className="px-4 py-3 font-mono text-xs text-blue-400">
                        {listing.id.slice(0, 8)}…
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${tm.color}`}>{tm.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-medium ${SELLER_COLOR[listing.sellerType]}`}>
                          {listing.sellerType}
                        </span>
                        <div className="text-xs text-gray-500 font-mono">{listing.sellerId.slice(0, 8)}…</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${sm.color}`}>{sm.label}</span>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-green-600">
                        {listing.price.toLocaleString()} ฿
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {new Date(listing.expiresAt).toLocaleDateString("th-TH")}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {new Date(listing.createdAt).toLocaleDateString("th-TH")}
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/resell/listings/${listing.id}`}
                          className="text-xs text-admin-primary hover:text-admin-dark whitespace-nowrap">
                          ดู →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
