"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { partsApi } from "../_lib/api";
import type { Part, StockMovement } from "../_lib/types";
import { MOVEMENT_TYPE_LABEL, MOVEMENT_TYPE_COLOR } from "../_lib/types";

interface DashboardData {
  total_skus: number;
  total_stock_value: number;
  low_stock: Part[];
  recent_movements: StockMovement[];
}

export default function PartsDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    partsApi.dashboard()
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Parts Dashboard</h1>
          <p className="text-xs text-gray-500 mt-0.5">ภาพรวมสต๊อกอะไหล่ — ใกล้หมด / ล่าสุด / มูลค่าคงคลัง</p>
        </div>
        <Link href="/parts" className="bg-green-700 hover:bg-green-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
          + เพิ่มอะไหล่
        </Link>
      </div>

      {loading && <div className="flex items-center justify-center h-40 text-gray-400">กำลังโหลด…</div>}
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-yellow-700 text-sm flex items-center gap-2">
          <span>⚠️</span>
          <span>ระบบอะไหล่กำลังพัฒนา — {error}</span>
        </div>
      )}

      {data && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-green-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-green-700">{data.total_skus}</p>
              <p className="text-xs text-gray-500 mt-0.5">รายการอะไหล่ทั้งหมด</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-blue-700">{data.total_stock_value.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-0.5">มูลค่าคงคลัง (pts)</p>
            </div>
          </div>

          {/* Low stock alert */}
          {data.low_stock.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-red-600 uppercase tracking-wider">⚠️ ใกล้หมด ({data.low_stock.length})</p>
                <Link href="/parts" className="text-xs text-green-700 hover:underline">ดูทั้งหมด</Link>
              </div>
              <div className="space-y-2">
                {data.low_stock.slice(0, 5).map((p) => (
                  <Link key={p.id} href={`/parts/${p.id}`}
                    className="flex items-center justify-between hover:bg-gray-50 rounded-lg px-2 py-1.5 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{p.name}</p>
                      <p className="text-xs text-gray-400">{p.sku} · {p.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-red-600">{p.stockQty} {p.unit}</p>
                      <p className="text-xs text-gray-400">เหลืออยู่</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Recent movements */}
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">ความเคลื่อนไหวล่าสุด</p>
              <Link href="/parts/movements" className="text-xs text-green-700 hover:underline">ดูทั้งหมด</Link>
            </div>
            {data.recent_movements.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">ยังไม่มีรายการ</p>
            ) : (
              <div className="space-y-2">
                {data.recent_movements.slice(0, 5).map((m) => (
                  <Link key={m.id} href={`/parts/movements/${m.id}`}
                    className="flex items-center justify-between hover:bg-gray-50 rounded-lg px-2 py-1.5 transition-colors">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${MOVEMENT_TYPE_COLOR[m.type]}`}>
                        {MOVEMENT_TYPE_LABEL[m.type]}
                      </span>
                      <p className="text-xs text-gray-600">{m.reason}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${m.type === "STOCK_IN" ? "text-green-600" : m.type === "STOCK_OUT" ? "text-red-600" : "text-yellow-600"}`}>
                        {m.type === "STOCK_IN" ? "+" : m.type === "STOCK_OUT" ? "-" : "±"}{m.qty}
                      </span>
                      <span className="text-xs text-gray-400">→ {m.balanceAfter}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Quick links */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { href: "/parts", label: "คลังอะไหล่", icon: "🔩" },
              { href: "/parts/movements", label: "ความเคลื่อนไหว", icon: "📊" },
              { href: "/parts/reservations", label: "จองอะไหล่", icon: "🔒" },
            ].map(item => (
              <Link key={item.href} href={item.href}
                className="bg-gray-50 hover:bg-gray-100 rounded-xl p-3 text-center transition-colors">
                <p className="text-xl mb-1">{item.icon}</p>
                <p className="text-xs font-medium text-gray-700">{item.label}</p>
              </Link>
            ))}
          </div>
        </>
      )}

      {!loading && !error && !data && (
        <div className="flex flex-col items-center justify-center h-48 text-gray-400">
          <span className="text-4xl mb-3">🔩</span>
          <p className="text-sm">ยังไม่มีข้อมูล — เพิ่มอะไหล่ได้ที่ปุ่มด้านบน</p>
        </div>
      )}
    </div>
  );
}

