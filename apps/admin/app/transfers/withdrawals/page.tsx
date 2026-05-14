"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/sidebar";

// Decision Record C — Manual Bank Transfer Module (2026-05-14)
// ระยะแรก: Admin ยืนยันการโอนเงินถอน Gold Point → เงิน

interface WithdrawalRequest {
  id: string;
  user_id: number;
  user_name: string;
  gold_points: number;
  thb_amount: number;
  bank_name: string;
  bank_account_number: string;
  bank_account_name: string;
  requested_at: string;
  status: "pending" | "transferred" | "rejected";
  note: string | null;
}

interface PaginatedWithdrawals {
  items: WithdrawalRequest[];
  total: number;
}

const STATUS_META: Record<WithdrawalRequest["status"], { label: string; color: string }> = {
  pending:     { label: "รอโอนเงิน",   color: "bg-yellow-900/50 text-yellow-400" },
  transferred: { label: "โอนแล้ว",     color: "bg-green-900/50 text-green-400" },
  rejected:    { label: "ปฏิเสธ",      color: "bg-red-900/50 text-red-400" },
};

export default function TransferWithdrawalsPage() {
  const router = useRouter();
  const [items, setItems] = useState<WithdrawalRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("pending");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  const showToast = (msg: string, type: "ok" | "err") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: filterStatus, limit: "50" });
      const d = await api.get<PaginatedWithdrawals>(`/admin/transfers/withdrawals?${params}`);
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

  async function handleConfirmTransfer(id: string) {
    if (confirmId !== id) {
      setConfirmId(id);
      return;
    }
    setActionLoading(id);
    setConfirmId(null);
    try {
      await api.patch(`/api/v1/transfers/withdraw/${id}/confirm/`, {});
      showToast("✅ ยืนยันการโอนเงินสำเร็จ — Gold Point ถูกหักแล้ว", "ok");
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
          <h1 className="text-2xl font-bold">🏦 จัดการคำขอถอนเงิน</h1>
        </div>
        <p className="text-gray-400 text-sm mb-6">
          อนุมัติและยืนยันการโอนเงินให้ผู้ใช้ที่ขอถอน Gold Point → บาท
        </p>

        {/* Filter tabs */}
        <div className="flex gap-1 mb-6 bg-gray-900 rounded-xl p-1 border border-gray-800 w-fit">
          {(["pending", "transferred", "rejected"] as const).map(s => (
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
                  <th className="px-6 py-3">Gold Point</th>
                  <th className="px-6 py-3">จำนวนเงิน (฿)</th>
                  <th className="px-6 py-3">บัญชีปลายทาง</th>
                  <th className="px-6 py-3">เวลา</th>
                  <th className="px-6 py-3">สถานะ</th>
                  {filterStatus === "pending" && <th className="px-6 py-3">ดำเนินการ</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {items.map(item => {
                  const sc = STATUS_META[item.status];
                  const isProcessing = actionLoading === item.id;
                  const needsConfirm = confirmId === item.id;
                  return (
                    <tr key={item.id} className="hover:bg-gray-800/40">
                      <td className="px-6 py-3">
                        <p className="text-sm">{item.user_name}</p>
                        <p className="text-xs text-gray-500">ID: {item.user_id}</p>
                      </td>
                      <td className="px-6 py-3 font-mono text-yellow-400 font-semibold">
                        {item.gold_points.toLocaleString()} G
                      </td>
                      <td className="px-6 py-3 font-mono text-green-400 font-semibold">
                        ฿{item.thb_amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-3">
                        <p className="text-xs text-gray-200">{item.bank_name}</p>
                        <p className="text-xs font-mono text-gray-400">{item.bank_account_number}</p>
                        <p className="text-xs text-gray-500">{item.bank_account_name}</p>
                      </td>
                      <td className="px-6 py-3 text-xs text-gray-400">
                        {new Date(item.requested_at).toLocaleString("th-TH")}
                      </td>
                      <td className="px-6 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${sc.color}`}>
                          {sc.label}
                        </span>
                      </td>
                      {filterStatus === "pending" && (
                        <td className="px-6 py-3">
                          {needsConfirm ? (
                            <div className="flex flex-col gap-1">
                              <p className="text-xs text-yellow-400">ยืนยันโอนเงินแล้ว?</p>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleConfirmTransfer(item.id)}
                                  disabled={isProcessing}
                                  className="px-3 py-1 bg-green-700 hover:bg-green-600 disabled:bg-gray-700 rounded text-xs transition-colors">
                                  ✅ ใช่
                                </button>
                                <button
                                  onClick={() => setConfirmId(null)}
                                  className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs transition-colors">
                                  ยกเลิก
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleConfirmTransfer(item.id)}
                              disabled={isProcessing}
                              className="px-3 py-1 bg-blue-700 hover:bg-blue-600 disabled:bg-gray-700 rounded text-xs font-medium transition-colors whitespace-nowrap">
                              {isProcessing ? "..." : "✅ ยืนยันโอนแล้ว"}
                            </button>
                          )}
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
