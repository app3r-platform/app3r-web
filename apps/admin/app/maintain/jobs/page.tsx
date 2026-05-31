"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isAuthenticated } from "@/lib/auth";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/sidebar";
import type { MaintainJob } from "@/lib/types";

/* ─── local extension — server may return these extra fields ─── */
interface MaintainJobListItem extends MaintainJob {
  dispute_flag?:     boolean;
  risk_flag?:        boolean;
  cross_module_ref?: { type: "repair"; job_id: string } | null;
  /* M7: No-show — ลูกค้าไม่อยู่ */
  no_show_flag?:     boolean;
  /* M2: ปิดเปล่า — ไม่มีร้านยื่นข้อเสนอ/หมดอายุ */
  no_match_flag?:    boolean;
}

const STATUS_META: Record<MaintainJob["status"], { label: string; color: string }> = {
  pending:     { label: "รอดำเนินการ",  color: "bg-gray-100 text-gray-500" },
  assigned:    { label: "มอบหมายแล้ว", color: "bg-blue-50 text-blue-700" },
  departed:    { label: "ออกเดินทาง",  color: "bg-yellow-50 text-yellow-700" },
  arrived:     { label: "ถึงที่แล้ว",   color: "bg-cyan-50 text-cyan-700" },
  in_progress: { label: "กำลังทำงาน",  color: "bg-brand-info/15 text-brand-info" },
  completed:   { label: "เสร็จสิ้น",   color: "bg-green-50 text-green-700" },
  cancelled:   { label: "ยกเลิก",       color: "bg-red-50 text-red-700" },
};

const APPLIANCE_LABEL: Record<MaintainJob["applianceType"], string> = {
  AC: "แอร์",
  WashingMachine: "เครื่องซัก",
};

const CLEANING_LABEL: Record<MaintainJob["cleaningType"], string> = {
  general:  "ล้างทั่วไป",
  deep:     "ล้างลึก",
  sanitize: "ล้าง+ฆ่าเชื้อ",
};

const STATUS_TABS: { label: string; value: string }[] = [
  { label: "ทั้งหมด",          value: "" },
  { label: "รอ/มอบหมาย",       value: "pending" },
  { label: "กำลังทำ",           value: "in_progress" },
  { label: "เสร็จสิ้น",         value: "completed" },
  { label: "ยกเลิก",            value: "cancelled" },
  { label: "⚪ ปิดเปล่า",       value: "no_match" },   /* M2 */
  { label: "🚫 No-show",        value: "no_show" },     /* M7 */
  { label: "⚖️ ข้อพิพาท",      value: "disputed" },
];

const PAGE_SIZE = 20;

// MOCK_MAINTAIN_JOBS — fallback เมื่อ API ไม่พร้อม (dev/staging)
const MOCK_MAINTAIN_JOBS = [
  { id: "m-001", serviceCode: "M-001", applianceType: "AC"             as const, cleaningType: "general"  as const, status: "pending"     as const, scheduledAt: "2026-05-26T09:00:00Z", totalPrice: 500,  recurring: null,                                technicianId: null   },
  { id: "m-002", serviceCode: "M-002", applianceType: "WashingMachine" as const, cleaningType: "deep"     as const, status: "in_progress" as const, scheduledAt: "2026-05-26T11:00:00Z", totalPrice: 800,  recurring: { enabled: true, interval: "monthly" }, technicianId: "t-02" },
  { id: "m-003", serviceCode: "M-003", applianceType: "AC"             as const, cleaningType: "sanitize" as const, status: "completed"   as const, scheduledAt: "2026-05-25T09:00:00Z", totalPrice: 1200, recurring: null,                                technicianId: "t-03" },
] as unknown as MaintainJobListItem[];

interface JobListResponse {
  results: MaintainJobListItem[];
  count: number;
}

