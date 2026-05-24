"use client";

/**
 * WeeeT — รายการงานรับซากที่ assign ให้
 * S9: แสดง status no_show ใน job list
 * เชื่อมไปหน้า [id] เพื่อ verify + S8/S9 actions
 */

import { useState } from "react";
import Link from "next/link";

// ── Mock types ────────────────────────────────────────────────────────────────
type ScrapPickupStatus =
  | "assigned"          // รับงานใหม่
  | "traveling"         // กำลังเดินทาง
  | "arrived"           // ถึงแล้ว รอ verify
  | "verifying"         // กำลังตรวจซาก (S8 trigger point)
  | "mismatch_reported" // S8: รายงานไม่ตรง รอ WeeeU
  | "pickup_confirmed"  // รับซากเรียบร้อย
  | "no_show"           // S9: WeeeU ไม่อยู่/ไม่พบ
  | "completed"
  | "cancelled";

interface ScrapPickupJob {
  id: string;
  scrapItemId: string;
  scrapDescription: string;
  weeeUAddress: string;
  weeeUName: string;
  weeeUPhone: string;
  scheduledDate: string;
  offeredPrice: number;
  grade: string;
  status: ScrapPickupStatus;
  weeerName: string;    // ร้านที่ assign งาน
  sourceRepairJobId?: string;  // S12
}

// ── Mock data ─────────────────────────────────────────────────────────────────
const MOCK_JOBS: ScrapPickupJob[] = [
  {
    id: "SPJ-001",
    scrapItemId: "SCR-002",
    scrapDescription: "แอร์ Mitsubishi 12000 BTU ซ่อมไม่คุ้ม",
    weeeUAddress: "123/4 ถ.สุขุมวิท แขวงคลองตัน กรุงเทพ",
    weeeUName: "สมชาย ใจดี",
    weeeUPhone: "081-234-5678",
    scheduledDate: "2026-05-26 10:00",
    offeredPrice: 380,
    grade: "grade_C",
    status: "arrived",   // ช่างถึงแล้ว รอ verify (demo S8/S9)
    weeerName: "ร้านซากดี จำกัด",
    sourceRepairJobId: "REP-0042",
  },
  {
    id: "SPJ-002",
    scrapItemId: "SCR-005",
    scrapDescription: "ตู้เย็น LG 2 ประตู มอเตอร์พัง",
    weeeUAddress: "88 ถ.พระราม 9 กรุงเทพ",
    weeeUName: "มาลี สวัสดี",
    weeeUPhone: "092-567-8901",
    scheduledDate: "2026-05-27 14:00",
    offeredPrice: 200,
    grade: "grade_B",
    status: "assigned",
    weeerName: "รับซากทั่วไทย",
  },
  {
    id: "SPJ-003",
    scrapItemId: "SCR-006",
    scrapDescription: "เครื่องซักผ้า Samsung ฝาบน พัง",
    weeeUAddress: "55 ถ.รัชดาภิเษก กรุงเทพ",
    weeeUName: "วิชัย บุญดี",
    weeeUPhone: "085-999-0001",
    scheduledDate: "2026-05-24 09:00",
    offeredPrice: 150,
    grade: "grade_C",
    status: "no_show",  // S9 demo
    weeerName: "ร้านซากดี จำกัด",
  },
];

const STATUS_META: Record<ScrapPickupStatus, { label: string; color: string; emoji: string }> = {
  assigned:          { label: "รับงานใหม่",      color: "bg-blue-100 text-blue-700",   emoji: "📋" },
  traveling:         { label: "กำลังเดินทาง",   color: "bg-indigo-100 text-indigo-700", emoji: "🚗" },
  arrived:           { label: "ถึงแล้ว",         color: "bg-teal-100 text-teal-700",   emoji: "📍" },
  verifying:         { label: "กำลังตรวจซาก",   color: "bg-yellow-100 text-yellow-700", emoji: "🔍" },
  mismatch_reported: { label: "รายงานไม่ตรง",   color: "bg-orange-100 text-orange-700", emoji: "⚠️" },
  pickup_confirmed:  { label: "รับซากแล้ว",     color: "bg-green-100 text-green-700",  emoji: "✅" },
  no_show:           { label: "ไม่พบลูกค้า",    color: "bg-red-100 text-red-600",      emoji: "🚫" },
  completed:         { label: "เสร็จสิ้น",       color: "bg-gray-100 text-gray-600",    emoji: "🏁" },
  cancelled:         { label: "ยกเลิก",          color: "bg-gray-100 text-gray-500",    emoji: "❌" },
};

