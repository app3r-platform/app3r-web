"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { repairApi } from "../../_lib/api";
import type { RepairJob } from "../../_lib/types";
import { STATUS_LABEL, STATUS_COLOR, BRANCH_LABEL } from "../../_lib/types";

const TIMELINE_STATES = [
  { key: "assigned",         label: "มอบหมาย WeeeT",         icon: "👷" },
  { key: "traveling",        label: "ช่างออกเดินทาง",          icon: "🚗" },
  { key: "awaiting_entry",   label: "รอ WeeeU อนุมัติเข้า",   icon: "🚪" },
  { key: "inspecting",       label: "ตรวจสภาพก่อนซ่อม",       icon: "🔍" },
  { key: "awaiting_decision",label: "รออนุมัติจากร้าน",       icon: "⚠️" },
  { key: "in_progress",      label: "กำลังซ่อม",               icon: "🔧" },
  { key: "awaiting_review",  label: "รอ WeeeU ตรวจรับ",       icon: "✅" },
  { key: "closed",           label: "ปิดงาน",                  icon: "🏁" },
];

const STATE_ORDER = ["assigned","traveling","arrived","awaiting_entry","inspecting","awaiting_decision","awaiting_user","in_progress","completed","awaiting_review","closed","cancelled","converted_scrap"];