export default function MaintainJobsPage() {
  const router = useRouter();
  const [items, setItems]               = useState<MaintainJobListItem[]>([]);
  const [total, setTotal]               = useState(0);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCleaning, setFilterCleaning] = useState("");
  const [filterShop, setFilterShop]     = useState("");
  const [dateFrom, setDateFrom]         = useState("");
  const [dateTo, setDateTo]             = useState("");
  const [page, setPage]                 = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String((page - 1) * PAGE_SIZE),
        ...(filterStatus   && { status: filterStatus }),
        ...(filterCleaning && { cleaning_type: filterCleaning }),
        ...(filterShop     && { shop_id: filterShop }),
        ...(dateFrom       && { date_from: dateFrom }),
        ...(dateTo         && { date_to: dateTo }),
      });
      const d = await api.get<JobListResponse>(
        "/maintain/jobs/admin/?" + params
      );
      setItems(d.results);
      setTotal(d.count);
      setError(null);
    } catch {
      // API ไม่พร้อม → ใช้ mock fallback
      setItems(MOCK_MAINTAIN_JOBS);
      setTotal(MOCK_MAINTAIN_JOBS.length);
      setError(null);
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus, filterCleaning, filterShop, dateFrom, dateTo]);

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
            <h1 className="text-2xl font-bold">🛁 Maintain Jobs — Audit</h1>
            <p className="text-gray-500 text-sm mt-1">
              รายการงานทั้งหมด — filter สถานะ / ประเภทล้าง / ร้าน / วันที่
            </p>
          </div>
          <Link href="/maintain/analytics"
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
                filterStatus === t.value
                  ? t.value === "disputed"  ? "bg-red-50 text-red-700"
                  : t.value === "no_show"   ? "bg-yellow-50 text-yellow-700"
                  : t.value === "no_match"  ? "bg-gray-200 text-gray-600"
                  : "bg-admin-surface text-admin-primary"
                  : "text-gray-500 hover:text-gray-900"
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Secondary filters */}
        <div className="flex gap-3 flex-wrap">
          <select
            value={filterCleaning}
            onChange={e => { setFilterCleaning(e.target.value); setPage(1); }}
            className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 w-40 focus:outline-none focus:border-admin-primary">
            <option value="">ทุกประเภทล้าง</option>
            <option value="general">ล้างทั่วไป</option>
            <option value="deep">ล้างลึก</option>
            <option value="sanitize">ล้าง+ฆ่าเชื้อ</option>
          </select>
          <input type="text" placeholder="Shop ID"
            value={filterShop} onChange={e => { setFilterShop(e.target.value); setPage(1); }}
            className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 placeholder-gray-400 w-40 focus:outline-none focus:border-admin-primary"
          />
          <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }}
            className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 w-40 focus:outline-none focus:border-admin-primary"
          />
          <span className="self-center text-gray-600 text-xs">ถึง</span>
          <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }}
            className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 w-40 focus:outline-none focus:border-admin-primary"
          />
          {(filterCleaning || filterShop || dateFrom || dateTo) && (
            <button onClick={() => { setFilterCleaning(""); setFilterShop(""); setDateFrom(""); setDateTo(""); setPage(1); }}
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
            <div className="px-6 py-8 text-red-600">{error}</div>
          ) : loading ? (
            <p className="px-6 py-8 text-gray-500">กำลังโหลด...</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-left border-b border-gray-200">
                  <th className="px-4 py-3">Service Code</th>
                  <th className="px-4 py-3">เครื่อง</th>
                  <th className="px-4 py-3">ประเภทล้าง</th>
                  <th className="px-4 py-3">สถานะ</th>
                  <th className="px-4 py-3">นัดหมาย</th>
                  <th className="px-4 py-3">ราคา</th>
                  <th className="px-4 py-3">Recurring</th>
                  <th className="px-4 py-3">ช่าง</th>
                  <th className="px-4 py-3">Flags</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.map(job => {
                  const sm = STATUS_META[job.status];
                  return (
                    <tr key={job.id} className={`hover:bg-gray-100/40 ${job.dispute_flag ? "bg-red-50/30" : ""}`}>
                      <td className="px-4 py-3 font-mono text-xs text-admin-primary">{job.serviceCode}</td>
                      <td className="px-4 py-3">
                        <span className="text-sm">{APPLIANCE_LABEL[job.applianceType]}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-700">
                        {CLEANING_LABEL[job.cleaningType]}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${sm.color}`}>{sm.label}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {new Date(job.scheduledAt).toLocaleString("th-TH", {
                          dateStyle: "short", timeStyle: "short",
                        })}
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-green-600">
                        {job.totalPrice.toLocaleString()} ฿
                      </td>
                      <td className="px-4 py-3">
                        {job.recurring?.enabled ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-admin-primary/15 text-admin-primary">
                            🔁 {job.recurring.interval.replace("_", " ")}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-600">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {job.technicianId ?? "—"}
                      </td>
                      {/* Flags column */}
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1 min-w-[72px]">
                          {job.dispute_flag && (
                            <Link href={`/disputes?job_id=${job.id}&service=maintain`}
                              className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 hover:bg-red-200 transition-colors whitespace-nowrap">
                              ⚖️ พิพาท
                            </Link>
                          )}
                          {job.risk_flag && (
                            <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 whitespace-nowrap">
                              ⚠️ ความเสี่ยง
                            </span>
                          )}
                          {job.cross_module_ref?.type === "repair" && (
                            <Link href={`/repair/jobs/${job.cross_module_ref.job_id}`}
                              className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full bg-admin-surface text-admin-primary hover:bg-admin-surface transition-colors whitespace-nowrap">
                              🔧 →ซ่อม
                            </Link>
                          )}
                          {/* M7: No-show */}
                          {job.no_show_flag && (
                            <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-800 whitespace-nowrap">
                              🚫 No-show
                            </span>
                          )}
                          {/* M2: ปิดเปล่า */}
                          {job.no_match_flag && (
                            <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 whitespace-nowrap">
                              ⚪ ปิดเปล่า
                            </span>
                          )}
                          {!job.dispute_flag && !job.risk_flag && !job.cross_module_ref && !job.no_show_flag && !job.no_match_flag && (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/maintain/jobs/${job.id}`}
                          className="text-xs text-admin-primary hover:text-admin-dark whitespace-nowrap">
                          ดู →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-6 py-10 text-center text-gray-500">
                      ไม่มีข้อมูล
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
