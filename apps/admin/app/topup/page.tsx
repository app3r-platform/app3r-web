"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/sidebar";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TopupRequest {
  id: number;
  user_id: number;
  user_name: string;
  amount: number;
  payment_method: string;
  slip_url: string | null;
  reference_no: string | null;
  status: string;
  reject_reason: string | null;
  created_at: string;
  reviewed_at: string | null;
}

interface PaginatedTopup {
  items: TopupRequest[];
  total: number;
  page: number;
  pages: number;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TopupPage() {
  const router = useRouter();

  const [data, setData] = useState<PaginatedTopup | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("pending");

  // Modal state สำหรับ reject
  const [rejectModal, setRejectModal] = useState<{ id: number; userName: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (statusFilter) params.set("status", statusFilter);
      const result = await api.get<PaginatedTopup>(`/admin/topup/requests?${params}`);
      setData(result);
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, router]);

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login"); return; }
    fetchData();
  }, [fetchData, router]);

  // ── Actions ────────────────────────────────────────────────────────────────
  async function handleApprove(id: number) {
    if (!confirm("ยืนยันอนุมัติการเติม Point?")) return;
    setActionLoading(id);
    try {
      await api.patch(`/admin/topup/requests/${id}/review`, { action: "approve" });
      showToast("อนุมัติเติม Point สำเร็จ ✓", "ok");
      fetchData();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "เกิดข้อผิดพลาด", "err");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject() {
    if (!rejectModal) return;
    if (!rejectReason.trim()) {
      showToast("กรุณาระบุเหตุผล", "err");
      return;
    }
    setActionLoading(rejectModal.id);
    try {
      await api.patch(`/admin/topup/requests/${rejectModal.id}/review`, {
        action: "reject",
        reject_reason: rejectReason.trim(),
      });
      showToast("ปฏิเสธคำขอแล้ว", "ok");
      setRejectModal(null);
      setRejectReason("");
      fetchData();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "เกิดข้อผิดพลาด", "err");
    } finally {
      setActionLoading(null);
    }
  }

  function showToast(msg: string, type: "ok" | "err") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  // ── Stats ─────────────────────────────────────────────────────────────────
  const pendingCount = statusFilter === "pending" ? data?.total ?? 0 : "—";

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      <Sidebar />

      <main className="flex-1 p-8 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold">อนุมัติการเติม Point</h1>
          {statusFilter === "pending" && data && (
            <span className="bg-yellow-600 text-white text-sm font-semibold px-3 py-1 rounded-full">
              รออนุมัติ {data.total} รายการ
            </span>
          )}
        </div>
        <p className="text-gray-400 text-sm mb-6">
          ตรวจสอบสลิปและอนุมัติ/ปฏิเสธคำขอเติม Point ของผู้ใช้
        </p>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-5">
          {[
            { val: "pending",  label: "รออนุมัติ",   color: "yellow" },
            { val: "approved", label: "อนุมัติแล้ว", color: "green"  },
            { val: "rejected", label: "ปฏิเสธแล้ว", color: "red"    },
            { val: "",         label: "ทั้งหมด",     color: "gray"   },
          ].map(({ val, label }) => (
            <button
              key={val}
              onClick={() => { setStatusFilter(val); setPage(1); }}
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                statusFilter === val
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-gray-500">
              <span className="animate-spin mr-3 text-xl">⟳</span> กำลังโหลด...
            </div>
          ) : !data || data.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <div className="text-4xl mb-3">📭</div>
              <p>ไม่มีคำขอในสถานะนี้</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-left border-b border-gray-800">
                  <th className="px-5 py-3 w-12">ID</th>
                  <th className="px-5 py-3">ผู้ใช้</th>
                  <th className="px-5 py-3">จำนวน</th>
                  <th className="px-5 py-3">วิธีชำระ</th>
                  <th className="px-5 py-3">เลขอ้างอิง</th>
                  <th className="px-5 py-3">สลิป</th>
                  <th className="px-5 py-3">สถานะ</th>
                  <th className="px-5 py-3">วันที่</th>
                  <th className="px-5 py-3 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {data.items.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-5 py-3.5 text-gray-500 text-xs">{req.id}</td>

                    <td className="px-5 py-3.5">
                      <div className="font-medium">{req.user_name}</div>
                      <div className="text-xs text-gray-500">UID: {req.user_id}</div>
                    </td>

                    <td className="px-5 py-3.5">
                      <span className="text-lg font-bold text-white">
                        {req.amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-xs text-gray-500 ml-1">Points</span>
                    </td>

                    <td className="px-5 py-3.5">
                      <PaymentMethodBadge method={req.payment_method} />
                    </td>

                    <td className="px-5 py-3.5 text-gray-400 text-xs font-mono">
                      {req.reference_no ?? <span className="text-gray-600">—</span>}
                    </td>

                    <td className="px-5 py-3.5">
                      {req.slip_url ? (
                        <a
                          href={req.slip_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-400 hover:text-blue-300 text-xs underline underline-offset-2"
                        >
                          ดูสลิป ↗
                        </a>
                      ) : (
                        <span className="text-gray-600 text-xs">ไม่มี</span>
                      )}
                    </td>

                    <td className="px-5 py-3.5">
                      <StatusBadge status={req.status} />
                      {req.reject_reason && (
                        <div className="text-xs text-red-400 mt-1 max-w-[140px] truncate" title={req.reject_reason}>
                          {req.reject_reason}
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-gray-500 text-xs">
                      {new Date(req.created_at).toLocaleDateString("th-TH", {
                        day: "2-digit", month: "short", year: "2-digit",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </td>

                    <td className="px-5 py-3.5">
                      {req.status === "pending" && (
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleApprove(req.id)}
                            disabled={actionLoading === req.id}
                            className="px-3 py-1.5 text-xs bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white rounded-lg transition-colors"
                          >
                            {actionLoading === req.id ? "..." : "✓ อนุมัติ"}
                          </button>
                          <button
                            onClick={() => setRejectModal({ id: req.id, userName: req.user_name })}
                            disabled={actionLoading === req.id}
                            className="px-3 py-1.5 text-xs bg-gray-700 hover:bg-red-800 disabled:opacity-50 text-gray-300 hover:text-white rounded-lg transition-colors"
                          >
                            ✕ ปฏิเสธ
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {data && data.pages > 1 && (
          <div className="flex items-center justify-between mt-5">
            <p className="text-sm text-gray-500">
              หน้า {data.page} จาก {data.pages} ({data.total} รายการ)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 text-sm bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-white rounded-lg"
              >
                ← ก่อนหน้า
              </button>
              <button
                onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                disabled={page === data.pages}
                className="px-4 py-2 text-sm bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-white rounded-lg"
              >
                ถัดไป →
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold mb-1">ปฏิเสธคำขอ</h3>
            <p className="text-sm text-gray-400 mb-4">
              ผู้ใช้: <span className="text-white">{rejectModal.userName}</span>
            </p>
            <label className="block text-sm text-gray-400 mb-2">เหตุผลที่ปฏิเสธ <span className="text-red-400">*</span></label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="เช่น: สลิปไม่ชัด, ยอดไม่ตรง, สลิปซ้ำ..."
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 placeholder-gray-600 resize-none"
            />
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => { setRejectModal(null); setRejectReason(""); }}
                className="flex-1 py-2.5 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading !== null}
                className="flex-1 py-2.5 text-sm bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                {actionLoading !== null ? "กำลังดำเนินการ..." : "ยืนยันปฏิเสธ"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-xl shadow-xl text-sm font-medium ${
          toast.type === "ok" ? "bg-green-700 text-white" : "bg-red-700 text-white"
        }`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PaymentMethodBadge({ method }: { method: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    bank_transfer: { label: "โอนธนาคาร", cls: "bg-blue-900 text-blue-300" },
    promptpay:     { label: "PromptPay",  cls: "bg-purple-900 text-purple-300" },
    truemoney:     { label: "TrueMoney",  cls: "bg-orange-900 text-orange-300" },
  };
  const m = map[method] ?? { label: method, cls: "bg-gray-800 text-gray-400" };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${m.cls}`}>
      {m.label}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending:  { label: "รออนุมัติ",   cls: "bg-yellow-900 text-yellow-300" },
    approved: { label: "อนุมัติแล้ว", cls: "bg-green-900 text-green-300" },
    rejected: { label: "ปฏิเสธแล้ว", cls: "bg-red-900 text-red-300" },
  };
  const s = map[status] ?? { label: status, cls: "bg-gray-800 text-gray-400" };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>
      {s.label}
    </span>
  );
}
