"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isAuthenticated } from "@/lib/auth";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/sidebar";

interface PickupAnalytics {
  total_jobs: number;
  active_jobs: number;
  completed_jobs: number;
  failed_jobs: number;
  cancelled_jobs: number;

  avg_pickup_to_shop_min: number | null;
  avg_shop_to_delivery_min: number | null;
  avg_total_time_min: number | null;
  avg_travel_cost: number | null;

  on_time_rate: number | null;
  success_rate: number | null;

  total_travel_cost: number;
  travel_cost_this_month: number;

  by_status: { status: string; count: number }[];
  top_weeet: { weeet_name: string; jobs: number; avg_time_min: number | null }[];
  monthly_travel_cost: { month: string; cost: number; jobs: number }[];
  by_direction: { direction: string; count: number }[];
}

const STATUS_LABELS: Record<string, string> = {
  pending:             "รอมอบหมาย",
  assigned:            "มอบหมายแล้ว",
  en_route_pickup:     "กำลังไปรับ",
  picked_up:           "รับแล้ว",
  en_route_delivery:   "กำลังส่ง",
  delivered:           "ส่งแล้ว",
  completed:           "เสร็จสิ้น",
  failed:              "ล้มเหลว",
  cancelled:           "ยกเลิก",
};

function StatCard({
  icon, label, value, sub, accent,
}: {
  icon: string; label: string; value: string | number; sub?: string; accent?: string;
}) {
  const accentMap: Record<string, string> = {
    blue:    "text-blue-400",
    green:   "text-green-400",
    red:     "text-red-400",
    orange:  "text-orange-400",
    yellow:  "text-yellow-400",
    purple:  "text-purple-400",
    cyan:    "text-cyan-400",
    default: "text-white",
  };
  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
      <p className="text-2xl mb-1">{icon}</p>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${accentMap[accent ?? "default"]}`}>{value}</p>
      {sub && <p className="text-xs text-gray-600 mt-1">{sub}</p>}
    </div>
  );
}

function fmtTime(min: number | null) {
  if (min == null) return "—";
  if (min < 60) return `${Math.round(min)} นาที`;
  return `${(min / 60).toFixed(1)} ชม.`;
}

export default function PickupAnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState<PickupAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState("30d");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const d = await api.get<PickupAnalytics>(`/admin/repair/pickup/analytics?period=${period}`);
      setData(d);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login"); return; }
    fetchData();
  }, [router, fetchData]);

  return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      <Sidebar />
      <main className="flex-1 p-8 space-y-8 max-w-5xl">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">📊 Pickup Analytics</h1>
            <p className="text-gray-400 text-sm mt-1">
              avg pickup time + travel cost + KPI — ภาพรวม pickup jobs
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Period selector */}
            <div className="flex gap-1 bg-gray-900 rounded-lg p-1 border border-gray-800">
              {["7d", "30d", "90d", "all"].map(p => (
                <button key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1 rounded text-xs transition-colors ${
                    period === p ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
                  }`}>
                  {p}
                </button>
              ))}
            </div>
            <Link href="/repair/pickup/queue"
              className="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors">
              ← Queue
            </Link>
          </div>
        </div>

        {loading ? (
          <p className="text-gray-500">กำลังโหลด...</p>
        ) : error ? (
          <div className="bg-red-900/30 border border-red-800 rounded-xl p-4 text-red-400">{error}</div>
        ) : data && (
          <>
            {/* Summary */}
            <section>
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">ภาพรวม</h2>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard icon="📋" label="Jobs ทั้งหมด"  value={data.total_jobs.toLocaleString()} />
                <StatCard icon="⚡" label="Active"        value={data.active_jobs.toLocaleString()} accent="blue" />
                <StatCard icon="✅" label="เสร็จสิ้น"      value={data.completed_jobs.toLocaleString()} accent="green" />
                <StatCard icon="❌" label="ล้มเหลว"        value={data.failed_jobs.toLocaleString()} accent="red" />
                <StatCard icon="🚫" label="ยกเลิก"         value={data.cancelled_jobs.toLocaleString()} accent="orange" />
              </div>
            </section>

            {/* KPI: avg times */}
            <section>
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                KPI — Avg Time
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  icon="🚛"
                  label="ไปรับ (avg)"
                  value={fmtTime(data.avg_pickup_to_shop_min)}
                  sub="assigned → picked_up"
                  accent="cyan"
                />
                <StatCard
                  icon="📦"
                  label="ส่งถึง (avg)"
                  value={fmtTime(data.avg_shop_to_delivery_min)}
                  sub="picked_up → delivered"
                  accent="indigo"
                />
                <StatCard
                  icon="⏱️"
                  label="รวมทั้งหมด (avg)"
                  value={fmtTime(data.avg_total_time_min)}
                  sub="assigned → completed"
                  accent="purple"
                />
                <StatCard
                  icon="💰"
                  label="ค่าเดินทาง/งาน (avg)"
                  value={data.avg_travel_cost != null ? `${data.avg_travel_cost.toFixed(0)} ฿` : "—"}
                  accent="yellow"
                />
              </div>
            </section>

            {/* KPI: rates */}
            <section>
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                KPI — Rate
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  icon="⏰"
                  label="On-time Rate"
                  value={data.on_time_rate != null ? `${(data.on_time_rate * 100).toFixed(1)}%` : "—"}
                  sub="ส่งทันกำหนด"
                  accent={data.on_time_rate != null && data.on_time_rate >= 0.9 ? "green" : "orange"}
                />
                <StatCard
                  icon="✅"
                  label="Success Rate"
                  value={data.success_rate != null ? `${(data.success_rate * 100).toFixed(1)}%` : "—"}
                  sub="completed / total"
                  accent="green"
                />
                <StatCard
                  icon="💵"
                  label="Travel Cost รวม"
                  value={`${data.total_travel_cost.toLocaleString()} ฿`}
                  accent="yellow"
                />
                <StatCard
                  icon="📅"
                  label="Travel Cost เดือนนี้"
                  value={`${data.travel_cost_this_month.toLocaleString()} ฿`}
                  accent="yellow"
                />
              </div>
            </section>

            {/* Monthly travel cost chart */}
            {data.monthly_travel_cost?.length > 0 && (
              <section className="bg-gray-900 rounded-xl border border-gray-800 p-5">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                  Travel Cost รายเดือน
                </h2>
                <div className="space-y-2.5">
                  {(() => {
                    const maxCost = Math.max(...data.monthly_travel_cost.map(m => m.cost), 1);
                    return data.monthly_travel_cost.map(m => {
                      const pct = (m.cost / maxCost) * 100;
                      return (
                        <div key={m.month} className="flex items-center gap-3">
                          <span className="text-xs text-gray-400 w-20 shrink-0 font-mono">{m.month}</span>
                          <div className="flex-1 bg-gray-800 rounded-full h-2">
                            <div className="bg-yellow-500 h-2 rounded-full transition-all"
                              style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-yellow-400 font-mono w-28 text-right">
                            {m.cost.toLocaleString()} ฿
                          </span>
                          <span className="text-xs text-gray-600 w-16 text-right">
                            {m.jobs} jobs
                          </span>
                        </div>
                      );
                    });
                  })()}
                </div>
              </section>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* By Status */}
              <section className="bg-gray-900 rounded-xl border border-gray-800 p-5">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Jobs by Status</h2>
                <div className="space-y-2">
                  {data.by_status.map(row => {
                    const pct = data.total_jobs > 0 ? (row.count / data.total_jobs) * 100 : 0;
                    return (
                      <div key={row.status} className="flex items-center gap-3">
                        <span className="text-xs text-gray-400 w-28 shrink-0">
                          {STATUS_LABELS[row.status] ?? row.status}
                        </span>
                        <div className="flex-1 bg-gray-800 rounded-full h-2">
                          <div className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-gray-300 w-10 text-right">{row.count}</span>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* By Direction */}
              <section className="bg-gray-900 rounded-xl border border-gray-800 p-5">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Jobs by Direction</h2>
                <div className="space-y-3">
                  {data.by_direction.map(row => {
                    const total = data.by_direction.reduce((s, r) => s + r.count, 0);
                    const pct = total > 0 ? (row.count / total) * 100 : 0;
                    const isS2C = row.direction === "shop_to_customer";
                    return (
                      <div key={row.direction} className="flex items-center gap-3">
                        <span className={`text-xs w-28 shrink-0 ${isS2C ? "text-teal-400" : "text-purple-400"}`}>
                          {isS2C ? "ร้าน → ลูกค้า" : "ลูกค้า → ร้าน"}
                        </span>
                        <div className="flex-1 bg-gray-800 rounded-full h-2">
                          <div className={`h-2 rounded-full transition-all ${isS2C ? "bg-teal-600" : "bg-purple-600"}`}
                            style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-gray-300 w-10 text-right">{row.count}</span>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>

            {/* Top WeeeT */}
            {data.top_weeet?.length > 0 && (
              <section className="bg-gray-900 rounded-xl border border-gray-800 p-5">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Top WeeeT</h2>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-500 text-left border-b border-gray-800">
                      <th className="pb-2">#</th>
                      <th className="pb-2">WeeeT</th>
                      <th className="pb-2 text-right">Jobs</th>
                      <th className="pb-2 text-right">Avg Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {data.top_weeet.map((row, i) => (
                      <tr key={i} className="hover:bg-gray-800/30">
                        <td className="py-2.5 text-gray-600 w-8">{i + 1}.</td>
                        <td className="py-2.5 text-gray-200">{row.weeet_name}</td>
                        <td className="py-2.5 text-right font-mono text-blue-400">{row.jobs}</td>
                        <td className="py-2.5 text-right font-mono text-purple-400">
                          {fmtTime(row.avg_time_min)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
