"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated, isSuperAdmin } from "@/lib/auth";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/sidebar";

interface ReconciliationStatus {
  status: "BALANCED" | "DISCREPANCY" | "PENDING";
  total_minted: number;
  reserve_pool: number;
  fee_pools_total: number;
  escrow_pool: number;
  written_off: number;
  difference: number;
  last_run_at: string | null;
}
interface RecHistory {
  id: string;
  status: "BALANCED" | "DISCREPANCY";
  difference: number;
  ran_by: string;
  created_at: string;
}

export default function ReconciliationPage() {
  const router = useRouter();
  const [status, setStatus] = useState<ReconciliationStatus | null>(null);
  const [history, setHistory] = useState<RecHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [histPage, setHistPage] = useState(1);
  const [histTotal, setHistTotal] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const isSuper = isSuperAdmin();

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const fetchStatus = useCallback(async () => {
    const d = await api.get<ReconciliationStatus>("/admin/platform/reconciliation/status");
    setStatus(d);
  }, []);

  const fetchHistory = useCallback(async () => {
    const d = await api.get<{ items: RecHistory[]; total: number }>(
      `/admin/platform/reconciliation/history?limit=20&offset=${(histPage - 1) * 20}`
    );
    setHistory(d.items);
    setHistTotal(d.total);
  }, [histPage]);

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login"); return; }
    Promise.all([fetchStatus(), fetchHistory()]).finally(() => setLoading(false));
  }, [router, fetchStatus, fetchHistory]);

  async function runReconciliation() {
    setRunning(true);
    try {
      await api.post("/admin/platform/reconciliation/run", {});
      showToast("✅ Reconciliation รันเสร็จ");
      await fetchStatus();
      setHistPage(1);
      await fetchHistory();
    } catch (e) {
      showToast(`❌ ${(e as Error).message}`);
    } finally {
      setRunning(false);
    }
  }

  const fmtG = (v: number) => v.toLocaleString() + " G";
  const totalPages = Math.ceil(histTotal / 20);

  const statusConfig = {
    BALANCED: { color: "bg-green-900/40 border-green-800 text-green-400", label: "✅ BALANCED", desc: "ยอดทุก bucket สมดุล" },
    DISCREPANCY: { color: "bg-red-900/40 border-red-800 text-red-400", label: "🚨 DISCREPANCY", desc: "พบความไม่สอดคล้อง — ต้องตรวจสอบทันที" },
    PENDING: { color: "bg-yellow-900/40 border-yellow-800 text-yellow-400", label: "⏳ PENDING", desc: "ยังไม่ได้รัน reconciliation" },
  };

  return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold">Reconciliation</h1>
          {isSuper && (
            <button onClick={runReconciliation} disabled={running}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg text-sm font-medium transition-colors">
              {running ? "กำลังรัน..." : "▶ Run Now (Super Admin)"}
            </button>
          )}
        </div>
        <p className="text-gray-400 text-sm mb-8">ตรวจสอบความสมดุล D17 — Total Minted = Sum of all buckets</p>

        {loading ? (
          <p className="text-gray-500">กำลังโหลด...</p>
        ) : status && (
          <>
            {/* Status Card */}
            <div className={`rounded-xl border p-6 mb-6 ${statusConfig[status.status].color}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-2xl font-bold mb-1">{statusConfig[status.status].label}</p>
                  <p className="text-sm opacity-80">{statusConfig[status.status].desc}</p>
                  {status.last_run_at && (
                    <p className="text-xs opacity-60 mt-1">
                      ล่าสุด: {new Date(status.last_run_at).toLocaleString("th-TH")}
                    </p>
                  )}
                </div>
                {status.status === "DISCREPANCY" && (
                  <div className="text-right">
                    <p className="text-xs opacity-70">Difference</p>
                    <p className="text-2xl font-bold font-mono">{status.difference.toLocaleString()} G</p>
                  </div>
                )}
              </div>
            </div>

            {/* Breakdown */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 mb-6">
              <h2 className="font-semibold mb-4">📐 Breakdown (D17 Invariant)</h2>
              <div className="space-y-3">
                <BreakdownRow label="Total Minted (A)" value={fmtG(status.total_minted)} highlight />
                <div className="border-t border-gray-800 pt-3 space-y-2.5">
                  <BreakdownRow label="Reserve Pool" value={fmtG(status.reserve_pool)} />
                  <BreakdownRow label="Fee Pools (รวม)" value={fmtG(status.fee_pools_total)} />
                  <BreakdownRow label="Escrow Pool" value={fmtG(status.escrow_pool)} />
                  <BreakdownRow label="Written-Off" value={fmtG(status.written_off)} />
                </div>
                <div className="border-t border-gray-800 pt-3">
                  <BreakdownRow
                    label="Sum of Buckets (B)"
                    value={fmtG(status.reserve_pool + status.fee_pools_total + status.escrow_pool + status.written_off)}
                    highlight
                  />
                </div>
                <div className={`mt-2 p-3 rounded-lg text-sm ${status.difference === 0 ? "bg-green-900/20 text-green-400" : "bg-red-900/20 text-red-400"}`}>
                  A − B = {status.difference === 0 ? "0 ✅ สมดุล" : `${status.difference.toLocaleString()} G ⚠️ ไม่สมดุล`}
                </div>
              </div>
            </div>

            {/* Run button for non-super */}
            {!isSuper && (
              <div className="mb-6 bg-gray-900 border border-gray-800 rounded-xl p-4 text-sm text-gray-400">
                ⚠️ การรัน Reconciliation ต้องการสิทธิ์ Super Admin (D27)
              </div>
            )}

            {/* History */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
                <h2 className="font-semibold">📋 ประวัติ Reconciliation</h2>
                {totalPages > 1 && (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <button onClick={() => setHistPage((p) => Math.max(1, p - 1))} disabled={histPage === 1}
                      className="px-2 py-1 rounded bg-gray-800 disabled:opacity-40">‹</button>
                    <span>{histPage} / {totalPages}</span>
                    <button onClick={() => setHistPage((p) => Math.min(totalPages, p + 1))} disabled={histPage === totalPages}
                      className="px-2 py-1 rounded bg-gray-800 disabled:opacity-40">›</button>
                  </div>
                )}
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 text-left">
                    <th className="px-6 py-3">เวลา</th>
                    <th className="px-6 py-3">สถานะ</th>
                    <th className="px-6 py-3 text-right">Difference</th>
                    <th className="px-6 py-3">รันโดย</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {history.map((h) => (
                    <tr key={h.id} className="hover:bg-gray-800/50">
                      <td className="px-6 py-3 text-gray-400 text-xs whitespace-nowrap">
                        {new Date(h.created_at).toLocaleString("th-TH")}
                      </td>
                      <td className="px-6 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          h.status === "BALANCED" ? "bg-green-900/50 text-green-400" : "bg-red-900/50 text-red-400"
                        }`}>
                          {h.status}
                        </span>
                      </td>
                      <td className={`px-6 py-3 text-right font-mono text-xs ${h.difference === 0 ? "text-gray-500" : "text-red-400 font-bold"}`}>
                        {h.difference === 0 ? "—" : h.difference.toLocaleString() + " G"}
                      </td>
                      <td className="px-6 py-3 text-gray-400 text-xs">{h.ran_by}</td>
                    </tr>
                  ))}
                  {history.length === 0 && (
                    <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">ยังไม่มีประวัติ</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {toast && (
          <div className="fixed bottom-6 right-6 bg-gray-800 border border-gray-700 rounded-xl px-5 py-3 text-sm shadow-xl">
            {toast}
          </div>
        )}
      </main>
    </div>
  );
}

function BreakdownRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className={`text-sm ${highlight ? "font-semibold text-white" : "text-gray-400"}`}>{label}</span>
      <span className={`font-mono text-sm ${highlight ? "font-bold text-white" : "text-gray-300"}`}>{value}</span>
    </div>
  );
}
