"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isAuthenticated } from "@/lib/auth";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/sidebar";

interface MaintainAnalytics {
  total_jobs: number;
  total_revenue: number;
  recurring_count: number;
  recurring_conversion_rate: number; // 0-1
  by_status: Record<string, number>;
  by_cleaning_type: Record<string, number>;
  by_appliance_type: Record<string, number>;
  avg_price: number;
  avg_duration: number;
}

const STATUS_LABEL: Record<string, string> = {
  pending:     "รอดำเนินการ",
  assigned:    "มอบหมายแล้ว",
  departed:    "ออกเดินทาง",
  arrived:     "ถึงที่แล้ว",
  in_progress: "กำลังทำงาน",
  completed:   "เสร็จสิ้น",
  cancelled:   "ยกเลิก",
};

const STATUS_COLOR: Record<string, string> = {
  pending:     "bg-gray-500",
  assigned:    "bg-blue-500",
  departed:    "bg-yellow-500",
  arrived:     "bg-cyan-500",
  in_progress: "bg-brand-info",
  completed:   "bg-green-500",
  cancelled:   "bg-red-500",
};

const CLEANING_LABEL: Record<string, string> = {
  general:  "ล้างทั่วไป",
  deep:     "ล้างลึก",
  sanitize: "ล้าง+ฆ่าเชื้อ",
};

const CLEANING_COLOR: Record<string, string> = {
  general:  "bg-blue-500",
  deep:     "bg-admin-primary",
  sanitize: "bg-brand-success",
};

const APPLIANCE_LABEL: Record<string, string> = {
  AC:             "แอร์",
  WashingMachine: "เครื่องซัก",
};

const APPLIANCE_COLOR: Record<string, string> = {
  AC:             "bg-sky-500",
  WashingMachine: "bg-orange-500",
};

function BarRow({
  label, value, total, color, suffix = "",
}: {
  label: string; value: number; total: number; color: string; suffix?: string;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-700">{label}</span>
        <span className="text-gray-500">{value.toLocaleString()}{suffix} ({pct}%)</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

export default function MaintainAnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState<MaintainAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login"); return; }
    api.get<MaintainAnalytics>("/maintain/analytics/")
      .then(d => { setData(d); setError(null); })
      .catch(e => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar /><main className="flex-1 p-8"><p className="text-gray-500">กำลังโหลด...</p></main>
    </div>
  );

  if (error || !data) return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar />
      <main className="flex-1 p-8 space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600">{error ?? "ไม่พบข้อมูล"}</div>
        <Link href="/maintain/jobs" className="text-sm text-admin-primary hover:text-admin-dark">← Jobs</Link>
      </main>
    </div>
  );

  const completedCount = data.by_status["completed"] ?? 0;
  const cancelledCount = data.by_status["cancelled"] ?? 0;

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar />
      <main className="flex-1 p-8 space-y-6 max-w-6xl">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">📊 Maintain Analytics</h1>
            <p className="text-gray-500 text-sm mt-1">
              ภาพรวมงาน Maintain — สถิติรายได้ / ประเภท / recurring
            </p>
          </div>
          <Link href="/maintain/jobs"
            className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-700 border border-gray-300 rounded-lg transition-colors">
            🛁 Jobs →
          </Link>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="งานทั้งหมด"
            value={data.total_jobs.toLocaleString()}
            sub={`เสร็จ ${completedCount.toLocaleString()} | ยกเลิก ${cancelledCount.toLocaleString()}`}
          />
          <StatCard
            label="รายได้รวม"
            value={`${data.total_revenue.toLocaleString()} ฿`}
            sub={`เฉลี่ย ${data.avg_price.toLocaleString()} ฿/งาน`}
          />
          <StatCard
            label="Recurring"
            value={data.recurring_count.toLocaleString()}
            sub={`Conversion ${(data.recurring_conversion_rate * 100).toFixed(1)}%`}
          />
          <StatCard
            label="ระยะเวลาเฉลี่ย"
            value={`${data.avg_duration.toFixed(1)} ชม.`}
            sub="per job"
          />
        </div>

        {/* Charts grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* By status */}
          <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              สถานะงาน
            </h2>
            {Object.entries(data.by_status)
              .sort((a, b) => b[1] - a[1])
              .map(([k, v]) => (
                <BarRow
                  key={k}
                  label={STATUS_LABEL[k] ?? k}
                  value={v}
                  total={data.total_jobs}
                  color={STATUS_COLOR[k] ?? "bg-gray-500"}
                />
              ))}
          </section>

          {/* By cleaning type */}
          <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              ประเภทการล้าง
            </h2>
            {Object.entries(data.by_cleaning_type)
              .sort((a, b) => b[1] - a[1])
              .map(([k, v]) => (
                <BarRow
                  key={k}
                  label={CLEANING_LABEL[k] ?? k}
                  value={v}
                  total={data.total_jobs}
                  color={CLEANING_COLOR[k] ?? "bg-gray-500"}
                />
              ))}
          </section>

          {/* By appliance type */}
          <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              ประเภทเครื่อง
            </h2>
            {Object.entries(data.by_appliance_type)
              .sort((a, b) => b[1] - a[1])
              .map(([k, v]) => (
                <BarRow
                  key={k}
                  label={APPLIANCE_LABEL[k] ?? k}
                  value={v}
                  total={data.total_jobs}
                  color={APPLIANCE_COLOR[k] ?? "bg-gray-500"}
                />
              ))}
          </section>

        </div>

        {/* Recurring conversion detail */}
        <section className="bg-white rounded-xl border border-admin-primary/30 p-5">
          <h2 className="text-xs font-semibold text-admin-primary uppercase tracking-wider mb-4">
            🔁 Recurring Conversion
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">งานทั้งหมด</span>
              <span className="text-white font-mono">{data.total_jobs.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">งาน recurring</span>
              <span className="text-admin-primary font-mono">{data.recurring_count.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Conversion Rate</span>
              <span className={`font-mono font-bold ${
                data.recurring_conversion_rate >= 0.3
                  ? "text-green-600"
                  : data.recurring_conversion_rate >= 0.15
                  ? "text-yellow-700"
                  : "text-red-600"
              }`}>
                {(data.recurring_conversion_rate * 100).toFixed(1)}%
              </span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden mt-2">
              <div
                className="h-full rounded-full bg-admin-primary transition-all"
                style={{ width: `${Math.min(data.recurring_conversion_rate * 100, 100)}%` }}
              />
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
