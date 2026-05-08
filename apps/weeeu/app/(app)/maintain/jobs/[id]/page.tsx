"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import type { MaintainJob } from "@/lib/types";

const STATUS_LABEL: Record<MaintainJob["status"], string> = {
  pending: "รอช่าง",
  assigned: "มอบหมายแล้ว",
  departed: "ช่างออกเดินทาง",
  arrived: "ช่างถึงแล้ว",
  in_progress: "กำลังล้าง",
  completed: "เสร็จแล้ว",
  cancelled: "ยกเลิก",
};

const STATUS_COLOR: Record<MaintainJob["status"], string> = {
  pending: "bg-yellow-100 text-yellow-700",
  assigned: "bg-blue-100 text-blue-700",
  departed: "bg-amber-100 text-amber-700",
  arrived: "bg-amber-100 text-amber-700",
  in_progress: "bg-teal-100 text-teal-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-gray-100 text-gray-500",
};

const TIMELINE_STEPS: { status: MaintainJob["status"]; label: string; icon: string }[] = [
  { status: "pending",     label: "รอมอบหมายช่าง",   icon: "⏳" },
  { status: "assigned",    label: "มอบหมายช่างแล้ว",  icon: "👷" },
  { status: "departed",    label: "ช่างออกเดินทาง",   icon: "🚗" },
  { status: "arrived",     label: "ช่างถึงหน้างาน",    icon: "📍" },
  { status: "in_progress", label: "กำลังล้างเครื่อง",  icon: "🛁" },
  { status: "completed",   label: "งานเสร็จสมบูรณ์",   icon: "✅" },
];

const APPLIANCE_LABEL: Record<MaintainJob["applianceType"], string> = {
  AC: "แอร์ 🌡️",
  WashingMachine: "เครื่องซักผ้า 🫧",
};

