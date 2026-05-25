"use client";
// ─── /jobs/[id]/progress — CMD A3 Set 3 (Tway A: Merge)
// ลบ initServiceProgressSeed + localStorage approach ทั้งหมด
// ใช้ apiFetch → GET /api/v1/service-progress/:id/ + MOCK_TIMELINE fallback
// Pattern เดียวกับ repair/[id]/progress — polling 3s · weeeu-primary ไม่มี indigo
// C7 abort ซ่อน (ไม่ทราบ serviceType จาก URL นี้)

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import type {
  ServiceProgressTimelineDto,
  ServiceProgressDto,
  ServiceProgressStatus,
} from "@/lib/types/service-progress";
import { SERVICE_PROGRESS_STATUS_LABEL } from "@/lib/types/service-progress";

// ── Status → icon ─────────────────────────────────────────────────────────────
const STATUS_ICON: Record<ServiceProgressStatus, string> = {
  pending:     "⏳",
  accepted:    "✅",
  in_progress: "🔧",
  paused:      "⏸️",
  completed:   "🎉",
  cancelled:   "❌",
};

// ── Status → ring color (weeeu-* ไม่มี indigo) ───────────────────────────────
const STATUS_COLOR: Record<ServiceProgressStatus, string> = {
  pending:     "border-gray-300 bg-gray-50",
  accepted:    "border-weeeu-primary bg-weeeu-surface",
  in_progress: "border-weeeu-dark bg-weeeu-surface",
  paused:      "border-yellow-400 bg-yellow-50",
  completed:   "border-green-500 bg-green-50",
  cancelled:   "border-red-400 bg-red-50",
};

// ── Mock fallback ─────────────────────────────────────────────────────────────
const MOCK_TIMELINE: ServiceProgressTimelineDto = {
  serviceId: "job-001",
  latestStatus: "in_progress",
  latestPercent: 65,
  entries: [
    {
      id: "prog-001", serviceId: "job-001",
      status: "pending", progressPercent: 0,
      note: "รับคำสั่งงานซ่อม — เครื่องซักผ้า LG ไม่ปั่นแห้ง",
      photoR2Key: null, updatedBy: "u-001",
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: "prog-002", serviceId: "job-001",
      status: "accepted", progressPercent: 20,
      note: "ร้านซ่อมดีเจริญ รับงาน — นัดช่างเข้าวันพรุ่งนี้",
      photoR2Key: null, updatedBy: "r-101",
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: "prog-003", serviceId: "job-001",
      status: "in_progress", progressPercent: 65,
      note: "ช่างตรวจสอบแล้ว — พบมอเตอร์ปั่นแห้งเสีย กำลังเปลี่ยนอะไหล่",
      photoR2Key: null, updatedBy: "t-201",
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
  ],
};

// ── Progress bar color ────────────────────────────────────────────────────────
function progressColor(status: ServiceProgressStatus | null): string {
  if (status === "completed") return "bg-green-500";
  if (status === "cancelled") return "bg-red-400";
  if (status === "paused")    return "bg-yellow-400";
  return "bg-weeeu-primary";
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" });
}

// ── Entry card ────────────────────────────────────────────────────────────────
function EntryCard({
  entry, isLatest, isFirst,
}: {
  entry: ServiceProgressDto; isLatest: boolean; isFirst: boolean;
}) {
  const colorCls = STATUS_COLOR[entry.status] ?? "border-gray-200 bg-gray-50";
  const icon     = STATUS_ICON[entry.status] ?? "•";
  const label    = SERVICE_PROGRESS_STATUS_LABEL[entry.status] ?? entry.status;

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div
          className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm flex-shrink-0 ${colorCls} ${isLatest ? "ring-2 ring-offset-1 ring-weeeu-primary/40" : ""}`}
        >
          {icon}
        </div>
        {!isFirst && (
          <div className="w-0.5 flex-1 my-1 bg-gray-200" style={{ minHeight: "20px" }} />
        )}
      </div>
      <div className={`pb-4 flex-1 ${isFirst ? "pb-0" : ""}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-semibold ${isLatest ? "text-weeeu-dark" : "text-gray-700"}`}>
              {label}
            </span>
            <span className="text-xs font-medium text-weeeu-primary bg-weeeu-surface px-1.5 py-0.5 rounded-full">
              {entry.progressPercent}%
            </span>
            {isLatest && (
              <span className="text-xs bg-weeeu-surface text-weeeu-primary px-2 py-0.5 rounded-full font-medium animate-pulse">
                ล่าสุด
              </span>
            )}
          </div>
          <span className="text-xs text-gray-400">{formatDate(entry.createdAt)}</span>
        </div>
        {entry.note && (
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">{entry.note}</p>
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
const POLL_INTERVAL_MS = 3000;

export default function JobProgressPage() {
  const { id } = useParams<{ id: string }>();
  const [timeline, setTimeline] = useState<ServiceProgressTimelineDto | null>(null);
  const [loading, setLoading]   = useState(true);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchProgress = () => {
      apiFetch(`/api/v1/service-progress/${id}/`)
        .then(r => r.ok ? r.json() : Promise.reject(r.status))
        .then((data: ServiceProgressTimelineDto) => {
          if (!cancelled) {
            setTimeline(data);
            setLastFetched(new Date());
            setLoading(false);
          }
        })
        .catch(() => {
          if (!cancelled) {
            // API ไม่พร้อม — fallback MOCK
            setTimeline(prev => prev ?? MOCK_TIMELINE);
            setLastFetched(new Date());
            setLoading(false);
          }
        });
    };

    fetchProgress();
    timerRef.current = setInterval(fetchProgress, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [id]);

  const entries = timeline ? [...timeline.entries].reverse() : [];

  return (
    <div className="max-w-xl space-y-5">
      <div className="flex items-center gap-3">
        <Link href={`/jobs/${id}`} className="text-gray-500 hover:text-gray-800 text-xl">‹</Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">ความคืบหน้า</h1>
          <p className="text-sm text-gray-400">งาน #{id.slice(0, 8)}</p>
        </div>
      </div>

      {loading && <div className="text-center py-16 text-gray-400">กำลังโหลด...</div>}

      {timeline && !loading && (
        <>
          {/* Progress summary */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">สถานะปัจจุบัน</p>
                <p className="text-sm font-semibold text-weeeu-dark">
                  {timeline.latestStatus
                    ? (SERVICE_PROGRESS_STATUS_LABEL[timeline.latestStatus] ?? timeline.latestStatus)
                    : "รอดำเนินการ"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-weeeu-primary">{timeline.latestPercent}%</p>
                <p className="text-xs text-gray-400">{entries.length} รายการ</p>
              </div>
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${progressColor(timeline.latestStatus)}`}
                style={{ width: `${timeline.latestPercent}%` }}
              />
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">บันทึกความคืบหน้า</p>
            {entries.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <p className="text-3xl mb-2">📋</p>
                <p className="text-sm">ยังไม่มีการอัพเดต</p>
              </div>
            ) : (
              <div className="space-y-0">
                {entries.map((entry, idx) => (
                  <EntryCard
                    key={entry.id}
                    entry={entry}
                    isLatest={idx === 0}
                    isFirst={idx === entries.length - 1}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Auto-refresh note */}
          <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-400 text-center space-y-0.5">
            <p>อัพเดตอัตโนมัติทุก {POLL_INTERVAL_MS / 1000} วินาที</p>
            {lastFetched && (
              <p>ล่าสุด: {lastFetched.toLocaleTimeString("th-TH", { timeStyle: "short" })}</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
