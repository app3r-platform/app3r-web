"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";
import type { MaintainJob } from "@/lib/types";

type StatusFilter = "all" | MaintainJob["status"];

const STATUS_LABEL: Record<MaintainJob["status"], string> = {
  awaiting_offer:  "รอข้อเสนอ",
  offer_expired:   "หมดอายุ — ไม่มีร้านรับ",
  pending:         "รอช่าง",
  assigned:        "มอบหมายแล้ว",
  departed:        "ช่างออกเดินทาง",
  arrived:         "ช่างถึงแล้ว",
  in_progress:     "กำลังล้าง",
  terminated:      "ยุติกลางคัน",
  completed:       "เสร็จแล้ว",
  cancelled:       "ยกเลิก",
  weeer_withdrawn: "WeeeR ถอนงาน",
  closed_for_repair: "ปิด→ซ่อม",
};

const STATUS_COLOR: Record<MaintainJob["status"], string> = {
  awaiting_offer:  "bg-blue-100 text-blue-700",
  offer_expired:   "bg-red-100 text-red-600",
  pending:         "bg-yellow-100 text-yellow-700",
  assigned:        "bg-weeeu-surface text-weeeu-primary",
  departed:        "bg-amber-100 text-amber-700",
  arrived:         "bg-amber-100 text-amber-700",
  in_progress:     "bg-weeeu-surface text-weeeu-dark",
  terminated:      "bg-gray-100 text-gray-600",
  completed:       "bg-green-100 text-green-700",
  cancelled:       "bg-gray-100 text-gray-500",
  weeer_withdrawn: "bg-orange-100 text-orange-700",
  closed_for_repair: "bg-orange-100 text-orange-700",
};

const APPLIANCE_LABEL: Record<MaintainJob["applianceType"], string> = {
  AC: "แอร์ 🌡️",
  WashingMachine: "เครื่องซักผ้า 🫧",
};

const CLEANING_LABEL: Record<MaintainJob["cleaningType"], string> = {
  general: "ล้างทั่วไป",
  deep: "ล้างลึก",
  sanitize: "ล้าง+ฆ่าเชื้อ",
};

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all",           label: "ทั้งหมด" },
  { value: "awaiting_offer", label: "รอข้อเสนอ" },
  { value: "offer_expired", label: "หมดอายุ" },
  { value: "in_progress",   label: "กำลังล้าง" },
  { value: "completed",     label: "เสร็จแล้ว" },
  { value: "cancelled",     label: "ยกเลิก" },
];

