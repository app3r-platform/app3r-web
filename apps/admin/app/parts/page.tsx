"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isAuthenticated } from "@/lib/auth";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/sidebar";
import type { Part } from "@/lib/types";

const CONDITION_META: Record<Part["condition"], { label: string; color: string }> = {
  new:         { label: "ใหม่",      color: "bg-green-50 text-green-700" },
  used:        { label: "มือสอง",   color: "bg-yellow-50 text-yellow-700" },
  refurbished: { label: "ปรับสภาพ", color: "bg-blue-50 text-blue-700" },
};

const PAGE_SIZE = 20;

interface PartsListResponse {
  results: Part[];
  count: number;
}

// mock fallback — ลบตอน Phase 4 (TD-06)
const MOCK_PARTS_DATA: PartsListResponse = {
  results: [
    { id: "PART-001", shopId: "SHOP-001", name: "คอมเพรสเซอร์ Daikin R410A", sku: "CP-DAI-001", category: "เครื่องปรับอากาศ", unit: "ตัว", condition: "new", stockQty: 5, reservedQty: 1, unitPrice: 4500, source: { type: "purchase" }, createdAt: "2026-01-15T09:00:00Z", updatedAt: "2026-05-20T12:00:00Z" },
    { id: "PART-002", shopId: "SHOP-002", name: "PCB Board Samsung A/C", sku: "PCB-SAM-002", category: "เครื่องใช้ไฟฟ้า", unit: "ชิ้น", condition: "used", stockQty: 3, reservedQty: 0, unitPrice: 1200, source: { type: "disassembly", refId: "SCRAP-001" }, createdAt: "2026-02-10T10:00:00Z", updatedAt: "2026-05-22T14:00:00Z" },
    { id: "PART-003", shopId: "SHOP-001", name: "มอเตอร์พัดลม LG 18BTU", sku: "MTR-LG-003", category: "เครื่องปรับอากาศ", unit: "ตัว", condition: "refurbished", stockQty: 2, reservedQty: 1, unitPrice: 2800, source: { type: "purchase" }, createdAt: "2026-03-05T08:00:00Z", updatedAt: "2026-05-25T10:00:00Z" },
  ] as unknown as Part[],
  count: 3,
};

function EmptyState({ message }: { message: string }) {
  return (
    <tr>
      <td colSpan={9} className="px-6 py-10 text-center text-gray-500">{message}</td>
    </tr>
  );
}

export default function PartsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Part[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterShop, setFilterShop] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterCondition, setFilterCondition] = useState("");
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String((page - 1) * PAGE_SIZE),
        ...(filterShop      && { shop_id: filterShop }),
        ...(filterCategory  && { category: filterCategory }),
        ...(filterCondition && { condition: filterCondition }),
        ...(filterLowStock  && { low_stock: "true" }),
      });
      const d = await api.get<PartsListResponse>("/admin/parts/?" + params);
      setItems(d.results);
      setTotal(d.count);
      setError(null);
    } catch (e) {
      // API ไม่พร้อม → ใช้ mock fallback
      console.warn("[mock fallback]", e);
      setItems(MOCK_PARTS_DATA.results);
      setTotal(MOCK_PARTS_DATA.count);
      setError(null);
    } finally {
      setLoading(false);
    }
  }, [page, filterShop, filterCategory, filterCondition, filterLowStock]);

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login"); return; }
    fetchData();
  }, [router, fetchData]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  function clearFilters() {
    setFilterShop(""); setFilterCategory(""); setFilterCondition(""); setFilterLowStock(false); setPage(1);
  }

  const hasFilters = filterShop || filterCategory || filterCondition || filterLowStock;

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar />
      <main className="flex-1 p-8 space-y-6 max-w-7xl">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">🔩 Parts Inventory</h1>
            <p className="text-gray-500 text-sm mt-1">
              รายการอะไหล่ข้าม shop — filter ร้าน / หมวด / สภาพ
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/parts/movements"
              className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg transition-colors">
              📦 Movements →
            </Link>
            <Link href="/parts/analytics"
              className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg transition-colors">
              📊 Analytics →
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap items-center">
          <input type="text" placeholder="รหัสร้าน"
            value={filterShop} onChange={e => { setFilterShop(e.target.value); setPage(1); }}
            className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 placeholder-gray-400 w-40 focus:outline-none focus:border-blue-500"
          />
          <input type="text" placeholder="หมวดหมู่"
            value={filterCategory} onChange={e => { setFilterCategory(e.target.value); setPage(1); }}
            className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 placeholder-gray-400 w-40 focus:outline-none focus:border-blue-500"
          />
          <select
            value={filterCondition}
            onChange={e => { setFilterCondition(e.target.value); setPage(1); }}
            className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 w-40 focus:outline-none focus:border-blue-500">
            <option value="">ทุกสภาพ</option>
            <option value="new">ใหม่</option>
            <option value="used">มือสอง</option>
            <option value="refurbished">ปรับสภาพ</option>
          </select>
          <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer">
            <input type="checkbox" checked={filterLowStock}
              onChange={e => { setFilterLowStock(e.target.checked); setPage(1); }}
              className="accent-red-500" />
            Low stock only
          </label>
          {hasFilters && (
            <button onClick={clearFilters}
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
            <div className="px-6 py-8 text-red-600">
              ระบบอะไหล่กำลังพัฒนา — {error}
            </div>
          ) : loading ? (
            <p className="px-6 py-8 text-gray-500">กำลังโหลด...</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-left border-b border-gray-200">
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3">ชื่ออะไหล่</th>
                  <th className="px-4 py-3">หมวด</th>
                  <th className="px-4 py-3">สภาพ</th>
                  <th className="px-4 py-3">Shop</th>
                  <th className="px-4 py-3">คงเหลือ</th>
                  <th className="px-4 py-3">จอง</th>
                  <th className="px-4 py-3">ราคา/หน่วย</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.length === 0 ? (
                  <EmptyState message="ยังไม่มีข้อมูลอะไหล่" />
                ) : items.map(part => {
                  const cm = CONDITION_META[part.condition];
                  const available = part.stockQty - part.reservedQty;
                  const isLow = available <= 2;
                  return (
                    <tr key={part.id} className="hover:bg-gray-100/40">
                      <td className="px-4 py-3 font-mono text-xs text-blue-400">{part.sku}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {part.imageUrl && (
                            <img src={part.imageUrl} alt={part.name}
                              className="w-8 h-8 object-cover rounded bg-gray-100" />
                          )}
                          <span className="text-sm text-gray-100">{part.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{part.category}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${cm.color}`}>{cm.label}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 font-mono">{part.shopId}</td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-mono font-semibold ${isLow ? "text-red-600" : "text-gray-100"}`}>
                          {part.stockQty} {part.unit}
                        </span>
                        {isLow && <span className="ml-1 text-xs text-red-500">⚠</span>}
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-yellow-600">
                        {part.reservedQty > 0 ? part.reservedQty : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-green-600">
                        {part.unitPrice.toLocaleString()} ฿
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/parts/${part.id}`}
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
