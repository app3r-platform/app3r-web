"use client";
// ── Wallet Settlements — Sub-CMD-6 Wave 2 ────────────────────────────────────
// รายการ settlements ของ WeeeR — GET /api/v1/settlements/
// Types aligned กับ Backend SettlementDto (Sub-CMD-6)

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  listSettlements,
  SETTLEMENT_STATUS_LABEL,
  SETTLEMENT_STATUS_COLOR,
} from "../../../../lib/settlement-api";
import type { SettlementDto, SettlementStatus } from "../../../../lib/settlement-api";

const STATUS_FILTERS: { label: string; value: SettlementStatus | "all" }[] = [
  { label: "ทั้งหมด",    value: "all" },
  { label: "รอตรวจสอบ",  value: "pending" },
  { label: "กำลังโอน",   value: "processing" },
  { label: "โอนสำเร็จ",  value: "completed" },
  { label: "โอนล้มเหลว", value: "failed" },
];

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("th-TH", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return iso; }
}

// Fallback mock — aligned กับ SettlementDto (Backend Sub-6)
const MOCK_SETTLEMENTS: SettlementDto[] = [
  {
    id: "stl-mock-001",
    serviceId: "svc-mock-001",
    weeerUserId: "usr-mock-001",
    amountThb: "500.00",
    status: "completed",
    bankAdapter: "mock",
    bankRef: "MOCK-TXN-001",
    initiatedBy: "usr-mock-001",
    createdAt: "2026-05-14T10:00:00Z",
    updatedAt: "2026-05-14T12:00:00Z",
  },
  {
    id: "stl-mock-002",
    serviceId: "svc-mock-002",
    weeerUserId: "usr-mock-001",
    amountThb: "200.00",
    status: "pending",
    bankAdapter: "mock",
    bankRef: null,
    initiatedBy: "usr-mock-001",
    createdAt: "2026-05-14T14:00:00Z",
    updatedAt: "2026-05-14T14:00:00Z",
  },
];

export default function SettlementsPage() {
  const [items, setItems]               = useState<SettlementDto[]>([]);
  const [total, setTotal]               = useState(0);
  const [loading, setLoading]           = useState(true);
  const [statusFilter, setStatusFilter] = useState<SettlementStatus | "all">("all");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const result = await listSettlements({
          status: statusFilter === "all" ? undefined : statusFilter,
          limit: 50,
        });
        setItems(result.items);
        setTotal(result.total);
      } catch {
        // Fallback — Backend Sub-6 อาจยังไม่ deploy
        const filtered = statusFilter === "all"
          ? MOCK_SETTLEMENTS
          : MOCK_SETTLEMENTS.filter((s) => s.status === statusFilter);
        setItems(filtered);
        setTotal(filtered.length);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [statusFilter]);

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/wallet" className="text-gray-400 hover:text-gray-600 text-sm">← กลับ</Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">ประวัติการถอนเงิน</h1>
            <p className="text-xs text-gray-500 mt-0.5">Settlement records — Sub-CMD-6</p>
          </div>
        </div>
        <Link
          href="/wallet/withdraw"
          className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
        >
          + ถอนเงิน
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setStatusFilter(f.value)}
            className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full transition-colors
              ${statusFilter === f.value
                ? "bg-green-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {!loading && (
        <p className="text-xs text-gray-400">{total} รายการ</p>
      )}

      {loading && (
        <div className="flex items-center justify-center h-40 text-gray-400">กำลังโหลด…</div>
      )}

      {!loading && items.length === 0 && (
        <div className="flex flex-col items-center justify-center h-48 text-gray-400">
          <span className="text-4xl mb-3">💸</span>
          <p className="text-sm">ยังไม่มีประวัติการถอนเงิน</p>
          <Link href="/wallet/withdraw" className="mt-3 text-xs text-green-600 hover:underline font-medium">
            ถอนเงินครั้งแรก →
          </Link>
        </div>
      )}

      {/* Settlement cards */}
      <div className="space-y-3">
        {items.map((stl) => (
          <div key={stl.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <div className="flex items-start gap-3">
              {/* Status icon */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0
                ${stl.status === "completed"  ? "bg-green-100"  :
                  stl.status === "failed"     ? "bg-red-100"    :
                  stl.status === "processing" ? "bg-blue-100"   : "bg-orange-100"}`}
              >
                {stl.status === "completed"  ? "✅" :
                 stl.status === "failed"     ? "❌" :
                 stl.status === "processing" ? "🔄" : "⏳"}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${SETTLEMENT_STATUS_COLOR[stl.status]}`}>
                    {SETTLEMENT_STATUS_LABEL[stl.status]}
                  </span>
                  <span className="text-xs text-gray-400 capitalize">{stl.bankAdapter}</span>
                </div>

                <div className="text-xs text-gray-500">
                  Service: <span className="font-mono">{stl.serviceId.slice(0, 8)}…</span>
                </div>
                {stl.bankRef && (
                  <div className="text-xs text-gray-400">
                    Bank Ref: <span className="font-mono">{stl.bankRef}</span>
                  </div>
                )}
                <div className="text-xs text-gray-300 mt-1">
                  {formatDate(stl.createdAt)}
                </div>
              </div>

              {/* Amount */}
              <div className="shrink-0 text-right">
                <p className="text-sm font-bold text-orange-600 tabular-nums">
                  -{Number(stl.amountThb).toLocaleString()}
                  <span className="text-xs font-normal text-gray-400 ml-0.5">฿</span>
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
