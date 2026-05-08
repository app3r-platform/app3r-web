"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isAuthenticated } from "@/lib/auth";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/sidebar";

interface LowStockItem {
  partId: string;
  shopId: string;
  name: string;
  sku: string;
  stockQty: number;
  reservedQty: number;
  unit: string;
}

interface TopMovingPart {
  partId: string;
  name: string;
  sku: string;
  totalQty: number;
  movementCount: number;
}

interface ShopStockValue {
  shopId: string;
  totalParts: number;
  totalValue: number;
}

interface PartsAnalytics {
  total_parts: number;
  total_stock_value: number;
  low_stock_count: number;
  disassembly_conversion_rate: number; // 0-1
  low_stock_items: LowStockItem[];
  top_moving_7d: TopMovingPart[];
  top_moving_30d: TopMovingPart[];
  top_moving_90d: TopMovingPart[];
  stock_value_by_shop: ShopStockValue[];
}

function StatCard({ label, value, sub, warn }: { label: string; value: string; sub?: string; warn?: boolean }) {
  return (
    <div className={`bg-gray-900 rounded-xl border p-5 ${warn ? "border-red-900/50" : "border-gray-800"}`}>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${warn ? "text-red-400" : "text-white"}`}>{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

function BarRow({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-300 truncate max-w-xs">{label}</span>
        <span className="text-gray-400 ml-2 shrink-0">{value.toLocaleString()} ({pct}%)</span>
      </div>
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

type PeriodKey = "top_moving_7d" | "top_moving_30d" | "top_moving_90d";

export default function PartsAnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState<PartsAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [topPeriod, setTopPeriod] = useState<PeriodKey>("top_moving_30d");

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login"); return; }
    api.get<PartsAnalytics>("/admin/parts/analytics/")
      .then(d => { setData(d); setError(null); })
      .catch(e => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      <Sidebar /><main className="flex-1 p-8"><p className="text-gray-500">กำลังโหลด...</p></main>
    </div>
  );

  if (error || !data) return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      <Sidebar />
      <main className="flex-1 p-8 space-y-4">
        <div className="bg-red-900/30 border border-red-800 rounded-xl p-4 text-red-400">
          ระบบอะไหล่กำลังพัฒนา — {error ?? "ไม่พบข้อมูล"}
        </div>
        <Link href="/parts" className="text-sm text-blue-400 hover:text-blue-300">← Inventory</Link>
      </main>
    </div>
  );

  const topMoving = data[topPeriod] ?? [];
  const maxTopQty = topMoving.reduce((m, t) => Math.max(m, t.totalQty), 1);
  const maxShopValue = data.stock_value_by_shop.reduce((m, s) => Math.max(m, s.totalValue), 1);

  return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      <Sidebar />
      <main className="flex-1 p-8 space-y-6 max-w-6xl">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">📊 Parts Analytics</h1>
            <p className="text-gray-400 text-sm mt-1">
              สรุปภาพรวมอะไหล่ระดับระบบ — low-stock / top moving / stock value / disassembly
            </p>
          </div>
          <Link href="/parts"
            className="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors">
            🔩 Inventory →
          </Link>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="อะไหล่ทั้งหมด"
            value={data.total_parts.toLocaleString()}
            sub="SKU รวมทุก shop"
          />
          <StatCard
            label="มูลค่าสต็อกรวม"
            value={`${data.total_stock_value.toLocaleString()} ฿`}
            sub="ทุก shop"
          />
          <StatCard
            label="Low Stock"
            value={data.low_stock_count.toLocaleString()}
            sub="อะไหล่ที่เหลือน้อย"
            warn={data.low_stock_count > 0}
          />
          <StatCard
            label="Disassembly Conversion"
            value={`${(data.disassembly_conversion_rate * 100).toFixed(1)}%`}
            sub="ซาก → อะไหล่"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Low stock items */}
          <section className="bg-gray-900 rounded-xl border border-red-900/30 p-5">
            <h2 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-4">
              ⚠️ Low Stock — ข้าม Shop
            </h2>
            {data.low_stock_items.length === 0 ? (
              <p className="text-sm text-gray-500">ไม่มีอะไหล่ที่สต็อกต่ำ</p>
            ) : (
              <div className="space-y-2">
                {data.low_stock_items.map(item => {
                  const avail = item.stockQty - item.reservedQty;
                  return (
                    <div key={item.partId}
                      className="flex items-center justify-between py-1.5 border-b border-gray-800/60 last:border-0">
                      <div>
                        <Link href={`/parts/${item.partId}`}
                          className="text-sm text-gray-100 hover:text-blue-400 transition-colors">
                          {item.name}
                        </Link>
                        <div className="text-xs text-gray-500 font-mono">{item.sku} · Shop: {item.shopId}</div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-mono font-bold ${avail <= 0 ? "text-red-500" : "text-red-400"}`}>
                          {item.stockQty} {item.unit}
                        </div>
                        {item.reservedQty > 0 && (
                          <div className="text-xs text-yellow-600">จอง {item.reservedQty}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Stock value by shop */}
          <section className="bg-gray-900 rounded-xl border border-gray-800 p-5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
              💰 มูลค่าสต็อกตาม Shop
            </h2>
            {data.stock_value_by_shop.length === 0 ? (
              <p className="text-sm text-gray-500">ยังไม่มีข้อมูล</p>
            ) : (
              <div className="space-y-3">
                {data.stock_value_by_shop
                  .sort((a, b) => b.totalValue - a.totalValue)
                  .map(shop => (
                    <BarRow
                      key={shop.shopId}
                      label={`${shop.shopId} (${shop.totalParts} SKU)`}
                      value={shop.totalValue}
                      total={maxShopValue}
                      color="bg-blue-500"
                    />
                  ))}
              </div>
            )}
          </section>

        </div>

        {/* Top moving parts */}
        <section className="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              🔥 Top Moving Parts
            </h2>
            <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
              {(["top_moving_7d", "top_moving_30d", "top_moving_90d"] as PeriodKey[]).map(k => (
                <button key={k}
                  onClick={() => setTopPeriod(k)}
                  className={`px-2.5 py-1 rounded text-xs transition-colors ${
                    topPeriod === k ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
                  }`}>
                  {k === "top_moving_7d" ? "7 วัน" : k === "top_moving_30d" ? "30 วัน" : "90 วัน"}
                </button>
              ))}
            </div>
          </div>
          {topMoving.length === 0 ? (
            <p className="text-sm text-gray-500">ยังไม่มีข้อมูล</p>
          ) : (
            <div className="space-y-3">
              {topMoving.slice(0, 10).map((t, i) => (
                <div key={t.partId} className="flex items-center gap-3">
                  <span className="text-xs text-gray-600 w-5 text-right shrink-0">{i + 1}</span>
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between text-xs">
                      <Link href={`/parts/${t.partId}`}
                        className="text-gray-300 hover:text-blue-400 transition-colors font-mono">
                        {t.sku}
                      </Link>
                      <span className="text-gray-400">{t.totalQty.toLocaleString()} หน่วย ({t.movementCount} ครั้ง)</span>
                    </div>
                    <p className="text-xs text-gray-500">{t.name}</p>
                    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-orange-500 rounded-full"
                        style={{ width: `${Math.round((t.totalQty / maxTopQty) * 100)}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Disassembly conversion */}
        <section className="bg-gray-900 rounded-xl border border-purple-900/30 p-5">
          <h2 className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-4">
            ♻️ Disassembly Conversion (ซาก → อะไหล่)
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Conversion Rate</span>
              <span className={`font-mono font-bold ${
                data.disassembly_conversion_rate >= 0.2
                  ? "text-green-400"
                  : data.disassembly_conversion_rate >= 0.1
                  ? "text-yellow-400"
                  : "text-red-400"
              }`}>
                {(data.disassembly_conversion_rate * 100).toFixed(1)}%
              </span>
            </div>
            <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-purple-500 transition-all"
                style={{ width: `${Math.min(data.disassembly_conversion_rate * 100, 100)}%` }} />
            </div>
            <p className="text-xs text-gray-600">
              ⚠️ Disassembly UI ยังเชื่อม Scrap module ไม่ครบ — C-3
            </p>
          </div>
        </section>

      </main>
    </div>
  );
}