const GRADE_COLOR: Record<string, string> = {
  grade_A: "bg-green-100 text-green-700",
  grade_B: "bg-yellow-100 text-yellow-700",
  grade_C: "bg-red-100 text-red-500",
};

export default function WeeeTScrapJobsPage() {
  const [filterStatus, setFilterStatus] = useState<ScrapPickupStatus | "">("");

  const filtered = filterStatus
    ? MOCK_JOBS.filter(j => j.status === filterStatus)
    : MOCK_JOBS;

  const noShowCount   = MOCK_JOBS.filter(j => j.status === "no_show").length;
  const activeCount   = MOCK_JOBS.filter(j =>
    ["assigned", "traveling", "arrived", "verifying"].includes(j.status)
  ).length;

  return (
    <div className="space-y-5 max-w-xl">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">♻️ งานรับซาก</h1>
        <p className="text-xs text-gray-400 mt-1">งานที่ร้านมอบหมายให้รับซากจากลูกค้า</p>
      </div>

      {/* Summary */}
      <div className="flex gap-3 flex-wrap">
        {activeCount > 0 && (
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 text-sm">
            <span className="text-blue-600 font-bold">{activeCount}</span>
            <span className="text-blue-700">งานที่กำลังดำเนินอยู่</span>
          </div>
        )}
        {/* S9 — no-show alert */}
        {noShowCount > 0 && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-sm">
            <span className="text-red-500">🚫</span>
            <span className="text-red-700">{noShowCount} งาน ไม่พบลูกค้า (No-show)</span>
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 w-fit flex-wrap">
        {(["", "assigned", "arrived", "no_show", "completed"] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
              filterStatus === s
                ? s === "no_show"
                  ? "bg-red-100 text-red-700"
                  : "bg-[#1696F9] text-white"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            {s === "" ? "ทั้งหมด"
             : s === "assigned" ? "รับงานใหม่"
             : s === "arrived"  ? "ถึงแล้ว"
             : s === "no_show"  ? "🚫 No-show"
             : "เสร็จสิ้น"}
          </button>
        ))}
      </div>

      {/* Job cards */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">ยังไม่มีงานในหมวดนี้</div>
        )}
        {filtered.map(job => {
          const sm = STATUS_META[job.status];
          return (
            <Link
              key={job.id}
              href={`/scrap/${job.id}`}
              className={`block bg-white rounded-2xl border shadow-sm p-4 space-y-3 transition-colors hover:border-blue-200 ${
                job.status === "no_show" ? "border-red-200 bg-red-50/30" : "border-gray-100"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {job.scrapDescription}
                    </p>
                    {/* S12 badge */}
                    {job.sourceRepairJobId && (
                      <span className="text-xs bg-orange-50 text-orange-600 border border-orange-200 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                        🔧 Repair
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                    <span className={`px-1.5 py-0.5 rounded-full ${GRADE_COLOR[job.grade]}`}>
                      {job.grade.replace("grade_", "")}
                    </span>
                    <span>#{job.id}</span>
                    <span>·</span>
                    <span>{job.weeerName}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className={`text-xs px-2 py-1 rounded-full ${sm.color}`}>
                    {sm.emoji} {sm.label}
                  </span>
                  {job.offeredPrice > 0 && (
                    <p className="text-xs font-mono text-green-600 mt-1">{job.offeredPrice} Gold</p>
                  )}
                </div>
              </div>

              <div className="text-xs text-gray-500 space-y-1">
                <p>📍 {job.weeeUAddress}</p>
                <p>📅 นัดรับ: {job.scheduledDate}</p>
              </div>

              {/* S9 — no-show quick action hint */}
              {job.status === "no_show" && (
                <div className="bg-red-100 rounded-xl px-3 py-2 text-xs text-red-700">
                  🚫 บันทึก no-show แล้ว — รอลูกค้าตอบกลับ (นัดใหม่/ยกเลิก)
                </div>
              )}

              {/* Arrived — action needed */}
              {job.status === "arrived" && (
                <div className="bg-teal-50 rounded-xl px-3 py-2 text-xs text-teal-700">
                  📍 ถึงสถานที่แล้ว → กดเพื่อเริ่มตรวจซาก
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
