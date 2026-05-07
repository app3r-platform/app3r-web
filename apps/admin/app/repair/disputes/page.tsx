"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isAuthenticated } from "@/lib/auth";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/sidebar";

interface RepairDispute {
  id: string;
  repair_job_id: string;
  weeeu_name: string;
  weeer_name: string;
  status: "open" | "in_review" | "resolved" | "escalated";
  opened_by: string;
  reason: string;
  created_at: string;
  resolved_at: string | null;
}

const DISPUTE_STATUS: Record<string, { label: string; color: string }> = {
  open:       { label: "เปิด",         color: "bg-red-900/50 text-red-400" },
  in_review:  { label: "กำลังตรวจ",   color: "bg-yellow-900/50 text-yellow-400" },
  resolved:   { label: "แก้ไขแล้ว",   color: "bg-green-900/50 text-green-400" },
  escalated:  { label: "Escalated",    color: "bg-orange-900/50 text-orange-400" },
};

const PAGE_SIZE = 20;

export default function RepairDisputesPage() {
  const router = useRouter();
  const [items, setItems] = useState<RepairDispute[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("open");
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        module: "repair",
        limit: String(PAGE_SIZE),
        offset: String((page - 1) * PAGE_SIZE),
        ...(filterStatus && { status: filterStatus }),
      });
      const d = await api.get<{ items: RepairDispute[]; total: number }>(
        "/admin/disputes?" + params
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

  return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold">⚖️ Repair Disputes</h1>
          <Link href="/disputes"
            className="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors">
            ดู Disputes ทั้งหมด →
          </Link>
        </div>
        <p className="text-gray-400 text-sm mb-6">
          ข้อพิพาทที่เกี่ยวกับ Repair module — filter จาก /admin/disputes?module=repair
        </p>

        {/* Status filter */}
        <div className="flex gap-1 mb-6 bg-gray-900 rounded-xl p-1 border border-gray-800 w-fit">
          {[
            { label: "ทั้งหมด", value: "" },
            { label: "เปิด", value: "open" },
            { label: "กำลังตรวจ", value: "in_review" },
            { label: "Escalated", value: "escalated" },
            { label: "แก้ไขแล้ว", value: "resolved" },
          ].map(f => (
            <button key={f.value}
              onClick={() => { setFilterStatus(f.value); setPage(1); }}
              className={`px-4 py-2 rounded-lg text-xs transition-colors ${
                filterStatus === f.value ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
              }`}>
              {f.label}
            </button>
          ))}
        </div>

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

          {loading ? (
            <p className="px-6 py-8 text-gray-500">กำลังโหลด...</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-left border-b border-gray-800">
                  <th className="px-6 py-3">Dispute ID</th>
                  <th className="px-6 py-3">Repair Job</th>
                  <th className="px-6 py-3">WeeeU</th>
                  <th className="px-6 py-3">WeeeR</th>
                  <th className="px-6 py-3">เปิดโดย</th>
                  <th className="px-6 py-3">สถานะ</th>
                  <th className="px-6 py-3">เหตุผล</th>
                  <th className="px-6 py-3">วันที่</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {items.map(d => {
                  const sc = DISPUTE_STATUS[d.status] ?? { label: d.status, color: "bg-gray-800 text-gray-300" };
                  return (
                    <tr key={d.id} className="hover:bg-gray-800/40">
                      <td className="px-6 py-3">
                        <span className="font-mono text-xs text-gray-400">{d.id.slice(0, 8)}…</span>
                      </td>
                      <td className="px-6 py-3">
                        <Link href={`/repair/jobs/${d.repair_job_id}`}
                          className="font-mono text-xs text-blue-400 hover:text-blue-300">
                          {d.repair_job_id.slice(0, 8)}…
                        </Link>
                      </td>
                      <td className="px-6 py-3 text-sm">{d.weeeu_name}</td>
                      <td className="px-6 py-3 text-sm text-gray-300">{d.weeer_name}</td>
                      <td className="px-6 py-3 text-xs text-gray-400">{d.opened_by}</td>
                      <td className="px-6 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${sc.color}`}>{sc.label}</span>
                      </td>
                      <td className="px-6 py-3 text-xs text-gray-400 max-w-xs truncate">{d.reason}</td>
                      <td className="px-6 py-3 text-xs text-gray-500">
                        {new Date(d.created_at).toLocaleDateString("th-TH")}
                      </td>
                      <td className="px-6 py-3">
                        <Link href={`/disputes`}
                          className="text-xs text-blue-400 hover:text-blue-300 transition-colors whitespace-nowrap">
                          จัดการ →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
                {items.length === 0 && (
                  <tr><td colSpan={9} className="px-6 py-10 text-center text-gray-500">ไม่มีข้อพิพาท</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
