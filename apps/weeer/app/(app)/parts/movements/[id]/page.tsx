"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { partsApi } from "../../_lib/api";
import type { StockMovement } from "../../_lib/types";
import { MOVEMENT_TYPE_LABEL, MOVEMENT_TYPE_COLOR, REASON_LABEL } from "../../_lib/types";

export default function MovementDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [movement, setMovement] = useState<StockMovement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    partsApi.getMovement(id)
      .then(setMovement)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex items-center justify-center h-48 text-gray-400">กำลังโหลด…</div>;
  if (error) return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-yellow-700 text-sm">
      ⚠️ ระบบอะไหล่กำลังพัฒนา — {error}
    </div>
  );
  if (!movement) return null;

  const sign = movement.type === "STOCK_IN" ? "+" : movement.type === "STOCK_OUT" ? "-" : "±";
  const qtyColor = movement.type === "STOCK_IN" ? "text-green-600"
    : movement.type === "STOCK_OUT" ? "text-red-600"
    : "text-yellow-600";

  return (
    <div className="space-y-5 max-w-xl">
      <div className="flex items-center gap-3">
        <Link href="/parts/movements" className="text-gray-400 hover:text-gray-600">←</Link>
        <h1 className="text-xl font-bold text-gray-900">รายละเอียดการเคลื่อนไหว</h1>
      </div>

      {/* Type badge + qty */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`text-sm px-3 py-1 rounded-full font-medium ${MOVEMENT_TYPE_COLOR[movement.type]}`}>
            {MOVEMENT_TYPE_LABEL[movement.type]}
          </span>
          <span className="text-sm text-gray-600">{REASON_LABEL[movement.reason]}</span>
        </div>
        <span className={`text-3xl font-bold ${qtyColor}`}>{sign}{movement.qty}</span>
      </div>

      {/* Detail card */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3 text-sm">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-400">ยอดหลังการเคลื่อนไหว</p>
            <p className="font-bold text-gray-900 text-lg">{movement.balanceAfter}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">วันที่ทำรายการ</p>
            <p className="font-medium text-gray-800">
              {new Date(movement.performedAt).toLocaleDateString("th-TH", {
                day: "numeric", month: "long", year: "numeric"
              })}
            </p>
            <p className="text-xs text-gray-400">
              {new Date(movement.performedAt).toLocaleTimeString("th-TH", {
                hour: "2-digit", minute: "2-digit"
              })}
            </p>
          </div>
        </div>

        <div className="border-t border-gray-50 pt-3">
          <p className="text-xs text-gray-400 mb-1">ผู้ทำรายการ</p>
          <p className="font-medium text-gray-800 font-mono text-xs">{movement.performedBy}</p>
        </div>

        {movement.refId && (
          <div className="border-t border-gray-50 pt-3">
            <p className="text-xs text-gray-400 mb-1">เลขอ้างอิง</p>
            <p className="font-medium text-gray-800 font-mono">{movement.refId}</p>
          </div>
        )}

        {movement.note && (
          <div className="border-t border-gray-50 pt-3">
            <p className="text-xs text-gray-400 mb-1">หมายเหตุ</p>
            <p className="text-gray-700">{movement.note}</p>
          </div>
        )}

        <div className="border-t border-gray-50 pt-3">
          <p className="text-xs text-gray-400 mb-1">Movement ID</p>
          <p className="text-xs text-gray-400 font-mono break-all">{movement.id}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-1">Part ID</p>
          <p className="text-xs text-gray-400 font-mono break-all">{movement.partId}</p>
        </div>
      </div>

      <Link href={`/parts/${movement.partId}`}
        className="block w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold py-3 rounded-xl transition-colors">
        ดูหน้าอะไหล่ →
      </Link>
    </div>
  );
}
