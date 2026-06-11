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
  pending:     { label: "รอโอนเงิน",   color: "bg-yellow-50 text-yellow-700" },
  transferred: { label: "โอนแล้ว",     color: "bg-green-50 text-green-700" },
  rejected:    { label: "ปฏิเสธ",      color: "bg-red-50 text-red-700" },
};

// mock fallback — ลบตอน Phase 4 (TD-06)
const MOCK_WITHDRAWALS: PaginatedWithdrawals = {
  items: [
    { id: "WD-2026-0401", user_id: 601, user_name: "พิมพ์ใจ สุขดี", gold_points: 500, thb_amount: 500, bank_name: "ธนาคารกรุงไทย", bank_account_number: "123-4-56789-0", bank_account_name: "พิมพ์ใจ สุขดี", requested_at: "2026-06-10T07:00:00Z", status: "pending", note: null },
    { id: "WD-2026-0402", user_id: 602, user_name: "ณรงค์ชัย ดีมาก", gold_points: 1000, thb_amount: 1000, bank_name: "ธนาคารกสิกรไทย", bank_account_number: "098-7-65432-1", bank_account_name: "ณรงค์ชัย ดีมาก", requested_at: "2026-06-10T09:30:00Z", status: "pending", note: null },
    { id: "WD-2026-0403", user_id: 603, user_name: "อรทัย งามเจริญ", gold_points: 300, thb_amount: 300, bank_name: "ธนาคารไทยพาณิชย์", bank_account_number: "456-7-89012-3", bank_account_name: "อรทัย งามเจริญ", requested_at: "2026-06-09T13:00:00Z", status: "transferred", note: null },
    { id: "WD-2026-0404", user_id: 604, user_name: "กมลทิพย์ แสงจันทร์", gold_points: 750, thb_amount: 750, bank_name: "ธนาคารกรุงเทพ", bank_account_number: "789-1-23456-7", bank_account_name: "กมลทิพย์ แสงจันทร์", requested_at: "2026-06-08T10:00:00Z", status: "rejected", note: "ข้อมูลบัญชีไม่ถูกต้อง" },
    { id: "WD-2026-0405", user_id: 605, user_name: "ปริญญา มีทอง", gold_points: 2000, thb_amount: 2000, bank_name: "ธนาคารทหารไทย", bank_account_number: "321-6-54987-0", bank_account_name: "ปริญญา มีทอง", requested_at: "2026-06-08T15:45:00Z", status: "pending", note: null },
  ],
  total: 5,
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
    } catch (e) {
      if ((e as Error).message === "UNAUTHORIZED") { router.push("/login"); return; }
      console.warn("[mock fallback]", e);
      setItems(MOCK_WITHDRAWALS.items);
      setTotal(MOCK_WITHDRAWALS.total);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, router]);

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
      showToast("✅ ยืนยันการโอนเงินสำเร็จ — พอยต์ทอง (Gold Point) ถูกหักแล้ว", "ok");
      fetchData();
    } catch (e) {
      if ((e as Error).message === "UNAUTHORIZED") { router.push("/login"); return; }
      showToast("โหมดสาธิต: backend ยังไม่พร้อม", "err");
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold">🏦 จัดการคำขอถอนเงิน</h1>
        </div>
        <p className="text-gray-500 text-sm mb-6">
          อนุมัติและยืนยันการโอนเงินให้ผู้ใช้ที่ขอถอนพอยต์ทอง (Gold Point) → บาท
        </p>

        {/* Filter tabs */}
        <div className="flex gap-1 mb-6 bg-white rounded-xl p-1 border border-gray-200 w-fit">
          {(["pending", "transferred", "rejected"] as const).map(s => (
            <button key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-4 py-1.5 rounded-lg text-xs transition-colors ${
                filterStatus === s ? "bg-admin-surface text-admin-primary" : "text-gray-500 hover:text-gray-900"
              }`}>
              {STATUS_META[s].label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-200 text-sm text-gray-500">
            พบ {total.toLocaleString()} รายการ
          </div>

          {loading ? (
            <p className="px-6 py-8 text-gray-500">กำลังโหลด...</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-left border-b border-gray-200">
                  <th className="px-6 py-3">ผู้ใช้</th>
                  <th className="px-6 py-3">พอยต์ทอง</th>
                  <th className="px-6 py-3">จำนวนเงิน (฿)</th>
                  <th className="px-6 py-3">บัญชีปลายทาง</th>
                  <th className="px-6 py-3">เวลา</th>
                  <th className="px-6 py-3">สถานะ</th>
                  {filterStatus === "pending" && <th className="px-6 py-3">ดำเนินการ</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.map(item => {
                  const sc = STATUS_META[item.status];
                  const isProcessing = actionLoading === item.id;
                  const needsConfirm = confirmId === item.id;
                  return (
                    <tr key={item.id} className="hover:bg-gray-100/40">
                      <td className="px-6 py-3">
                        <p className="text-sm">{item.user_name}</p>
                        <p className="text-xs text-gray-500">ID: {item.user_id}</p>
                      </td>
                      <td className="px-6 py-3 font-mono text-yellow-700 font-semibold">
                        {item.gold_points.toLocaleString()} G
                      </td>
                      <td className="px-6 py-3 font-mono text-green-600 font-semibold">
                        ฿{item.thb_amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-3">
                        <p className="text-xs text-gray-200">{item.bank_name}</p>
                        <p className="text-xs font-mono text-gray-500">{item.bank_account_number}</p>
                        <p className="text-xs text-gray-500">{item.bank_account_name}</p>
                      </td>
                      <td className="px-6 py-3 text-xs text-gray-500">
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
                              <p className="text-xs text-yellow-700">ยืนยันโอนเงินแล้ว?</p>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleConfirmTransfer(item.id)}
                                  disabled={isProcessing}
                                  className="px-3 py-1 bg-brand-success hover:bg-brand-success/90 disabled:opacity-40 rounded text-xs transition-colors">
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
                              className="px-3 py-1 bg-blue-700 hover:bg-blue-600 disabled:opacity-40 rounded text-xs font-medium transition-colors whitespace-nowrap">
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
