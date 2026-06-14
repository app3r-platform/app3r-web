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
  RECURRING_LABEL,
} from "../_lib/types";
import { MockAnnoOrigin, MockAnnoNav } from "@/components/MockAnno";

// ── Mock fallback — fresh-session seed (D-T4-02 fix) ──────────────────────────
function freshMockQueueJobs(): MaintainJob[] {
  const now = Date.now();
  const iso = (ms: number) => new Date(now + ms).toISOString();
  return [
    {
      id: "mock-mq-001", serviceCode: "M-2026-010", customerId: "C010",
      status: "pending",
      applianceType: "AC", cleaningType: "deep", serviceMethod: "on_site",
      scheduledAt: iso(26 * 3600000), estimatedDuration: 3,
      address: { lat: 13.756, lng: 100.502, address: "234 ถนนสาทร แขวงทุ่งมหาเมฆ กรุงเทพฯ" },
      totalPrice: 1500,
      offerDeadlineAt: iso(22 * 3600000),
      createdAt: iso(-2 * 3600000), updatedAt: iso(-2 * 3600000),
    },
    {
      id: "mock-mq-002", serviceCode: "M-2026-011", customerId: "C011",
      status: "pending",
      applianceType: "WashingMachine", cleaningType: "general", serviceMethod: "on_site",
      scheduledAt: iso(48 * 3600000), estimatedDuration: 2,
      address: { lat: 13.778, lng: 100.521, address: "567 ถนนรัชดาภิเษก แขวงดินแดง กรุงเทพฯ" },
      totalPrice: 800,
      offerDeadlineAt: iso(20 * 3600000),
      createdAt: iso(-4 * 3600000), updatedAt: iso(-4 * 3600000),
    },
    {
      id: "mock-mq-003", serviceCode: "M-2026-012", customerId: "C012",
      status: "pending",
      applianceType: "AC", cleaningType: "sanitize", serviceMethod: "on_site",
      scheduledAt: iso(36 * 3600000), estimatedDuration: 4,
      address: { lat: 13.792, lng: 100.535, address: "890 ถนนวิภาวดีรังสิต แขวงจตุจักร กรุงเทพฯ" },
      totalPrice: 2000,
      recurring: { enabled: true, interval: "6_months", nextScheduledAt: iso(180 * 24 * 3600000) },
      offerDeadlineAt: iso(18 * 3600000),
      createdAt: iso(-6 * 3600000), updatedAt: iso(-6 * 3600000),
    },
  ];
}

// ── M2: Offer countdown helper ─────────────────────────────────────────────────
// deadline = offerDeadlineAt ?? createdAt + 24h
function getOfferDeadline(job: MaintainJob): Date {
  if (job.offerDeadlineAt) return new Date(job.offerDeadlineAt);
  const d = new Date(job.createdAt);
  d.setHours(d.getHours() + 24);
  return d;
}

function useCountdown(deadline: Date) {
  const [msLeft, setMsLeft] = useState(() => deadline.getTime() - Date.now());
  useEffect(() => {
    const t = setInterval(() => setMsLeft(deadline.getTime() - Date.now()), 1000);
    return () => clearInterval(t);
  }, [deadline]);
  return msLeft;
}

function OfferCountdown({ job }: { job: MaintainJob }) {
  const deadline = getOfferDeadline(job);
  const msLeft = useCountdown(deadline);

  if (msLeft <= 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
        ⏰ หมดอายุแล้ว — งานนี้จะหลุดจาก queue
      </span>
    );
  }

  const totalSec = Math.floor(msLeft / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const isUrgent = msLeft < 3 * 60 * 60 * 1000; // น้อยกว่า 3 ชม. = urgent

  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
      isUrgent ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-700"
    }`}>
      ⏳ เหลือ {h}:{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
    </span>
  );
}

export default function MaintainQueuePage() {
  const [jobs, setJobs] = useState<MaintainJob[]>(() =>
    process.env.NEXT_PUBLIC_DEV_NAV === "true" ? freshMockQueueJobs() : []
  );
  const [loading, setLoading] = useState(() => process.env.NEXT_PUBLIC_DEV_NAV !== "true");
  const [error, setError] = useState("");

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_DEV_NAV === "true") return;
    maintainApi.getQueue()
      .then(setJobs)
      .catch(() => setJobs(freshMockQueueJobs()))  // D-T4-02: seed sample data on API unavailable
      .finally(() => setLoading(false));
  }, []);

  // M2: กรองเฉพาะ pending (offer_expired หลุดออกจาก queue อัตโนมัติ)
  const pendingJobs = jobs.filter(j => j.status === "pending");

  return (
    <div className="space-y-5">
      <MockAnnoOrigin from="R-47" />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">คิวงานบำรุงรักษา (Maintain)</h1>
          <p className="text-xs text-gray-500 mt-0.5">งานล้างเครื่องใช้ไฟฟ้าในรัศมี — ดูรายละเอียด → ยื่นข้อเสนอ</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/maintain/jobs" className="text-sm text-[#FF663A] hover:text-[#D8491F] font-medium">
            งานที่รับแล้ว →
          </Link>
          <Link href="/repair/dashboard" className="text-gray-400 hover:text-gray-600 text-sm">← แดชบอร์ด (Dashboard)</Link>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-orange-50 rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-orange-700">{pendingJobs.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">รอยื่นข้อเสนอ</p>
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

      {/* M2: Expiry notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 flex items-center gap-2">
        <span className="text-sm">⏰</span>
        <p className="text-xs text-amber-700">งานที่หมดเวลายื่นข้อเสนอจะหลุดออก queue อัตโนมัติ — ยื่นก่อนนับถอยหลังหมด</p>
      </div>

      {loading && <div className="flex items-center justify-center h-40 text-gray-400">กำลังโหลด…</div>}
      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">{error}</div>}

      {!loading && !error && pendingJobs.length === 0 && (
        <div className="flex flex-col items-center justify-center h-48 text-gray-400">
          <span className="text-4xl mb-3">🛁</span>
          <p className="text-sm">ไม่มีงานบำรุงรักษา (Maintain) ใหม่ในขณะนี้</p>
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
                  <span className="text-xs text-gray-400">💰 {job.totalPrice.toLocaleString()} พอยต์</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  🗓 {new Date(job.scheduledAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </p>

                {/* M2: Countdown */}
                <div className="mt-1.5">
                  <OfferCountdown job={job} />
                </div>

                {job.recurring?.enabled && (
                  <div className="mt-1.5 inline-flex items-center gap-1 bg-[#FFF1ED] rounded-lg px-2 py-0.5">
                    <span className="text-xs">🔁</span>
                    <span className="text-xs text-[#D63B12] font-medium">นัดซ้ำ {RECURRING_LABEL[job.recurring.interval]} (ส่วนลด 10%)</span>
                  </div>
                )}
              </div>
              <MockAnnoNav to="R-48" label="ยื่นข้อเสนอ" style={{ display: "contents" }}>
                <Link
                  href={`/maintain/queue/${job.id}/offer`}
                  className="shrink-0 bg-[#FF663A] hover:bg-[#D8491F] text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                  📝 ยื่นข้อเสนอ
                </Link>
              </MockAnnoNav>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
