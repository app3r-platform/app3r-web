"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isAuthenticated } from "@/lib/auth";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/sidebar";

interface AbandonedDevice {
  id: string;
  job_id: string;
  job_number: string;
  store_name: string;
  device_model: string;
  device_brand: string;
  customer_name: string;
  customer_phone: string;
  completed_at: string;
  days_stored: number;
  storage_fee_accumulated: number;
  last_contact_at: string | null;
  status: "waiting" | "contacted" | "scrapped" | "disposed";
}

const ABANDONED_STATUS: Record<string, { label: string; color: string }> = {
  waiting:  { label: "รอดำเนินการ", color: "bg-yellow-900/50 text-yellow-400" },
  contacted:{ label: "ติดต่อแล้ว",  color: "bg-blue-900/50 text-blue-300" },
  scrapped: { label: "ส่งขายซาก",   color: "bg-orange-900/50 text-orange-400" },
  disposed: { label: "ทำลายแล้ว",   color: "bg-gray-800 text-gray-400" },
};

const PAGE_SIZE = 20;

export default function AbandonedDevicesPage() {
  const router = useRouter();
  const [items, setItems] = useState<AbandonedDevice[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("waiting");
  const [page, setPage] = useState(1);

  // Scrap action state
  const [scrapId, setScrapId] = useState<string | null>(null);
  const [scrapLoading, setScrapLoading] = useState(false);
  const [scrapMsg, setScrapMsg] = useState<{ id: string; type: "success" | "error"; text: string } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String((page - 1) * PAGE_SIZE),
        ...(filterStatus && { status: filterStatus }),
      });
      const d = await api.get<{ items: AbandonedDevice[]; total: number }>(
        "/admin/repair/walk-in/abandoned?" + params
      );
      setItems(d.items);
      setTotal(d.total);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus]);

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login"); return; }
    fetchData();
  }, [router, fetchData]);

  async function handleScrap(id: string) {
    setScrapLoading(true);
    setScrapMsg(null);
    try {
      await api.post(`/admin/repair/walk-in/abandoned/${id}/scrap`, {});
      setScrapMsg({ id, type: "success", text: "ส่งขายซากสำเร็จ — Scrap module triggered ✓" });
      setScrapId(null);
      fetchData();
    } catch (e) {
      setScrapMsg({ id, type: "error", text: (e as Error).message });
    } finally {
      setScrapLoading(false);
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      <Sidebar />
      <main className="flex-1 p-8 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">📦 Abandoned Devices</h1>
            <p className="text-gray-400 text-sm mt-1">
              เครื่องที่ลูกค้าไม่มารับ — action: ติดต่อ / ส่งขายซาก / ทำลาย
            </p>
          </div>
          <Link href="/repair/walk-in/queue"
            className="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors">
            ← Walk-in Queue
          </Link>
        </div>

        {/* Status filter */}
        <div className="flex gap-1 bg-gray-900 rounded-xl p-1 border border-gray-800 w-fit">
          {[
            { label: "ทั้งหมด", value: "" },
            { label: "รอดำเนินการ", value: "waiting" },
            { label: "ติดต่อแล้ว", value: "contacted" },
            { label: "ส่งขายซาก", value: "scrapped" },
            { label: "ทำลายแล้ว", value: "disposed" },
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

        {/* Global scrap message */}
        {scrapMsg && (
          <div className={`p-3 rounded-xl text-sm border ${
            scrapMsg.type === "success"
              ? "bg-green-900/30 border-green-800 text-green-300"
              : "bg-red-900/30 border-red-800 text-red-300"
          }`}>
            {scrapMsg.text}
          </div>
        )}

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
                  <th className="px-5 py-3">Job #</th>
                  <th className="px-5 py-3">ร้าน</th>
                  <th className="px-5 py-3">อุปกรณ์</th>
                  <th className="px-5 py-3">ลูกค้า</th>
                  <th className="px-5 py-3">เก็บ (วัน)</th>
                  <th className="px-5 py-3">Storage Fee</th>
                  <th className="px-5 py-3">ติดต่อล่าสุด</th>
                  <th className="px-5 py-3">สถานะ</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {items.map(d => {
                  const sm = ABANDONED_STATUS[d.status] ?? { label: d.status, color: "bg-gray-800 text-gray-300" };
                  const isConfirming = scrapId === d.id;
                  return (
                    <tr key={d.id} className="hover:bg-gray-800/40">
                      <td className="px-5 py-3">
                        <Link href={`/repair/walk-in/${d.job_id}`}
                          className="font-mono text-xs text-blue-400 hover:text-blue-300">
                          {d.job_number}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-300">{d.store_name}</td>
                      <td className="px-5 py-3">
                        <div className="text-sm text-white">{d.device_brand} {d.device_model}</div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="text-sm">{d.customer_name}</div>
                        <div className="text-xs text-gray-500">{d.customer_phone}</div>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-sm font-bold ${d.days_stored > 30 ? "text-red-400" : d.days_stored > 14 ? "text-orange-400" : "text-yellow-400"}`}>
                          {d.days_stored}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-yellow-400">
                        {d.storage_fee_accumulated.toLocaleString()} ฿
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-500">
                        {d.last_contact_at
                          ? new Date(d.last_contact_at).toLocaleDateString("th-TH")
                          : <span className="text-red-400">ยังไม่ติดต่อ</span>}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${sm.color}`}>{sm.label}</span>
                      </td>
                      <td className="px-5 py-3">
                        {d.status === "waiting" || d.status === "contacted" ? (
                          isConfirming ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-orange-400">ยืนยันส่งขายซาก?</span>
                              <button
                                onClick={() => handleScrap(d.id)}
                                disabled={scrapLoading}
                                className="text-xs px-2 py-1 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded transition-colors">
                                {scrapLoading ? "..." : "ยืนยัน"}
                              </button>
                              <button onClick={() => setScrapId(null)}
                                className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded transition-colors">
                                ยกเลิก
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => { setScrapId(d.id); setScrapMsg(null); }}
                              className="text-xs px-3 py-1 bg-orange-900/40 hover:bg-orange-900/60 border border-orange-700/50 text-orange-300 rounded-lg transition-colors">
                              ♻️ ส่งขายซาก
                            </button>
                          )
                        ) : (
                          <span className="text-xs text-gray-600">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {items.length === 0 && (
                  <tr><td colSpan={9} className="px-6 py-10 text-center text-gray-500">ไม่มีรายการ</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
