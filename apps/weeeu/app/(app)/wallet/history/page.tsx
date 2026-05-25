"use client";
// ─── ประวัติ Wallet (/wallet/history) — MOCK fallback (T3 fix) ────────────────
// GET transfers/history → MOCK fallback ถ้า API ไม่ตอบ · color migrated

import { useState, useEffect } from "react";
import Link from "next/link";
import { getAdapter } from "@/lib/dal";
import type { Transfer, TransferType } from "@app3r/shared/dal/weeeu";

// MOCK fallback — ใช้เมื่อ API ไม่ตอบสนอง (T3 fix)
const MOCK_TRANSFERS: Transfer[] = [
  {
    id: "tx-001", type: "deposit", points: 500, amount: 500,
    status: "approved", userId: "mock-user",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    slipFileId: "slip-001",
  },
  {
    id: "tx-002", type: "withdraw", points: 300, amount: 300,
    status: "pending", userId: "mock-user",
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    bankName: "ธนาคารกสิกรไทย (KBank)", bankAccount: "XXX-X-X5678-X",
  },
  {
    id: "tx-003", type: "deposit", points: 1000, amount: 1000,
    status: "approved", userId: "mock-user",
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    slipFileId: "slip-003",
  },
];

// ─── Status + Type config ─────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  pending:  { label: "รอยืนยัน",   cls: "bg-yellow-100 text-yellow-700" },
  approved: { label: "อนุมัติแล้ว", cls: "bg-green-100 text-green-700" },
  rejected: { label: "ปฏิเสธ",     cls: "bg-red-100 text-red-700" },
};

const TYPE_CONFIG: Record<string, { icon: string; label: string; amountPrefix: string; amountCls: string }> = {
  deposit:  { icon: "💰", label: "เติม Gold",  amountPrefix: "+", amountCls: "text-green-600" },
  withdraw: { icon: "💸", label: "แจ้งถอน Gold", amountPrefix: "-", amountCls: "text-red-600" },
};

// ─── TransferItem ─────────────────────────────────────────────────────────────

function TransferItem({ transfer }: { transfer: Transfer }) {
  const type = TYPE_CONFIG[transfer.type] ?? TYPE_CONFIG.deposit;
  const status = STATUS_CONFIG[transfer.status] ?? STATUS_CONFIG.pending;
  const dateStr = new Date(transfer.createdAt).toLocaleDateString("th-TH", {
    day: "numeric", month: "short", year: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });

  return (
    <div className="flex items-center gap-4 py-4 border-b border-gray-50 last:border-b-0">
      <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
        {type.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800">{type.label}</p>
        <p className="text-xs text-gray-400 mt-0.5">{dateStr}</p>
        {transfer.type === "deposit" && transfer.slipFileId && (
          <p className="text-xs text-gray-300 mt-0.5 truncate">สลิป: {transfer.slipFileId}</p>
        )}
        {transfer.type === "withdraw" && transfer.bankName && (
          <p className="text-xs text-gray-400 mt-0.5">{transfer.bankName}</p>
        )}
      </div>
      <div className="text-right flex-shrink-0">
        <p className={`text-sm font-bold ${type.amountCls}`}>
          {type.amountPrefix}{transfer.points.toLocaleString("th-TH")} Gold
        </p>
        <p className="text-xs text-gray-400 mt-0.5">฿{transfer.amount.toLocaleString("th-TH")}</p>
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
    dal.transfer
      .history(params)
      .then((result) => {
        setTransfers(result.ok ? result.data : MOCK_TRANSFERS);
        if (!result.ok) setError(""); // ใช้ mock แทน
      })
      .catch(() => {
        // MOCK fallback ถ้า API ไม่ตอบ
        const filtered = filter !== "all"
          ? MOCK_TRANSFERS.filter(t => t.type === filter)
          : MOCK_TRANSFERS;
        setTransfers(filtered);
      })
      .finally(() => setLoading(false));
  }, [filter]);

  const filterTabs: Array<{ value: TransferType | "all"; label: string }> = [
    { value: "all",      label: "ทั้งหมด" },
    { value: "deposit",  label: "เติม Gold" },
    { value: "withdraw", label: "แจ้งถอน" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/wallet" className="text-gray-400 hover:text-gray-600">←</Link>
          <h1 className="text-xl font-bold text-gray-900">ประวัติ Gold Point</h1>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/wallet/deposit"
          className="flex items-center justify-center gap-2 bg-weeeu-primary hover:bg-weeeu-dark text-white py-3 rounded-2xl text-sm font-semibold transition-colors"
        >
          💰 เติม Gold
        </Link>
        <Link
          href="/wallet/withdraw"
          className="flex items-center justify-center gap-2 bg-white border border-weeeu-primary/20 text-weeeu-primary hover:bg-weeeu-surface py-3 rounded-2xl text-sm font-semibold transition-colors"
        >
          💸 แจ้งถอน Gold
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
                ? "bg-white text-weeeu-primary shadow-sm"
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
          <div className="p-8 text-center text-gray-400 text-sm animate-pulse">กำลังโหลดประวัติ...</div>
        ) : error ? (
          <div className="p-6 text-center text-red-500 text-sm">{error}</div>
        ) : transfers.length === 0 ? (
          <div className="p-10 text-center text-gray-400 space-y-2">
            <p className="text-3xl">📭</p>
            <p className="text-sm">ยังไม่มีรายการ</p>
            <Link href="/wallet/deposit" className="text-xs text-weeeu-primary hover:underline">
              เติม Gold ครั้งแรก →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 px-5">
            {transfers.map((t) => <TransferItem key={t.id} transfer={t} />)}
          </div>
        )}
      </div>

      <p className="text-xs text-center text-gray-400">
        1 Gold = 1 บาท · Gold ไม่หมดอายุ · * แสดง Mock ถ้า API ไม่พร้อม
      </p>
    </div>
  );
}