function timelineStep(job: RepairJob) {
  return TIMELINE_STATES.findIndex((s) => s.key === job.status);
}

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [job, setJob] = useState<RepairJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    repairApi.getJob(id)
      .then(setJob)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex items-center justify-center h-48 text-gray-400">กำลังโหลด…</div>;
  if (error) return <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">{error}</div>;
  if (!job) return null;

  const currentStep = timelineStep(job);
  const isTerminal = ["closed", "cancelled", "converted_scrap"].includes(job.status);

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/repair/jobs" className="text-gray-400 hover:text-gray-600">←</Link>
        <h1 className="text-xl font-bold text-gray-900 truncate">{job.appliance_name}</h1>
        <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLOR[job.status]}`}>
          {STATUS_LABEL[job.status]}
        </span>
      </div>

      {/* Info card */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-gray-400">ลูกค้า</p>
            <p className="font-medium text-gray-800">{job.customer_name}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">WeeeT</p>
            <p className="font-medium text-gray-800">{job.weeet_name}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">ที่อยู่</p>
            <p className="font-medium text-gray-800 text-xs">{job.customer_address}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">นัดหมาย</p>
            <p className="font-medium text-gray-800 text-xs">
              {new Date(job.scheduled_at).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
          {job.original_price > 0 && (
            <div>
              <p className="text-xs text-gray-400">ราคาข้อเสนอ</p>
              <p className="font-medium text-green-700">{job.original_price.toLocaleString()} pts</p>
            </div>
          )}
          {job.final_price && (
            <div>
              <p className="text-xs text-gray-400">ราคาสุดท้าย</p>
              <p className="font-bold text-green-700">{job.final_price.toLocaleString()} pts</p>
            </div>
          )}
        </div>

        {job.arrival_location && (
          <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3">
            <span className="text-2xl">📍</span>
            <div>
              <p className="text-xs font-medium text-gray-700">ตำแหน่งช่าง (GPS)</p>
              <p className="text-xs text-gray-500">{job.arrival_location.lat.toFixed(5)}, {job.arrival_location.lng.toFixed(5)}</p>
            </div>
          </div>
        )}
      </div>

      {/* Decision branch */}
      {job.decision_branch && (
        <div className={`border rounded-xl p-4 ${job.decision_branch.startsWith("B1") ? "bg-green-50 border-green-100" : "bg-red-50 border-red-100"}`}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-bold">{job.decision_branch}</span>
            <span className="text-sm text-gray-700">{BRANCH_LABEL[job.decision_branch]}</span>
          </div>
          {job.decision_notes && <p className="text-xs text-gray-600 mt-1">{job.decision_notes}</p>}
          {job.parts_added && job.parts_added.length > 0 && (
            <div className="mt-2 space-y-1">
              <p className="text-xs font-medium text-gray-600">อะไหล่เพิ่มเติม:</p>
              {job.parts_added.map((p, i) => (
                <div key={i} className="flex justify-between text-xs text-gray-600">
                  <span>{p.name} × {p.qty}</span>
                  <span className="font-medium">{p.price.toLocaleString()} pts</span>
                </div>
              ))}
              {job.proposed_price && (
                <div className="flex justify-between text-xs font-bold text-green-700 pt-1 border-t border-green-100">
                  <span>ราคาใหม่รวม</span>
                  <span>{job.proposed_price.toLocaleString()} pts</span>
                </div>
              )}
            </div>
          )}
          {job.scrap_agreed_price && (
            <p className="text-xs font-medium text-red-700 mt-1">ราคารับซาก: {job.scrap_agreed_price.toLocaleString()} pts</p>
          )}
        </div>
      )}

      {/* Timeline */}
      <div className="bg-white border border-gray-100 rounded-xl p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Timeline</p>
        <div className="space-y-3">
          {TIMELINE_STATES.map((step, i) => {
            const done = i < currentStep;
            const active = i === currentStep && !isTerminal;
            return (
              <div key={step.key} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0
                  ${done ? "bg-green-600 text-white" : active ? "bg-green-100 ring-2 ring-green-400 text-green-700" : "bg-gray-100 text-gray-400"}`}>
                  {done ? "✓" : step.icon}
                </div>
                <span className={`text-sm ${done || active ? "text-gray-800 font-medium" : "text-gray-400"}`}>
                  {step.label}
                </span>
                {active && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">ปัจจุบัน</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Evidence photos summary */}
      {(job.arrival_files?.length || job.pre_inspection_files?.length || job.post_repair_files?.length) && (
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">หลักฐาน</p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-gray-50 rounded-lg p-2">
              <p className="text-lg font-bold text-gray-700">{job.arrival_files?.length ?? 0}</p>
              <p className="text-xs text-gray-400">รูปถึงหน้างาน</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-2">
              <p className="text-lg font-bold text-gray-700">{job.pre_inspection_files?.length ?? 0}</p>
              <p className="text-xs text-gray-400">รูปก่อนซ่อม</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-2">
              <p className="text-lg font-bold text-gray-700">{job.post_repair_files?.length ?? 0}</p>
              <p className="text-xs text-gray-400">รูปหลังซ่อม</p>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      {!isTerminal && (
        <div className="flex flex-col gap-2">
          <Link href={`/repair/jobs/${job.id}/progress`}
            className="w-full bg-white border border-green-200 text-green-700 hover:bg-green-50 font-medium py-2.5 rounded-xl text-center transition-colors text-sm">
            📊 ดูความคืบหน้า (Progress)
          </Link>
          {job.status === "awaiting_decision" && (
            <Link href={`/repair/jobs/${job.id}/approve`}
              className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-3 rounded-xl text-center transition-colors">
              ✅ อนุมัติผลตรวจ WeeeT
            </Link>
          )}
          {["in_progress", "awaiting_review"].includes(job.status) && (
            <Link href={`/repair/jobs/${job.id}/dispute`}
              className="w-full bg-white border border-red-200 text-red-600 hover:bg-red-50 font-medium py-3 rounded-xl text-center transition-colors text-sm">
              🚩 เปิดข้อพิพาท
            </Link>
          )}
        </div>
      )}

      {(job.status === "closed" || job.status === "converted_scrap") && (
        <div className={`rounded-xl p-4 text-center ${job.status === "closed" ? "bg-green-50" : "bg-lime-50"}`}>
          <span className="text-2xl">{job.status === "closed" ? "🏁" : "♻️"}</span>
          <p className="text-sm font-semibold text-gray-800 mt-1">
            {job.status === "closed" ? "งานปิดสำเร็จ" : "โอนไป Scrap module แล้ว"}
          </p>
          {job.closed_at && (
            <p className="text-xs text-gray-500 mt-0.5">
              {new Date(job.closed_at).toLocaleDateString("th-TH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
