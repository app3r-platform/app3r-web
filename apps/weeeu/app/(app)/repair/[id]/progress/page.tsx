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
import { useParams, useRouter } from "next/navigation";
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
  accepted:    "border-weeeu-primary bg-weeeu-surface",
  in_progress: "border-weeeu-dark bg-weeeu-surface",
  paused:      "border-yellow-400 bg-yellow-50",
  completed:   "border-green-500 bg-green-50",
  cancelled:   "border-red-400 bg-red-50",
};

// ── Mock fallback (CMD-FIX-2a) — try API → catch → fallback MOCK ─────────────
const MOCK_TIMELINE: ServiceProgressTimelineDto = {
  serviceId: "job-001",
  latestStatus: "in_progress",
  latestPercent: 55,
  entries: [
    {
      id: "prog-001",
      serviceId: "job-001",
      status: "pending",
      progressPercent: 0,
      note: "รับแจ้งซ่อม — แอร์ Daikin เสียงดังผิดปกติ",
      photoR2Key: null,
      updatedBy: "u-001",
      createdAt: "2026-05-25T09:00:00.000Z",
    },
    {
      id: "prog-002",
      serviceId: "job-001",
      status: "accepted",
      progressPercent: 20,
      note: "ร้านซ่อมดีเจริญ รับงานแล้ว — นัดช่างเข้าวันนี้",
      photoR2Key: null,
      updatedBy: "r-101",
      createdAt: "2026-05-25T09:30:00.000Z",
    },
    {
      id: "prog-003",
      serviceId: "job-001",
      status: "in_progress",
      progressPercent: 40,
      note: "ช่างถึงหน้างานแล้ว — กำลังเริ่มตรวจสอบระบบ",
      photoR2Key: null,
      updatedBy: "t-201",
      createdAt: "2026-05-25T10:30:00.000Z",
    },
    {
      id: "prog-004",
      serviceId: "job-001",
      status: "in_progress",
      progressPercent: 55,
      note: "พบปัญหาคอมเพรสเซอร์เสื่อม — กำลังเตรียมเปลี่ยนอะไหล่",
      photoR2Key: null,
      updatedBy: "t-201",
      createdAt: "2026-05-25T11:15:00.000Z",
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
          className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm flex-shrink-0 ${colorCls} ${isLatest ? "ring-2 ring-offset-1 ring-weeeu-primary/40" : ""}`}
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

// ── C7 abort reasons ──────────────────────────────────────────────────────────
const ABORT_REASONS = [
  { value: "changed_mind",       label: "เปลี่ยนใจ / ไม่ซ่อมแล้ว" },
  { value: "too_expensive",      label: "ราคาสูงกว่าที่คาดไว้" },
  { value: "taking_too_long",    label: "ใช้เวลานานเกินไป" },
  { value: "appliance_totaled",  label: "เครื่องเสียหายเพิ่มระหว่างซ่อม" },
  { value: "other",              label: "เหตุผลอื่น" },
] as const;

type AbortReason = typeof ABORT_REASONS[number]["value"];

// ── Main page ─────────────────────────────────────────────────────────────────
const POLL_INTERVAL_MS = 3000; // Backend comment: "Polling fallback: FE poll GET every 3s"

export default function RepairProgressPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [timeline, setTimeline] = useState<ServiceProgressTimelineDto | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  // ── C7: ยุติงาน abort flow ──────────────────────────────────────────────────
  // ── C7: ยุติงาน abort flow ──────────────────────────────────────────────────
  const [showAbortModal, setShowAbortModal] = useState(false);
  const [abortReason, setAbortReason] = useState<AbortReason | "">("");
  const [abortNote, setAbortNote] = useState("");
  const [abortSubmitting, setAbortSubmitting] = useState(false);
  const [abortError, setAbortError] = useState<string | null>(null);

  // ── CMD A3: ยืนยันรับงานเสร็จ + toast ──────────────────────────────────────
  const [jobConfirmed, setJobConfirmed] = useState(false);
  const [toast, setToast] = useState("");

  const handleConfirmJob = () => {
    setJobConfirmed(true);
    setToast("บันทึกแล้ว (Mockup)");
    setTimeout(() => setToast(""), 2500);
  };

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
            // API ไม่พร้อม — fallback MOCK (CMD-FIX-2a No-seed fix)
            setTimeline(prev => prev ?? MOCK_TIMELINE);
            setError(null);
            setLastFetched(new Date());
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

  // ── C7: submit abort ───────────────────────────────────────────────────────
  const handleAbortSubmit = async () => {
    if (!abortReason) { setAbortError("กรุณาเลือกเหตุผล"); return; }
    setAbortSubmitting(true);
    setAbortError(null);
    try {
      const res = await apiFetch(`/api/v1/repair/jobs/${id}/abort`, {
        method: "POST",
        body: JSON.stringify({ reason: abortReason, note: abortNote.trim() || undefined }),
      });
      if (!res.ok) throw new Error(await res.text());
      // Notify WeeeR + redirect to repair home
      router.push("/repair");
    } catch {
      setAbortError("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    } finally {
      setAbortSubmitting(false);
    }
  };

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
                <p className="text-sm font-semibold text-weeeu-dark">
                  {timeline.latestStatus
                    ? (SERVICE_PROGRESS_STATUS_LABEL[timeline.latestStatus] ?? timeline.latestStatus)
                    : "รอดำเนินการ"}
                </p>
              </div>
              <div className="text-right">
                <p
                  data-testid="main-progress-percent"
                  className="text-2xl font-bold text-weeeu-primary"
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

          {/* ── CMD A3: toast ────────────────────────────────────────────── */}
          {toast && (
            <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-gray-800 text-white text-xs px-4 py-2 rounded-full shadow-lg">
              {toast}
            </div>
          )}

          {/* ── CMD A3: ยืนยันรับงานเสร็จ (completed only) ───────────────── */}
          {timeline.latestStatus === "completed" && !jobConfirmed && (
            <div className="bg-weeeu-surface border border-weeeu-primary/20 rounded-2xl p-4">
              <p className="text-sm font-semibold text-weeeu-dark mb-1">ช่างรายงานว่าซ่อมเสร็จแล้ว ✅</p>
              <p className="text-xs text-gray-500 mb-3">กรุณายืนยันว่าได้รับเครื่องคืนและทำงานได้ปกติ</p>
              <button
                type="button"
                onClick={handleConfirmJob}
                className="w-full bg-weeeu-primary hover:bg-weeeu-dark text-white font-semibold py-3 rounded-xl text-sm transition-colors"
              >
                ยืนยันรับงานเสร็จ ✅
              </button>
            </div>
          )}
          {jobConfirmed && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
              <p className="text-sm font-semibold text-green-700">✅ ยืนยันรับงานแล้ว (Mockup)</p>
            </div>
          )}

          {/* ── CMD A3: dispute + fee-settle links ───────────────────────── */}
          {timeline.latestStatus && ["in_progress", "completed"].includes(timeline.latestStatus) && (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => router.push(`/repair/${id}/dispute`)}
                className="flex-1 border border-orange-200 text-orange-600 hover:bg-orange-50 font-medium py-2.5 rounded-xl text-sm transition-colors"
              >
                ⚠️ มีปัญหา? → โต้แย้ง
              </button>
              <button
                type="button"
                onClick={() => router.push(`/repair/${id}/fee-settle`)}
                className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium py-2.5 rounded-xl text-sm transition-colors"
              >
                🔒 พอยต์ทองที่ล็อก
              </button>
            </div>
          )}

          {/* C7: ยุติงาน — แสดงเฉพาะสถานะที่ยังยุติได้ */}
          {timeline.latestStatus &&
            !["completed", "cancelled"].includes(timeline.latestStatus) && (
              <div className="border border-red-100 rounded-2xl p-4 bg-red-50/40">
                <p className="text-xs text-red-600 font-medium mb-2">⚠️ ต้องการยุติงานซ่อม?</p>
                <p className="text-xs text-gray-500 mb-3">
                  การยุติงานจะแจ้งให้ร้านซ่อมทราบทันที และระบบจะคำนวณค่าแรงยุติตามเงื่อนไขที่ตกลงไว้
                </p>
                <button
                  type="button"
                  onClick={() => setShowAbortModal(true)}
                  className="w-full border border-red-300 text-red-600 hover:bg-red-50 font-medium py-2.5 rounded-xl text-sm transition-colors"
                >
                  ยุติงาน (C7)
                </button>
              </div>
            )}
        </>
      )}

      {/* ── C7 Abort Modal ─────────────────────────────────────────────────── */}
      {showAbortModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900">ยุติงานซ่อม</h3>
              <button
                type="button"
                onClick={() => { setShowAbortModal(false); setAbortError(null); }}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-500">
              เลือกเหตุผลการยุติงาน — ร้านซ่อมจะได้รับแจ้งและดำเนินการตามเงื่อนไข ข้อ 4 (ค่าแรงยุติ)
            </p>

            {/* เหตุผล */}
            <div className="space-y-2">
              {ABORT_REASONS.map(r => (
                <label
                  key={r.value}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    abortReason === r.value
                      ? "border-red-400 bg-red-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="abort-reason"
                    value={r.value}
                    checked={abortReason === r.value}
                    onChange={() => setAbortReason(r.value)}
                    className="accent-red-500"
                  />
                  <span className="text-sm text-gray-700">{r.label}</span>
                </label>
              ))}
            </div>

            {/* หมายเหตุเพิ่มเติม */}
            <textarea
              value={abortNote}
              onChange={e => setAbortNote(e.target.value)}
              placeholder="หมายเหตุเพิ่มเติม (ไม่บังคับ)"
              rows={2}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
            />

            {abortError && (
              <p className="text-sm text-red-600">{abortError}</p>
            )}

            <div className="space-y-2 pt-1">
              <button
                type="button"
                disabled={abortSubmitting}
                onClick={handleAbortSubmit}
                className="w-full bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white font-semibold py-3 rounded-2xl text-sm transition-colors flex items-center justify-center gap-2"
              >
                {abortSubmitting
                  ? <><span className="animate-spin">⟳</span> กำลังยุติงาน...</>
                  : "ยืนยันยุติงาน"}
              </button>
              <button
                type="button"
                disabled={abortSubmitting}
                onClick={() => { setShowAbortModal(false); setAbortError(null); }}
                className="w-full text-gray-400 hover:text-gray-600 text-sm py-2 transition-colors"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
