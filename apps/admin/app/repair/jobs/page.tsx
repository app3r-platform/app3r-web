"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isAuthenticated } from "@/lib/auth";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/sidebar";

const JOB_STATUS: Record<string, { label: string; color: string }> = {
  assigned:          { label: "มอบหมายแล้ว",      color: "bg-gray-800 text-gray-300" },
  traveling:         { label: "เดินทาง",           color: "bg-blue-900/50 text-blue-300" },
  arrived:           { label: "ถึงแล้ว",            color: "bg-blue-900/50 text-blue-400" },
  awaiting_entry:    { label: "รอเข้าบ้าน",        color: "bg-yellow-900/50 text-yellow-400" },
  inspecting:        { label: "ตรวจสภาพ",          color: "bg-purple-900/50 text-purple-400" },
  awaiting_decision: { label: "รอ WeeeR อนุมัติ",  color: "bg-orange-900/50 text-orange-400" },
  awaiting_user:     { label: "รอ WeeeU ตอบ",      color: "bg-yellow-900/50 text-yellow-300" },
  in_progress:       { label: "กำลังซ่อม",         color: "bg-blue-900/50 text-blue-400" },
  completed:         { label: "ซ่อมเสร็จ",         color: "bg-teal-900/50 text-teal-400" },
  awaiting_review:   { label: "รอตรวจรับ",         color: "bg-teal-900/50 text-teal-300" },
  closed:            { label: "ปิดงาน ✓",          color: "bg-green-900/50 text-green-400" },
  cancelled:         { label: "ยกเลิก",             color: "bg-red-900/50 text-red-400" },
  converted_scrap:   { label: "→ ซาก",             color: "bg-gray-700 text-gray-400" },
};

const FILTER_GROUPS = [
  { label: "ทั้งหมด", value: "" },
  { label: "Active", value: "active" },
  { label: "มอบหมายแล้ว", value: "assigned" },
  { label: "เดินทาง", value: "traveling" },
  { label: "รอเข้าบ้าน", value: "awaiting_entry" },
  { label: "ตรวจสภาพ", value: "inspecting" },
  { label: "รอ WeeeR", value: "awaiting_decision" },
  { label: "รอ WeeeU", value: "awaiting_user" },
  { label: "กำลังซ่อม", value: "in_progress" },
  { label: "รอตรวจรับ", value: "awaiting_review" },
  { label: "ปิดงาน", value: "closed" },
  { label: "ยกเลิก", value: "cancelled" },
  { label: "→ ซาก", value: "converted_scrap" },
];

interface RepairJob {
  id: string;
  weeeu_name: string;
  weeer_name: string;
  weeet_name: string;
  service_type: string;
  status: string;
  decision_branch: string | null;
  scheduled_at: string;
  created_at: string;
  // D64 RepairJob source additive
  source?: {
    type: "customer" | "purchased_scrap";
    refId?: string;
  };
}

const PAGE_SIZE = 20;

