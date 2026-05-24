"use client";
/**
 * MOCKUP — M2: หมดอายุ / ไม่มีร้านยื่นข้อเสนอภายใน deadline
 * Blueprint WeeeU Maintain (369813ec-7277-813f-abdf-e1bb3faac08e)
 * ผังเคส M2: WeeeU ไม่รับข้อเสนอ / หมดอายุ → ปิดเปล่า
 *
 * สิ่งที่เพิ่ม (delta จาก jobs/[id]/page.tsx เดิม):
 *  1. สถานะ "expired" ใน STATUS_LABEL / STATUS_COLOR
 *  2. Banner แจ้งหมดอายุ + timestamp
 *  3. ปุ่ม "ลงประกาศใหม่" → redirect ไป maintain/book (pre-fill ข้อมูล)
 *
 * Maintain Gen 4 · 2026-05-24 · Mockup เคส M2
 */

import Link from "next/link";

/* ─── mock data ─── */
const JOB = {
  id: "mock-m2-001",
  serviceCode: "MTN-20260519-0042",
  applianceType: "AC" as const,
  cleaningType: "deep" as const,
  status: "expired" as const,
  scheduledAt: "2026-05-19T10:00:00+07:00",
  expiredAt:   "2026-05-18T23:59:00+07:00", // deadline หมดก่อนวันนัด
  address: { address: "123 ถ.รัตนาธิเบศร์ เมืองนนทบุรี 11000" },
  estimatedDuration: 2,
  totalPrice: 0,
};

/* ─── display maps ─── */
const STATUS_LABEL = {
  pending:     "รอช่าง",
  assigned:    "มอบหมายแล้ว",
  departed:    "ช่างออกเดินทาง",
  arrived:     "ช่างถึงแล้ว",
  in_progress: "กำลังล้าง",
  completed:   "เสร็จแล้ว",
  cancelled:   "ยกเลิก",
  expired:     "หมดอายุ",   // ← M2 เพิ่ม
} as const;

const STATUS_COLOR = {
  pending:     "bg-yellow-100 text-yellow-700",
  assigned:    "bg-blue-100 text-blue-700",
  departed:    "bg-amber-100 text-amber-700",
  arrived:     "bg-amber-100 text-amber-700",
  in_progress: "bg-[#E1F7EC] text-[#0A9B55]",
  completed:   "bg-green-100 text-green-700",
  cancelled:   "bg-gray-100 text-gray-500",
  expired:     "bg-gray-200 text-gray-600",  // ← M2 เพิ่ม — neutral grey
} as const;

const APPLIANCE_LABEL = { AC: "แอร์ 🌡️", WashingMachine: "เครื่องซักผ้า 🫧" };
const CLEANING_LABEL  = { general: "ล้างทั่วไป 🧼", deep: "ล้างลึก 🔬", sanitize: "ล้าง+ฆ่าเชื้อ 🦠" };

function fmt(iso: string) {
  return new Date(iso).toLocaleString("th-TH", {
    day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function M2ExpiredMockupPage() {
  return (
    <div className="max-w-xl space-y-5">
      {/* ─── Header ─── */}
      <div className="flex items-center gap-3">
        <Link href="/maintain/jobs" className="text-gray-500 hover:text-gray-800 text-xl">‹</Link>
        <h1 className="text-xl font-bold text-gray-900">รายละเอียดงานล้าง</h1>
        <span className="ml-auto text-[10px] font-mono text-gray-300 bg-gray-100 px-2 py-0.5 rounded">
          MOCKUP M2
        </span>
      </div>

      {/* ─── M2: Banner หมดอายุ ─── */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3">
        <div className="flex items-start gap-3">
          <span className="text-2xl">⏰</span>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-800">ไม่มีร้านยื่นข้อเสนอ — ประกาศปิดอัตโนมัติ</p>
            <p className="text-sm text-gray-500 mt-1">
              ไม่มีร้านรับงานภายใน deadline ระบบปิดประกาศให้อัตโนมัติ
            </p>
            <p className="text-xs text-gray-400 mt-1">
              หมดอายุ: {fmt(JOB.expiredAt)}
            </p>
          </div>
        </div>

        {/* ปุ่ม "ลงประกาศใหม่" — M2 action หลัก */}
        <Link
          href={`/maintain/book?rebook=${JOB.id}`}
          className="block w-full text-center bg-[#0DC36C] hover:bg-[#0A9B55] text-white font-semibold py-3 rounded-xl transition-colors text-sm"
        >
          🔄 ลงประกาศใหม่
        </Link>
        <p className="text-xs text-gray-400 text-center">
          ระบบจะนำข้อมูลเดิมมากรอกให้ — แก้ไขวันเวลาได้
        </p>
      </div>

      {/* ─── Status card ─── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-bold text-gray-900">{APPLIANCE_LABEL[JOB.applianceType]}</p>
            <p className="text-sm text-gray-500 mt-0.5">{CLEANING_LABEL[JOB.cleaningType]}</p>
            <p className="text-xs font-mono text-gray-400 mt-1">{JOB.serviceCode}</p>
          </div>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${STATUS_COLOR[JOB.status]}`}>
            {STATUS_LABEL[JOB.status]}
          </span>
        </div>
      </div>

      {/* ─── Job info ─── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">ข้อมูลงาน (อ้างอิง)</p>
        </div>
        <div className="p-5 space-y-3">
          <Row label="วันนัด (เดิม)" value={fmt(JOB.scheduledAt)} />
          <Row label="ที่อยู่"        value={JOB.address.address} />
          <Row label="ระยะเวลา"      value={`${JOB.estimatedDuration} ชั่วโมง`} />
        </div>
      </div>

      {/* ─── Secondary action ─── */}
      <button
        className="w-full border border-gray-200 text-gray-500 hover:bg-gray-50 font-medium py-3 rounded-2xl transition-colors text-sm"
      >
        ← ดูรายการงานทั้งหมด
      </button>
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
