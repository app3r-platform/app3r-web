"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { isAuthenticated } from "@/lib/auth";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/sidebar";
import type { StockMovement } from "@/lib/types";

const TYPE_META: Record<string, { label: string; color: string }> = {
  STOCK_IN:         { label: "รับเข้า",    color: "bg-green-900/50 text-green-400" },
  STOCK_OUT:        { label: "จ่ายออก",    color: "bg-red-900/50 text-red-400" },
  STOCK_ADJUSTMENT: { label: "ปรับสต็อก", color: "bg-yellow-900/50 text-yellow-400" },
};

const REASON_LABEL: Record<string, string> = {
  purchase:               "ซื้อเข้า",
  receive_from_disassembly: "รับจากซาก",
  sell:                   "ขาย",
  use_for_repair:         "ใช้ซ่อม",
  use_for_maintain:       "ใช้ล้าง",
  scrap:                  "ทิ้ง",
  manual:                 "Manual",
};

const TYPE_TABS = [
  { label: "ทั้งหมด",    value: "" },
  { label: "รับเข้า",    value: "STOCK_IN" },
  { label: "จ่ายออก",    value: "STOCK_OUT" },
  { label: "ปรับสต็อก", value: "STOCK_ADJUSTMENT" },
];

const PAGE_SIZE = 25;

interface MovementsListResponse {
  results: StockMovement[];
  count: number;
}

function MovementsInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<StockMovement[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState("");
  const [filterShop, setFilterShop] = useState("");
  const [filterPartId, setFilterPartId] = useState(searchParams.get("part_id") ?? "");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [exportLoading, setExportLoading] = useState(false);

  const buildParams = useCallback((extraParams?: Record<string, string>) => {
    return new URLSearchParams({
      limit: String(PAGE_SIZE),
      offset: String((page - 1) * PAGE_SIZE),
      ...(filterType   && { type: filterType }),
      ...(filterShop   && { shop_id: filterShop }),
      ...(filterPartId && { part_id: filterPartId }),
      ...(dateFrom     && { date_from: dateFrom }),
      ...(dateTo       && { date_to: dateTo }),
      ...extraParams,
    });
  }, [page, filterType, filterShop, filterPartId, dateFrom, dateTo]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const d = await api.get<MovementsListResponse>(
        "/admin/parts/movements/?" + buildParams()
      );
      setItems(d.results);
      setTotal(d.count);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login"); return; }
    fetchData();
  }, [router, fetchData]);

  async function handleExportCsv() {
    setExportLoading(true);
    try {
      const params = buildParams({ limit: "9999", offset: "0" });
      const d = await api.get<MovementsListResponse>("/admin/parts/movements/?" + params);
      const rows = d.results;
      const header = "id,partId,type,qty,reason,refId,note,performedBy,performedAt,balanceAfter";
      const csvRows = rows.map(r =>
        [r.id, r.partId, r.type, r.qty, r.reason, r.refId ?? "", r.note ?? "", r.performedBy, r.performedAt, r.balanceAfter]
          .map(v => `"${String(v).replace(/"/g, '""')}"`)
          .join(",")
      );
      const csv = [header, ...csvRows].join("\n");
      const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `parts-movements-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("Export ล้มเหลว: " + (e as Error).message);
    } finally {
      setExportLoading(false);
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const hasFilters = filterShop || filterPartId || dateFrom || dateTo;

  return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      <Sidebar />
      <main className="flex-1 p-8 space-y-6 max-w-7xl">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">📦 Stock Movements</h1>
            <p className="text-gray-400 text-sm mt-1">
              ประวัติการเคลื่อนไหวสต็อกข้าม shop — filter ประเภท / ร้าน / อะไหล่ / วันที่
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleExportCsv} disabled={exportLoading}
              className="px-3 py-1.5 text-xs bg-green-800 hover:bg-green-700 disabled:bg-gray-700 disabled:text-gray-500 border border-green-700 disabled:border-gray-600 text-white rounded-lg transition-colors">
              {exportLoading ? "กำลัง export..." : "⬇ Export CSV"}
            </button>
            <Link href="/parts"
              className="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors">
              🔩 Inventory →
            </Link>
          </div>
        </div>

        {/* Type tabs */}
        <div className="flex gap-1 bg-gray-900 rounded-xl p-1 border border-gray-800 w-fit flex-wrap">
          {TYPE_TABS.map(t => (
            <button key={t.value}
              onClick={() => { setFilterType(t.value); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                filterType === t.value ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Secondary filters */}
        <div className="flex gap-3 flex-wrap">
          <input type="text" placeholder="Shop ID"
            value={filterShop} onChange={e => { setFilterShop(e.target.value); setPage(1); }}
            className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-600 w-40 focus:outline-none focus:border-blue-500"
          />
          <input type="text" placeholder="Part ID"
            value={filterPartId} onChange={e => { setFilterPartId(e.target.value); setPage(1); }}
            className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-600 w-44 focus:outline-none focus:border-blue-500"
          />
          <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }}
            className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white w-40 focus:outline-none focus:border-blue-500"
          />
          <span className="self-center text-gray-600 text-xs">ถึง</span>
          <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }}
            className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white w-40 focus:outline-none focus:border-blue-500"
          />
          {hasFilters && (
            <button onClick={() => { setFilterShop(""); setFilterPartId(""); setDateFrom(""); setDateTo(""); setPage(1); }}
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
            <div className="px-6 py-8 text-red-400">ระบบอะไหล่กำลังพัฒนา — {error}</div>
          ) : loading ? (
            <p className="px-6 py-8 text-gray-500">กำลังโหลด...</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-left border-b border-gray-800">
                  <th className="px-4 py-3">ประเภท</th>
                  <th className="px-4 py-3">Part ID</th>
                  <th className="px-4 py-3">จำนวน</th>
                  <th className="px-4 py-3">เหตุผล</th>
                  <th className="px-4 py-3">คงเหลือหลัง</th>
                  <th className="px-4 py-3">Ref</th>
                  <th className="px-4 py-3">หมายเหตุ</th>
                  <th className="px-4 py-3">ผู้ดำเนินการ</th>
                  <th className="px-4 py-3">วันที่</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {items.length === 0 ? (
                  <tr><td colSpan={10} className="px-6 py-10 text-center text-gray-500">ยังไม่มีข้อมูล movement</td></tr>
                ) : items.map(m => {
                  const tm = TYPE_META[m.type] ?? { label: m.type, color: "bg-gray-800 text-gray-300" };
                  const qtySign = m.type === "STOCK_IN" ? "+" : m.type === "STOCK_OUT" ? "-" : "±";
                  const qtyColor = m.type === "STOCK_IN" ? "text-green-400" : m.type === "STOCK_OUT" ? "text-red-400" : "text-yellow-400";
                  return (
                    <tr key={m.id} className="hover:bg-gray-800/40">
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${tm.color}`}>{tm.label}</span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-blue-400">
                        <Link href={`/parts/${m.partId}`} className="hover:text-blue-300">
                          {m.partId.slice(0, 8)}…
                        </Link>
                      </td>
                      <td className={`px-4 py-3 font-mono font-semibold ${qtyColor}`}>
                        {qtySign}{m.qty}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-300">
                        {REASON_LABEL[m.reason] ?? m.reason}
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-gray-300">{m.balanceAfter}</td>
                      <td className="px-4 py-3 text-xs font-mono text-gray-500">
                        {m.refId ? (
                          <span className="text-blue-500">{m.refId.slice(0, 8)}…</span>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 max-w-32 truncate">
                        {m.note ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">{m.performedBy}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {new Date(m.performedAt).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" })}
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/parts/movements/${m.id}`}
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

export default function MovementsPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen bg-gray-950 text-white">
        <Sidebar /><main className="flex-1 p-8"><p className="text-gray-500">กำลังโหลด...</p></main>
      </div>
    }>
      <MovementsInner />
    </Suspense>
  );
}
