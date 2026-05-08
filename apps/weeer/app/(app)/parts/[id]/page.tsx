"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { partsApi } from "../_lib/api";
import type { Part, StockMovement } from "../_lib/types";
import { CONDITION_LABEL, CONDITION_COLOR, MOVEMENT_TYPE_LABEL, MOVEMENT_TYPE_COLOR, REASON_LABEL } from "../_lib/types";

export default function PartDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [part, setPart] = useState<Part | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      partsApi.get(id),
      partsApi.movements({ partId: id }),
    ])
      .then(([p, m]) => { setPart(p); setMovements(m); })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex items-center justify-center h-48 text-gray-400">กำลังโหลด…</div>;
  if (error) return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-yellow-700 text-sm flex items-center gap-2">
      <span>⚠️</span><span>ระบบอะไหล่กำลังพัฒนา — {error}</span>
    </div>
  );
  if (!part) return null;

  const availQty = part.stockQty - part.reservedQty;

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/parts" className="text-gray-400 hover:text-gray-600">←</Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900 truncate">{part.name}</h1>
          <p className="text-xs text-gray-400 font-mono">{part.sku}</p>
        </div>
        <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${CONDITION_COLOR[part.condition]}`}>
          {CONDITION_LABEL[part.condition]}
        </span>
      </div>

      {/* Info card */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-gray-400">หมวดหมู่</p>
          <p className="font-medium text-gray-800">{part.category}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">หน่วย</p>
          <p className="font-medium text-gray-800">{part.unit}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">ราคาต่อหน่วย</p>
          <p className="font-bold text-green-700">{part.unitPrice.toLocaleString()} pts</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">แหล่งที่มา</p>
          <p className="font-medium text-gray-800">
            {part.source ? (part.source.type === "purchase" ? "ซื้อเข้า" : "แยกจากซาก") : "—"}
            {part.source?.refId && <span className="text-xs text-gray-400 ml-1">({part.source.refId})</span>}
          </p>
        </div>
        {part.imageUrl && (
          <div className="col-span-2">
            <p className="text-xs text-gray-400 mb-1">รูปอะไหล่</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={part.imageUrl} alt={part.name} className="w-32 h-32 object-cover rounded-xl border border-gray-100" />
          </div>
        )}
      </div>

      {/* Stock card */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-green-50 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-green-700">{part.stockQty}</p>
          <p className="text-xs text-gray-500 mt-0.5">สต๊อกรวม ({part.unit})</p>
        </div>
        <div className="bg-orange-50 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-orange-600">{part.reservedQty}</p>
          <p className="text-xs text-gray-500 mt-0.5">จองอยู่</p>
        </div>
        <div className={`rounded-xl p-3 text-center ${availQty <= 3 ? "bg-red-50" : "bg-blue-50"}`}>
          <p className={`text-2xl font-bold ${availQty <= 3 ? "text-red-600" : "text-blue-700"}`}>{availQty}</p>
          <p className="text-xs text-gray-500 mt-0.5">พร้อมใช้</p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 flex-wrap">
        <Link href={`/parts/${id}/stock-in`}
          className="bg-green-700 hover:bg-green-800 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors">
          📦 รับเข้า
        </Link>
        <Link href={`/parts/${id}/stock-adjust`}
          className="bg-yellow-600 hover:bg-yellow-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors">
          ✏️ ปรับสต๊อก
        </Link>
        <Link href={`/parts/${id}/edit`}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold px-3 py-2 rounded-lg transition-colors">
          ⚙️ แก้ไขข้อมูล
        </Link>
      </div>

      {/* Movement history */}
      <div className="bg-white border border-gray-100 rounded-xl p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">ประวัติความเคลื่อนไหว</p>
        {movements.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">ยังไม่มีประวัติ</p>
        ) : (
          <div className="space-y-2">
            {movements.map(m => (
              <Link key={m.id} href={`/parts/movements/${m.id}`}
                className="flex items-center justify-between hover:bg-gray-50 rounded-lg px-2 py-2 transition-colors">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${MOVEMENT_TYPE_COLOR[m.type]}`}>
                    {MOVEMENT_TYPE_LABEL[m.type]}
                  </span>
                  <span className="text-xs text-gray-600">{REASON_LABEL[m.reason]}</span>
                  {m.note && <span className="text-xs text-gray-400 truncate max-w-24">{m.note}</span>}
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-bold ${m.type === "STOCK_IN" ? "text-green-600" : m.type === "STOCK_OUT" ? "text-red-600" : "text-yellow-600"}`}>
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
    </div>
  );
}
