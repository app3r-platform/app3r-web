"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isAuthenticated } from "@/lib/auth";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/sidebar";

interface CourierStats {
  courier_name: string;
  jobs: number;
  avg_transit_days: number | null;
  on_time_rate: number | null;
  dispute_rate: number | null;
  total_cost: number;
}

interface ParcelAnalytics {
  total_jobs: number;
  active_jobs: number;
  completed_jobs: number;
  failed_jobs: number;
  lost_jobs: number;

  avg_outbound_days: number | null;
  avg_return_days: number | null;
  avg_total_days: number | null;

  return_rate: number | null;
  dispute_rate: number | null;
  success_rate: number | null;

  total_shipping_cost: number;
  shipping_cost_this_month: number;
  avg_shipping_cost: number | null;

  by_status: { status: string; count: number }[];
  by_courier: CourierStats[];
  monthly_shipping_cost: { month: string; cost: number; jobs: number }[];
  disputes_by_type: { type: string; count: number }[];
}

const STATUS_LABELS: Record<string, string> = {
  pending:          "รอดำเนินการ",
  label_created:    "สร้าง label",
  shipped_out:      "ส่งออกแล้ว",
  in_transit_out:   "กำลังส่งไปร้าน",
  at_shop:          "อยู่ที่ร้าน",
  repaired:         "ซ่อมเสร็จ",
  shipped_back:     "ส่งคืนแล้ว",
  in_transit_back:  "กำลังส่งกลับ",
  delivered:        "ส่งถึงลูกค้า",
  completed:        "เสร็จสิ้น",
  failed:           "ล้มเหลว",
  lost:             "พัสดุหาย",
  cancelled:        "ยกเลิก",
};

