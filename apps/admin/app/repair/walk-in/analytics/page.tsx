"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isAuthenticated } from "@/lib/auth";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/sidebar";

interface WalkInAnalytics {
  total_jobs: number;
  active_jobs: number;
  completed_jobs: number;
  closed_jobs: number;
  abandoned_jobs: number;
  cancelled_jobs: number;

  storage_fee_total: number;
  storage_fee_this_month: number;
  abandoned_rate: number | null;
  avg_repair_hours: number | null;
  avg_storage_days: number | null;

  by_status: { status: string; count: number }[];
  by_store:  { store_name: string; count: number; storage_fee: number }[];

  monthly_storage_fee: { month: string; fee: number }[];
  top_issues: { issue: string; count: number }[];
}

const STATUS_LABELS: Record<string, string> = {
  checked_in:        "เช็คอิน",
  inspecting:        "ตรวจสภาพ",
  awaiting_decision: "รอตัดสินใจ",
  awaiting_parts:    "รอชิ้นส่วน",
  in_progress:       "กำลังซ่อม",
  completed:         "ซ่อมเสร็จ",
  awaiting_pickup:   "รอรับคืน",
  closed:            "ปิดงาน",
  abandoned:         "ทิ้งแล้ว",
  cancelled:         "ยกเลิก",
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

export default function WalkInAnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState<WalkInAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const d = await api.get<WalkInAnalytics>("/admin/repair/walk-in/analytics");
      setData(d);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login"); return; }
    fetchData();
  }, [router, fetchData]);

  return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      <Sidebar />
      <main className="flex-1 p-8 space-y-8 max-w-5xl">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">📊 Walk-in Analytics</h1>
            <p className="text-gray-400 text-sm mt-1">
              Storage fee revenue + abandoned rate + ภาพรวม walk-in jobs
            </p>
          </div>
          <Link href="/repair/walk-in/queue"
            className="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors">
            ← Walk-in Queue
          </Link>
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
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <StatCard icon="📋" label="Jobs ทั้งหมด"   value={data.total_jobs.toLocaleString()} />
                <StatCard icon="⚡" label="Active"         value={data.active_jobs.toLocaleString()} accent="blue" />
                <StatCard icon="✅" label="ปิดงานแล้ว"     value={data.closed_jobs.toLocaleString()} accent="green" />
                <StatCard icon="📦" label="Abandoned"      value={data.abandoned_jobs.toLocaleString()} accent="orange" />
                <StatCard icon="❌" label="ยกเลิก"          value={data.cancelled_jobs.toLocaleString()} accent="red" />
                <StatCard icon="🔧" label="ซ่อมเสร็จ"      value={data.completed_jobs.toLocaleString()} accent="purple" />
              </div>
            </section>

            {/* Storage Fee KPIs */}
            <section>
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Storage Fee & KPI</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  icon="💰"
                  label="Storage Fee รวม"
                  value={`${data.storage_fee_total.toLocaleString()} ฿`}
                  sub="ตลอดช่วงเวลา"
                  accent="yellow"
                />
                <StatCard
                  icon="📅"
                  label="Storage Fee เดือนนี้"
                  value={`${data.storage_fee_this_month.toLocaleString()} ฿`}
                  accent="yellow"
                />
                <StatCard
                  icon="📦"
                  label="Abandoned Rate"
                  value={data.abandoned_rate != null
                    ? `${(data.abandoned_rate * 100).toFixed(1)}%`
                    : "—"}
                  sub="abandoned / total closed"
                  accent="orange"
                />
                <StatCard
                  icon="⏱️"
                  label="Avg Repair Time"
                  value={data.avg_repair_hours != null
                    ? `${data.avg_repair_hours.toFixed(1)} ชม.`
                    : "—"}
                  sub="checked_in → completed"
                  accent="purple"
                />
              </div>
            </section>

            {/* Monthly Storage Fee chart */}
            {data.monthly_storage_fee?.length > 0 && (
              <section className="bg-gray-900 rounded-xl border border-gray-800 p-5">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                  Storage Fee รายเดือน
                </h2>
                <div className="space-y-2.5">
                  {(() => {
                    const maxFee = Math.max(...data.monthly_storage_fee.map(m => m.fee), 1);
                    return data.monthly_storage_fee.map(m => {
                      const pct = (m.fee / maxFee) * 100;
                      return (
                        <div key={m.month} className="flex items-center gap-3">
                          <span className="text-xs text-gray-400 w-20 shrink-0 font-mono">{m.month}</span>
                          <div className="flex-1 bg-gray-800 rounded-full h-2">
                            <div className="bg-yellow-500 h-2 rounded-full transition-all"
                              style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-yellow-400 font-mono w-28 text-right">
                            {m.fee.toLocaleString()} ฿
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
                  {data.by_status.length === 0 && (
                    <p className="text-xs text-gray-600">ยังไม่มีข้อมูล</p>
                  )}
                </div>
              </section>

              {/* Top Issues */}
              {data.top_issues?.length > 0 && (
                <section className="bg-gray-900 rounded-xl border border-gray-800 p-5">
                  <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                    อาการที่พบบ่อย
                  </h2>
                  <div className="space-y-2">
                    {data.top_issues.map((row, i) => {
                      const maxCount = data.top_issues[0]?.count ?? 1;
                      const pct = (row.count / maxCount) * 100;
                      return (
                        <div key={i} className="flex items-center gap-3">
                          <span className="text-xs text-gray-600 w-4 text-right">{i + 1}.</span>
                          <span className="text-xs text-gray-300 w-40 shrink-0 truncate">{row.issue}</span>
                          <div className="flex-1 bg-gray-800 rounded-full h-2">
                            <div className="bg-purple-600 h-2 rounded-full transition-all"
                              style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-gray-400 w-8 text-right">{row.count}</span>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}
            </div>

            {/* By Store */}
            {data.by_store?.length > 0 && (
              <section className="bg-gray-900 rounded-xl border border-gray-800 p-5">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                  ภาพรวมตามร้าน
                </h2>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-500 text-left border-b border-gray-800">
                      <th className="pb-2">ร้าน</th>
                      <th className="pb-2 text-right">Jobs</th>
                      <th className="pb-2 text-right">Storage Fee</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {data.by_store.map((row, i) => (
                      <tr key={i} className="hover:bg-gray-800/30">
                        <td className="py-2.5 text-gray-200">{row.store_name}</td>
                        <td className="py-2.5 text-right font-mono text-blue-400">{row.count}</td>
                        <td className="py-2.5 text-right font-mono text-yellow-400">
                          {row.storage_fee.toLocaleString()} ฿
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
