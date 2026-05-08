"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { maintainApi } from "../_lib/api";
import type { MaintainJob } from "../_lib/types";
import {
  MAINTAIN_STATUS_LABEL,
  MAINTAIN_STATUS_COLOR,
  APPLIANCE_LABEL,
  CLEANING_LABEL,
} from "../_lib/types";

export default function MaintainQueuePage() {
  const [jobs, setJobs] = useState<MaintainJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [accepting, setAccepting] = useState<string | null>(null);

  useEffect(() => {
    maintainApi.getQueue()
      .then(setJobs)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleAccept(id: string) {
    setAccepting(id);
    try {
      const updated = await maintainApi.acceptJob(id);
      setJobs(prev => prev.map(j => j.id === id ? updated : j));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setAccepting(null);
    }
  }

  const pendingJobs = jobs.filter(j => j.status === "pending");

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">คิวงาน Maintain</h1>
          <p className="text-xs text-gray-500 mt-0.5">งานล้างเครื่องใช้ไฟฟ้าในรัศมี — รับงาน → มอบหมายช่าง</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/maintain/jobs" className="text-sm text-green-700 hover:text-green-900 font-medium">
            งานที่รับแล้ว →
          </Link>
          <Link href="/repair/dashboard" className="text-gray-400 hover:text-gray-600 text-sm">← Dashboard</Link>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-orange-50 rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-orange-700">{pendingJobs.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">รอรับงาน</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-blue-700">{jobs.filter(j => j.applianceType === "AC").length}</p>
          <p className="text-xs text-gray-500 mt-0.5">แอร์</p>
        </div>
        <div className="bg-cyan-50 rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-cyan-700">{jobs.filter(j => j.applianceType === "WashingMachine").length}</p>
          <p className="text-xs text-gray-500 mt-0.5">เครื่องซักผ้า</p>
        </div>
      </div>

      {loading && <div className="flex items-center justify-center h-40 text-gray-400">กำลังโหลด…</div>}
      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">{error}</div>}

      {!loading && !error && pendingJobs.length === 0 && (
        <div className="flex flex-col items-center justify-center h-48 text-gray-400">
          <span className="text-4xl mb-3">🛁</span>
          <p className="text-sm">ไม่มีงาน Maintain ใหม่ในขณะนี้</p>
        </div>
      )}

      <div className="space-y-3">
        {pendingJobs.map((job) => (
          <div key={job.id} className="bg-white border border-gray-100 rounded-xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${MAINTAIN_STATUS_COLOR[job.status]}`}>
                    {MAINTAIN_STATUS_LABEL[job.status]}
                  </span>
                  <span className="text-xs text-gray-400">{job.serviceCode}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-base">{job.applianceType === "AC" ? "❄️" : "🫧"}</span>
                  <p className="text-sm font-semibold text-gray-800">
                    {APPLIANCE_LABEL[job.applianceType]} — {CLEANING_LABEL[job.cleaningType]}
                  </p>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
                  <span className="text-xs text-gray-400">📍 {job.address.address}</span>
                  <span className="text-xs text-gray-400">⏱ {job.estimatedDuration} ชม.</span>
                  <span className="text-xs text-gray-400">💰 {job.totalPrice.toLocaleString()} pts</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  🗓 {new Date(job.scheduledAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </p>
                {job.recurring?.enabled && (
                  <div className="mt-1.5 inline-flex items-center gap-1 bg-purple-50 rounded-lg px-2 py-0.5">
                    <span className="text-xs">🔁</span>
                    <span className="text-xs text-purple-700 font-medium">นัดซ้ำ {RECURRING_LABEL[job.recurring.interval]} (ส่วนลด 10%)</span>
                  </div>
                )}
              </div>
              <button
                onClick={() => handleAccept(job.id)}
                disabled={accepting === job.id}
                className="shrink-0 bg-green-700 hover:bg-green-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                {accepting === job.id ? "กำลังรับ…" : "✅ รับงาน"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// helper (used inline above)
const RECURRING_LABEL: Record<string, string> = {
  "3_months":  "ทุก 3 เดือน",
  "6_months":  "ทุก 6 เดือน",
  "12_months": "ทุก 12 เดือน",
};