const DISPUTE_TYPE_LABEL: Record<string, string> = {
  lost:             "พัสดุหาย",
  damaged_arrival:  "เสียหายเมื่อถึงร้าน",
  damaged_return:   "เสียหายเมื่อส่งคืน",
  wrong_item:       "ส่งผิดชิ้น",
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

export default function ParcelAnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState<ParcelAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState("30d");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const d = await api.get<ParcelAnalytics>(`/admin/repair/parcel/analytics?period=${period}`);
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

  function fmtDays(d: number | null) {
    if (d == null) return "—";
    return `${d.toFixed(1)} วัน`;
  }

  return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      <Sidebar />
      <main className="flex-1 p-8 space-y-8 max-w-5xl">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">📊 Parcel Analytics</h1>
            <p className="text-gray-400 text-sm mt-1">
              avg shipping time + dispute rate + courier comparison
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1 bg-gray-900 rounded-lg p-1 border border-gray-800">
              {["7d", "30d", "90d", "all"].map(p => (
                <button key={p} onClick={() => setPeriod(p)}
                  className={`px-3 py-1 rounded text-xs transition-colors ${
                    period === p ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
                  }`}>
                  {p}
                </button>
              ))}
            </div>
            <Link href="/repair/parcel/queue"
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
                <StatCard icon="📦" label="Jobs ทั้งหมด"  value={data.total_jobs.toLocaleString()} />
                <StatCard icon="⚡" label="Active"        value={data.active_jobs.toLocaleString()} accent="blue" />
                <StatCard icon="✅" label="เสร็จสิ้น"     value={data.completed_jobs.toLocaleString()} accent="green" />
                <StatCard icon="❌" label="ล้มเหลว"       value={data.failed_jobs.toLocaleString()} accent="red" />
                <StatCard icon="🔍" label="พัสดุหาย"     value={data.lost_jobs.toLocaleString()} accent="orange" />
              </div>
            </section>

            {/* KPI: Avg Time */}
            <section>
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                KPI — Avg Shipping Time
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon="↗" label="ขาออก (avg)" value={fmtDays(data.avg_outbound_days)}
                  sub="ส่ง → ถึงร้าน" accent="cyan" />
                <StatCard icon="↙" label="ขาคืน (avg)" value={fmtDays(data.avg_return_days)}
                  sub="ส่งกลับ → ถึงลูกค้า" accent="indigo" />
                <StatCard icon="⏱️" label="รวม (avg)" value={fmtDays(data.avg_total_days)}
                  sub="ตั้งแต่ต้นจนจบ" accent="purple" />
                <StatCard icon="💰" label="ค่าส่ง/งาน (avg)"
                  value={data.avg_shipping_cost != null ? `${data.avg_shipping_cost.toFixed(0)} ฿` : "—"}
                  accent="yellow" />
              </div>
            </section>

            {/* KPI: Rates */}
            <section>
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                KPI — Rate
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon="✅" label="Success Rate"
                  value={data.success_rate != null ? `${(data.success_rate * 100).toFixed(1)}%` : "—"}
                  sub="completed / total" accent="green" />
                <StatCard icon="↩️" label="Return Rate"
                  value={data.return_rate != null ? `${(data.return_rate * 100).toFixed(1)}%` : "—"}
                  sub="ส่งคืนจาก total" accent="orange" />
                <StatCard icon="⚠️" label="Dispute Rate"
                  value={data.dispute_rate != null ? `${(data.dispute_rate * 100).toFixed(1)}%` : "—"}
                  sub="dispute / total" accent={data.dispute_rate != null && data.dispute_rate > 0.05 ? "red" : "orange"} />
                <StatCard icon="💵" label="ค่าส่งรวม"
                  value={`${data.total_shipping_cost.toLocaleString()} ฿`} accent="yellow" />
              </div>
            </section>

            {/* Monthly shipping cost chart */}
            {data.monthly_shipping_cost?.length > 0 && (
              <section className="bg-gray-900 rounded-xl border border-gray-800 p-5">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                  Shipping Cost รายเดือน
                </h2>
                <div className="space-y-2.5">
                  {(() => {
                    const maxCost = Math.max(...data.monthly_shipping_cost.map(m => m.cost), 1);
                    return data.monthly_shipping_cost.map(m => (
                      <div key={m.month} className="flex items-center gap-3">
                        <span className="text-xs text-gray-400 w-20 shrink-0 font-mono">{m.month}</span>
                        <div className="flex-1 bg-gray-800 rounded-full h-2">
                          <div className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${(m.cost / maxCost) * 100}%` }} />
                        </div>
                        <span className="text-xs text-blue-400 font-mono w-28 text-right">
                          {m.cost.toLocaleString()} ฿
                        </span>
                        <span className="text-xs text-gray-600 w-14 text-right">{m.jobs} jobs</span>
                      </div>
                    ));
                  })()}
                </div>
              </section>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Disputes by type */}
              {data.disputes_by_type?.length > 0 && (
                <section className="bg-gray-900 rounded-xl border border-gray-800 p-5">
                  <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                    Disputes by Type
                  </h2>
                  <div className="space-y-2">
                    {data.disputes_by_type.map(row => {
                      const total = data.disputes_by_type.reduce((s, r) => s + r.count, 0);
                      const pct = total > 0 ? (row.count / total) * 100 : 0;
                      return (
                        <div key={row.type} className="flex items-center gap-3">
                          <span className="text-xs text-gray-400 w-36 shrink-0">
                            {DISPUTE_TYPE_LABEL[row.type] ?? row.type}
                          </span>
                          <div className="flex-1 bg-gray-800 rounded-full h-2">
                            <div className="bg-orange-600 h-2 rounded-full transition-all"
                              style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-gray-300 w-8 text-right">{row.count}</span>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

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
                        <span className="text-xs text-gray-300 w-8 text-right">{row.count}</span>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>

            {/* Courier comparison */}
            {data.by_courier?.length > 0 && (
              <section className="bg-gray-900 rounded-xl border border-gray-800 p-5">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                  Courier Comparison
                </h2>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-500 text-left border-b border-gray-800">
                      <th className="pb-2">Courier</th>
                      <th className="pb-2 text-right">Jobs</th>
                      <th className="pb-2 text-right">Avg Transit</th>
                      <th className="pb-2 text-right">On-time</th>
                      <th className="pb-2 text-right">Dispute Rate</th>
                      <th className="pb-2 text-right">Total Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {data.by_courier.map((row, i) => (
                      <tr key={i} className="hover:bg-gray-800/30">
                        <td className="py-2.5 text-gray-200 font-medium">{row.courier_name}</td>
                        <td className="py-2.5 text-right font-mono text-blue-400">{row.jobs}</td>
                        <td className="py-2.5 text-right font-mono text-purple-400">
                          {fmtDays(row.avg_transit_days)}
                        </td>
                        <td className="py-2.5 text-right font-mono">
                          <span className={
                            row.on_time_rate != null && row.on_time_rate >= 0.9
                              ? "text-green-400" : "text-orange-400"
                          }>
                            {row.on_time_rate != null ? `${(row.on_time_rate * 100).toFixed(1)}%` : "—"}
                          </span>
                        </td>
                        <td className="py-2.5 text-right font-mono">
                          <span className={
                            row.dispute_rate != null && row.dispute_rate > 0.05
                              ? "text-red-400" : "text-gray-400"
                          }>
                            {row.dispute_rate != null ? `${(row.dispute_rate * 100).toFixed(1)}%` : "—"}
                          </span>
                        </td>
                        <td className="py-2.5 text-right font-mono text-yellow-400">
                          {row.total_cost.toLocaleString()} ฿
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
