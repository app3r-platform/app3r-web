"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isAuthenticated } from "@/lib/auth";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/sidebar";
import type { MaintainJob } from "@/lib/types";

const INTERVAL_LABEL: Record<string, string> = {
  "3_months":  "3 เดือน",
  "6_months":  "6 เดือน",
  "12_months": "12 เดือน",
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

const PAGE_SIZE = 20;

interface RecurringListResponse {
  results: MaintainJob[];
  count: number;
}

interface TriggerState {
  loading: boolean;
  msg: { type: "success" | "error"; text: string } | null;
}

export default function MaintainRecurringPage() {
  const router = useRouter();
  const [items, setItems] = useState<MaintainJob[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterInterval, setFilterInterval] = useState("");
  const [filterAppliance, setFilterAppliance] = useState("");
  const [page, setPage] = useState(1);
  const [triggerStates, setTriggerStates] = useState<Record<string, TriggerState>>({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String((page - 1) * PAGE_SIZE),
        recurring: "true",
        ...(filterInterval  && { interval: filterInterval }),
        ...(filterAppliance && { appliance_type: filterAppliance }),
      });
      const d = await api.get<RecurringListResponse>(
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
  }, [page, filterInterval, filterAppliance]);

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login"); return; }
    fetchData();
  }, [router, fetchData]);

  async function handleTrigger(jobId: string) {
    setTriggerStates(prev => ({ ...prev, [jobId]: { loading: true, msg: null } }));
    try {
      await api.post(`/maintain/recurring/${jobId}/trigger/`, {});
      setTriggerStates(prev => ({
        ...prev,
        [jobId]: { loading: false, msg: { type: "success", text: "สร้างงานรอบถัดไปสำเร็จ" } },
      }));
      fetchData();
    } catch (e) {
      setTriggerStates(prev => ({
        ...prev,
        [jobId]: { loading: false, msg: { type: "error", text: (e as Error).message } },
      }));
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Days until next scheduled
  function daysUntil(dateStr: string) {
    const diff = new Date(dateStr).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return { label: `เลย ${Math.abs(days)} วัน`, urgent: true };
    if (days === 0) return { label: "วันนี้", urgent: true };
    if (days <= 7) return { label: `อีก ${days} วัน`, urgent: true };
    return { label: `อีก ${days} วัน`, urgent: false };
  }

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar />
      <main className="flex-1 p-8 space-y-6 max-w-7xl">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">🔁 Maintain Recurring</h1>
            <p className="text-gray-500 text-sm mt-1">
              รายการนัดซ้ำทั้งหมด — ติดตาม nextScheduledAt + manual trigger
            </p>
          </div>
          <Link href="/maintain/jobs"
            className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg transition-colors">
            🛁 Jobs →
          </Link>
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <select
            value={filterInterval}
            onChange={e => { setFilterInterval(e.target.value); setPage(1); }}
            className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 w-44 focus:outline-none focus:border-blue-500">
            <option value="">ทุก interval</option>
            <option value="3_months">3 เดือน</option>
            <option value="6_months">6 เดือน</option>
            <option value="12_months">12 เดือน</option>
          </select>
          <select
            value={filterAppliance}
            onChange={e => { setFilterAppliance(e.target.value); setPage(1); }}
            className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 w-44 focus:outline-none focus:border-blue-500">
            <option value="">ทุกเครื่อง</option>
            <option value="AC">แอร์</option>
            <option value="WashingMachine">เครื่องซัก</option>
          </select>
          {(filterInterval || filterAppliance) && (
            <button onClick={() => { setFilterInterval(""); setFilterAppliance(""); setPage(1); }}
              className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-900 bg-gray-100 rounded-lg">
              ล้าง filter
            </button>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-200 flex items-center justify-between text-sm text-gray-500">
            <span>พบ {total.toLocaleString()} รายการ (recurring)</span>
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
                  <th className="px-4 py-3">Interval</th>
                  <th className="px-4 py-3">Next Scheduled</th>
                  <th className="px-4 py-3">ราคา</th>
                  <th className="px-4 py-3">Trigger</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.map(job => {
                  const next = job.recurring?.nextScheduledAt;
                  const countdown = next ? daysUntil(next) : null;
                  const ts = triggerStates[job.id];
                  return (
                    <tr key={job.id} className="hover:bg-gray-100/40">
                      <td className="px-4 py-3 font-mono text-xs text-blue-400">{job.serviceCode}</td>
                      <td className="px-4 py-3 text-sm">{APPLIANCE_LABEL[job.applianceType]}</td>
                      <td className="px-4 py-3 text-xs text-gray-700">{CLEANING_LABEL[job.cleaningType]}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-admin-primary/15 text-admin-primary">
                          {INTERVAL_LABEL[job.recurring?.interval ?? ""] ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {next ? (
                          <div>
                            <div className="text-xs text-gray-700">
                              {new Date(next).toLocaleDateString("th-TH")}
                            </div>
                            <div className={`text-xs mt-0.5 ${countdown?.urgent ? "text-red-600" : "text-gray-500"}`}>
                              {countdown?.label}
                            </div>
                          </div>
                        ) : <span className="text-gray-600">—</span>}
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-green-600">
                        {job.totalPrice.toLocaleString()} ฿
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => handleTrigger(job.id)}
                            disabled={ts?.loading}
                            className="px-2.5 py-1 text-xs bg-admin-dark hover:bg-admin-primary disabled:opacity-40 disabled:cursor-not-allowed disabled:cursor-not-allowed text-white rounded-lg transition-colors whitespace-nowrap">
                            {ts?.loading ? "..." : "▶ Trigger"}
                          </button>
                          {ts?.msg && (
                            <span className={`text-xs ${ts.msg.type === "success" ? "text-green-600" : "text-red-600"}`}>
                              {ts.msg.text}
                            </span>
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
                    <td colSpan={8} className="px-6 py-10 text-center text-gray-500">
                      ไม่มีข้อมูล recurring
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
