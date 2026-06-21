"use client";
/**
 * components/payment/PaymentWalletCard.tsx
 * CMD #117-F (T-CHAT-03 · Advisor Gen 117): WeeeT ไม่ถือ wallet / ช่างไม่ถือ wallet
 *  - view-only เท่านั้น · ไม่มี balance แบบ wallet holder · ไม่มี "พร้อมโอน"/โอน/ถอน
 *  - ค่าบริการ (Service Fee) ของงานที่ช่างรับผิดชอบ ชำระเข้าร้าน (WeeeR) ที่ช่างสังกัด
 *  - แสดงรายละเอียดธุรกรรม (read-only) — สอดคล้องกับหน้า /wallet
 */
import { useState, useEffect } from "react";
import { getAdapter } from "@/lib/dal";
import type { WalletTransaction } from "@/lib/dal/types";

export function PaymentWalletCard() {
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTx, setShowTx] = useState(false);

  useEffect(() => {
    const dal = getAdapter();
    // view-only: ดึงเฉพาะรายการธุรกรรม (read-only) — ไม่อ่าน balance แบบ holder
    dal.payment.getTransactions(10).then((t) => {
      if (t.ok) setTransactions(t.data);
      else setError(t.error);
      setLoading(false);
    });
  }, []);

  const fmt = (n: number) => n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (loading) return <div className="bg-gray-700 rounded-xl p-4 animate-pulse h-20" />;
  if (error) return <div className="bg-red-950/40 border border-red-800 rounded-xl p-3 text-xs text-red-300">⚠️ {error}</div>;

  return (
    <div className="space-y-3">
      {/* View-only context banner — ช่าง (WeeeT) ไม่ถือพอยต์/กระเป๋าเงินเอง */}
      <div className="bg-sky-900/40 border border-sky-700 rounded-xl px-4 py-3">
        <p className="text-sm text-sky-200 font-medium">👁️ อ่านอย่างเดียว (View-only)</p>
        <p className="text-xs text-sky-300/80 mt-1 leading-relaxed">
          ค่าบริการ (Service Fee) ของงานที่คุณรับผิดชอบ ชำระเข้าร้าน (WeeeR) ที่คุณสังกัด —
          ช่าง (WeeeT) ไม่ได้ถือกระเป๋าเงินเอง จึงไม่มีการเติม/ถอน/โอน
        </p>
      </div>

      {/* รายละเอียดธุรกรรม (read-only) — ผูกกับงาน · ไม่มี balance holder / ปุ่มทำธุรกรรม */}
      <button onClick={() => setShowTx(!showTx)} className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-gray-300 hover:border-gray-500 transition-colors">
        <span>📋 รายละเอียดธุรกรรม</span><span className="text-gray-500 text-xs">{showTx ? "▲" : "▼"}</span>
      </button>
      {showTx && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl divide-y divide-gray-700">
          {transactions.length === 0 ? (
            <div className="px-4 py-5 text-center text-xs text-gray-500">ยังไม่มีรายการ</div>
          ) : transactions.map((tx) => (
            <div key={tx.id} className="px-4 py-3 flex items-center gap-3">
              <span className="text-lg flex-shrink-0">🧾</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{tx.description}</p>
                <p className="text-xs text-gray-500">{new Date(tx.createdAt).toLocaleDateString("th-TH")}{tx.jobId && ` · ${tx.jobId}`}</p>
              </div>
              <span className="text-sm font-semibold text-gray-200 flex-shrink-0">
                ฿{fmt(tx.amount)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
