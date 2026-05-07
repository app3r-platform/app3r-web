"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { repairApi } from "../_lib/api";
import type { RepairDashboard } from "../_lib/types";
import { STATUS_LABEL, STATUS_COLOR } from "../_lib/types";

export default function RepairDashboardPage() {
  const [data, setData] = useState<RepairDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    repairApi.getDashboard()
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-48 text-gray-400">กำลังโหลด…</div>;
  if (error) return <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">{error}</div>;
  if (!data) return null;

  const kpis = [
    { label: "งานที่กำลังดำเนิน", value: data.active_jobs, icon: "🔧", color: "text-green-700", bg: "bg-green-50" },
    { label: "งานเดือนนี้", value: data.jobs_this_month, icon: "📋", color: "text-blue-700", bg: "bg-blue-50" },
    { label: "รายได้เดือนนี้", value: `${data.earnings_this_month.toLocaleString()} pts`, icon: "🪙", color: "text-yellow-700", bg: "bg-yellow-50" },
    { label: "รออนุมัติ", value: data.pending_approvals, icon: "⚠️", color: "text-orange-700", bg: "bg-orange-50" },
    { label: "คะแนนเฉลี่ย", value: data.avg_rating.toFixed(1), icon: "⭐", color: "text-purple-700", bg: "bg-purple-50" },
    { label: "WeeeT ใช้งาน %", value: `${data.weeet_utilization}%`, icon: "👷", color: "text-teal-700", bg: "bg-teal-50" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">ซ่อม — Dashboard</h1>
        <Link href="/repair/jobs" className="text-sm text-green-700 hover:underline font-medium">ดูงานทั้งหมด →</Link>
      </div>

      {data.pending_approvals > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-orange-800">มี {data.pending_approvals} งานรออนุมัติจากคุณ</p>
            <p className="text-xs text-orange-600 mt-0.5">WeeeT ส่งผลตรวจสภาพมา — กรุณาตรวจสอบ</p>
          </div>
          <Link href="/repair/jobs?status=awaiting_decision" className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
            ตรวจสอบ
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {kpis.map((k) => (
          <div key={k.label} className={`${k.bg} rounded-xl p-4`}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{k.icon}</span>
              <span className="text-xs text-gray-500">{k.label}</span>
            </div>
            <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700">งานล่าสุด</h2>
          <Link href="/repair/jobs" className="text-xs text-green-700 hover:underline">ดูทั้งหมด</Link>
        </div>
        <div className="space-y-2">
          {data.recent_jobs.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">ยังไม่มีงาน</p>
          )}
          {data.recent_jobs.map((job) => (
            <Link key={job.id} href={`/repair/jobs/${job.id}`}
              className="block bg-white border border-gray-100 rounded-xl p-4 hover:border-green-200 hover:shadow-sm transition-all">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{job.appliance_name}</p>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{job.customer_name} · {job.weeet_name}</p>
                </div>
                <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[job.status]}`}>
                  {STATUS_LABEL[job.status]}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                นัด: {new Date(job.scheduled_at).toLocaleDateString("th-TH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
              </p>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link href="/repair/announcements"
          className="bg-white border border-gray-100 rounded-xl p-4 hover:border-green-200 hover:shadow-sm transition-all text-center">
          <div className="text-2xl mb-1">📢</div>
          <p className="text-sm font-semibold text-gray-800">ประกาศรับงาน</p>
          <p className="text-xs text-gray-400 mt-0.5">ยื่นข้อเสนอใหม่</p>
        </Link>
        <Link href="/repair/jobs"
          className="bg-white border border-gray-100 rounded-xl p-4 hover:border-green-200 hover:shadow-sm transition-all text-center">
          <div className="text-2xl mb-1">📋</div>
          <p className="text-sm font-semibold text-gray-800">งานทั้งหมด</p>
          <p className="text-xs text-gray-400 mt-0.5">จัดการ + ติดตาม</p>
        </Link>
      </div>
    </div>
  );
}
