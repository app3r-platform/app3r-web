"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { isAuthenticated } from "@/lib/auth";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/sidebar";
import type { Offer } from "@/lib/types";

const STATUS_META: Record<Offer["status"], { label: string; color: string }> = {
  pending:   { label: "รอ",     color: "bg-yellow-50 text-yellow-700" },
  selected:  { label: "เลือก",  color: "bg-green-50 text-green-700" },
  rejected:  { label: "ปฏิเสธ", color: "bg-red-50 text-red-700" },
  withdrawn: { label: "ถอน",    color: "bg-gray-100 text-gray-500" },
};

const PAGE_SIZE = 25;

interface OffersResponse {
  results: Offer[];
  count: number;
}

// mock fallback — ลบตอน Phase 4 (TD-06)
const MOCK_OFFERS_DATA: OffersResponse = {
  results: [
    { id: "OFR-001", listingId: "LST-001", buyerId: "WEEEU-001", buyerType: "WeeeU", offerPrice: 11000, deliveryMethod: "self_pickup", message: "ขอซื้อด้วยครับ", status: "pending", expiresAt: "2026-06-15T00:00:00Z", createdAt: "2026-05-10T11:00:00Z" },
    { id: "OFR-002", listingId: "LST-001", buyerId: "WEEER-002", buyerType: "WeeeR", offerPrice: 11500, deliveryMethod: "shipping", status: "selected", expiresAt: "2026-06-15T00:00:00Z", createdAt: "2026-05-11T09:00:00Z" },
    { id: "OFR-003", listingId: "LST-002", buyerId: "WEEEU-003", buyerType: "WeeeU", offerPrice: 9800, deliveryMethod: "self_pickup", status: "rejected", expiresAt: "2026-06-10T00:00:00Z", createdAt: "2026-05-08T14:00:00Z" },
  ] as unknown as Offer[],
  count: 3,
};

function OffersInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<Offer[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterBuyerType, setFilterBuyerType] = useState("");
  const [filterListingId, setFilterListingId] = useState(searchParams.get("listing_id") ?? "");
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String((page - 1) * PAGE_SIZE),
        ...(filterStatus    && { status: filterStatus }),
        ...(filterBuyerType && { buyer_type: filterBuyerType }),
        ...(filterListingId && { listing_id: filterListingId }),
      });
      const d = await api.get<OffersResponse>("/admin/offers/?" + params);
      setItems(d.results);
      setTotal(d.count);
      setError(null);
    } catch (e) {
      // API ไม่พร้อม → ใช้ mock fallback
      console.warn("[mock fallback]", e);
      setItems(MOCK_OFFERS_DATA.results);
      setTotal(MOCK_OFFERS_DATA.count);
      setError(null);
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus, filterBuyerType, filterListingId]);

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login"); return; }
    fetchData();
  }, [router, fetchData]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar />
      <main className="flex-1 p-8 space-y-6 max-w-7xl">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">🤝 Offer Audit</h1>
            <p className="text-gray-500 text-sm mt-1">
              ตรวจสอบ offers ข้าม listings — anti-fraud monitoring
            </p>
          </div>
          <Link href="/resell/listings"
            className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg transition-colors">
            🛍️ Listings →
          </Link>
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <select value={filterStatus}
            onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
            className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 w-36 focus:outline-none focus:border-blue-500">
            <option value="">ทุกสถานะ</option>
            <option value="pending">รอ</option>
            <option value="selected">เลือก</option>
            <option value="rejected">ปฏิเสธ</option>
            <option value="withdrawn">ถอน</option>
          </select>
          <select value={filterBuyerType}
            onChange={e => { setFilterBuyerType(e.target.value); setPage(1); }}
            className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 w-36 focus:outline-none focus:border-blue-500">
            <option value="">ทุก Buyer</option>
            <option value="WeeeU">WeeeU</option>
            <option value="WeeeR">WeeeR</option>
          </select>
          <input type="text" placeholder="Listing ID"
            value={filterListingId} onChange={e => { setFilterListingId(e.target.value); setPage(1); }}
            className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 placeholder-gray-400 w-52 focus:outline-none focus:border-blue-500"
          />
          {(filterStatus || filterBuyerType || filterListingId) && (
            <button onClick={() => { setFilterStatus(""); setFilterBuyerType(""); setFilterListingId(""); setPage(1); }}
              className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-900 bg-gray-100 rounded-lg">
              ล้าง filter
            </button>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-200 flex items-center justify-between text-sm text-gray-500">
            <span>พบ {total.toLocaleString()} offers</span>
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
                  <th className="px-4 py-3">Offer ID</th>
                  <th className="px-4 py-3">Listing ID</th>
                  <th className="px-4 py-3">Buyer</th>
                  <th className="px-4 py-3">ราคา Offer</th>
                  <th className="px-4 py-3">Delivery</th>
                  <th className="px-4 py-3">สถานะ</th>
                  <th className="px-4 py-3">หมดอายุ</th>
                  <th className="px-4 py-3">วันที่</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.length === 0 ? (
                  <tr><td colSpan={8} className="px-6 py-10 text-center text-gray-500">ยังไม่มีข้อมูล offer</td></tr>
                ) : items.map(offer => {
                  const sm = STATUS_META[offer.status];
                  return (
                    <tr key={offer.id} className="hover:bg-gray-100/40">
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{offer.id.slice(0, 8)}…</td>
                      <td className="px-4 py-3">
                        <Link href={`/resell/listings/${offer.listingId}`}
                          className="font-mono text-xs text-admin-primary hover:text-admin-dark">
                          {offer.listingId.slice(0, 8)}…
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-medium ${offer.buyerType === "WeeeU" ? "text-sky-400" : "text-green-600"}`}>
                          {offer.buyerType}
                        </span>
                        <div className="text-xs text-gray-500 font-mono">{offer.buyerId.slice(0, 8)}…</div>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-green-600">
                        {offer.offerPrice.toLocaleString()} ฿
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{offer.deliveryMethod}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${sm.color}`}>{sm.label}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {new Date(offer.expiresAt).toLocaleDateString("th-TH")}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {new Date(offer.createdAt).toLocaleDateString("th-TH")}
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

export default function OffersPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen bg-gray-50 text-gray-900">
        <Sidebar /><main className="flex-1 p-8"><p className="text-gray-500">กำลังโหลด...</p></main>
      </div>
    }>
      <OffersInner />
    </Suspense>
  );
}
