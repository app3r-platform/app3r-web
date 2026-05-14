"use client";

/**
 * /repair/[id]/progress — F1 Carry-over (fix/weeeu-f1-carryover)
 *
 * Task 1: ใช้ types จาก @/lib/types/service-progress (mirror ของ Backend)
 * Task 2: Polling fallback ทุก 3s (Backend comment: "FE poll GET every 3s if WS not connected")
 *
 * API: GET /api/v1/service-progress/:serviceId/ → ServiceProgressTimelineDto
 */

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

// ── Status → icon (สำหรับ timeline entry) ────────────────────────────────────
const STATUS_ICON: Record<ServiceProgressStatus, string> = {
  pending:     "⏳",
  accepted:    "✅",
  in_progress: "🔧",
  paused:      "⏸️",
  completed:   "🎉",
  cancelled:   "❌",
};

// ── Status → ring color (สำหรับ timeline bullet) ──────────────────────────────
const STATUS_COLOR: Record<ServiceProgressStatus, string> = {
  pending:     "border-gray-300 bg-gray-50",
  accepted:    "border-blue-400 bg-blue-50",
  in_progress: "border-indigo-500 bg-indigo-50",
  paused:      "border-yellow-400 bg-yellow-50",
  completed:   "border-green-500 bg-green-50",
  cancelled:   "border-red-400 bg-red-50",
};

// ── Progress bar color ────────────────────────────────────────────────────────
function progressColor(status: ServiceProgressStatus | null): string {
  if (status === "completed") return "bg-green-500";
  if (status === "cancelled") return "bg-red-400";
  if (status === "paused")    return "bg-yellow-400";
  return "bg-indigo-400";
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" });
}

// ── Entry card ────────────────────────────────────────────────────────────────
function EntryCard({
  entry,
  isLatest,
  isFirst,
}: {
  entry: ServiceProgressDto;
  isLatest: boolean;
  isFirst: boolean;
}) {
  const colorCls = STATUS_COLOR[entry.status] ?? "border-gray-200 bg-gray-50";
  const icon     = STATUS_ICON[entry.status] ?? "•";
  const label    = SERVICE_PROGRESS_STATUS_LABEL[entry.status] ?? entry.status;

  return (
    <div className="flex gap-3">
      {/* Bullet + connector */}
      <div className="flex flex-col items-center">
        <div
          data-testid={`entry-bullet-${entry.id}`}
          className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm flex-shrink-0 ${colorCls} ${isLatest ? "ring-2 ring-offset-1 ring-indigo-300" : ""}`}
        >
          {icon}
        </div>
        {!isFirst && (
          <div className="w-0.5 flex-1 my-1 bg-gray-200" style={{ minHeight: "20px" }} />
        )}
      </div>

      {/* Content */}
      <div className={`pb-4 flex-1 ${isFirst ? "pb-0" : ""}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-semibold ${isLatest ? "text-indigo-700" : "text-gray-700"}`}>
              {label}
            </span>
            <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-full">
              {entry.progressPercent}%
            </span>
            {isLatest && (
              <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium animate-pulse">
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

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyTimeline() {
  return (
    <div className="text-center py-10 text-gray-400">
      <p className="text-3xl mb-2">📋</p>
      <p className="text-sm">ยังไม่มีการอัพเดตความคืบหน้า</p>
      <p className="text-xs mt-1">ช่างจะอัพเดตเมื่อเริ่มดำเนินการ</p>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
const POLL_INTERVAL_MS = 3000; // Backend comment: "Polling fallback: FE poll GET every 3s"

export default function RepairProgressPage() {
  const { id } = useParams<{ id: string }>();
  const [timeline, setTimeline] = useState<ServiceProgressTimelineDto | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  // ── Fetch helper ────────────────────────────────────────────────────────────
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchProgress = () => {
      apiFetch(`/api/v1/service-progress/${id}/`)
        .then(r => r.ok ? r.json() : Promise.reject(r.status))
        .then((data: ServiceProgressTimelineDto) => {
          if (!cancelled) {
            setTimeline(data);
            setError(null);
            setLastFetched(new Date());
            setLoading(false);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setError("ไม่สามารถโหลดข้อมูลความคืบหน้าได้");
            setLoading(false);
          }
        });
    };

    // Task 2: Polling fallback every 3s (Backend: "FE poll GET every 3s if WS not connected")
    fetchProgress(); // initial load
    timerRef.current = setInterval(fetchProgress, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [id]);

  // Entries เรียงใหม่ → เก่า (UI แสดง latest ก่อน)
  const entries = timeline ? [...timeline.entries].reverse() : [];

  return (
    <div className="max-w-xl space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/repair/${id}`} className="text-gray-500 hover:text-gray-800 text-xl">‹</Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">ความคืบหน้า</h1>
          <p className="text-sm text-gray-400">งาน #{id.slice(0, 8)}</p>
        </div>
      </div>

      {loading && (
        <div className="text-center py-16 text-gray-400">กำลังโหลด...</div>
      )}

      {error && !timeline && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {timeline && !loading && (
        <>
          {/* Progress summary card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">สถานะปัจจุบัน</p>
                <p className="text-sm font-semibold text-indigo-700">
                  {timeline.latestStatus
                    ? (SERVICE_PROGRESS_STATUS_LABEL[timeline.latestStatus] ?? timeline.latestStatus)
                    : "รอดำเนินการ"}
                </p>
              </div>
              <div className="text-right">
                <p
                  data-testid="main-progress-percent"
                  className="text-2xl font-bold text-indigo-600"
                >
                  {timeline.latestPercent}%
                </p>
                <p className="text-xs text-gray-400">{entries.length} รายการอัพเดต</p>
              </div>
            </div>
            {/* Progress bar */}
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                data-testid="main-progress-bar"
                className={`h-full rounded-full transition-all duration-500 ${progressColor(timeline.latestStatus)}`}
                style={{ width: `${timeline.latestPercent}%` }}
              />
            </div>
          </div>

          {/* Timeline entries */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
              บันทึกความคืบหน้า
            </p>
            {entries.length === 0 ? (
              <EmptyTimeline />
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
            <p>ข้อมูลอัพเดตอัตโนมัติทุก {POLL_INTERVAL_MS / 1000} วินาที</p>
            {lastFetched && (
              <p>อัพเดตล่าสุด: {lastFetched.toLocaleTimeString("th-TH", { timeStyle: "short" })}</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
