"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isAuthenticated } from "@/lib/auth";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/sidebar";
import type { ScrapItem } from "@/lib/types";

const STATUS_META: Record<ScrapItem["status"], { label: string; color: string }> = {
  available: { label: "ขายได้",   color: "bg-green-900/50 text-green-400" },
  sold:      { label: "ขายแล้ว",  color: "bg-blue-900/50 text-blue-300" },
  removed:   { label: "ลบแล้ว",   color: "bg-gray-800 text-gray-500" },
};

const GRADE_META: Record<ScrapItem["conditionGrade"], { label: string; color: string }> = {
  grade_A: { label: "A", color: "bg-green-900/50 text-green-400" },
  grade_B: { label: "B", color: "bg-yellow-900/50 text-yellow-400" },
  grade_C: { label: "C", color: "bg-red-900/50 text-red-400" },
};

const PAGE_SIZE = 20;

interface ScrapListResponse {
  results: ScrapItem[];
  count: number;
}

function EmptyState({ message }: { message: string }) {
  return (
    <tr>
      <td colSpan={8} className="px-6 py-10 text-center text-gray-500">{message}</td>
    </tr>
  );
}

export default function ScrapListingsPage() {
  const router = useRouter();
  const [items, setItems] = useState<ScrapItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterGrade, setFilterGrade] = useState("");
  const [filterSeller, setFilterSeller] = useState("");
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String((page - 1) * PAGE_SIZE),
        ...(filterStatus && { status: filterStatus }),
        ...(filterGrade  && { condition_grade: filterGrade }),
        ...(filterSeller && { seller_id: filterSeller }),
      });
      const d = await api.get<ScrapListResponse>("/admin/scrap/items/?" + params);
      setItems(d.results);
      setTotal(d.count);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus, filterGrade, filterSeller]);

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login"); return; }
    fetchData();
  }, [router, fetchData]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  function clearFilters() {
    setFilterStatus(""); setFilterGrade(""); setFilterSeller(""); setPage(1);
  }

  const hasFilters = filterStatus || filterGrade || filterSeller;

  return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      <Sidebar />
      <main className="flex-1 p-8 space-y-6 max-w-7xl">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">♻️ Scrap Listings</h1>
            <p className="text-gray-400 text-sm mt-1">
              รายการซากเครื่องใช้ไฟฟ้า — filter สถานะ / เกรด / ผู้ขาย
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/scrap/jobs"
              className="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors">
              🔨 Jobs →
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap items-center">
          <select
            value={filterStatus}
            onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
            className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white w-36 focus:outline-none focus:border-blue-500">
            <option value="">ทุกสถานะ</option>
            <option value="available">ขายได้</option>
            <option value="sold">ขายแล้ว</option>
            <option value="removed">ลบแล้ว</option>
          </select>
          <select
            value={filterGrade}
            onChange={e => { setFilterGrade(e.target.value); setPage(1); }}
            className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white w-36 focus:outline-none focus:border-blue-500">
            <option value="">ทุกเกรด</option>
            <option value="grade_A">Grade A</option>
            <option value="grade_B">Grade B</option>
            <option value="grade_C">Grade C</option>
          </select>
          <input type="text" placeholder="Seller ID"
            value={filterSeller} onChange={e => { setFilterSeller(e.target.value); setPage(1); }}
            className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-600 w-44 focus:outline-none focus:border-blue-500"
          />
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
            <div className="px-6 py-8 text-red-400">ระบบ Scrap กำลังพัฒนา — {error}</div>
          ) : loading ? (
            <p className="px-6 py-8 text-gray-500">กำลังโหลด...</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-left border-b border-gray-800">
                  <th className="px-4 py-3">Seller</th>
                  <th className="px-4 py-3">รายละเอียด</th>
                  <th className="px-4 py-3">เกรด</th>
                  <th className="px-4 py-3">Part ที่ใช้ได้</th>
                  <th className="px-4 py-3">ราคา</th>
                  <th className="px-4 py-3">สถานะ</th>
                  <th className="px-4 py-3">วันที่สร้าง</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {items.length === 0 ? (
                  <EmptyState message="ยังไม่มีรายการซาก" />
                ) : items.map(item => {
                  const sm = STATUS_META[item.status];
                  const gm = GRADE_META[item.conditionGrade];
                  return (
                    <tr key={item.id} className="hover:bg-gray-800/40">
                      <td className="px-4 py-3 text-xs font-mono text-gray-400">{item.sellerId}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {item.photos[0] && (
                            <img src={item.photos[0]} alt="" className="w-8 h-8 object-cover rounded bg-gray-800" />
                          )}
                          <span className="text-sm text-gray-100 max-w-xs truncate">{item.description}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${gm.color}`}>{gm.label}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {item.workingParts.length > 0
                          ? item.workingParts.slice(0, 3).join(", ") + (item.workingParts.length > 3 ? "…" : "")
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-green-400">
                        {item.price.toLocaleString()} ฿
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${sm.color}`}>{sm.label}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {new Date(item.createdAt).toLocaleDateString("th-TH")}
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/scrap/listings/${item.id}`}
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
