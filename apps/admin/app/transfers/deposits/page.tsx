"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/sidebar";

// Decision Record C — Manual Bank Transfer Module (2026-05-14)
// ระยะแรก: Admin ตรวจสลิปโอนเงิน + อนุมัติ/ปฏิเสธ → เพิ่ม Point

interface DepositRequest {
  id: string;
  user_id: number;
  user_name: string;
  amount: number;
  reference: string;
  slip_url: string | null;
  submitted_at: string;
  status: "pending" | "verified" | "rejected";
  note: string | null;
}

interface PaginatedDeposits {
  items: DepositRequest[];
  total: number;
}

const STATUS_META: Record<DepositRequest["status"], { label: string; color: string }> = {
  pending:  { label: "รอตรวจสลิป", color: "bg-yellow-900/50 text-yellow-400" },
  verified: { label: "อนุมัติแล้ว", color: "bg-green-900/50 text-green-400" },
  rejected: { label: "ปฏิเสธ",      color: "bg-red-900/50 text-red-400" },
};

export default function TransferDepositsPage() {
  const router = useRouter();
  const [items, setItems] = useState<DepositRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("pending");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);
  const [slipModal, setSlipModal] = useState<string | null>(null);

  const showToast = (msg: string, type: "ok" | "err") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: filterStatus, limit: "50" });
      const d = await api.get<PaginatedDeposits>(`/admin/transfers/deposits?${params}`);
      setItems(d.items);
      setTotal(d.total);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login"); return; }
    fetchData();
  }, [router, fetchData]);

  async function handleVerify(id: string) {
    setActionLoading(id);
    try {
      await api.patch(`/api/v1/transfers/deposit/${id}/verify/`, {});
      showToast("✅ อนุมัติการเติม Point สำเร็จ", "ok");
      fetchData();
    } catch (e) {
      showToast(`❌ ${(e as Error).message}`, "err");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(id: string) {
    const note = rejectNote[id] ?? "";
    if (note.trim().length < 5) {
      showToast("❌ กรุณาระบุเหตุผลปฏิเสธ (อย่างน้อย 5 ตัวอักษร)", "err");
      return;
    }
    setActionLoading(id);
    try {
      await api.patch(`/api/v1/transfers/deposit/${id}/verify/`, {
        approved: false,
        note,
      });
      showToast("✅ ปฏิเสธรายการสำเร็จ", "ok");
      setRejectNote(prev => { const n = { ...prev }; delete n[id]; return n; });
      fetchData();
    } catch (e) {
      showToast(`❌ ${(e as Error).message}`, "err");
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold">💳 ตรวจสลิปโอนเงิน</h1>
        </div>
        <p className="text-gray-400 text-sm mb-6">
          ตรวจสอบและอนุมัติคำขอเติม Point ผ่านการโอนเงินตรง (Manual Bank Transfer)
        </p>

        {/* Filter tabs */}
        <div className="flex gap-1 mb-6 bg-gray-900 rounded-xl p-1 border border-gray-800 w-fit">
          {(["pending", "verified", "rejected"] as const).map(s => (
            <button key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-4 py-1.5 rounded-lg text-xs transition-colors ${
                filterStatus === s ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
              }`}>
              {STATUS_META[s].label}
            </button>
          ))}
        </div>

        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-800 text-sm text-gray-400">
            พบ {total.toLocaleString()} รายการ
          </div>

          {loading ? (
            <p className="px-6 py-8 text-gray-500">กำลังโหลด...</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-left border-b border-gray-800">
                  <th className="px-6 py-3">ผู้ใช้</th>
                  <th className="px-6 py-3">จำนวนเงิน</th>
                  <th className="px-6 py-3">อ้างอิง</th>
                  <th className="px-6 py-3">สลิป</th>
                  <th className="px-6 py-3">เวลา</th>
                  <th className="px-6 py-3">สถานะ</th>
                  {filterStatus === "pending" && <th className="px-6 py-3">ดำเนินการ</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {items.map(item => {
                  const sc = STATUS_META[item.status];
                  const isProcessing = actionLoading === item.id;
                  return (
                    <tr key={item.id} className="hover:bg-gray-800/40">
                      <td className="px-6 py-3">
                        <p className="text-sm">{item.user_name}</p>
                        <p className="text-xs text-gray-500">ID: {item.user_id}</p>
                      </td>
                      <td className="px-6 py-3 font-mono text-green-400 font-semibold">
                        ฿{item.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-3 font-mono text-xs text-gray-400">
                        {item.reference || "—"}
                      </td>
                      <td className="px-6 py-3">
                        {item.slip_url ? (
                          <button
                            onClick={() => setSlipModal(item.slip_url!)}
                            className="text-xs text-blue-400 hover:text-blue-300 underline">
                            ดูสลิป 🖼️
                          </button>
                        ) : (
                          <span className="text-xs text-gray-600">ไม่มี</span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-xs text-gray-400">
                        {new Date(item.submitted_at).toLocaleString("th-TH")}
                      </td>
                      <td className="px-6 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${sc.color}`}>
                          {sc.label}
                        </span>
                        {item.note && (
                          <p className="text-xs text-gray-500 mt-1">{item.note}</p>
                        )}
                      </td>
                      {filterStatus === "pending" && (
                        <td className="px-6 py-3">
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => handleVerify(item.id)}
                              disabled={isProcessing}
                              className="px-3 py-1 bg-green-700 hover:bg-green-600 disabled:bg-gray-700 rounded text-xs font-medium transition-colors">
                              {isProcessing ? "..." : "✅ อนุมัติ"}
                            </button>
                            <div className="flex gap-1">
                              <input
                                type="text"
                                placeholder="เหตุผลปฏิเสธ..."
                                value={rejectNote[item.id] ?? ""}
                                onChange={e => setRejectNote(prev => ({ ...prev, [item.id]: e.target.value }))}
                                className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs w-32 focus:outline-none focus:border-red-500"
                              />
                              <button
                                onClick={() => handleReject(item.id)}
                                disabled={isProcessing}
                                className="px-2 py-1 bg-red-800 hover:bg-red-700 disabled:bg-gray-700 rounded text-xs transition-colors">
                                ❌
                              </button>
                            </div>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={filterStatus === "pending" ? 7 : 6}
                      className="px-6 py-10 text-center text-gray-500">
                      ไม่มีรายการ
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Slip modal */}
        {slipModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setSlipModal(null)}>
            <div className="bg-gray-900 rounded-xl border border-gray-700 p-4 max-w-lg w-full"
              onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-sm">สลิปโอนเงิน</h3>
                <button onClick={() => setSlipModal(null)}
                  className="text-gray-500 hover:text-white text-lg">✕</button>
              </div>
              <img src={slipModal} alt="slip" className="w-full rounded-lg max-h-96 object-contain" />
            </div>
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div className={`fixed bottom-6 right-6 px-4 py-3 rounded-xl text-sm font-medium shadow-xl z-50 ${
            toast.type === "ok" ? "bg-green-900 text-green-200 border border-green-700"
              : "bg-red-900 text-red-200 border border-red-700"
          }`}>
            {toast.msg}
          </div>
        )}
      </main>
    </div>
  );
}