export default function RepairJobsPage() {
  const router = useRouter();
  const [items, setItems] = useState<RepairJob[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterSource, setFilterSource] = useState("all");
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        service_type: "on_site",
        limit: String(PAGE_SIZE),
        offset: String((page - 1) * PAGE_SIZE),
        ...(filterStatus && filterStatus !== "active" && { status: filterStatus }),
        ...(filterStatus === "active" && { active: "true" }),
      });
      const d = await api.get<{ items: RepairJob[]; total: number }>(
        "/admin/repair/jobs?" + params
      );
      setItems(d.items);
      setTotal(d.total);
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus]);

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login"); return; }
    fetchData();
  }, [router, fetchData]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  // D64 client-side source filter (backward-compat: no source → customer)
  const displayItems = items.filter(job => {
    if (filterSource === "all") return true;
    if (filterSource === "customer") return !job.source || job.source.type === "customer";
    if (filterSource === "purchased_scrap") return job.source?.type === "purchased_scrap";
    return true;
  });

  return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold">🔧 Repair Jobs — On-site</h1>
          <div className="flex gap-2">
            <Link href="/repair/analytics"
              className="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors">
              📊 Analytics
            </Link>
            <Link href="/repair/disputes"
              className="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors">
              ⚖️ Disputes
            </Link>
          </div>
        </div>
        <p className="text-gray-400 text-sm mb-6">
          ดูและ oversight งานซ่อม On-site ทั้งหมด — filter ตาม state machine
        </p>

        {/* Source filter (D64) */}
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xs text-gray-500 shrink-0">แหล่งที่มา:</span>
          <select
            value={filterSource}
            onChange={e => { setFilterSource(e.target.value); setPage(1); }}
            className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white w-48 focus:outline-none focus:border-blue-500">
            <option value="all">ทั้งหมด</option>
            <option value="customer">ลูกค้า (customer)</option>
            <option value="purchased_scrap">ซื้อจากซาก (purchased_scrap)</option>
          </select>
          {filterSource !== "all" && (
            <button onClick={() => setFilterSource("all")}
              className="text-xs text-gray-500 hover:text-white bg-gray-800 px-2 py-1 rounded">
              ล้าง
            </button>
          )}
        </div>

        {/* Status filter */}
        <div className="flex flex-wrap gap-1 mb-6 bg-gray-900 rounded-xl p-1 border border-gray-800">
          {FILTER_GROUPS.map(fg => (
            <button key={fg.value}
              onClick={() => { setFilterStatus(fg.value); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                filterStatus === fg.value ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
              }`}>
              {fg.label}
            </button>
          ))}
        </div>

        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-800 flex items-center justify-between text-sm text-gray-400">
            <span>พบ {total.toLocaleString()} รายการ{filterSource !== "all" ? ` (แสดง ${displayItems.length})` : ""}</span>
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

          {loading ? (
            <p className="px-6 py-8 text-gray-500">กำลังโหลด...</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-left border-b border-gray-800">
                  <th className="px-6 py-3">Job ID</th>
                  <th className="px-6 py-3">WeeeU (ลูกค้า)</th>
                  <th className="px-6 py-3">WeeeR (ร้าน)</th>
                  <th className="px-6 py-3">WeeeT (ช่าง)</th>
                  <th className="px-6 py-3">สถานะ</th>
                  <th className="px-6 py-3">แหล่งที่มา</th>
                  <th className="px-6 py-3">Branch</th>
                  <th className="px-6 py-3">นัดหมาย</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {displayItems.map(job => {
                  const sc = JOB_STATUS[job.status] ?? { label: job.status, color: "bg-gray-800 text-gray-300" };
                  const isPurchasedScrap = job.source?.type === "purchased_scrap";
                  return (
                    <tr key={job.id} className="hover:bg-gray-800/40">
                      <td className="px-6 py-3">
                        <span className="font-mono text-xs text-gray-400">{job.id.slice(0, 8)}…</span>
                      </td>
                      <td className="px-6 py-3 text-sm">{job.weeeu_name}</td>
                      <td className="px-6 py-3 text-sm text-gray-300">{job.weeer_name}</td>
                      <td className="px-6 py-3 text-sm text-gray-300">{job.weeet_name}</td>
                      <td className="px-6 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${sc.color}`}>{sc.label}</span>
                      </td>
                      <td className="px-6 py-3">
                        {isPurchasedScrap ? (
                          <span className="bg-orange-900/40 border border-orange-700 text-orange-300 text-xs px-2 py-0.5 rounded">
                            ซื้อจากซาก
                          </span>
                        ) : (
                          <span className="bg-blue-900/40 border border-blue-700 text-blue-300 text-xs px-2 py-0.5 rounded">
                            ลูกค้า
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        {job.decision_branch
                          ? <span className="text-xs font-mono font-bold text-purple-400">{job.decision_branch}</span>
                          : <span className="text-xs text-gray-600">—</span>}
                      </td>
                      <td className="px-6 py-3 text-xs text-gray-400">
                        {new Date(job.scheduled_at).toLocaleString("th-TH")}
                      </td>
                      <td className="px-6 py-3">
                        <Link href={`/repair/jobs/${job.id}`}
                          className="text-xs text-blue-400 hover:text-blue-300 transition-colors whitespace-nowrap">
                          ดูละเอียด →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
                {displayItems.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-6 py-10 text-center text-gray-500">ไม่มีรายการ</td>
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