const CLEANING_LABEL: Record<MaintainJob["cleaningType"], string> = {
  general: "ล้างทั่วไป 🧼",
  deep: "ล้างลึก 🔬",
  sanitize: "ล้าง+ฆ่าเชื้อ 🦠",
};

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("th-TH", {
    day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function MaintainJobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<MaintainJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    apiFetch(`/api/v1/maintain/jobs/${id}/`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (!d) setError("ไม่พบงานนี้"); else setJob(d); })
      .catch(() => setError("ไม่สามารถโหลดข้อมูลได้"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleCancel = async () => {
    if (!confirm("ยืนยันยกเลิกงานนี้?")) return;
    setCancelling(true);
    try {
      const res = await apiFetch(`/api/v1/maintain/jobs/${id}/cancel/`, { method: "POST" });
      if (!res.ok) throw new Error();
      setJob(j => j ? { ...j, status: "cancelled" } : j);
    } catch {
      setError("ไม่สามารถยกเลิกได้ กรุณาลองใหม่");
    } finally {
      setCancelling(false);
    }
  };

  const currentStepIdx = job ? TIMELINE_STEPS.findIndex(s => s.status === job.status) : -1;

  if (loading) return <div className="text-center py-16 text-gray-400">กำลังโหลด...</div>;
  if (error || !job) return (
    <div className="text-center py-16">
      <p className="text-4xl mb-3">🛁</p>
      <p className="text-gray-600 font-medium">{error || "ไม่พบข้อมูล"}</p>
      <Link href="/maintain/jobs" className="mt-3 inline-block text-teal-600 text-sm font-medium hover:underline">← กลับรายการ</Link>
    </div>
  );

  return (
    <div className="max-w-xl space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/maintain/jobs" className="text-gray-500 hover:text-gray-800 text-xl">‹</Link>
        <h1 className="text-xl font-bold text-gray-900">รายละเอียดงานล้าง</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Action banner — rate */}
      {job.status === "completed" && (
        <Link
          href={`/maintain/jobs/${id}/rate`}
          className="block bg-teal-50 border border-teal-200 rounded-2xl p-4 hover:bg-teal-100 transition-colors"
        >
          <p className="text-sm font-semibold text-teal-800">⭐ งานเสร็จแล้ว — ให้คะแนนช่าง</p>
          <p className="text-xs text-teal-600 mt-1 font-medium">กดที่นี่เพื่อให้คะแนน →</p>
        </Link>
      )}

      {/* Status card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-bold text-gray-900">{APPLIANCE_LABEL[job.applianceType]}</p>
            <p className="text-sm text-gray-500 mt-0.5">{CLEANING_LABEL[job.cleaningType]}</p>
            <p className="text-xs font-mono text-gray-400 mt-1">{job.serviceCode}</p>
          </div>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${STATUS_COLOR[job.status]}`}>
            {STATUS_LABEL[job.status]}
          </span>
        </div>
      </div>

      {/* Status timeline */}
      {job.status !== "cancelled" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">ขั้นตอน</p>
          <div className="space-y-3">
            {TIMELINE_STEPS.map((step, i) => {
              const done = currentStepIdx >= i;
              const active = currentStepIdx === i;
              return (
                <div key={step.status} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 ${
                    done ? "bg-teal-100 text-teal-600" : "bg-gray-100 text-gray-300"
                  } ${active ? "ring-2 ring-teal-400 ring-offset-1" : ""}`}>
                    {step.icon}
                  </div>
                  <p className={`text-sm ${done ? "text-gray-800 font-medium" : "text-gray-400"}`}>
                    {step.label}
                  </p>
                  {active && <span className="ml-auto text-xs text-teal-600 font-medium">● ตอนนี้</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Job info */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">ข้อมูลงาน</p>
        </div>
        <div className="p-5 space-y-3">
          <Row label="วันนัด" value={formatDate(job.scheduledAt)} />
          <Row label="ที่อยู่" value={job.address.address} />
          <Row label="ระยะเวลาโดยประมาณ" value={`${job.estimatedDuration} ชั่วโมง`} />
          {job.recurring?.enabled && (
            <Row label="นัดซ้ำ" value={
              job.recurring.interval === "3_months" ? "ทุก 3 เดือน 🔄"
              : job.recurring.interval === "6_months" ? "ทุก 6 เดือน 🔄"
              : "ทุกปี 🔄"
            } />
          )}
          {job.recurring?.nextScheduledAt && (
            <Row label="นัดถัดไป" value={formatDate(job.recurring.nextScheduledAt)} />
          )}
          {job.totalPrice > 0 && (
            <Row label="ราคา" value={`${job.totalPrice.toLocaleString()} Point`} />
          )}
        </div>
      </div>

      {/* Technician info */}
      {job.technicianId && (
        <div className="bg-teal-50 border border-teal-100 rounded-2xl p-4">
          <p className="text-sm font-semibold text-teal-800">👷 ช่างที่รับงาน</p>
          <p className="text-xs text-teal-600 mt-1">ID: {job.technicianId}</p>
        </div>
      )}

      {/* Parts used */}
      {job.parts_used && job.parts_used.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">อะไหล่/สารเคมีที่ใช้</p>
          {job.parts_used.map((p, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-gray-600">{p.name}</span>
              <span className="text-gray-800 font-medium">x{p.qty}</span>
            </div>
          ))}
        </div>
      )}

      {/* Cancel button */}
      {(job.status === "pending" || job.status === "assigned") && (
        <button
          onClick={handleCancel}
          disabled={cancelling}
          className="w-full border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50 font-medium py-3 rounded-2xl transition-colors text-sm"
        >
          {cancelling ? <><span className="animate-spin">⟳</span> กำลังยกเลิก...</> : "❌ ยกเลิกงานนี้"}
        </button>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <p className="text-sm text-gray-500 shrink-0">{label}</p>
      <p className="text-sm font-medium text-gray-800 text-right">{value}</p>
    </div>
  );
}
