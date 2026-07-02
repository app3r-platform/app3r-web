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
import { MockAnnoOrigin } from "@/components/MockAnno";

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

export default function SettlementsPage() {
  const [items, setItems]               = useState<SettlementDto[]>([]);
  const [total, setTotal]               = useState(0);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<SettlementStatus | "all">("all");
  const [reloadNonce, setReloadNonce]   = useState(0);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await listSettlements({
          status: statusFilter === "all" ? undefined : statusFilter,
          limit: 50,
        });
        setItems(result.items);
        setTotal(result.total);
      } catch (err) {
        // ห้าม fallback เป็น mock — โหลดล้มเหลวต้องแสดง error state จริง ไม่แสร้งเป็น "ไม่มีประวัติ"
        setItems([]);
        setTotal(0);
        setError(err instanceof Error ? err.message : "โหลดประวัติการถอนเงินไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [statusFilter, reloadNonce]);

  return (
    <div className="space-y-5 max-w-2xl">
      <MockAnnoOrigin from="R-36" />
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
          className="bg-[#FF663A] hover:bg-[#F04E20] text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
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
                ? "bg-[#FF663A] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {!loading && !error && (
        <p className="text-xs text-gray-400">{total} รายการ</p>
      )}

      {loading && (
        <div className="flex items-center justify-center h-40 text-gray-400">กำลังโหลด…</div>
      )}

      {!loading && error && (
        <div className="flex flex-col items-center justify-center h-48 text-center">
          <span className="text-4xl mb-3">⚠️</span>
          <p className="text-sm font-medium text-red-600">โหลดประวัติการถอนเงินไม่สำเร็จ</p>
          <p className="text-xs text-gray-400 mt-1">{error}</p>
          <button
            type="button"
            onClick={() => setReloadNonce((n) => n + 1)}
            className="mt-3 text-xs text-[#F04E20] hover:underline font-medium"
          >
            ลองใหม่อีกครั้ง →
          </button>
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="flex flex-col items-center justify-center h-48 text-gray-400">
          <span className="text-4xl mb-3">💸</span>
          <p className="text-sm">ยังไม่มีประวัติการถอนเงิน</p>
          <Link href="/wallet/withdraw" className="mt-3 text-xs text-[#F04E20] hover:underline font-medium">
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
