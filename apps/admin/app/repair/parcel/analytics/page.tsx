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

// mock fallback — ลบตอน Phase 4 (TD-06)
const MOCK_PARCEL_ANALYTICS: ParcelAnalytics = {
  total_jobs: 142,
  active_jobs: 38,
  completed_jobs: 95,
  failed_jobs: 4,
  lost_jobs: 5,
  avg_outbound_days: 1.8,
  avg_return_days: 2.1,
  avg_total_days: 12.4,
  return_rate: 0.67,
  dispute_rate: 0.035,
  success_rate: 0.869,
  total_shipping_cost: 19850,
  shipping_cost_this_month: 4320,
  avg_shipping_cost: 139.79,
  by_status: [
    { status: "completed",       count: 95 },
    { status: "at_shop",         count: 18 },
    { status: "in_transit_out",  count: 10 },
    { status: "in_transit_back", count: 10 },
    { status: "lost",            count: 5  },
    { status: "failed",          count: 4  },
  ],
  by_courier: [
    { courier_name: "Kerry Express",     jobs: 62, avg_transit_days: 1.6, on_time_rate: 0.94, dispute_rate: 0.016, total_cost: 7850 },
    { courier_name: "Flash Express",     jobs: 45, avg_transit_days: 1.9, on_time_rate: 0.91, dispute_rate: 0.044, total_cost: 5625 },
    { courier_name: "J&T Express",       jobs: 22, avg_transit_days: 2.3, on_time_rate: 0.86, dispute_rate: 0.045, total_cost: 3080 },
    { courier_name: "Thailand Post EMS", jobs: 13, avg_transit_days: 3.1, on_time_rate: 0.77, dispute_rate: 0.077, total_cost: 3295 },
  ],
  monthly_shipping_cost: [
    { month: "2026-03", cost: 3200, jobs: 23 },
    { month: "2026-04", cost: 4100, jobs: 29 },
    { month: "2026-05", cost: 4850, jobs: 34 },
    { month: "2026-06", cost: 4320, jobs: 31 },
  ],
  disputes_by_type: [
    { type: "lost",             count: 5 },
    { type: "damaged_arrival",  count: 3 },
    { type: "damaged_return",   count: 2 },
    { type: "wrong_item",       count: 1 },
  ],
};

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
    green:   "text-green-600",
    red:     "text-red-600",
    orange:  "text-orange-700",
    yellow:  "text-yellow-700",
    "admin-primary": "text-admin-primary",
    cyan:    "text-cyan-400",
    "brand-info": "text-brand-info",
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

