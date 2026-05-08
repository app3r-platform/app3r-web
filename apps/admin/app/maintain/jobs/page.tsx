"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isAuthenticated } from "@/lib/auth";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/sidebar";
import type { MaintainJob } from "@/lib/types";

const STATUS_META: Record<MaintainJob["status"], { label: string; color: string }> = {
  pending:     { label: "รอดำเนินการ",  color: "bg-gray-800 text-gray-400" },
  assigned:    { label: "มอบหมายแล้ว", color: "bg-blue-900/50 text-blue-300" },
  departed:    { label: "ออกเดินทาง",  color: "bg-yellow-900/50 text-yellow-400" },
  arrived:     { label: "ถึงที่แล้ว",   color: "bg-cyan-900/50 text-cyan-300" },
  in_progress: { label: "กำลังทำงาน",  color: "bg-indigo-900/50 text-indigo-300" },
  completed:   { label: "เสร็จสิ้น",   color: "bg-green-900/50 text-green-400" },
  cancelled:   { label: "ยกเลิก",       color: "bg-red-900/50 text-red-400" },
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
  { label: "ทั้งหมด",    value: "" },
  { label: "รอ/มอบหมาย", value: "pending" },
  { label: "กำลังทำ",    value: "in_progress" },
  { label: "เสร็จสิ้น",  value: "completed" },
  { label: "ยกเลิก",     value: "cancelled" },
];

const PAGE_SIZE = 20;

interface JobListResponse {
  results: MaintainJob[];
  count: number;
}

export default function MaintainJobsPage() {
  const router = useRouter();
  const [items, setItems] = useState<MaintainJob[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCleaning, setFilterCleaning] = useState("");
  const [filterShop, setFilterShop] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo]     = useState("");
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String((page - 1) * PAGE_SIZE),
        ...(filterStatus  && { status: filterStatus }),
        ...(filterCleaning && { cleaning_type: filterCleaning }),
        ...(filterShop    && { shop_id: filterShop }),
        ...(dateFrom      && { date_from: dateFrom }),
        ...(dateTo        && { date_to: dateTo }),
      });
      const d = await api.get<JobListResponse>(
        "/maintain/jobs/admin/?" + params
      );
      setItems(d.results);
      setTotal(d.count);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
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
    <div className="flex min-h-screen bg-gray-950 text-white">
      <Sidebar />
      <main className="flex-1 p-8 space-y-6 max-w-7xl">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">🛁 Maintain Jobs — Audit</h1>
            <p className="text-gray-400 text-sm mt-1">
              รายการงานทั้งหมด — filter สถานะ / ประเภทล้าง / ร้าน / วันที่
            </p>
          </div>
          <Link href="/maintain/analytics"
            className="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors">
            📊 Analytics →
          </Link>
        </div>

        {/* Status tabs */}
        <div className="flex gap-1 bg-gray-900 rounded-xl p-1 border border-gray-800 w-fit flex-wrap">
          {STATUS_TABS.map(t => (
            <button key={t.value}
              onClick={() => { setFilterStatus(t.value); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                filterStatus === t.value ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
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
            className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white w-40 focus:outline-none focus:border-blue-500">
            <option value="">ทุกประเภทล้าง</option>
            <option value="general">ล้างทั่วไป</option>
            <option value="deep">ล้างลึก</option>
            <option value="sanitize">ล้าง+ฆ่าเชื้อ</option>
          </select>
          <input type="text" placeholder="Shop ID"
            value={filterShop} onChange={e => { setFilterShop(e.target.value); setPage(1); }}
            className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-600 w-40 focus:outline-none focus:border-blue-500"
          />
          <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }}
            className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white w-40 focus:outline-none focus:border-blue-500"
          />
          <span className="self-center text-gray-600 text-xs">ถึง</span>
          <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }}
            className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white w-40 focus:outline-none focus:border-blue-500"
          />
          {(filterCleaning || filterShop || dateFrom || dateTo) && (
            <button onClick={() => { setFilterCleaning(""); setFilterShop(""); setDateFrom(""); setDateTo(""); setPage(1); }}
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
            <div className="px-6 py-8 text-red-400">{error}</div>
          ) : loading ? (
            <p className="px-6 py-8 text-gray-500">กำลังโหลด...</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-left border-b border-gray-800">
                  <th className="px-4 py-3">Service Code</th>
                  <th className="px-4 py-3">เครื่อง</th>
                  <th className="px-4 py-3">ประเภทล้าง</th>
                  <th className="px-4 py-3">สถานะ</th>
                  <th className="px-4 py-3">นัดหมาย</th>
                  <th className="px-4 py-3">ราคา</th>
                  <th className="px-4 py-3">Recurring</th>
                  <th className="px-4 py-3">ช่าง</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {items.map(job => {
                  const sm = STATUS_META[job.status];
                  return (
                    <tr key={job.id} className="hover:bg-gray-800/40">
                      <td className="px-4 py-3 font-mono text-xs text-blue-400">{job.serviceCode}</td>
                      <td className="px-4 py-3">
                        <span className="text-sm">{APPLIANCE_LABEL[job.applianceType]}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-300">
                        {CLEANING_LABEL[job.cleaningType]}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${sm.color}`}>{sm.label}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {new Date(job.scheduledAt).toLocaleString("th-TH", {
                          dateStyle: "short", timeStyle: "short",
                        })}
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-green-400">
                        {job.totalPrice.toLocaleString()} ฿
                      </td>
                      <td className="px-4 py-3">
                        {job.recurring?.enabled ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-900/40 text-purple-300">
                            🔁 {job.recurring.interval.replace("_", " ")}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-600">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {job.technicianId ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/maintain/jobs/${job.id}`}
                          className="text-xs text-blue-400 hover:text-blue-300 whitespace-nowrap">
                          ดู →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-6 py-10 text-center text-gray-500">
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
