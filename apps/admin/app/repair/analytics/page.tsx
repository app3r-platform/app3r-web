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

// mock fallback — ลบตอน Phase 4 (TD-06)
const MOCK_REPAIR_ANALYTICS: RepairAnalytics = {
  total_jobs: 218,
  active_jobs: 47,
  closed_jobs: 152,
  cancelled_jobs: 14,
  converted_scrap_jobs: 5,
  by_status: [
    { status: "closed",            count: 152 },
    { status: "in_progress",       count: 22 },
    { status: "awaiting_decision", count: 12 },
    { status: "awaiting_user",     count: 8 },
    { status: "inspecting",        count: 5 },
    { status: "cancelled",         count: 14 },
    { status: "converted_scrap",   count: 5 },
  ],
  by_branch: [
    { branch: "B1.1", count: 98 },
    { branch: "B1.2", count: 54 },
    { branch: "B2.1", count: 14 },
    { branch: "B2.2", count: 5 },
  ],
  by_source: [
    { type: "customer",        count: 201 },
    { type: "purchased_scrap", count: 17 },
  ],
  avg_completion_hours: 5.3,
  conversion_rate_b22: 0.0329,
  top_weeer: [
    { weeer_name: "ร้าน iCare สยาม", jobs: 48 },
    { weeer_name: "TechFix เซ็นทรัล", jobs: 41 },
    { weeer_name: "GadgetDoc ลาดพร้าว", jobs: 35 },
    { weeer_name: "ProRepair สีลม", jobs: 28 },
    { weeer_name: "QuickFix อารีย์", jobs: 19 },
  ],
  recent_closures: [
    { job_id: "rj-001aabbcc", closed_at: "2026-06-09T14:30:00Z", final_price: 2500 },
    { job_id: "rj-002ddeeff", closed_at: "2026-06-09T11:00:00Z", final_price: 1800 },
    { job_id: "rj-003gghhii", closed_at: "2026-06-08T16:45:00Z", final_price: 3200 },
    { job_id: "rj-004jjkkll", closed_at: "2026-06-08T13:20:00Z", final_price: 950 },
    { job_id: "rj-005mmnnoo", closed_at: "2026-06-07T10:10:00Z", final_price: 4500 },
  ],
};

