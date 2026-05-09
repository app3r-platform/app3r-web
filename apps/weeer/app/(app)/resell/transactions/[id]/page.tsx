"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { resellApi } from "../../_lib/api";
import type { ResellTransaction } from "../../_lib/types";
import { LISTING_STATUS_LABEL, LISTING_STATUS_COLOR } from "../../_lib/types";

const ACTIONS: { status: string; action: "confirm_delivery" | "complete" | "dispute"; label: string; color: string }[] = [
  { status: "delivered", action: "complete", label: "✅ ยืนยันรับสินค้า / เสร็จสิ้น", color: "bg-green-700 hover:bg-green-800 text-white" },
  { status: "inspection_period", action: "complete", label: "✅ ตรวจสอบผ่าน / เสร็จสิ้น", color: "bg-green-700 hover:bg-green-800 text-white" },
  { status: "delivered", action: "dispute", label: "⚠️ พิพาท / มีปัญหา", color: "bg-red-100 hover:bg-red-200 text-red-700" },
  { status: "inspection_period", action: "dispute", label: "⚠️ พิพาท / มีปัญหา", color: "bg-red-100 hover:bg-red-200 text-red-700" },
];

export default function ResellTransactionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [tx, setTx] = useState<ResellTransaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    resellApi.transactionsGet(id)
      .then(setTx)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleAction(action: "confirm_delivery" | "complete" | "dispute") {
    setActionLoading(true);
    try {
      const updated = await resellApi.transitionStatus(id, action);
      setTx(updated);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) return <div className="flex items-center justify-center h-48 text-gray-400">กำลังโหลด…</div>;
  if (error && !tx) return <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-yellow-700 text-sm">⚠️ ระบบขายมือสองกำลังพัฒนา — {error}</div>;
  if (!tx) return null;

  const availableActions = ACTIONS.filter(a => a.status === tx.status);

  return (
    <div className="space-y-5 max-w-xl">
      <div className="flex items-center gap-3">
        <Link href="/resell/transactions" className="text-gray-400 hover:text-gray-600">←</Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900 truncate">{tx.applianceName}</h1>
        </div>
        <span className={`shrink-0 text-xs px-2.5 py-1 rounded-full font-medium ${LISTING_STATUS_COLOR[tx.status]}`}>
          {LISTING_STATUS_LABEL[tx.status]}
        </span>
      </div>

      {/* Detail card */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3 text-sm">
        <div className="grid grid-cols-2 gap-3">
          <div><p className="text-xs text-gray-400">ผู้ขาย</p><p className="font-medium">{tx.sellerName}</p></div>
          <div><p className="text-xs text-gray-400">ผู้ซื้อ</p><p className="font-medium">{tx.buyerName}</p></div>
          <div><p className="text-xs text-gray-400">ราคา</p><p className="text-xl font-bold text-green-700">{tx.price.toLocaleString()} pts</p></div>
          <div><p className="text-xs text-gray-400">จัดส่ง</p><p className="font-medium">{tx.deliveryMethod}</p></div>
          <div><p className="text-xs text-gray-400">เริ่มต้น</p><p className="font-medium">{new Date(tx.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" })}</p></div>
          <div><p className="text-xs text-gray-400">อัพเดต</p><p className="font-medium">{new Date(tx.updatedAt).toLocaleDateString("th-TH", { day: "numeric", month: "long" })}</p></div>
        </div>

        {/* State machine progress */}
        <div className="border-t border-gray-50 pt-3">
          <p className="text-xs text-gray-400 mb-2">ขั้นตอน</p>
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {(["in_progress", "delivered", "inspection_period", "completed"] as const).map((s, i) => (
              <div key={s} className="flex items-center gap-1 shrink-0">
                <div className={`text-xs px-2 py-1 rounded-lg font-medium ${tx.status === s ? LISTING_STATUS_COLOR[s] : "bg-gray-50 text-gray-400"}`}>
                  {LISTING_STATUS_LABEL[s]}
                </div>
                {i < 3 && <span className="text-gray-300 text-xs">→</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      {availableActions.length > 0 && (
        <div className="space-y-2">
          {availableActions.map(a => (
            <button key={a.action} onClick={() => handleAction(a.action)} disabled={actionLoading}
              className={`w-full font-semibold py-3 rounded-xl transition-colors disabled:opacity-60 ${a.color}`}>
              {actionLoading ? "กำลังดำเนินการ…" : a.label}
            </button>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-red-500 text-center">{error}</p>}
    </div>
  );
}
