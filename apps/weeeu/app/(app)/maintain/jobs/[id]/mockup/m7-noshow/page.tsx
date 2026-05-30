"use client";
/**
 * MOCKUP — M7 (WeeeU view): No-show — ช่างถึงแล้วแต่ลูกค้าไม่อยู่
 * Blueprint WeeeU Maintain (369813ec-7277-813f-abdf-e1bb3faac08e)
 * ผังเคส M7: No-show → แจ้ง WeeeU → ปุ่ม นัดใหม่ / ยกเลิกงาน
 *
 * สิ่งที่เพิ่ม (delta):
 *  1. Status "no_show" + notification banner
 *  2. 2 ตัวเลือก: "นัดใหม่" / "ยกเลิกงาน"
 *  3. ถ้ายกเลิก: แจ้ง settle ค่าเสียเที่ยว (No-show policy ตาม offer lock)
 *
 * Maintain Gen 4 · 2026-05-24 · Mockup เคส M7 WeeeU
 */

import { useState } from "react";
import Link from "next/link";

const JOB = {
  id: "mock-m7-001",
  serviceCode: "MTN-20260519-0071",
  applianceType: "AC" as const,
  cleaningType: "sanitize" as const,
  status: "no_show" as const,
  scheduledAt: "2026-05-22T13:00:00+07:00",
  noShowReportedAt: "2026-05-22T13:18:00+07:00",
  address: { address: "45 ซ.ลาดพร้าว 71 ลาดพร้าว กรุงเทพ 10230" },
  offerLock: {
    shopName:       "ร้านเทพล้างแอร์",
    noShowFee:      300, // ค่าเสียเที่ยว ถ้าลูกค้าไม่อยู่ (ตาม offer)
    noShowPolicy:   "คิดค่าเสียเที่ยว 300 พอยต์ทอง ถ้าลูกค้าไม่อยู่เมื่อช่างถึงที่",
  },
};

function fmt(iso: string) {
  return new Date(iso).toLocaleString("th-TH", {
    day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function M7NoShowWeeeUMockupPage() {
  const [action, setAction] = useState<"idle" | "reschedule" | "cancel_confirm" | "done">("idle");

  return (
    <div className="max-w-xl space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/maintain/jobs" className="text-gray-500 hover:text-gray-800 text-xl">‹</Link>
        <h1 className="text-xl font-bold text-gray-900">รายละเอียดงานล้าง</h1>
        <span className="ml-auto text-[10px] font-mono text-gray-300 bg-gray-100 px-2 py-0.5 rounded">
          MOCKUP M7-WeeeU
        </span>
      </div>

      {/* ─── M7 Alert: No-show ─── */}
      {action !== "done" && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-start gap-3">
            <span className="text-2xl shrink-0">🚫</span>
            <div className="flex-1">
              <p className="font-semibold text-amber-800">
                ช่างรายงานว่าไม่พบลูกค้า
              </p>
              <p className="text-sm text-amber-700 mt-1">
                {JOB.offerLock.shopName} ถึงหน้างานแล้ว แต่ไม่พบลูกค้า/ไม่มีคนเปิดประตู
              </p>
              <p className="text-xs text-amber-500 mt-1">
                รายงาน: {fmt(JOB.noShowReportedAt)}
              </p>
            </div>
          </div>

          {/* No-show policy */}
          <div className="bg-white border border-amber-100 rounded-xl p-3 space-y-1">
            <p className="text-xs font-semibold text-gray-500">นโยบาย No-show (ตาม offer lock)</p>
            <p className="text-sm text-gray-700">{JOB.offerLock.noShowPolicy}</p>
            <div className="flex justify-between text-sm pt-1">
              <span className="text-gray-600">ค่าเสียเที่ยว</span>
              <span className="font-bold text-amber-700">{JOB.offerLock.noShowFee} พอยต์ทอง</span>
            </div>
          </div>

          {/* 2 ตัวเลือก */}
          {action === "idle" && (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setAction("reschedule")}
                className="bg-[#0DC36C] hover:bg-[#0A9B55] text-white font-semibold py-3 rounded-xl transition-colors text-sm"
              >
                📅 นัดใหม่
              </button>
              <button
                onClick={() => setAction("cancel_confirm")}
                className="border border-red-300 text-red-600 hover:bg-red-50 font-medium py-3 rounded-xl transition-colors text-sm"
              >
                ❌ ยกเลิกงาน
              </button>
            </div>
          )}

          {/* Reschedule state */}
          {action === "reschedule" && (
            <div className="bg-[#E1F7EC] rounded-xl p-3 space-y-2">
              <p className="text-sm font-semibold text-[#0A9B55]">📅 เลือกวันใหม่</p>
              <input
                type="datetime-local"
                className="w-full border border-[#0DC36C]/40 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#0DC36C]"
              />
              <p className="text-xs text-gray-500">
                * ค่าเสียเที่ยว {JOB.offerLock.noShowFee} พอยต์ทอง จะถูกหักจากงานนี้
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setAction("done")}
                  className="flex-1 bg-[#0DC36C] hover:bg-[#0A9B55] text-white font-semibold py-2.5 rounded-xl text-sm"
                >
                  ยืนยันนัดใหม่
                </button>
                <button
                  onClick={() => setAction("idle")}
                  className="flex-1 border border-gray-200 text-gray-500 py-2.5 rounded-xl text-sm"
                >
                  ย้อนกลับ
                </button>
              </div>
            </div>
          )}

          {/* Cancel confirm */}
          {action === "cancel_confirm" && (
            <div className="bg-white border border-red-200 rounded-xl p-4 space-y-3">
              <p className="text-sm font-semibold text-gray-800">ยืนยันยกเลิกงาน?</p>
              <p className="text-xs text-gray-500">
                ระบบจะหักค่าเสียเที่ยว {JOB.offerLock.noShowFee} พอยต์ทอง จากพอยต์ทองของคุณ
                (ตาม offer ที่ระบุไว้)
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setAction("done")}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
                >
                  ยืนยันยกเลิก
                </button>
                <button
                  onClick={() => setAction("idle")}
                  className="flex-1 border border-gray-200 text-gray-500 hover:bg-gray-50 py-2.5 rounded-xl text-sm transition-colors"
                >
                  ย้อนกลับ
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Done state */}
      {action === "done" && (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-center space-y-2">
          <p className="text-2xl">✅</p>
          <p className="font-semibold text-gray-700">ดำเนินการเรียบร้อย</p>
        </div>
      )}

      {/* Job info */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">ข้อมูลงาน</p>
        </div>
        <div className="p-5 space-y-3">
          <Row label="เครื่อง"    value="แอร์ 🌡️ — ล้าง+ฆ่าเชื้อ 🦠" />
          <Row label="รหัสงาน"   value={JOB.serviceCode} />
          <Row label="วันนัด"    value={fmt(JOB.scheduledAt)} />
          <Row label="ที่อยู่"    value={JOB.address.address} />
          <Row label="ร้านที่รับ" value={JOB.offerLock.shopName} />
        </div>
      </div>
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
