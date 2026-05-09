"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { resellApi } from "../_lib/api";
import type { ResellTransaction, ListingStatus } from "../_lib/types";
import { LISTING_STATUS_LABEL, LISTING_STATUS_COLOR } from "../_lib/types";

const ACTIVE_STATUSES: ListingStatus[] = ["in_progress", "delivered", "inspection_period"];
const TABS: { value: ListingStatus | ""; label: string }[] = [
  { value: "", label: "ทั้งหมด" },
  { value: "in_progress", label: "กำลังดำเนินการ" },
  { value: "delivered", label: "ส่งมอบแล้ว" },
  { value: "inspection_period", label: "ช่วงตรวจสอบ" },
  { value: "completed", label: "เสร็จสิ้น" },
];

export default function ResellTransactionsPage() {
  const [transactions, setTransactions] = useState<ResellTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState<ListingStatus | "">("");

  useEffect(() => {
    resellApi.transactionsList({ status: statusFilter || undefined })
      .then(setTransactions)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  const activeCount = transactions.filter(t => ACTIVE_STATUSES.includes(t.status)).length;

  if (loading) return <div className="flex items-center justify-center h-48 text-gray-400">กำลังโหลด…</div>;
  if (error) return <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-yellow-700 text-sm">⚠️ ระบบขายมือสองกำลังพัฒนา — {error}</div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/resell" className="text-gray-400 hover:text-gray-600">←</Link>
          <h1 className="text-xl font-bold text-gray-900">รายการซื้อขาย</h1>
        </div>
        {activeCount > 0 && (
          <span className="text-xs bg-yellow-100 text-yellow-700 font-semibold px-2.5 py-1 rounded-full">
            {activeCount} กำลังดำเนินการ
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map(t => (
          <button key={t.value} onClick={() => setStatusFilter(t.value)}
            className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full transition-colors
              ${statusFilter === t.value ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {transactions.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">ยังไม่มีรายการ</div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl divide-y divide-gray-50">
          {transactions.map(tx => (
            <Link key={tx.id} href={`/resell/transactions/${tx.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-800 truncate">{tx.applianceName}</p>
                <p className="text-xs text-gray-400">ผู้ซื้อ: {tx.buyerName}</p>
                <span className={`text-xs px-1.5 py-0.5 rounded font-medium mt-0.5 inline-block ${LISTING_STATUS_COLOR[tx.status]}`}>
                  {LISTING_STATUS_LABEL[tx.status]}
                </span>
              </div>
              <div className="shrink-0 ml-3 text-right">
                <p className="text-sm font-bold text-green-700">{tx.price.toLocaleString()} pts</p>
                <p className="text-xs text-gray-400">
                  {new Date(tx.updatedAt).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
