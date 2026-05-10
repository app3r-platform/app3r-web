"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isAuthenticated } from "@/lib/auth";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/sidebar";

interface RepairAnalytics {
  total_jobs: number;
  active_jobs: number;
  closed_jobs: number;
  cancelled_jobs: number;
  converted_scrap_jobs: number;

  by_status: { status: string; count: number }[];
  by_branch: { branch: string; count: number }[];
  by_source?: { type: string; count: number }[];  // D64 source breakdown

  avg_completion_hours: number | null;
  conversion_rate_b22: number | null;

  top_weeer: { weeer_name: string; jobs: number }[];
  recent_closures: { job_id: string; closed_at: string; final_price: number }[];
}

function StatCard({
  icon, label, value, sub, accent,
}: {
  icon: string; label: string; value: string | number; sub?: string; accent?: string;
}) {
  const accentMap: Record<string, string> = {
    blue:   "text-blue-400",
    green:  "text-green-400",
    red:    "text-red-400",
    orange: "text-orange-400",
    purple: "text-purple-400",
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

const BRANCH_LABELS: Record<string, string> = {
  "B1.1": "B1.1 ซ่อมตามเงื่อนไข",
  "B1.2": "B1.2 เพิ่มอะไหล่",
  "B2.1": "B2.1 ซ่อมไม่ได้ (ยกเลิก)",
  "B2.2": "B2.2 ขายซาก",
};

const STATUS_LABELS: Record<string, string> = {
  assigned: "มอบหมาย", traveling: "เดินทาง", arrived: "ถึงแล้ว",
  awaiting_entry: "รอเข้าบ้าน", inspecting: "ตรวจสภาพ",
  awaiting_decision: "รอ WeeeR", awaiting_user: "รอ WeeeU",
  in_progress: "กำลังซ่อม", completed: "ซ่อมเสร็จ",
  awaiting_review: "รอตรวจรับ", closed: "ปิดงาน",
  cancelled: "ยกเลิก", converted_scrap: "→ ซาก",
};

export default function RepairAnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState<RepairAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const d = await api.get<RepairAnalytics>("/admin/repair/analytics?service_type=on_site");
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

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">📊 Repair Analytics — On-site</h1>
            <p className="text-gray-400 text-sm mt-1">ภาพรวมงานซ่อม On-site — jobs by status, branch, conversion rate</p>
          </div>
          <Link href="/repair/jobs"
            className="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors">
            ← ดู Jobs List
          </Link>
        </div>

        {loading ? (
          <p className="text-gray-500">กำลังโหลด...</p>
        ) : error ? (
          <div className="bg-red-900/30 border border-red-800 rounded-xl p-4 text-red-400">{error}</div>
        ) : data && (
          <>
            {/* Summary cards */}
            <section>
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">ภาพรวม</h2>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard icon="📋" label="Jobs ทั้งหมด" value={data.total_jobs.toLocaleString()} />
                <StatCard icon="⚡" label="Active" value={data.active_jobs.toLocaleString()} accent="blue" />
                <StatCard icon="✅" label="ปิดงานแล้ว" value={data.closed_jobs.toLocaleString()} accent="green" />
                <StatCard icon="❌" label="ยกเลิก" value={data.cancelled_jobs.toLocaleString()} accent="red" />
                <StatCard icon="♻️" label="→ ซาก (B2.2)" value={data.converted_scrap_jobs.toLocaleString()} accent="orange" />
              </div>
            </section>

            {/* KPI */}
            <section>
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">KPI</h2>
              <div className="grid grid-cols-2 gap-4">
                <StatCard
                  icon="⏱️"
                  label="Avg Completion Time"
                  value={data.avg_completion_hours != null
                    ? `${data.avg_completion_hours.toFixed(1)} ชั่วโมง`
                    : "—"}
                  sub="T0 → T7 เฉลี่ย"
                  accent="purple"
                />
                <StatCard
                  icon="♻️"
                  label="B2.2 Conversion Rate"
                  value={data.conversion_rate_b22 != null
                    ? `${(data.conversion_rate_b22 * 100).toFixed(1)}%`
                    : "—"}
                  sub="ซ่อมไม่ได้ → ซาก / total closed"
                  accent="orange"
                />
              </div>
            </section>

            {/* By Status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <section className="bg-gray-900 rounded-xl border border-gray-800 p-5">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Jobs by Status</h2>
                <div className="space-y-2">
                  {data.by_status.map(row => {
                    const pct = data.total_jobs > 0 ? (row.count / data.total_jobs) * 100 : 0;
                    return (
                      <div key={row.status} className="flex items-center gap-3">
                        <span className="text-xs text-gray-400 w-32 shrink-0">
                          {STATUS_LABELS[row.status] ?? row.status}
                        </span>
                        <div className="flex-1 bg-gray-800 rounded-full h-2">
                          <div className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-gray-300 w-12 text-right">{row.count}</span>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* By Branch */}
              <section className="bg-gray-900 rounded-xl border border-gray-800 p-5">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Jobs by Branch</h2>
                <div className="space-y-3">
                  {data.by_branch.map(row => {
                    const total = data.by_branch.reduce((s, r) => s + r.count, 0);
                    const pct = total > 0 ? (row.count / total) * 100 : 0;
                    const colors: Record<string, string> = {
                      "B1.1": "bg-green-600", "B1.2": "bg-yellow-600",
                      "B2.1": "bg-red-600",   "B2.2": "bg-orange-600",
                    };
                    return (
                      <div key={row.branch} className="flex items-center gap-3">
                        <span className="text-xs font-mono text-purple-400 w-10 shrink-0">{row.branch}</span>
                        <span className="text-xs text-gray-500 w-32 shrink-0">
                          {BRANCH_LABELS[row.branch] ?? row.branch}
                        </span>
                        <div className="flex-1 bg-gray-800 rounded-full h-2">
                          <div className={`${colors[row.branch] ?? "bg-gray-600"} h-2 rounded-full transition-all`}
                            style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-gray-300 w-10 text-right">{row.count}</span>
                      </div>
                    );
                  })}
                  {data.by_branch.length === 0 && (
                    <p className="text-xs text-gray-600">ยังไม่มี branch data</p>
                  )}
                </div>
              </section>
            </div>

            {/* By Source — D64 */}
            <section className="bg-gray-900 rounded-xl border border-gray-800 p-5">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                🔍 Jobs by Source (D64)
              </h2>
              {!data.by_source || data.by_source.length === 0 ? (
                <p className="text-xs text-gray-600">ยังไม่มีข้อมูล by_source — รอ Backend C-3.3</p>
              ) : (
                <div className="space-y-3">
                  {data.by_source.map(row => {
                    const sourceTotal = data.by_source!.reduce((s, r) => s + r.count, 0);
                    const pct = sourceTotal > 0 ? (row.count / sourceTotal) * 100 : 0;
                    const isScrap = row.type === "purchased_scrap";
                    return (
                      <div key={row.type} className="flex items-center gap-3">
                        <span className={`text-xs px-2 py-0.5 rounded border shrink-0 w-36 text-center ${
                          isScrap
                            ? "bg-orange-900/40 border-orange-700 text-orange-300"
                            : "bg-blue-900/40 border-blue-700 text-blue-300"
                        }`}>
                          {isScrap ? "ซื้อจากซาก" : "ลูกค้า"}
                        </span>
                        <div className="flex-1 bg-gray-800 rounded-full h-2">
                          <div className={`${isScrap ? "bg-orange-500" : "bg-blue-500"} h-2 rounded-full transition-all`}
                            style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-gray-300 w-20 text-right font-mono">
                          {row.count} ({pct.toFixed(1)}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Top WeeeR */}
            {data.top_weeer?.length > 0 && (
              <section className="bg-gray-900 rounded-xl border border-gray-800 p-5">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Top WeeeR (by jobs)</h2>
                <div className="space-y-1.5">
                  {data.top_weeer.map((row, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      <span className="text-gray-600 w-5 text-right">{i + 1}.</span>
                      <span className="text-gray-200 flex-1">{row.weeer_name}</span>
                      <span className="text-blue-400 font-mono">{row.jobs} jobs</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Recent closures */}
            {data.recent_closures?.length > 0 && (
              <section className="bg-gray-900 rounded-xl border border-gray-800 p-5">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Recent Closures</h2>
                <div className="space-y-1.5">
                  {data.recent_closures.map(row => (
                    <div key={row.job_id} className="flex items-center gap-3 text-sm border-b border-gray-800/50 pb-1.5">
                      <Link href={`/repair/jobs/${row.job_id}`}
                        className="font-mono text-xs text-blue-400 hover:text-blue-300 w-24 shrink-0">
                        {row.job_id.slice(0, 8)}…
                      </Link>
                      <span className="text-gray-400 text-xs flex-1">
                        {new Date(row.closed_at).toLocaleString("th-TH")}
                      </span>
                      <span className="text-green-400 font-mono text-xs">
                        {row.final_price.toLocaleString()} G
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
