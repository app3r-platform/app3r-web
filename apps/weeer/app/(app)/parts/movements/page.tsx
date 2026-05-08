"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { partsApi } from "../_lib/api";
import type { StockMovement } from "../_lib/types";
import { MOVEMENT_TYPE_LABEL, MOVEMENT_TYPE_COLOR, REASON_LABEL } from "../_lib/types";

const TYPE_FILTERS = [
  { value: "", label: "ทั้งหมด" },
  { value: "STOCK_IN", label: "รับเข้า" },
  { value: "STOCK_OUT", label: "จ่ายออก" },
  { value: "STOCK_ADJUSTMENT", label: "ปรับ Manual" },
] as const;

export default function PartsMovementsPage() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [typeFilter, setTypeFilter] = useState<"" | "STOCK_IN" | "STOCK_OUT" | "STOCK_ADJUSTMENT">("");

  useEffect(() => {
    partsApi.movements({})
      .then(setMovements)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = typeFilter ? movements.filter(m => m.type === typeFilter) : movements;

  if (loading) return <div className="flex items-center justify-center h-48 text-gray-400">กำลังโหลด…</div>;
  if (error) return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-yellow-700 text-sm">
      ⚠️ ระบบอะไหล่กำลังพัฒนา — {error}
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/parts" className="text-gray-400 hover:text-gray-600">←</Link>
          <h1 className="text-xl font-bold text-gray-900">ประวัติความเคลื่อนไหวสต๊อก</h1>
        </div>
        <span className="text-xs text-gray-400">{filtered.length} รายการ</span>
      </div>

      {/* Type filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TYPE_FILTERS.map(f => (
          <button key={f.value} onClick={() => setTypeFilter(f.value)}
            className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full transition-colors
              ${typeFilter === f.value
                ? "bg-gray-800 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">ยังไม่มีประวัติ</div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl divide-y divide-gray-50">
          {filtered.map(m => (
            <Link key={m.id} href={`/parts/movements/${m.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`shrink-0 text-xs px-1.5 py-0.5 rounded font-medium ${MOVEMENT_TYPE_COLOR[m.type]}`}>
                  {MOVEMENT_TYPE_LABEL[m.type]}
                </span>
                <div className="min-w-0">
                  <p className="text-xs text-gray-600 truncate">{REASON_LABEL[m.reason]}</p>
                  {m.note && <p className="text-xs text-gray-400 truncate max-w-48">{m.note}</p>}
                  {m.refId && <p className="text-xs text-gray-400 font-mono truncate max-w-48">ref: {m.refId}</p>}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-2">
                <span className={`text-sm font-bold ${
                  m.type === "STOCK_IN" ? "text-green-600"
                  : m.type === "STOCK_OUT" ? "text-red-600"
                  : "text-yellow-600"
                }`}>
                  {m.type === "STOCK_IN" ? "+" : m.type === "STOCK_OUT" ? "-" : "±"}{m.qty}
                </span>
                <span className="text-xs text-gray-400">→ {m.balanceAfter}</span>
                <span className="text-xs text-gray-300">
                  {new Date(m.performedAt).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
