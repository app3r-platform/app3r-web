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

// mock fallback — ลบตอน Phase 4 (TD-06)
const MOCK_RECURRING: RecurringListResponse = {
  count: 5,
  results: [
    {
      id: "mjr-001", serviceCode: "M-2026-001", customerId: "u-101", shopId: "shop-11",
      technicianId: "tech-21", status: "completed", applianceType: "AC", cleaningType: "general",
      serviceMethod: "on_site", scheduledAt: "2026-04-15T10:00:00Z", estimatedDuration: 2,
      address: { lat: 13.7563, lng: 100.5018, address: "123 ถ.สุขุมวิท แขวงคลองเตย กรุงเทพฯ" },
      recurring: { enabled: true, interval: "6_months", nextScheduledAt: "2026-10-15T10:00:00Z" },
      totalPrice: 800, createdAt: "2026-01-10T08:00:00Z", updatedAt: "2026-04-15T12:00:00Z",
    },
    {
      id: "mjr-002", serviceCode: "M-2026-007", customerId: "u-102", shopId: "shop-12",
      status: "pending", applianceType: "WashingMachine", cleaningType: "deep",
      serviceMethod: "on_site", scheduledAt: "2026-10-20T09:00:00Z", estimatedDuration: 3,
      address: { lat: 13.8621, lng: 100.4931, address: "88/5 ซ.ลาดพร้าว 71 กรุงเทพฯ" },
      recurring: { enabled: true, interval: "3_months", nextScheduledAt: "2026-10-20T09:00:00Z" },
      totalPrice: 1200, createdAt: "2026-01-20T09:00:00Z", updatedAt: "2026-07-20T10:00:00Z",
    },
    {
      id: "mjr-003", serviceCode: "M-2026-014", customerId: "u-103", shopId: "shop-11",
      technicianId: "tech-22", status: "completed", applianceType: "AC", cleaningType: "sanitize",
      serviceMethod: "on_site", scheduledAt: "2026-06-01T14:00:00Z", estimatedDuration: 2,
      address: { lat: 13.7308, lng: 100.5235, address: "45 ถ.พระรามสี่ แขวงสีลม กรุงเทพฯ" },
      recurring: { enabled: true, interval: "12_months", nextScheduledAt: "2027-06-01T14:00:00Z" },
      totalPrice: 1500, createdAt: "2026-02-01T07:00:00Z", updatedAt: "2026-06-01T16:00:00Z",
    },
    {
      id: "mjr-004", serviceCode: "M-2026-023", customerId: "u-104", shopId: "shop-13",
      status: "assigned", applianceType: "AC", cleaningType: "general",
      serviceMethod: "on_site", scheduledAt: "2026-06-12T10:00:00Z", estimatedDuration: 2,
      address: { lat: 13.7469, lng: 100.5345, address: "220 ถ.พหลโยธิน แขวงสามเสน กรุงเทพฯ" },
      recurring: { enabled: true, interval: "6_months", nextScheduledAt: "2026-06-12T10:00:00Z" },
      totalPrice: 900, createdAt: "2026-03-15T11:00:00Z", updatedAt: "2026-06-10T08:00:00Z",
    },
    {
      id: "mjr-005", serviceCode: "M-2026-031", customerId: "u-105",
      status: "pending", applianceType: "WashingMachine", cleaningType: "general",
      serviceMethod: "on_site", scheduledAt: "2026-09-05T11:00:00Z", estimatedDuration: 2,
      address: { lat: 13.7611, lng: 100.5572, address: "67 ซ.อโศก แขวงคลองเตยเหนือ กรุงเทพฯ" },
      recurring: { enabled: true, interval: "3_months", nextScheduledAt: "2026-09-05T11:00:00Z" },
      totalPrice: 700, createdAt: "2026-04-05T10:00:00Z", updatedAt: "2026-06-05T09:00:00Z",
    },
  ],
};

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
    } catch (e: unknown) {
      if ((e as Error).message === "UNAUTHORIZED") { router.push("/login"); return; }
      console.warn("[mock fallback]", e);
      setItems(MOCK_RECURRING.results);
      setTotal(MOCK_RECURRING.count);
      setError(null);
    } finally {
      setLoading(false);
    }
  }, [page, filterInterval, filterAppliance, router]);

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
    } catch {
      setTriggerStates(prev => ({
        ...prev,
        [jobId]: { loading: false, msg: { type: "error", text: "โหมดสาธิต: backend ยังไม่พร้อม" } },
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
            <h1 className="text-2xl font-bold">🔁 งานบำรุงรักษาประจำ</h1>
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
            className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 w-44 focus:outline-none focus:border-admin-primary">
            <option value="">ทุก interval</option>
            <option value="3_months">3 เดือน</option>
            <option value="6_months">6 เดือน</option>
            <option value="12_months">12 เดือน</option>
          </select>
          <select
            value={filterAppliance}
            onChange={e => { setFilterAppliance(e.target.value); setPage(1); }}
            className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 w-44 focus:outline-none focus:border-admin-primary">
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
                  <th className="px-4 py-3">รหัสบริการ</th>
                  <th className="px-4 py-3">เครื่อง</th>
                  <th className="px-4 py-3">ประเภทล้าง</th>
                  <th className="px-4 py-3">ความถี่</th>
                  <th className="px-4 py-3">นัดหมายถัดไป</th>
                  <th className="px-4 py-3">ราคา</th>
                  <th className="px-4 py-3">กระตุ้นงาน</th>
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
                      <td className="px-4 py-3 font-mono text-xs text-admin-primary">{job.serviceCode}</td>
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
