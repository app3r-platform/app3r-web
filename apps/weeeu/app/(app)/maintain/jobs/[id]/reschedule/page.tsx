"use client";

/**
 * เลื่อนนัดบำรุงรักษา (M3 เลื่อนนัด) — U-13 · /maintain/jobs/[id]/reschedule
 *
 * Disposition Matrix M3: เลื่อนนัด → หน้า success
 *   เลือกวัน-เวลาใหม่ + เหตุผล → ยืนยัน → success (ส่งให้ WeeeR ยืนยันอีกครั้ง)
 *
 * mockup — persist/แจ้ง WeeeR จริง = BE จังหวะ2
 */

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

const MOCK = {
  serviceCode: "MTN-20260604-0091",
  applianceLabel: "แอร์ 🌡️ — ล้างลึก",
  shopName: "ช่างเย็น Pro สาขาพระราม 9",
  currentSchedule: "2026-06-08T10:00:00+07:00",
};

const RESCHEDULE_REASONS = [
  "ติดธุระไม่อยู่บ้านตามเวลานัด",
  "ขอเลื่อนเป็นวันหยุด",
  "ช่างขอเลื่อน — ตกลงเวลาใหม่",
  "อื่นๆ",
];

function fmt(iso: string) {
  return new Date(iso).toLocaleString("th-TH", {
    day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default function MaintainReschedulePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [newDate, setNewDate] = useState("");
  const [newDate2, setNewDate2] = useState("");
  const [reason, setReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);

  const handleConfirm = () => {
    if (!newDate) { setError("กรุณาเลือกวันเวลาใหม่ที่ต้องการ"); return; }
    const reasonVal = reason === "อื่นๆ" ? customReason.trim() : reason;
    if (!reasonVal) { setError("กรุณาเลือก/ระบุเหตุผลในการเลื่อนนัด"); return; }
    setError("");
    setSubmitting(true);
    setTimeout(() => { setSubmitting(false); setDone(true); }, 800);
  };

  // ─── Success ───────────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="max-w-xl mx-auto px-4 py-6 space-y-5">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center space-y-4">
          <p className="text-5xl">📅</p>
          <div>
            <h2 className="text-xl font-bold text-gray-900">ส่งคำขอเลื่อนนัดแล้ว</h2>
            <p className="text-sm text-gray-500 mt-2">
              วันเวลาที่ขอใหม่: <span className="font-semibold text-weeeu-dark">{fmt(newDate)}</span>
              <br />รอ {MOCK.shopName} ยืนยันเวลาใหม่อีกครั้ง
            </p>
          </div>
          <button
            onClick={() => router.push(`/maintain/jobs/${id}`)}
            className="w-full bg-weeeu-primary hover:bg-weeeu-dark text-white font-semibold py-3 rounded-2xl text-sm transition-colors"
          >
            กลับรายละเอียดงาน →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center gap-3">
        <Link href={`/maintain/jobs/${id}`} className="text-gray-500 hover:text-gray-800 text-xl">‹</Link>
        <h1 className="text-xl font-bold text-gray-900">เลื่อนนัดบำรุงรักษา</h1>
      </div>

      {/* Job + current schedule */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-1">
        <p className="font-semibold text-gray-900">{MOCK.applianceLabel}</p>
        <p className="text-sm text-gray-500">{MOCK.shopName}</p>
        <p className="text-xs font-mono text-gray-400">{MOCK.serviceCode}</p>
        <p className="text-xs text-gray-500 mt-1">นัดเดิม: <span className="font-medium text-gray-700">{fmt(MOCK.currentSchedule)}</span></p>
      </div>

      {/* New schedule */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">วันเวลาใหม่ ช่วงที่ 1 <span className="text-red-500">*</span></label>
          <input
            type="datetime-local"
            value={newDate}
            min={minDate.toISOString().slice(0, 16)}
            onChange={e => { setNewDate(e.target.value); setError(""); }}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-weeeu-primary/40"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            วันเวลาใหม่ ช่วงที่ 2 <span className="text-gray-400 text-xs font-normal">(สำรอง — ถ้าช่วงแรกช่างไม่ว่าง)</span>
          </label>
          <input
            type="datetime-local"
            value={newDate2}
            min={minDate.toISOString().slice(0, 16)}
            onChange={e => setNewDate2(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-weeeu-primary/40"
          />
        </div>
      </div>

      {/* Reason */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">เหตุผลในการเลื่อนนัด <span className="text-red-500">*</span></p>
        <div className="space-y-1.5">
          {RESCHEDULE_REASONS.map(r => (
            <button
              key={r}
              type="button"
              onClick={() => { setReason(r); setError(""); }}
              className={`w-full text-left px-3 py-2.5 rounded-xl border text-sm transition-colors ${
                reason === r ? "bg-weeeu-surface border-weeeu-primary text-weeeu-text font-medium" : "border-gray-200 text-gray-600 hover:border-weeeu-primary/40"
              }`}
            >
              {reason === r && <span className="mr-2">✅</span>}{r}
            </button>
          ))}
        </div>
        {reason === "อื่นๆ" && (
          <textarea
            value={customReason}
            onChange={e => setCustomReason(e.target.value)}
            placeholder="ระบุเหตุผล..."
            rows={2}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-weeeu-primary/40 resize-none"
          />
        )}
      </div>

      <p className="text-xs text-gray-400 px-1">
        ℹ️ การเลื่อนนัดต้องรอ WeeeR ยืนยันเวลาใหม่ — เลื่อนได้ก่อนถึงวันนัดเท่านั้น
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <button
        onClick={handleConfirm}
        disabled={submitting}
        className="w-full bg-weeeu-primary hover:bg-weeeu-dark disabled:opacity-50 text-white font-semibold py-3.5 rounded-2xl text-sm transition-colors flex items-center justify-center gap-2"
      >
        {submitting ? <><span className="animate-spin">⟳</span> กำลังส่งคำขอ...</> : "📅 ขอเลื่อนนัด"}
      </button>
    </div>
  );
}
