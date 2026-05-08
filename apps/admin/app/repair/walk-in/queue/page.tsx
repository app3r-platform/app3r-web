"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isAuthenticated } from "@/lib/auth";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/sidebar";

type WalkInStatus =
  | "checked_in" | "inspecting" | "awaiting_decision" | "awaiting_parts"
  | "in_progress" | "completed" | "awaiting_pickup" | "closed"
  | "abandoned" | "cancelled";

interface WalkInJob {
  id: string;
  job_number: string;
  store_id: string;
  store_name: string;
  device_model: string;
  device_issue: string;
  customer_name: string;
  customer_phone: string;
  status: WalkInStatus;
  checked_in_at: string;
  estimated_completion: string | null;
  completed_at: string | null;
  storage_fee: number;
  quote_price: number | null;
  final_price: number | null;
  technician_name: string | null;
}

const STATUS_META: Record<string, { label: string; color: string }> = {
  checked_in:        { label: "เช็คอิน",        color: "bg-blue-900/50 text-blue-300" },
  inspecting:        { label: "ตรวจสภาพ",        color: "bg-purple-900/50 text-purple-300" },
  awaiting_decision: { label: "รอตัดสินใจ",      color: "bg-yellow-900/50 text-yellow-400" },
  awaiting_parts:    { label: "รอชิ้นส่วน",      color: "bg-orange-900/50 text-orange-300" },
  in_progress:       { label: "กำลังซ่อม",       color: "bg-cyan-900/50 text-cyan-300" },
  completed:         { label: "ซ่อมเสร็จ",       color: "bg-teal-900/50 text-teal-300" },
  awaiting_pickup:   { label: "รอรับคืน",        color: "bg-indigo-900/50 text-indigo-300" },
  closed:            { label: "ปิดงาน",          color: "bg-green-900/50 text-green-400" },
  abandoned:         { label: "ทิ้งแล้ว",        color: "bg-red-900/50 text-red-400" },
  cancelled:         { label: "ยกเลิก",          color: "bg-gray-800 text-gray-400" },
};

const PAGE_SIZE = 20;

const STATUS_TABS = [
  { label: "ทั้งหมด", value: "" },
  { label: "เช็คอิน", value: "checked_in" },
  { label: "ตรวจสภาพ", value: "inspecting" },
  { label: "รอตัดสินใจ", value: "awaiting_decision" },
  { label: "กำลังซ่อม", value: "in_progress" },
  { label: "รอรับคืน", value: "awaiting_pickup" },
  { label: "ปิดงาน", value: "closed" },
  { label: "ทิ้ง/ยกเลิก", value: "abandoned" },
];

export default function WalkInQueuePage() {
  const router = useRouter();
  const [items, setItems] = useState<WalkInJob[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterStore, setFilterStore] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String((page - 1) * PAGE_SIZE),
        ...(filterStatus && { status: filterStatus }),
        ...(filterStore  && { store_id: filterStore }),
        ...(filterDate   && { date: filterDate }),
      });
      const d = await api.get<{ items: WalkInJob[]; total: number }>(
        "/admin/repair/walk-in/queue?" + params
      );
      setItems(d.items);
      setTotal(d.total);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus, filterStore, filterDate]);

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login"); return; }
    fetchData();
  }, [router, fetchData]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  function resetFilters() {
    setFilterStatus("");
    setFilterStore("");
    setFilterDate("");
    setPage(1);
  }

  return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      <Sidebar />
      <main className="flex-1 p-8 space-y-6 max-w-7xl">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">🚶 Walk-in Queue</h1>
            <p className="text-gray-400 text-sm mt-1">
              ตารางรวม walk-in queue ทุกร้าน — filter ร้าน / วัน / สถานะ
            </p>
          </div>
          <Link href="/repair/walk-in/analytics"
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
          <input
            type="text"
            placeholder="ค้นหาร้าน (store_id)"
            value={filterStore}
            onChange={e => { setFilterStore(e.target.value); setPage(1); }}
            className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-600 w-52 focus:outline-none focus:border-blue-500"
          />
          <input
            type="date"
            value={filterDate}
            onChange={e => { setFilterDate(e.target.value); setPage(1); }}
            className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white w-44 focus:outline-none focus:border-blue-500"
          />
          {(filterStore || filterDate) && (
            <button onClick={resetFilters}
              className="px-3 py-1.5 text-xs text-gray-400 hover:text-white bg-gray-800 rounded-lg transition-colors">
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
                  <th className="px-4 py-3">Job #</th>
                  <th className="px-4 py-3">ร้าน</th>
                  <th className="px-4 py-3">อุปกรณ์</th>
                  <th className="px-4 py-3">ลูกค้า</th>
                  <th className="px-4 py-3">ช่าง</th>
                  <th className="px-4 py-3">สถานะ</th>
                  <th className="px-4 py-3">Storage Fee</th>
                  <th className="px-4 py-3">ราคา</th>
                  <th className="px-4 py-3">เช็คอิน</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {items.map(job => {
                  const sm = STATUS_META[job.status] ?? { label: job.status, color: "bg-gray-800 text-gray-300" };
                  return (
                    <tr key={job.id} className="hover:bg-gray-800/40">
                      <td className="px-4 py-3 font-mono text-xs text-blue-400">{job.job_number}</td>
                      <td className="px-4 py-3 text-xs text-gray-300">{job.store_name}</td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-white">{job.device_model}</div>
                        <div className="text-xs text-gray-500 truncate max-w-[140px]">{job.device_issue}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">{job.customer_name}</div>
                        <div className="text-xs text-gray-500">{job.customer_phone}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">{job.technician_name ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${sm.color}`}>{sm.label}</span>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-yellow-400">
                        {job.storage_fee > 0 ? `${job.storage_fee.toLocaleString()} ฿` : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-green-400">
                        {job.final_price != null
                          ? `${job.final_price.toLocaleString()} ฿`
                          : job.quote_price != null
                            ? <span className="text-gray-400">{job.quote_price.toLocaleString()} ฿ (quote)</span>
                            : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {new Date(job.checked_in_at).toLocaleDateString("th-TH")}
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/repair/walk-in/${job.id}`}
                          className="text-xs text-blue-400 hover:text-blue-300 whitespace-nowrap">
                          ดู →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
                {items.length === 0 && (
                  <tr><td colSpan={10} className="px-6 py-10 text-center text-gray-500">ไม่มีข้อมูล</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
