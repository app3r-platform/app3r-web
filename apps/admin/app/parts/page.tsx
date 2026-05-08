"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isAuthenticated } from "@/lib/auth";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/sidebar";
import type { Part } from "@/lib/types";

const CONDITION_META: Record<Part["condition"], { label: string; color: string }> = {
  new:         { label: "ใหม่",      color: "bg-green-900/50 text-green-400" },
  used:        { label: "มือสอง",   color: "bg-yellow-900/50 text-yellow-400" },
  refurbished: { label: "ปรับสภาพ", color: "bg-blue-900/50 text-blue-300" },
};

const PAGE_SIZE = 20;

interface PartsListResponse {
  results: Part[];
  count: number;
}

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
      setError((e as Error).message);
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
    <div className="flex min-h-screen bg-gray-950 text-white">
      <Sidebar />
      <main className="flex-1 p-8 space-y-6 max-w-7xl">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">🔩 Parts Inventory</h1>
            <p className="text-gray-400 text-sm mt-1">
              รายการอะไหล่ข้าม shop — filter ร้าน / หมวด / สภาพ
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/parts/movements"
              className="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors">
              📦 Movements →
            </Link>
            <Link href="/parts/analytics"
              className="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors">
              📊 Analytics →
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap items-center">
          <input type="text" placeholder="Shop ID"
            value={filterShop} onChange={e => { setFilterShop(e.target.value); setPage(1); }}
            className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-600 w-40 focus:outline-none focus:border-blue-500"
          />
          <input type="text" placeholder="หมวดหมู่"
            value={filterCategory} onChange={e => { setFilterCategory(e.target.value); setPage(1); }}
            className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-600 w-40 focus:outline-none focus:border-blue-500"
          />
          <select
            value={filterCondition}
            onChange={e => { setFilterCondition(e.target.value); setPage(1); }}
            className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white w-40 focus:outline-none focus:border-blue-500">
            <option value="">ทุกสภาพ</option>
            <option value="new">ใหม่</option>
            <option value="used">มือสอง</option>
            <option value="refurbished">ปรับสภาพ</option>
          </select>
          <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
            <input type="checkbox" checked={filterLowStock}
              onChange={e => { setFilterLowStock(e.target.checked); setPage(1); }}
              className="accent-red-500" />
            Low stock only
          </label>
          {hasFilters && (
            <button onClick={clearFilters}
              className="px-3 py-1.5 text-xs text-gray-400 hover:text-white bg-gray-800 rounded-lg">
              ล้าง filter
            </button>
          )}
        </div>

        {/* Table */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-800 flex items-center justify-between text-sm text-gray-400">
            <span>พบ {total.toLocaleString()} รายการ</span>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-2 py-1 rounded bg-gray-800 disabled:opacity-40 hover:bg-gray-700">‹</button>
                <span>{page} / {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="px-2 py-1 rounded bg-gray-800 disabled:opacity-40 hover:bg-gray-700">›</button>
              </div>
            )}
          </div>

          {error ? (
            <div className="px-6 py-8 text-red-400">
              ระบบอะไหล่กำลังพัฒนา — {error}
            </div>
          ) : loading ? (
            <p className="px-6 py-8 text-gray-500">กำลังโหลด...</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-left border-b border-gray-800">
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
              <tbody className="divide-y divide-gray-800">
                {items.length === 0 ? (
                  <EmptyState message="ยังไม่มีข้อมูลอะไหล่" />
                ) : items.map(part => {
                  const cm = CONDITION_META[part.condition];
                  const available = part.stockQty - part.reservedQty;
                  const isLow = available <= 2;
                  return (
                    <tr key={part.id} className="hover:bg-gray-800/40">
                      <td className="px-4 py-3 font-mono text-xs text-blue-400">{part.sku}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {part.imageUrl && (
                            <img src={part.imageUrl} alt={part.name}
                              className="w-8 h-8 object-cover rounded bg-gray-800" />
                          )}
                          <span className="text-sm text-gray-100">{part.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">{part.category}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${cm.color}`}>{cm.label}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 font-mono">{part.shopId}</td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-mono font-semibold ${isLow ? "text-red-400" : "text-gray-100"}`}>
                          {part.stockQty} {part.unit}
                        </span>
                        {isLow && <span className="ml-1 text-xs text-red-500">⚠</span>}
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-yellow-600">
                        {part.reservedQty > 0 ? part.reservedQty : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-green-400">
                        {part.unitPrice.toLocaleString()} ฿
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/parts/${part.id}`}
                          className="text-xs text-blue-400 hover:text-blue-300 whitespace-nowrap">
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
