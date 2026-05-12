"use client";
/**
 * components/payment/PaymentWalletCard.tsx
 * Phase D-2 — กระเป๋าเงินช่าง (WeeeT earner wallet)
 * NOTE-D89-2: ไม่มี withdrawal UI ใน D-2 — manual Phase D-5
 */
import { useState, useEffect } from "react";
import { getAdapter } from "@/lib/dal";
import type { WalletBalance, WalletTransaction } from "@/lib/dal/types";

export function PaymentWalletCard() {
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTx, setShowTx] = useState(false);

  useEffect(() => {
    const dal = getAdapter();
    Promise.all([dal.payment.getWalletBalance(), dal.payment.getTransactions(10)]).then(([b, t]) => {
      if (b.ok) setBalance(b.data); else setError(b.error);
      if (t.ok) setTransactions(t.data);
      setLoading(false);
    });
  }, []);

  const fmt = (n: number) => n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (loading) return <div className="bg-gray-700 rounded-xl p-4 animate-pulse h-20" />;
  if (error) return <div className="bg-red-950/40 border border-red-800 rounded-xl p-3 text-xs text-red-300">⚠️ {error}</div>;

  return (
    <div className="space-y-3">
      <div className="bg-gradient-to-br from-orange-950/60 to-gray-800 border border-orange-800/50 rounded-xl p-4">
        <p className="text-xs text-orange-300/70 mb-1">กระเป๋าเงินช่าง</p>
        <div className="flex items-end gap-2">
          <span className="text-2xl font-bold text-white">฿{fmt(balance?.available ?? 0)}</span>
          <span className="text-xs text-gray-400 mb-0.5">พร้อมโอน</span>
        </div>
        {(balance?.pending ?? 0) > 0 && <p className="text-xs text-amber-400 mt-1">฿{fmt(balance!.pending)} รอปล่อย (escrow)</p>}
        <p className="text-xs text-gray-500 mt-2">💡 การโอนเงินจัดการผ่านทีมงาน — Phase D-5</p>
      </div>
      <button onClick={() => setShowTx(!showTx)} className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-gray-300 hover:border-gray-500 transition-colors">
        <span>📋 ประวัติรายการ</span><span className="text-gray-500 text-xs">{showTx ? "▲" : "▼"}</span>
      </button>
      {showTx && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl divide-y divide-gray-700">
          {transactions.length === 0 ? (
            <div className="px-4 py-5 text-center text-xs text-gray-500">ยังไม่มีรายการ</div>
          ) : transactions.map((tx) => (
            <div key={tx.id} className="px-4 py-3 flex items-center gap-3">
              <span className="text-lg flex-shrink-0">{tx.type === "credit" ? "💚" : "🔴"}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{tx.description}</p>
                <p className="text-xs text-gray-500">{new Date(tx.createdAt).toLocaleDateString("th-TH")}{tx.jobId && ` · ${tx.jobId}`}</p>
              </div>
              <span className={`text-sm font-semibold flex-shrink-0 ${tx.type === "credit" ? "text-green-400" : "text-red-400"}`}>
                {tx.type === "credit" ? "+" : "-"}฿{fmt(tx.amount)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
