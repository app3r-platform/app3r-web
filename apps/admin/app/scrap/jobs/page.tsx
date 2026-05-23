"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isAuthenticated } from "@/lib/auth";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/sidebar";
import type { ScrapJob, ScrapJobOption } from "@/lib/types";

/* S7/S9/S10/S12 — extended job fields (mock patch) */
interface ScrapJobExtended extends ScrapJob {
  cancelled_reason?: "weeer_withdraw" | "weeu_stop" | "force_majeure" | null;  /* S7/S10 */
  no_show_flag?:     boolean;   /* S9 */
  source_repair_job_id?: string | null;  /* S12 */
}

const STATUS_META: Record<ScrapJob["status"], { label: string; color: string }> = {
  pending_decision: { label: "รอตัดสินใจ", color: "bg-yellow-50 text-yellow-700" },
  in_progress:      { label: "กำลังดำเนิน", color: "bg-blue-50 text-blue-700" },
  completed:        { label: "เสร็จแล้ว",   color: "bg-green-50 text-green-700" },
  cancelled:        { label: "ยกเลิก",      color: "bg-gray-100 text-gray-500" },
};

const OPTION_LABEL: Record<ScrapJobOption, string> = {
  resell_parts:    "แยกอะไหล่ขาย",
  repair_and_sell: "ซ่อมแล้วขาย",
  resell_as_scrap: "ขายเป็นซาก",
  dispose:         "ทิ้ง/E-Waste",
};

const PAGE_SIZE = 20;

interface ScrapJobListResponse {
  results: ScrapJobExtended[];
  count: number;
}

/* S9 — no-show filter */
const CANCEL_REASON_LABEL: Record<string, string> = {
  weeer_withdraw: "S7: WeeeR ถอน",
  weeu_stop:      "S10: WeeeU ยุติ",
  force_majeure:  "สุดวิสัย",
};

function EmptyState({ message }: { message: string }) {
  return (
    <tr>
      <td colSpan={9} className="px-6 py-10 text-center text-gray-500">{message}</td>
    </tr>
  );
}

export default function ScrapJobsPage() {
  const router = useRouter();
  const [items, setItems] = useState<ScrapJobExtended[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDecision, setFilterDecision] = useState("");
  const [filterBuyer, setFilterBuyer] = useState("");
  const [filterNoShow, setFilterNoShow] = useState(false);   /* S9 */
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
        ...(filterNoShow   && { no_show: "true" }),   /* S9 */
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
  }, [page, filterStatus, filterDecision, filterBuyer, filterNoShow]);

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login"); return; }
    fetchData();
  }, [router, fetchData]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  function clearFilters() {
    setFilterStatus(""); setFilterDecision(""); setFilterBuyer("");
    setFilterNoShow(false); setPage(1);
  }

  const hasFilters = filterStatus || filterDecision || filterBuyer || filterNoShow;

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar />
      <main className="flex-1 p-8 space-y-6 max-w-7xl">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">🔨 Scrap Jobs</h1>
            <p className="text-gray-500 text-sm mt-1">
              Pipeline การตัดสินใจซาก — filter สถานะ / ตัวเลือก / ผู้ซื้อ
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/scrap/listings"
              className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg transition-colors">
              ♻️ Listings →
            </Link>
            <Link href="/scrap/certificates"
              className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg transition-colors">
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
                  : "border-gray-300 text-gray-500 hover:text-gray-700"
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
            className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 w-44 focus:outline-none focus:border-admin-primary">
            <option value="">ทุกตัวเลือก</option>
            <option value="resell_parts">แยกอะไหล่ขาย</option>
            <option value="repair_and_sell">ซ่อมแล้วขาย</option>
            <option value="resell_as_scrap">ขายเป็นซาก</option>
            <option value="dispose">ทิ้ง/E-Waste</option>
          </select>
          <input type="text" placeholder="Buyer ID"
            value={filterBuyer} onChange={e => { setFilterBuyer(e.target.value); setPage(1); }}
            className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 placeholder-gray-400 w-44 focus:outline-none focus:border-admin-primary"
          />
          {/* S9 — no-show filter */}
          <button
            onClick={() => { setFilterNoShow(v => !v); setPage(1); }}
            className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
              filterNoShow
                ? "bg-yellow-50 text-yellow-700 border-yellow-300"
                : "bg-white text-gray-500 border-gray-300 hover:text-gray-700"
            }`}>
            🚫 No-show
          </button>
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
            <div className="px-6 py-8 text-red-600">ระบบ Scrap Jobs กำลังพัฒนา — {error}</div>
          ) : loading ? (
            <p className="px-6 py-8 text-gray-500">กำลังโหลด...</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-left border-b border-gray-200">
                  <th className="px-4 py-3">Job ID</th>
                  <th className="px-4 py-3">Scrap Item</th>
                  <th className="px-4 py-3">Buyer</th>
                  <th className="px-4 py-3">ตัวเลือก</th>
                  <th className="px-4 py-3">สถานะ</th>
                  <th className="px-4 py-3">ตัดสินใจเมื่อ</th>
                  <th className="px-4 py-3">Flags</th>
                  <th className="px-4 py-3">Cert</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.length === 0 ? (
                  <EmptyState message="ยังไม่มี Scrap Jobs" />
                ) : items.map(job => {
                  const sm = STATUS_META[job.status];
                  return (
                    <tr key={job.id} className={`hover:bg-gray-100/40 ${job.no_show_flag ? "bg-yellow-50/30" : ""}`}>
                      <td className="px-4 py-3 font-mono text-xs text-admin-primary max-w-[120px] truncate">{job.id}</td>
                      <td className="px-4 py-3">
                        <Link href={`/scrap/listings/${job.scrapItemId}`}
                          className="text-xs font-mono text-gray-700 hover:text-blue-400">
                          {job.scrapItemId.slice(0, 8)}…
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-gray-500">{job.buyerId}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-admin-primary">{OPTION_LABEL[job.decision]}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${sm.color}`}>{sm.label}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {job.decisionAt ? new Date(job.decisionAt).toLocaleDateString("th-TH") : "—"}
                      </td>
                      {/* Flags — S7/S9/S10/S12 */}
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1 min-w-[80px]">
                          {job.no_show_flag && (
                            <span className="inline-flex items-center text-xs px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-800 whitespace-nowrap">
                              🚫 No-show
                            </span>
                          )}
                          {job.cancelled_reason && (
                            <span className={`inline-flex items-center text-xs px-1.5 py-0.5 rounded-full whitespace-nowrap ${
                              job.cancelled_reason === "weeer_withdraw"
                                ? "bg-orange-100 text-orange-700"
                                : job.cancelled_reason === "weeu_stop"
                                ? "bg-red-100 text-red-700"
                                : "bg-gray-100 text-gray-600"
                            }`}>
                              ❌ {CANCEL_REASON_LABEL[job.cancelled_reason]}
                            </span>
                          )}
                          {job.source_repair_job_id && (
                            <Link href={`/repair/jobs/${job.source_repair_job_id}`}
                              className="inline-flex items-center text-xs px-1.5 py-0.5 rounded-full bg-orange-50 text-orange-700 hover:bg-orange-100 whitespace-nowrap transition-colors">
                              🔧 →Repair
                            </Link>
                          )}
                          {!job.no_show_flag && !job.cancelled_reason && !job.source_repair_job_id && (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {job.certificateId ? (
                          <Link href={`/scrap/certificates/${job.certificateId}`}
                            className="text-xs text-admin-primary hover:text-admin-dark">📜</Link>
                        ) : (
                          <span className="text-xs text-gray-600">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/scrap/jobs/${job.id}`}
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