function StatCard({
  icon, label, value, sub, accent,
}: {
  icon: string; label: string; value: string | number; sub?: string; accent?: string;
}) {
  const accentMap: Record<string, string> = {
    blue:   "text-blue-400",
    green:  "text-green-600",
    red:    "text-red-600",
    orange: "text-orange-700",
    "admin-primary": "text-admin-primary",
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

  const fetchData = useCallback(async () => {
    try {
      const d = await api.get<RepairAnalytics>("/admin/repair/analytics?service_type=on_site");
      setData(d);
    } catch (e: unknown) {
      if ((e as Error).message === "UNAUTHORIZED") { router.push("/login"); return; }
      console.warn("[mock fallback]", e);
      setData(MOCK_REPAIR_ANALYTICS);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login"); return; }
    fetchData();
  }, [router, fetchData]);

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar />
      <main className="flex-1 p-8 space-y-8 max-w-5xl">

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">📊 สถิติการซ่อม — On-site</h1>
            <p className="text-gray-500 text-sm mt-1">ภาพรวมงานซ่อม On-site — jobs by status, branch, conversion rate</p>
          </div>
          <Link href="/repair/jobs"
            className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg transition-colors">
            ← รายการงาน
          </Link>
        </div>

        {loading ? (
          <p className="text-gray-500">กำลังโหลด...</p>
        ) : data && (
          <>
            {/* Summary cards */}
            <section>
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">ภาพรวม</h2>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard icon="📋" label="งานทั้งหมด" value={data.total_jobs.toLocaleString()} />
                <StatCard icon="⚡" label="กำลังดำเนินการ" value={data.active_jobs.toLocaleString()} accent="blue" />
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
                  label="เวลาเฉลี่ยในการซ่อม"
                  value={data.avg_completion_hours != null
                    ? `${data.avg_completion_hours.toFixed(1)} ชั่วโมง`
                    : "—"}
                  sub="T0 → T7 เฉลี่ย"
                  accent="admin-primary"
                />
                <StatCard
                  icon="♻️"
                  label="อัตราแปลงเป็นซาก (B2.2)"
                  value={data.conversion_rate_b22 != null
                    ? `${(data.conversion_rate_b22 * 100).toFixed(1)}%`
                    : "—"}
                  sub="ซ่อมไม่ได้ → ซาก / ปิดงานทั้งหมด"
                  accent="orange"
                />
              </div>
            </section>

            {/* By Status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <section className="bg-white rounded-xl border border-gray-200 p-5">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">งานตามสถานะ</h2>
                <div className="space-y-2">
                  {data.by_status.map(row => {
                    const pct = data.total_jobs > 0 ? (row.count / data.total_jobs) * 100 : 0;
                    return (
                      <div key={row.status} className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 w-32 shrink-0">
                          {STATUS_LABELS[row.status] ?? row.status}
                        </span>
                        <div className="flex-1 bg-gray-100 rounded-full h-2">
                          <div className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-gray-700 w-12 text-right">{row.count}</span>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* By Branch */}
              <section className="bg-white rounded-xl border border-gray-200 p-5">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">งานตาม Branch</h2>
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
                        <span className="text-xs font-mono text-admin-primary w-10 shrink-0">{row.branch}</span>
                        <span className="text-xs text-gray-500 w-32 shrink-0">
                          {BRANCH_LABELS[row.branch] ?? row.branch}
                        </span>
                        <div className="flex-1 bg-gray-100 rounded-full h-2">
                          <div className={`${colors[row.branch] ?? "bg-gray-600"} h-2 rounded-full transition-all`}
                            style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-gray-700 w-10 text-right">{row.count}</span>
                      </div>
                    );
                  })}
                  {data.by_branch.length === 0 && (
                    <p className="text-xs text-gray-600">ยังไม่มีข้อมูล branch</p>
                  )}
                </div>
              </section>
            </div>

            {/* By Source section */}
            <section className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                🔍 งานตามแหล่งที่มา
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
                            ? "bg-orange-900/40 border-orange-700 text-orange-700"
                            : "bg-blue-50 border-blue-200 text-blue-700"
                        }`}>
                          {isScrap ? "ซื้อจากซาก" : "ลูกค้า"}
                        </span>
                        <div className="flex-1 bg-gray-100 rounded-full h-2">
                          <div className={`${isScrap ? "bg-orange-500" : "bg-blue-500"} h-2 rounded-full transition-all`}
                            style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-gray-700 w-20 text-right font-mono">
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
              <section className="bg-white rounded-xl border border-gray-200 p-5">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">WeeeR ยอดนิยม (by งาน)</h2>
                <div className="space-y-1.5">
                  {data.top_weeer.map((row, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      <span className="text-gray-600 w-5 text-right">{i + 1}.</span>
                      <span className="text-gray-200 flex-1">{row.weeer_name}</span>
                      <span className="text-blue-400 font-mono">{row.jobs} งาน</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Recent closures */}
            {data.recent_closures?.length > 0 && (
              <section className="bg-white rounded-xl border border-gray-200 p-5">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">งานปิดล่าสุด</h2>
                <div className="space-y-1.5">
                  {data.recent_closures.map(row => (
                    <div key={row.job_id} className="flex items-center gap-3 text-sm border-b border-gray-200/50 pb-1.5">
                      <Link href={`/repair/jobs/${row.job_id}`}
                        className="font-mono text-xs text-admin-primary hover:text-admin-dark w-24 shrink-0">
                        {row.job_id.slice(0, 8)}…
                      </Link>
                      <span className="text-gray-500 text-xs flex-1">
                        {new Date(row.closed_at).toLocaleString("th-TH")}
                      </span>
                      <span className="text-green-600 font-mono text-xs">
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
