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

// mock fallback — ลบตอน Phase 4 (TD-06)
const MOCK_PICKUP_ANALYTICS: PickupAnalytics = {
  total_jobs: 203,
  active_jobs: 8,
  completed_jobs: 178,
  failed_jobs: 9,
  cancelled_jobs: 8,
  avg_pickup_to_shop_min: 22.5,
  avg_shop_to_delivery_min: 35.8,
  avg_total_time_min: 61.2,
  avg_travel_cost: 98.4,
  on_time_rate: 0.913,
  success_rate: 0.877,
  total_travel_cost: 19978,
  travel_cost_this_month: 3840,
  by_status: [
    { status: "pending",             count: 2 },
    { status: "assigned",            count: 1 },
    { status: "en_route_pickup",     count: 3 },
    { status: "picked_up",           count: 1 },
    { status: "en_route_delivery",   count: 2 },
    { status: "delivered",           count: 1 },
    { status: "completed",           count: 178 },
    { status: "failed",              count: 9 },
    { status: "cancelled",           count: 8 },
  ],
  top_weeet: [
    { weeet_name: "นายชัยวัฒน์ วิ่งเร็ว",    jobs: 72, avg_time_min: 55.3 },
    { weeet_name: "นางสาวปิยะดา รีบมา",      jobs: 58, avg_time_min: 63.1 },
    { weeet_name: "นายนิรันดร์ ส่งไว",        jobs: 45, avg_time_min: 59.7 },
    { weeet_name: "นายเอกชัย ตรงเวลา",       jobs: 28, avg_time_min: 68.0 },
  ],
  monthly_travel_cost: [
    { month: "2026-01", cost: 2800, jobs: 28 },
    { month: "2026-02", cost: 3100, jobs: 32 },
    { month: "2026-03", cost: 3500, jobs: 36 },
    { month: "2026-04", cost: 3200, jobs: 33 },
    { month: "2026-05", cost: 3538, jobs: 36 },
    { month: "2026-06", cost: 3840, jobs: 38 },
  ],
  by_direction: [
    { direction: "shop_to_customer", count: 124 },
    { direction: "customer_to_shop", count: 79 },
  ],
};

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
    green:   "text-green-600",
    red:     "text-red-600",
    orange:  "text-orange-700",
    yellow:  "text-yellow-700",
    "admin-primary": "text-admin-primary",
    "brand-info": "text-brand-info",
    cyan:    "text-cyan-400",
    default: "text-white",
  };
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
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
      if ((e as Error).message === "UNAUTHORIZED") { router.push("/login"); return; }
      console.warn("[mock fallback]", e);
      setData(MOCK_PICKUP_ANALYTICS);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login"); return; }
    fetchData();
  }, [router, fetchData]);

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar />
      <main className="flex-1 p-8 space-y-8 max-w-5xl">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">📊 สถิติงานรับ-ส่งอุปกรณ์</h1>
            <p className="text-gray-500 text-sm mt-1">
              avg pickup time + travel cost + KPI — ภาพรวม pickup jobs
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Period selector */}
            <div className="flex gap-1 bg-white rounded-lg p-1 border border-gray-200">
              {["7d", "30d", "90d", "all"].map(p => (
                <button key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1 rounded text-xs transition-colors ${
                    period === p ? "bg-admin-surface text-admin-primary" : "text-gray-500 hover:text-gray-900"
                  }`}>
                  {p}
                </button>
              ))}
            </div>
            <Link href="/repair/pickup/queue"
              className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg transition-colors">
              ← Queue
            </Link>
          </div>
        </div>

        {loading ? (
          <p className="text-gray-500">กำลังโหลด...</p>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600">{error}</div>
        ) : data && (
          <>
            {/* Summary */}
            <section>
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">ภาพรวม</h2>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard icon="📋" label="Jobs ทั้งหมด"  value={data.total_jobs.toLocaleString()} />
                <StatCard icon="⚡" label="กำลังดำเนิน"    value={data.active_jobs.toLocaleString()} accent="blue" />
                <StatCard icon="✅" label="เสร็จสิ้น"      value={data.completed_jobs.toLocaleString()} accent="green" />
                <StatCard icon="❌" label="ล้มเหลว"        value={data.failed_jobs.toLocaleString()} accent="red" />
                <StatCard icon="🚫" label="ยกเลิก"         value={data.cancelled_jobs.toLocaleString()} accent="orange" />
              </div>
            </section>

            {/* KPI: avg times */}
            <section>
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                KPI — เวลาเฉลี่ย
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
                  accent="brand-info"
                />
                <StatCard
                  icon="⏱️"
                  label="รวมทั้งหมด (avg)"
                  value={fmtTime(data.avg_total_time_min)}
                  sub="assigned → completed"
                  accent="admin-primary"
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
                KPI — อัตรา
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  icon="⏰"
                  label="อัตราตรงเวลา"
                  value={data.on_time_rate != null ? `${(data.on_time_rate * 100).toFixed(1)}%` : "—"}
                  sub="ส่งทันกำหนด"
                  accent={data.on_time_rate != null && data.on_time_rate >= 0.9 ? "green" : "orange"}
                />
                <StatCard
                  icon="✅"
                  label="อัตราสำเร็จ"
                  value={data.success_rate != null ? `${(data.success_rate * 100).toFixed(1)}%` : "—"}
                  sub="completed / total"
                  accent="green"
                />
                <StatCard
                  icon="💵"
                  label="ค่าเดินทางรวม"
                  value={`${data.total_travel_cost.toLocaleString()} ฿`}
                  accent="yellow"
                />
                <StatCard
                  icon="📅"
                  label="ค่าเดินทางเดือนนี้"
                  value={`${data.travel_cost_this_month.toLocaleString()} ฿`}
                  accent="yellow"
                />
              </div>
            </section>

            {/* Monthly travel cost chart */}
            {data.monthly_travel_cost?.length > 0 && (
              <section className="bg-white rounded-xl border border-gray-200 p-5">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                  ค่าเดินทางรายเดือน
                </h2>
                <div className="space-y-2.5">
                  {(() => {
                    const maxCost = Math.max(...data.monthly_travel_cost.map(m => m.cost), 1);
                    return data.monthly_travel_cost.map(m => {
                      const pct = (m.cost / maxCost) * 100;
                      return (
                        <div key={m.month} className="flex items-center gap-3">
                          <span className="text-xs text-gray-500 w-20 shrink-0 font-mono">{m.month}</span>
                          <div className="flex-1 bg-gray-100 rounded-full h-2">
                            <div className="bg-yellow-500 h-2 rounded-full transition-all"
                              style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-yellow-700 font-mono w-28 text-right">
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
              <section className="bg-white rounded-xl border border-gray-200 p-5">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">งานตามสถานะ</h2>
                <div className="space-y-2">
                  {data.by_status.map(row => {
                    const pct = data.total_jobs > 0 ? (row.count / data.total_jobs) * 100 : 0;
                    return (
                      <div key={row.status} className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 w-28 shrink-0">
                          {STATUS_LABELS[row.status] ?? row.status}
                        </span>
                        <div className="flex-1 bg-gray-100 rounded-full h-2">
                          <div className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-gray-700 w-10 text-right">{row.count}</span>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* By Direction */}
              <section className="bg-white rounded-xl border border-gray-200 p-5">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">งานตามทิศทาง</h2>
                <div className="space-y-3">
                  {data.by_direction.map(row => {
                    const total = data.by_direction.reduce((s, r) => s + r.count, 0);
                    const pct = total > 0 ? (row.count / total) * 100 : 0;
                    const isS2C = row.direction === "shop_to_customer";
                    return (
                      <div key={row.direction} className="flex items-center gap-3">
                        <span className={`text-xs w-28 shrink-0 ${isS2C ? "text-brand-success" : "text-admin-primary"}`}>
                          {isS2C ? "ร้าน → ลูกค้า" : "ลูกค้า → ร้าน"}
                        </span>
                        <div className="flex-1 bg-gray-100 rounded-full h-2">
                          <div className={`h-2 rounded-full transition-all ${isS2C ? "bg-brand-success" : "bg-admin-primary"}`}
                            style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-gray-700 w-10 text-right">{row.count}</span>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>

            {/* Top WeeeT */}
            {data.top_weeet?.length > 0 && (
              <section className="bg-white rounded-xl border border-gray-200 p-5">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">WeeeT อันดับต้น</h2>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-500 text-left border-b border-gray-200">
                      <th className="pb-2">#</th>
                      <th className="pb-2">WeeeT</th>
                      <th className="pb-2 text-right">งาน</th>
                      <th className="pb-2 text-right">เวลาเฉลี่ย</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {data.top_weeet.map((row, i) => (
                      <tr key={i} className="hover:bg-gray-100/30">
                        <td className="py-2.5 text-gray-600 w-8">{i + 1}.</td>
                        <td className="py-2.5 text-gray-200">{row.weeet_name}</td>
                        <td className="py-2.5 text-right font-mono text-blue-400">{row.jobs}</td>
                        <td className="py-2.5 text-right font-mono text-admin-primary">
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