export default function ParcelAnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState<ParcelAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30d");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const d = await api.get<ParcelAnalytics>(`/admin/repair/parcel/analytics?period=${period}`);
      setData(d);
    } catch (e: unknown) {
      if ((e as Error).message === "UNAUTHORIZED") { router.push("/login"); return; }
      console.warn("[mock fallback]", e);
      setData(MOCK_PARCEL_ANALYTICS);
    } finally {
      setLoading(false);
    }
  }, [period, router]);

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login"); return; }
    fetchData();
  }, [router, fetchData]);

  function fmtDays(d: number | null) {
    if (d == null) return "—";
    return `${d.toFixed(1)} วัน`;
  }

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar />
      <main className="flex-1 p-8 space-y-8 max-w-5xl">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">📊 สถิติพัสดุ (Parcel Analytics)</h1>
            <p className="text-gray-500 text-sm mt-1">
              เวลาส่งเฉลี่ย / อัตราข้อพิพาท / เปรียบเทียบ Courier
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1 bg-white rounded-lg p-1 border border-gray-200">
              {["7d", "30d", "90d", "all"].map(p => (
                <button key={p} onClick={() => setPeriod(p)}
                  className={`px-3 py-1 rounded text-xs transition-colors ${
                    period === p ? "bg-admin-surface text-admin-primary" : "text-gray-500 hover:text-gray-900"
                  }`}>
                  {p}
                </button>
              ))}
            </div>
            <Link href="/repair/parcel/queue"
              className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg transition-colors">
              ← คิว
            </Link>
          </div>
        </div>

        {loading ? (
          <p className="text-gray-500">กำลังโหลด...</p>
        ) : data && (
          <>
            {/* Summary */}
            <section>
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">ภาพรวม</h2>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard icon="📦" label="งานทั้งหมด"  value={data.total_jobs.toLocaleString()} />
                <StatCard icon="⚡" label="กำลังดำเนินการ" value={data.active_jobs.toLocaleString()} accent="blue" />
                <StatCard icon="✅" label="เสร็จสิ้น"     value={data.completed_jobs.toLocaleString()} accent="green" />
                <StatCard icon="❌" label="ล้มเหลว"       value={data.failed_jobs.toLocaleString()} accent="red" />
                <StatCard icon="🔍" label="พัสดุหาย"     value={data.lost_jobs.toLocaleString()} accent="orange" />
              </div>
            </section>

            {/* KPI: Avg Time */}
            <section>
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                KPI — เวลาส่งเฉลี่ย
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon="↗" label="ขาออก (เฉลี่ย)" value={fmtDays(data.avg_outbound_days)}
                  sub="ส่ง → ถึงร้าน" accent="cyan" />
                <StatCard icon="↙" label="ขาคืน (เฉลี่ย)" value={fmtDays(data.avg_return_days)}
                  sub="ส่งกลับ → ถึงลูกค้า" accent="brand-info" />
                <StatCard icon="⏱️" label="รวม (เฉลี่ย)" value={fmtDays(data.avg_total_days)}
                  sub="ตั้งแต่ต้นจนจบ" accent="admin-primary" />
                <StatCard icon="💰" label="ค่าส่ง/งาน (เฉลี่ย)"
                  value={data.avg_shipping_cost != null ? `${data.avg_shipping_cost.toFixed(0)} ฿` : "—"}
                  accent="yellow" />
              </div>
            </section>

            {/* KPI: Rates */}
            <section>
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                KPI — อัตรา
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon="✅" label="อัตราสำเร็จ"
                  value={data.success_rate != null ? `${(data.success_rate * 100).toFixed(1)}%` : "—"}
                  sub="เสร็จสิ้น / ทั้งหมด" accent="green" />
                <StatCard icon="↩️" label="อัตราส่งคืน"
                  value={data.return_rate != null ? `${(data.return_rate * 100).toFixed(1)}%` : "—"}
                  sub="ส่งคืนจากทั้งหมด" accent="orange" />
                <StatCard icon="⚠️" label="อัตราข้อพิพาท"
                  value={data.dispute_rate != null ? `${(data.dispute_rate * 100).toFixed(1)}%` : "—"}
                  sub="ข้อพิพาท / ทั้งหมด" accent={data.dispute_rate != null && data.dispute_rate > 0.05 ? "red" : "orange"} />
                <StatCard icon="💵" label="ค่าส่งรวม"
                  value={`${data.total_shipping_cost.toLocaleString()} ฿`} accent="yellow" />
              </div>
            </section>

            {/* Monthly shipping cost chart */}
            {data.monthly_shipping_cost?.length > 0 && (
              <section className="bg-white rounded-xl border border-gray-200 p-5">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                  ค่าส่งรายเดือน
                </h2>
                <div className="space-y-2.5">
                  {(() => {
                    const maxCost = Math.max(...data.monthly_shipping_cost.map(m => m.cost), 1);
                    return data.monthly_shipping_cost.map(m => (
                      <div key={m.month} className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 w-20 shrink-0 font-mono">{m.month}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-2">
                          <div className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${(m.cost / maxCost) * 100}%` }} />
                        </div>
                        <span className="text-xs text-blue-400 font-mono w-28 text-right">
                          {m.cost.toLocaleString()} ฿
                        </span>
                        <span className="text-xs text-gray-600 w-14 text-right">{m.jobs} งาน</span>
                      </div>
                    ));
                  })()}
                </div>
              </section>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Disputes by type */}
              {data.disputes_by_type?.length > 0 && (
                <section className="bg-white rounded-xl border border-gray-200 p-5">
                  <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                    ข้อพิพาทตามประเภท
                  </h2>
                  <div className="space-y-2">
                    {data.disputes_by_type.map(row => {
                      const total = data.disputes_by_type.reduce((s, r) => s + r.count, 0);
                      const pct = total > 0 ? (row.count / total) * 100 : 0;
                      return (
                        <div key={row.type} className="flex items-center gap-3">
                          <span className="text-xs text-gray-500 w-36 shrink-0">
                            {DISPUTE_TYPE_LABEL[row.type] ?? row.type}
                          </span>
                          <div className="flex-1 bg-gray-100 rounded-full h-2">
                            <div className="bg-orange-600 h-2 rounded-full transition-all"
                              style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-gray-700 w-8 text-right">{row.count}</span>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

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
                        <span className="text-xs text-gray-700 w-8 text-right">{row.count}</span>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>

            {/* Courier comparison */}
            {data.by_courier?.length > 0 && (
              <section className="bg-white rounded-xl border border-gray-200 p-5">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                  เปรียบเทียบ Courier
                </h2>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-500 text-left border-b border-gray-200">
                      <th className="pb-2">ขนส่ง</th>
                      <th className="pb-2 text-right">งาน</th>
                      <th className="pb-2 text-right">เวลาเฉลี่ย</th>
                      <th className="pb-2 text-right">ตรงเวลา</th>
                      <th className="pb-2 text-right">ข้อพิพาท</th>
                      <th className="pb-2 text-right">ค่าส่งรวม</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {data.by_courier.map((row, i) => (
                      <tr key={i} className="hover:bg-gray-100/30">
                        <td className="py-2.5 text-gray-200 font-medium">{row.courier_name}</td>
                        <td className="py-2.5 text-right font-mono text-blue-400">{row.jobs}</td>
                        <td className="py-2.5 text-right font-mono text-admin-primary">
                          {fmtDays(row.avg_transit_days)}
                        </td>
                        <td className="py-2.5 text-right font-mono">
                          <span className={
                            row.on_time_rate != null && row.on_time_rate >= 0.9
                              ? "text-green-600" : "text-orange-700"
                          }>
                            {row.on_time_rate != null ? `${(row.on_time_rate * 100).toFixed(1)}%` : "—"}
                          </span>
                        </td>
                        <td className="py-2.5 text-right font-mono">
                          <span className={
                            row.dispute_rate != null && row.dispute_rate > 0.05
                              ? "text-red-600" : "text-gray-500"
                          }>
                            {row.dispute_rate != null ? `${(row.dispute_rate * 100).toFixed(1)}%` : "—"}
                          </span>
                        </td>
                        <td className="py-2.5 text-right font-mono text-yellow-700">
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
