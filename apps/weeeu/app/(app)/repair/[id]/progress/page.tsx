"use client";

/**
 * /repair/[id]/progress — Sub-CMD-5 Wave 2: Service Progress Tracker D79
 *
 * Read-only timeline view สำหรับลูกค้าดูความคืบหน้างานซ่อม
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️  Formal Ruling Option D: ห้าม stub type เต็ม
 *     ServiceProgress type ยังไม่ export จาก Backend → ใช้ inline type เท่านั้น
 *     TODO: Sub-5 — import ServiceProgress from @app3r/types/services เมื่อ Backend export แล้ว
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api-client";

// TODO: Sub-5 — import ServiceProgress from @app3r/types/services when Backend exports
type ServiceProgress = {
  step_key: string;
  label: string;
  description: string | null;
  completed_at: string | null;
  actor_role: string | null;
  is_current: boolean;
  is_done: boolean;
};

// TODO: Sub-5 — import RepairProgressDto from @app3r/types/services when Backend exports
type RepairProgressDto = {
  job_id: string;
  appliance_name: string;
  status: string;
  progress_percent: number;
  steps: ServiceProgress[];
  estimated_done?: string | null; // TODO: Sub-5 — pending Backend schema
};

// ── Status → Thai label (minimal subset for progress page) ───────────────────
const STATUS_LABEL: Record<string, string> = {
  assigned:          "มอบหมายแล้ว",
  traveling:         "ช่างกำลังเดินทาง",
  arrived:           "ช่างถึงแล้ว",
  awaiting_entry:    "รออนุมัติเข้าหน้างาน",
  inspecting:        "กำลังตรวจสอบ",
  awaiting_decision: "รอ WeeeR อนุมัติ",
  awaiting_user:     "รอคุณตัดสินใจ",
  in_progress:       "กำลังซ่อม",
  completed:         "ซ่อมเสร็จแล้ว",
  awaiting_review:   "รอตรวจรับงาน",
  closed:            "สำเร็จ",
  cancelled:         "ยกเลิก",
  // Pickup
  appliance_at_shop: "เครื่องอยู่ที่ร้าน",
  en_route_delivery: "กำลังส่งคืน",
  // Parcel
  parcel_inspecting:  "กำลังตรวจสอบ (Parcel)",
  parcel_in_progress: "กำลังซ่อม (Parcel)",
};

// ── Step icon based on state ─────────────────────────────────────────────────
function StepIcon({ isDone, isCurrent }: { isDone: boolean; isCurrent: boolean }) {
  if (isDone)    return <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">✓</div>;
  if (isCurrent) return <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0"><div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" /></div>;
  return          <div className="w-7 h-7 rounded-full border-2 border-gray-200 bg-white flex-shrink-0" />;
}

// ── Fallback: derive steps from status when Backend hasn't implemented progress API ──
function deriveStepsFromStatus(status: string, applianceName: string): ServiceProgress[] {
  const onSiteSteps: Array<{ key: string; label: string; desc: string }> = [
    { key: "assigned",          label: "มอบหมายช่าง",          desc: `ช่างรับงานซ่อม ${applianceName}` },
    { key: "traveling",         label: "ช่างออกเดินทาง",        desc: "ช่างกำลังมุ่งหน้าไปยังที่อยู่ของคุณ" },
    { key: "arrived",           label: "ช่างถึงหน้างาน",         desc: "ช่างมาถึงแล้ว — รอเข้าหน้างาน" },
    { key: "inspecting",        label: "ตรวจสอบเครื่อง",         desc: "ช่างกำลังวินิจฉัยอาการเสีย" },
    { key: "in_progress",       label: "กำลังซ่อม",              desc: "อยู่ระหว่างดำเนินการซ่อม" },
    { key: "completed",         label: "ซ่อมเสร็จ",              desc: "ช่างซ่อมเสร็จแล้ว — รอตรวจรับงาน" },
    { key: "awaiting_review",   label: "ตรวจรับงาน",             desc: "คุณต้องยืนยันรับงาน" },
    { key: "closed",            label: "งานสำเร็จ",              desc: "งานซ่อมเสร็จสมบูรณ์" },
  ];

  const ORDER = onSiteSteps.map(s => s.key);
  const currentIdx = ORDER.indexOf(status);

  return onSiteSteps.map((step, idx) => ({
    step_key:     step.key,
    label:        step.label,
    description:  step.desc,
    completed_at: null,
    actor_role:   null,
    is_done:      idx < currentIdx,
    is_current:   idx === currentIdx,
  }));
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" });
}

export default function RepairProgressPage() {
  const { id } = useParams<{ id: string }>();
  const [progress, setProgress] = useState<RepairProgressDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // TODO: Sub-5 — เมื่อ Backend implement GET /api/v1/repair/:id/progress
    // เปลี่ยน fallback logic นี้เป็น: apiFetch(`/api/v1/repair/${id}/progress`)
    apiFetch(`/api/v1/repair/jobs/${id}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((data: any) => {
        // TODO: Sub-5 — replace with dedicated /repair/:id/progress endpoint when Backend ships it
        const steps = data.progress_percent != null
          ? (data.steps ?? deriveStepsFromStatus(data.status, data.appliance_name))
          : deriveStepsFromStatus(data.status, data.appliance_name);
        setProgress({
          job_id:           data.id,
          appliance_name:   data.appliance_name,
          status:           data.status,
          progress_percent: data.progress_percent ?? 0,
          steps,
          estimated_done:   data.estimated_done ?? null,
        });
      })
      .catch(() => setError("ไม่สามารถโหลดข้อมูลความคืบหน้าได้"))
      .finally(() => setLoading(false));
  }, [id]);

  const doneCount  = progress?.steps.filter(s => s.is_done || s.is_current).length ?? 0;
  const totalCount = progress?.steps.length ?? 0;

  return (
    <div className="max-w-xl space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/repair/${id}`} className="text-gray-500 hover:text-gray-800 text-xl">‹</Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">ความคืบหน้า</h1>
          {progress && (
            <p className="text-sm text-gray-400">{progress.appliance_name}</p>
          )}
        </div>
      </div>

      {loading && (
        <div className="text-center py-16 text-gray-400">กำลังโหลด...</div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {progress && !loading && (
        <>
          {/* Progress summary card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">สถานะปัจจุบัน</p>
                <p className="text-sm font-semibold text-indigo-700">
                  {STATUS_LABEL[progress.status] ?? progress.status}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-indigo-600">{progress.progress_percent}%</p>
                <p className="text-xs text-gray-400">{doneCount}/{totalCount} ขั้นตอน</p>
              </div>
            </div>
            {/* Progress bar */}
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                data-testid="main-progress-bar"
                className="h-full bg-indigo-400 rounded-full transition-all duration-500"
                style={{ width: `${progress.progress_percent}%` }}
              />
            </div>
            {progress.estimated_done && (
              <p className="text-xs text-gray-400">
                🗓 คาดว่าเสร็จ: {formatDate(progress.estimated_done)}
              </p>
            )}
          </div>

          {/* Steps timeline */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">ขั้นตอนงานซ่อม</p>
            <div className="space-y-0">
              {progress.steps.map((step, idx) => (
                <div key={step.step_key} className="flex gap-3">
                  {/* Icon + connector */}
                  <div className="flex flex-col items-center">
                    <StepIcon isDone={step.is_done} isCurrent={step.is_current} />
                    {idx < progress.steps.length - 1 && (
                      <div className={`w-0.5 flex-1 my-1 ${step.is_done ? "bg-green-300" : "bg-gray-200"}`} style={{ minHeight: "24px" }} />
                    )}
                  </div>
                  {/* Content */}
                  <div className={`pb-5 flex-1 ${idx === progress.steps.length - 1 ? "pb-0" : ""}`}>
                    <p className={`text-sm font-medium ${
                      step.is_current ? "text-indigo-700" :
                      step.is_done    ? "text-gray-700" :
                                        "text-gray-400"
                    }`}>
                      {step.label}
                    </p>
                    {step.description && (
                      <p className={`text-xs mt-0.5 ${step.is_current || step.is_done ? "text-gray-500" : "text-gray-300"}`}>
                        {step.description}
                      </p>
                    )}
                    {step.completed_at && (
                      <p className="text-xs text-green-600 mt-0.5">✓ {formatDate(step.completed_at)}</p>
                    )}
                    {step.is_current && (
                      <span className="inline-block mt-1 text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                        กำลังดำเนินการ
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Info note */}
          <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-400 text-center">
            ข้อมูลอัพเดตอัตโนมัติ — รีเฟรชหน้าเพื่อดูสถานะล่าสุด
          </div>
        </>
      )}
    </div>
  );
}