// ── Mock fallback ─────────────────────────────────────────────────────────────
const MOCK_MAINTAIN_JOBS: MaintainJob[] = [
  {
    id: "mock-maintain-001",
    serviceCode: "M-2026-001",
    customerId: "current-user",
    shopId: "shop-001",
    technicianId: "weeet-001",
    status: "in_progress",
    applianceType: "AC",
    cleaningType: "deep",
    serviceMethod: "on_site",
    scheduledAt: new Date(Date.now() - 3600000).toISOString(),
    estimatedDuration: 3,
    address: { lat: 13.7563, lng: 100.5018, address: "123 ถ.สุขุมวิท แขวงคลองเตย กรุงเทพ 10110" },
    totalPrice: 800,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "mock-maintain-002",
    serviceCode: "M-2026-002",
    customerId: "current-user",
    status: "awaiting_offer",
    applianceType: "WashingMachine",
    cleaningType: "general",
    serviceMethod: "on_site",
    scheduledAt: new Date(Date.now() + 86400000 * 2).toISOString(),
    estimatedDuration: 2,
    address: { lat: 13.7563, lng: 100.5018, address: "123 ถ.สุขุมวิท แขวงคลองเตย กรุงเทพ 10110" },
    totalPrice: 0,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "mock-maintain-003",
    serviceCode: "M-2026-003",
    customerId: "current-user",
    shopId: "shop-002",
    status: "completed",
    applianceType: "AC",
    cleaningType: "sanitize",
    serviceMethod: "on_site",
    scheduledAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    estimatedDuration: 4,
    address: { lat: 13.7563, lng: 100.5018, address: "456 ถ.พระราม 9 ห้วยขวาง กรุงเทพ 10310" },
    totalPrice: 1200,
    createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 6).toISOString(),
  },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("th-TH", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function MaintainJobsPage() {
  const [jobs, setJobs] = useState<MaintainJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>("all");

  useEffect(() => {
    apiFetch("/api/v1/maintain/jobs/customer/")
      .then(r => r.ok ? r.json() : { items: [] })
      .then(d => setJobs(d.items ?? d ?? []))
      .catch(() => {
        setJobs(prev => prev.length > 0 ? prev : MOCK_MAINTAIN_JOBS);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === "all" ? jobs : jobs.filter(j => j.status === filter);

  return (
    <div className="max-w-xl space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-900">งานล้างของฉัน</h1>
        <Link
          href="/maintain/book"
          className="bg-weeeu-primary hover:bg-weeeu-dark text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
        >
          + จองล้าง
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {FILTERS.map(f => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              filter === f.value
                ? "bg-weeeu-primary text-white"
                : "bg-white border border-gray-200 text-gray-500 hover:border-weeeu-primary"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">กำลังโหลด...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <p className="text-4xl">🛁</p>
          <p className="text-gray-500 font-medium">ยังไม่มีงานล้างเครื่อง</p>
          <Link
            href="/maintain/book"
            className="inline-block bg-weeeu-primary hover:bg-weeeu-dark text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            จองล้างเครื่องเลย
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(job => {
            const isExpired = job.status === "offer_expired";

            // M2 — offer_expired: render เป็น div + ปุ่มจองใหม่ (ไม่ navigate)
            if (isExpired) return (
              <div key={job.id} className="bg-white rounded-2xl border border-red-100 shadow-sm p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-gray-800">{APPLIANCE_LABEL[job.applianceType]}</p>
                      <span className="text-xs text-gray-400">—</span>
                      <p className="text-xs text-gray-500">{CLEANING_LABEL[job.cleaningType]}</p>
                    </div>
                    <p className="text-xs text-gray-400 font-mono">{job.serviceCode}</p>
                    <p className="text-xs text-gray-500">📅 {formatDate(job.scheduledAt)}</p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${STATUS_COLOR[job.status]}`}>
                    {STATUS_LABEL[job.status]}
                  </span>
                </div>
                <div className="mt-3 pt-3 border-t border-red-100 flex items-center justify-between gap-3">
                  <p className="text-xs text-red-500">ไม่มี WeeeR รับงานภายในเวลาที่กำหนด</p>
                  <Link
                    href="/maintain/book"
                    className="shrink-0 bg-weeeu-primary hover:bg-weeeu-dark text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                  >
                    + จองใหม่
                  </Link>
                </div>
              </div>
            );

            // ปกติ — render เป็น Link
            return (
              <Link
                key={job.id}
                href={`/maintain/jobs/${job.id}`}
                className="block bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:border-weeeu-primary/30 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-gray-800">{APPLIANCE_LABEL[job.applianceType]}</p>
                      <span className="text-xs text-gray-400">—</span>
                      <p className="text-xs text-gray-500">{CLEANING_LABEL[job.cleaningType]}</p>
                    </div>
                    <p className="text-xs text-gray-400 font-mono">{job.serviceCode}</p>
                    <p className="text-xs text-gray-500">📅 {formatDate(job.scheduledAt)}</p>
                    {job.recurring?.enabled && (
                      <p className="text-xs text-weeeu-primary">🔄 นัดซ้ำ ({
                        job.recurring.interval === "3_months" ? "ทุก 3 เดือน"
                        : job.recurring.interval === "6_months" ? "ทุก 6 เดือน"
                        : "ทุกปี"
                      })</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLOR[job.status]}`}>
                      {STATUS_LABEL[job.status]}
                    </span>
                    {job.totalPrice > 0 && (
                      <p className="text-xs font-semibold text-weeeu-dark">{job.totalPrice.toLocaleString()} พอยต์ทอง</p>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
