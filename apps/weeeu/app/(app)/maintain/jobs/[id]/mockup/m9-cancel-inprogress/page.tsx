"use client";
/**
 * MOCKUP — M9 (WeeeU view): ยุติกลางล้าง — WeeeU กดยกเลิกระหว่าง in_progress
 * Blueprint WeeeU Maintain (369813ec-7277-813f-abdf-e1bb3faac08e)
 * ผังเคส M9: WeeeU ยุติระหว่างล้าง → แจ้ง WeeeR + WeeeT → settle
 *
 * สิ่งที่เพิ่ม (delta จาก jobs/[id]/page.tsx เดิม):
 *  - ปุ่ม "ยกเลิกงาน" ปรากฏเมื่อ status === "in_progress" (เดิมแสดงเฉพาะ pending/assigned)
 *  - confirm dialog + textarea กรอกเหตุผล (บังคับก่อน submit)
 *  - แสดง settle preview (ตาม offer lock)
 *
 * Maintain Gen 4 · 2026-05-24 · Mockup เคส M9 WeeeU
 */

import { useState } from "react";
import Link from "next/link";

const JOB = {
  id: "mock-m9-001",
  serviceCode: "MTN-20260519-0088",
  applianceType: "AC" as const,
  cleaningType: "deep" as const,
  status: "in_progress" as const,
  scheduledAt: "2026-05-22T10:00:00+07:00",
  address: { address: "200 ถ.พหลโยธิน จตุจักร กรุงเทพ 10900" },
  technicianId: "TECH-0042",
  offerLock: {
    shopName:           "ร้านฟ้าใสแอร์เซอร์วิส",
    depositAmount:      300,
    travelFee:          80,
    cancelMidPolicy:    "ยกเลิกกลางคัน: WeeeR ได้รับค่าเดินทาง + ค่าบริการตามสัดส่วน",
    estimatedSettle:    130, // ค่าเดินทาง 80 + ค่าบริการส่วน ~50
  },
};

const TIMELINE_STEPS = [
  { status: "pending",     label: "รอมอบหมายช่าง",  icon: "⏳" },
  { status: "assigned",    label: "มอบหมายช่างแล้ว", icon: "👷" },
  { status: "departed",    label: "ช่างออกเดินทาง",  icon: "🚗" },
  { status: "arrived",     label: "ช่างถึงหน้างาน",   icon: "📍" },
  { status: "in_progress", label: "กำลังล้างเครื่อง", icon: "🛁" },
  { status: "completed",   label: "งานเสร็จสมบูรณ์",  icon: "✅" },
];

const CURRENT_IDX = 4; // in_progress

export default function M9CancelInProgressMockupPage() {
  const [showDialog, setShowDialog] = useState(false);
  const [reason, setReason]         = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [cancelled, setCancelled]   = useState(false);

  const canSubmit = reason.trim().length >= 10 && !submitting;

  const handleSubmit = () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setTimeout(() => {
      setCancelled(true);
      setShowDialog(false);
      setSubmitting(false);
    }, 800);
  };

  return (
    <div className="max-w-xl space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/maintain/jobs" className="text-gray-500 hover:text-gray-800 text-xl">‹</Link>
        <h1 className="text-xl font-bold text-gray-900">รายละเอียดงานล้าง</h1>
        <span className="ml-auto text-[10px] font-mono text-gray-300 bg-gray-100 px-2 py-0.5 rounded">
          MOCKUP M9-WeeeU
        </span>
      </div>

      {/* Cancelled confirmation */}
      {cancelled && (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="font-semibold text-gray-700">ยกเลิกงานเรียบร้อย</p>
              <p className="text-sm text-gray-500">
                WeeeR ได้รับแจ้งแล้ว · คาดว่า settle {JOB.offerLock.estimatedSettle} พอยต์ทอง ภายใน 1-3 วัน
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Status card */}
      {!cancelled && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-bold text-gray-900">แอร์ 🌡️ — ล้างลึก 🔬</p>
              <p className="text-xs font-mono text-gray-400 mt-1">{JOB.serviceCode}</p>
            </div>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-[#E1F7EC] text-[#0A9B55] whitespace-nowrap">
              กำลังล้าง
            </span>
          </div>
        </div>
      )}

      {/* Timeline */}
      {!cancelled && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">ขั้นตอน</p>
          <div className="space-y-3">
            {TIMELINE_STEPS.map((step, i) => {
              const done   = CURRENT_IDX >= i;
              const active = CURRENT_IDX === i;
              return (
                <div key={step.status} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 ${
                    done ? "bg-[#E1F7EC] text-[#0DC36C]" : "bg-gray-100 text-gray-300"
                  } ${active ? "ring-2 ring-[#0DC36C] ring-offset-1" : ""}`}>
                    {step.icon}
                  </div>
                  <p className={`text-sm ${done ? "text-gray-800 font-medium" : "text-gray-400"}`}>
                    {step.label}
                  </p>
                  {active && <span className="ml-auto text-xs text-[#0DC36C] font-medium">● ตอนนี้</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── M9: ปุ่มยกเลิกงานระหว่าง in_progress ─── */}
      {!cancelled && !showDialog && (
        <button
          onClick={() => setShowDialog(true)}
          className="w-full border border-red-300 text-red-600 hover:bg-red-50 font-medium py-3 rounded-2xl transition-colors text-sm"
        >
          ⚠️ ยกเลิกงาน (กลางคัน)
        </button>
      )}

      {/* ─── M9: Confirm dialog + reason ─── */}
      {showDialog && !cancelled && (
        <div className="bg-white border border-red-200 rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="text-2xl shrink-0">⚠️</span>
            <div>
              <p className="font-semibold text-gray-800">ยืนยันยกเลิกงานกลางคัน?</p>
              <p className="text-sm text-gray-500 mt-1">
                ช่างกำลังล้างเครื่องอยู่ การยกเลิกจะแจ้ง WeeeR และ WeeeT ทันที
              </p>
            </div>
          </div>

          {/* Settle preview */}
          <div className="bg-red-50 border border-red-100 rounded-xl p-3 space-y-1">
            <p className="text-xs font-semibold text-gray-500">ประมาณการ settle (ตาม offer lock)</p>
            <p className="text-xs text-gray-500">{JOB.offerLock.cancelMidPolicy}</p>
            <div className="flex justify-between text-sm pt-1">
              <span className="text-gray-600">คาดว่า WeeeR ได้รับ</span>
              <span className="font-bold text-red-600">{JOB.offerLock.estimatedSettle} พอยต์ทอง</span>
            </div>
          </div>

          {/* Reason textarea — บังคับ */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              เหตุผลยกเลิก <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
              placeholder="ระบุเหตุผลอย่างน้อย 10 ตัวอักษร เช่น ติดธุระฉุกเฉิน..."
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-red-400 resize-none"
            />
            <p className="text-xs text-gray-400">{reason.trim().length}/10 ตัวอักษรขั้นต่ำ</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors text-sm"
            >
              {submitting ? "กำลังส่ง..." : "ยืนยันยกเลิก"}
            </button>
            <button
              onClick={() => setShowDialog(false)}
              className="flex-1 border border-gray-200 text-gray-500 hover:bg-gray-50 font-medium py-3 rounded-xl transition-colors text-sm"
            >
              ย้อนกลับ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
