"use client";
// ─── หน้าประวัติรายการเติม/ถอน (/wallet/history) — Decision Record C ──────────
// GET /api/v1/transfers/history + filter by type + status badges

import { useState, useEffect } from "react";
import Link from "next/link";
import { getAdapter } from "@/lib/dal";
import type { Transfer, TransferType } from "@app3r/shared/dal/weeeu";

// ─── Status badge config ──────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  pending:  { label: "รอยืนยัน",  cls: "bg-yellow-100 text-yellow-700" },
  approved: { label: "อนุมัติแล้ว", cls: "bg-green-100 text-green-700" },
  rejected: { label: "ปฏิเสธ",    cls: "bg-red-100 text-red-700" },
};

const TYPE_CONFIG: Record<string, { icon: string; label: string; amountPrefix: string; amountCls: string }> = {
  deposit:  { icon: "💰", label: "เติมแต้ม",  amountPrefix: "+", amountCls: "text-green-600" },
  withdraw: { icon: "💸", label: "ถอนแต้ม",   amountPrefix: "-", amountCls: "text-red-600" },
};

// ─── TransferItem component ───────────────────────────────────────────────────

function TransferItem({ transfer }: { transfer: Transfer }) {
  const type = TYPE_CONFIG[transfer.type] ?? TYPE_CONFIG.deposit;
  const status = STATUS_CONFIG[transfer.status] ?? STATUS_CONFIG.pending;
  const dateStr = new Date(transfer.createdAt).toLocaleDateString("th-TH", {
    day: "numeric", month: "short", year: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });

  return (
    <div className="flex items-center gap-4 py-4 border-b border-gray-50 last:border-b-0">
      {/* Icon */}
      <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
        {type.icon}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800">{type.label}</p>
        <p className="text-xs text-gray-400 mt-0.5">{dateStr}</p>
        {transfer.type === "deposit" && transfer.slipFileId && (
          <p className="text-xs text-gray-300 mt-0.5 truncate">
            สลิป: {transfer.slipFileId}
          </p>
        )}
        {transfer.type === "withdraw" && transfer.bankName && (
          <p className="text-xs text-gray-400 mt-0.5">
            {transfer.bankName} — {transfer.bankAccount}
          </p>
        )}
      </div>

      {/* Amount + Status */}
      <div className="text-right flex-shrink-0">
        <p className={`text-sm font-bold ${type.amountCls}`}>
          {type.amountPrefix}{transfer.points.toLocaleString("th-TH")} แต้ม
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          ฿{transfer.amount.toLocaleString("th-TH")}
        </p>
        <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${status.cls}`}>
          {status.label}
        </span>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WalletHistoryPage() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<TransferType | "all">("all");

  useEffect(() => {
    const dal = getAdapter();
    const params = filter !== "all" ? { type: filter } : undefined;
    dal.transfer.history(params).then((result) => {
      if (result.ok) setTransfers(result.data);
      else setError(result.error);
      setLoading(false);
    });
  }, [filter]);

  const filterTabs: Array<{ value: TransferType | "all"; label: string }> = [
    { value: "all", label: "ทั้งหมด" },
    { value: "deposit", label: "เติมแต้ม" },
    { value: "withdraw", label: "ถอนแต้ม" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-gray-400 hover:text-gray-600">
            ←
          </Link>
          <h1 className="text-xl font-bold text-gray-900">ประวัติ Wallet</h1>
        </div>
      </div>

      {/* Quick action buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/wallet/deposit"
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-2xl text-sm font-semibold transition-colors"
        >
          💰 เติมแต้ม
        </Link>
        <Link
          href="/wallet/withdraw"
          className="flex items-center justify-center gap-2 bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 py-3 rounded-2xl text-sm font-semibold transition-colors"
        >
          💸 ถอนแต้ม
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
        {filterTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setFilter(tab.value); setLoading(true); setError(""); }}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors ${
              filter === tab.value
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Transfer list */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm animate-pulse">
            กำลังโหลดประวัติ...
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-500 text-sm">
            {error}
          </div>
        ) : transfers.length === 0 ? (
          <div className="p-10 text-center text-gray-400 space-y-2">
            <p className="text-3xl">📭</p>
            <p className="text-sm">ยังไม่มีรายการ</p>
            <Link href="/wallet/deposit" className="text-xs text-indigo-500 hover:underline">
              เติมแต้มครั้งแรก →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 px-5">
            {transfers.map((t) => (
              <TransferItem key={t.id} transfer={t} />
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-center text-gray-400">
        อัตรา: 1 บาท = 1 แต้ม · แต้มหมดอายุใน 365 วัน
      </p>
    </div>
  );
}
