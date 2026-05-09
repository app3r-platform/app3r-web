"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isAuthenticated } from "@/lib/auth";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/sidebar";
import type { ScrapJob, ScrapJobOption } from "@/lib/types";

const STATUS_META: Record<ScrapJob["status"], { label: string; color: string }> = {
  pending_decision: { label: "รอตัดสินใจ", color: "bg-yellow-900/50 text-yellow-400" },
  in_progress:      { label: "กำลังดำเนิน", color: "bg-blue-900/50 text-blue-400" },
  completed:        { label: "เสร็จแล้ว",   color: "bg-green-900/50 text-green-400" },
  cancelled:        { label: "ยกเลิก",      color: "bg-gray-800 text-gray-500" },
};

const OPTION_LABEL: Record<ScrapJobOption, string> = {
  resell_parts:    "แยกอะไหล่ขาย",
  repair_and_sell: "ซ่อมแล้วขาย",
  resell_as_scrap: "ขายเป็นซาก",
  dispose:         "ทิ้ง/E-Waste",
};

const PAGE_SIZE = 20;

interface ScrapJobListResponse {
  results: ScrapJob[];
  count: number;
}

function EmptyState({ message }: { message: string }) {
  return (
    <tr>
      <td colSpan={8} className="px-6 py-10 text-center text-gray-500">{message}</td>
    </tr>
  );
}

export default function ScrapJobsPage() {
  const router = useRouter();
  const [items, setItems] = useState<ScrapJob[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDecision, setFilterDecision] = useState("");
  const [filterBuyer, setFilterBuyer] = useState("");
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String((page - 1) * PAGE_SIZE),
        ...(filterStatus   && { status: filterStatus }),
        ...(filterDecision && { decision: filterDecision }),
        ...(filterBuyer    && { buyer_id: filterBuyer }),
      });
      const d = await api.get<ScrapJobListResponse>("/admin/scrap/jobs/?" + params);
      setItems(d.results);
      setTotal(d.count);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus, filterDecision, filterBuyer]);

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login"); return; }
    fetchData();
  }, [router, fetchData]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  function clearFilters() {
    setFilterStatus(""); setFilterDecision(""); setFilterBuyer(""); setPage(1);
  }

  const hasFilters = filterStatus || filterDecision || filterBuyer;

  return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      <Sidebar />
      <main className="flex-1 p-8 space-y-6 max-w-7xl">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">🔨 Scrap Jobs</h1>
            <p className="text-gray-400 text-sm mt-1">
              Pipeline การตัดสินใจซาก — filter สถานะ / ตัวเลือก / ผู้ซื้อ
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/scrap/listings"
              className="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors">
              ♻️ Listings →
            </Link>
            <Link href="/scrap/certificates"
              className="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors">
              📜 Certs →
            </Link>
          </div>
        </div>

        {/* Status summary pills */}
        <div className="flex gap-2 flex-wrap">
          {(Object.entries(STATUS_META) as [ScrapJob["status"], { label: string; color: string }][]).map(([key, meta]) => (
            <button key={key}
              onClick={() => { setFilterStatus(filterStatus === key ? "" : key); setPage(1); }}
              className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                filterStatus === key
                  ? meta.color + " border-current"
                  : "border-gray-700 text-gray-500 hover:text-gray-300"
              }`}>
              {meta.label}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap items-center">
          <select
            value={filterDecision}
            onChange={e => { setFilterDecision(e.target.value); setPage(1); }}
            className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white w-44 focus:outline-none focus:border-blue-500">
            <option value="">ทุกตัวเลือก</option>
            <option value="resell_parts">แยกอะไหล่ขาย</option>
            <option value="repair_and_sell">ซ่อมแล้วขาย</option>
            <option value="resell_as_scrap">ขายเป็นซาก</option>
            <option value="dispose">ทิ้ง/E-Waste</option>
          </select>
          <input type="text" placeholder="Buyer ID"
            value={filterBuyer} onChange={e => { setFilterBuyer(e.target.value); setPage(1); }}
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
            <div className="px-6 py-8 text-red-400">ระบบ Scrap Jobs กำลังพัฒนา — {error}</div>
          ) : loading ? (
            <p className="px-6 py-8 text-gray-500">กำลังโหลด...</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-left border-b border-gray-800">
                  <th className="px-4 py-3">Job ID</th>
                  <th className="px-4 py-3">Scrap Item</th>
                  <th className="px-4 py-3">Buyer</th>
                  <th className="px-4 py-3">ตัวเลือก</th>
                  <th className="px-4 py-3">สถานะ</th>
                  <th className="px-4 py-3">ตัดสินใจเมื่อ</th>
                  <th className="px-4 py-3">Cert</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {items.length === 0 ? (
                  <EmptyState message="ยังไม่มี Scrap Jobs" />
                ) : items.map(job => {
                  const sm = STATUS_META[job.status];
                  return (
                    <tr key={job.id} className="hover:bg-gray-800/40">
                      <td className="px-4 py-3 font-mono text-xs text-blue-400 max-w-[120px] truncate">{job.id}</td>
                      <td className="px-4 py-3">
                        <Link href={`/scrap/listings/${job.scrapItemId}`}
                          className="text-xs font-mono text-gray-300 hover:text-blue-400">
                          {job.scrapItemId.slice(0, 8)}…
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-gray-400">{job.buyerId}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-purple-300">{OPTION_LABEL[job.decision]}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${sm.color}`}>{sm.label}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {job.decisionAt ? new Date(job.decisionAt).toLocaleDateString("th-TH") : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {job.certificateId ? (
                          <Link href={`/scrap/certificates/${job.certificateId}`}
                            className="text-xs text-blue-400 hover:text-blue-300">📜</Link>
                        ) : (
                          <span className="text-xs text-gray-600">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/scrap/jobs/${job.id}`}
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
