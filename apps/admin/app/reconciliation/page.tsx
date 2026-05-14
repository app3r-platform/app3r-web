"use client";

/**
 * /reconciliation/page.tsx
 * Settlement Reconciliation Dashboard — Sub-CMD-7 Wave 2 (2026-05-14)
 *
 * หน้าตรวจสอบและแก้ไข settlement (การชำระเงิน) ที่ค้างอยู่ในสถานะ pending/processing
 * แตกต่างจาก /platform/reconciliation ซึ่งเป็น Point Balance (D17 Invariant)
 *
 * Endpoints (Backend Sub-7):
 *   GET  /api/v1/reconciliation       — รายงาน settlement ค้าง
 *   POST /api/v1/reconciliation/run   — trigger worker ด้วยตนเอง
 *   PATCH /api/v1/reconciliation/:id/resolve — แก้ไข settlement ค้างทีละรายการ
 */

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated, isSuperAdmin } from "@/lib/auth";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/sidebar";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type SettlementStatus = "pending" | "processing" | "completed" | "failed" | "resolved";

export interface StuckSettlement {
  id: string;
  job_id: string;             // repair/maintain/listing job ที่เชื่อมกับ settlement
  job_type: string;           // "repair" | "resell" | "scrap" | "maintain"
  amount: number;             // จำนวน Gold Point
  status: SettlementStatus;
  created_at: string;
  updated_at: string;
  stuck_since_hours: number;  // นานแค่ไหนที่ค้างอยู่
  error_message: string | null;
}

export interface ReconciliationReport {
  total_stuck: number;
  total_pending: number;
  total_processing: number;
  total_failed: number;
  last_worker_run_at: string | null;
  worker_status: "idle" | "running" | "error";
  items: StuckSettlement[];
}

interface ResolvePayload {
  action: "force_complete" | "force_fail" | "retry";
  note: string;
}

// ─── Status config ──────────────────────────────────────────────────────────────

const STATUS_META: Record<SettlementStatus, { label: string; color: string }> = {
  pending:    { label: "รอดำเนินการ",   color: "bg-yellow-900/50 text-yellow-400" },
  processing: { label: "กำลังประมวลผล", color: "bg-blue-900/50 text-blue-400" },
  completed:  { label: "สำเร็จ",        color: "bg-green-900/50 text-green-400" },
  failed:     { label: "ล้มเหลว",       color: "bg-red-900/50 text-red-400" },
  resolved:   { label: "แก้ไขแล้ว",     color: "bg-gray-700 text-gray-400" },
};

const JOB_TYPE_LABELS: Record<string, string> = {
  repair:   "ซ่อม",
  resell:   "ขายมือสอง",
  scrap:    "ซาก",
  maintain: "ดูแล",
};

// ─── Sub-components ────────────────────────────────────────────────────────────

function SummaryCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-3xl font-bold font-mono ${color}`}>{value.toLocaleString()}</p>
    </div>
  );
}

function ResolveModal({
  settlement,
  onClose,
  onSubmit,
  loading,
}: {
  settlement: StuckSettlement;
  onClose: () => void;
  onSubmit: (id: string, payload: ResolvePayload) => Promise<void>;
  loading: boolean;
}) {
  const [action, setAction] = useState<ResolvePayload["action"]>("retry");
  const [note, setNote] = useState("");

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onClose}>
      <div className="bg-gray-900 rounded-xl border border-gray-700 p-6 w-full max-w-md"
        onClick={e => e.stopPropagation()}>
        <h3 className="font-semibold mb-1">🔧 แก้ไข Settlement ค้าง</h3>
        <p className="text-xs text-gray-500 mb-4 font-mono">{settlement.id.slice(0, 12)}…</p>

        <div className="space-y-3 mb-4">
          <div className="bg-gray-800 rounded-lg p-3 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-500">Job</span>
              <span className="font-mono text-xs">{settlement.job_id.slice(0, 8)}… ({JOB_TYPE_LABELS[settlement.job_type] ?? settlement.job_type})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">จำนวน</span>
              <span className="font-mono text-yellow-400">{settlement.amount.toLocaleString()} G</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">ค้างมา</span>
              <span className="text-red-400">{settlement.stuck_since_hours.toFixed(1)} ชั่วโมง</span>
            </div>
            {settlement.error_message && (
              <div className="mt-2 text-xs text-red-400 bg-red-900/20 rounded p-2">
                {settlement.error_message}
              </div>
            )}
          </div>

          <div>
            <label className="text-xs text-gray-500 block mb-1">การดำเนินการ (Action)</label>
            <select value={action} onChange={e => setAction(e.target.value as ResolvePayload["action"])}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
              <option value="retry">🔄 Retry — ลองประมวลผลอีกครั้ง</option>
              <option value="force_complete">✅ Force Complete — บังคับให้สำเร็จ</option>
              <option value="force_fail">❌ Force Fail — บังคับให้ล้มเหลว</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-500 block mb-1">หมายเหตุ (บังคับ)</label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="อธิบายเหตุผลที่แก้ไข settlement นี้..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 resize-none"
              rows={3}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={onClose}
            className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors">
            ยกเลิก
          </button>
          <button
            onClick={() => onSubmit(settlement.id, { action, note })}
            disabled={loading || note.trim().length < 5}
            className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg text-sm font-medium transition-colors">
            {loading ? "กำลังส่ง..." : "ยืนยันแก้ไข"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function SettlementReconciliationPage() {
  const router = useRouter();
  const isSuper = isSuperAdmin();

  const [report, setReport] = useState<ReconciliationReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedSettlement, setSelectedSettlement] = useState<StuckSettlement | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  const showToast = (msg: string, type: "ok" | "err") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchReport = useCallback(async () => {
    try {
      const d = await api.get<ReconciliationReport>("/reconciliation");
      setReport(d);
    } catch (e) {
      showToast(`❌ โหลดข้อมูลไม่สำเร็จ: ${(e as Error).message}`, "err");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login"); return; }
    fetchReport();
  }, [router, fetchReport]);

  async function handleRunWorker() {
    if (!isSuper) return;
    setRunning(true);
    try {
      await api.post("/reconciliation/run", {});
      showToast("✅ Reconciliation Worker รันเสร็จ", "ok");
      await fetchReport();
    } catch (e) {
      showToast(`❌ ${(e as Error).message}`, "err");
    } finally {
      setRunning(false);
    }
  }

  async function handleResolve(id: string, payload: ResolvePayload) {
    if (payload.note.trim().length < 5) return;
    setResolving(true);
    try {
      await api.patch(`/reconciliation/${id}/resolve`, payload);
      showToast("✅ แก้ไข settlement สำเร็จ", "ok");
      setSelectedSettlement(null);
      await fetchReport();
    } catch (e) {
      showToast(`❌ ${(e as Error).message}`, "err");
    } finally {
      setResolving(false);
    }
  }

  const displayItems = (report?.items ?? []).filter(item => {
    if (filterStatus === "all") return true;
    return item.status === filterStatus;
  });

  const workerStatusConfig = {
    idle:    { label: "⏸ Idle",     color: "text-gray-400" },
    running: { label: "▶ Running",  color: "text-blue-400" },
    error:   { label: "🚨 Error",   color: "text-red-400" },
  };

  return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      <Sidebar />
      <main className="flex-1 p-8 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">⚙️ Settlement Reconciliation</h1>
            <p className="text-gray-400 text-sm mt-1">
              ตรวจสอบและแก้ไข settlement (การชำระเงิน) ที่ค้างอยู่ในระบบ
            </p>
          </div>
          {isSuper && (
            <button
              onClick={handleRunWorker}
              disabled={running}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg text-sm font-medium transition-colors">
              {running ? (
                <><span className="animate-spin">⟳</span> กำลังรัน...</>
              ) : (
                <>▶ Run Worker ตอนนี้</>
              )}
            </button>
          )}
        </div>

        {loading ? (
          <p className="text-gray-500">กำลังโหลด...</p>
        ) : report && (
          <>
            {/* Worker Status */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">Worker Status:</span>
                <span className={`text-sm font-semibold ${workerStatusConfig[report.worker_status].color}`}>
                  {workerStatusConfig[report.worker_status].label}
                </span>
              </div>
              <span className="text-xs text-gray-600">
                {report.last_worker_run_at
                  ? `ล่าสุด: ${new Date(report.last_worker_run_at).toLocaleString("th-TH")}`
                  : "ยังไม่เคยรัน"}
              </span>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-4 gap-4">
              <SummaryCard label="ค้างทั้งหมด" value={report.total_stuck} color="text-yellow-400" />
              <SummaryCard label="Pending" value={report.total_pending} color="text-yellow-300" />
              <SummaryCard label="Processing" value={report.total_processing} color="text-blue-400" />
              <SummaryCard label="Failed" value={report.total_failed} color="text-red-400" />
            </div>

            {/* Filter */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500 shrink-0">กรองตามสถานะ:</span>
              <div className="flex gap-1 bg-gray-900 rounded-xl p-1 border border-gray-800">
                {["all", "pending", "processing", "failed"].map(s => (
                  <button key={s}
                    onClick={() => setFilterStatus(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                      filterStatus === s ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
                    }`}>
                    {s === "all" ? "ทั้งหมด" : STATUS_META[s as SettlementStatus]?.label ?? s}
                  </button>
                ))}
              </div>
              <span className="text-xs text-gray-600">แสดง {displayItems.length} รายการ</span>
            </div>

            {/* Table */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 text-left border-b border-gray-800">
                    <th className="px-6 py-3">Settlement ID</th>
                    <th className="px-6 py-3">Job</th>
                    <th className="px-6 py-3">จำนวน (G)</th>
                    <th className="px-6 py-3">สถานะ</th>
                    <th className="px-6 py-3">ค้างมา (ชม.)</th>
                    <th className="px-6 py-3">ข้อผิดพลาด</th>
                    {isSuper && <th className="px-6 py-3">จัดการ</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {displayItems.map(item => {
                    const sc = STATUS_META[item.status] ?? { label: item.status, color: "bg-gray-800 text-gray-300" };
                    const isUrgent = item.stuck_since_hours > 24;
                    return (
                      <tr key={item.id} className={`hover:bg-gray-800/40 ${isUrgent ? "border-l-2 border-red-700" : ""}`}>
                        <td className="px-6 py-3">
                          <span className="font-mono text-xs text-gray-400">{item.id.slice(0, 12)}…</span>
                        </td>
                        <td className="px-6 py-3">
                          <span className="text-xs text-gray-300">{JOB_TYPE_LABELS[item.job_type] ?? item.job_type}</span>
                          <span className="block font-mono text-xs text-gray-600">{item.job_id.slice(0, 8)}…</span>
                        </td>
                        <td className="px-6 py-3 font-mono text-yellow-400 font-semibold">
                          {item.amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${sc.color}`}>{sc.label}</span>
                        </td>
                        <td className={`px-6 py-3 font-mono text-xs ${isUrgent ? "text-red-400 font-bold" : "text-gray-400"}`}>
                          {item.stuck_since_hours.toFixed(1)} {isUrgent && "⚠️"}
                        </td>
                        <td className="px-6 py-3 text-xs text-red-400 max-w-xs truncate">
                          {item.error_message ?? <span className="text-gray-600">—</span>}
                        </td>
                        {isSuper && (
                          <td className="px-6 py-3">
                            {item.status !== "resolved" && item.status !== "completed" && (
                              <button
                                onClick={() => setSelectedSettlement(item)}
                                className="px-3 py-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded text-xs transition-colors">
                                🔧 แก้ไข
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                  {displayItems.length === 0 && (
                    <tr>
                      <td colSpan={isSuper ? 7 : 6} className="px-6 py-12 text-center text-gray-500">
                        {filterStatus === "all" ? "✅ ไม่มี settlement ค้าง" : "ไม่มีรายการในสถานะนี้"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {!isSuper && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-sm text-gray-400">
                ⚠️ การ Run Worker และแก้ไข settlement ต้องการสิทธิ์ Super Admin
              </div>
            )}
          </>
        )}

        {/* Resolve Modal */}
        {selectedSettlement && (
          <ResolveModal
            settlement={selectedSettlement}
            onClose={() => setSelectedSettlement(null)}
            onSubmit={handleResolve}
            loading={resolving}
          />
        )}

        {/* Toast */}
        {toast && (
          <div className={`fixed bottom-6 right-6 px-4 py-3 rounded-xl text-sm font-medium shadow-xl z-50 ${
            toast.type === "ok"
              ? "bg-green-900 text-green-200 border border-green-700"
              : "bg-red-900 text-red-200 border border-red-700"
          }`}>
            {toast.msg}
          </div>
        )}
      </main>
    </div>
  );
}
