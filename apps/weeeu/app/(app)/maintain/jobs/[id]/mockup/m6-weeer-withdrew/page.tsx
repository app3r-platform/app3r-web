"use client";
/**
 * MOCKUP — M6 (WeeeU view): WeeeR ถอนหลังยืนยัน
 * Blueprint WeeeU Maintain (369813ec-7277-813f-abdf-e1bb3faac08e)
 * ผังเคส M6: WeeeR ถอนงาน → WeeeU ต้องตัดสิน: หาร้านใหม่ / ยกเลิก
 *
 * สิ่งที่เพิ่ม (delta):
 *  1. Alert banner "WeeeR แจ้งถอนรับงาน" + เหตุผลที่ร้านระบุ
 *  2. 2 ตัวเลือก: "หา WeeeR ใหม่" (reroute) / "ยกเลิกงาน"
 *  3. ถ้ายกเลิก: แสดง settle ตาม offer lock (มัดจำ/ค่าเดินทางที่ WeeeR เคยระบุ)
 *
 * Maintain Gen 4 · 2026-05-24 · Mockup เคส M6 WeeeU
 */

import { useState } from "react";
import Link from "next/link";

const JOB = {
  id: "mock-m6-001",
  serviceCode: "MTN-20260519-0055",
  applianceType: "WashingMachine" as const,
  cleaningType: "general" as const,
  status: "assigned" as const,
  scheduledAt: "2026-05-22T09:00:00+07:00",
  address: { address: "88/2 ถ.ศรีนครินทร์ สาทร กรุงเทพ 10120" },
  technicianId: null,
  /* offer lock — WeeeR ระบุไว้ใน offer */
  offerLock: {
    shopName:      "ร้านเย็นสบาย แอร์เซอร์วิส",
    depositAmount: 200,
    travelFee:     50,
    withdrawReason: "ช่างติดนัดฉุกเฉิน ไม่สามารถรับงานได้ตามกำหนด",
    withdrawAt:    "2026-05-21T14:30:00+07:00",
  },
};

function fmt(iso: string) {
  return new Date(iso).toLocaleString("th-TH", {
    day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function M6WeeeRWithdrewMockupPage() {
  const [action, setAction] = useState<"idle" | "cancel_confirm" | "cancelled" | "rerouting">("idle");

  return (
    <div className="max-w-xl space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/maintain/jobs" className="text-gray-500 hover:text-gray-800 text-xl">‹</Link>
        <h1 className="text-xl font-bold text-gray-900">รายละเอียดงานล้าง</h1>
        <span className="ml-auto text-[10px] font-mono text-gray-300 bg-gray-100 px-2 py-0.5 rounded">
          MOCKUP M6-WeeeU
        </span>
      </div>

      {/* ─── M6 Alert: WeeeR ถอนงาน ─── */}
      {action !== "cancelled" && action !== "rerouting" && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-start gap-3">
            <span className="text-2xl shrink-0">🚨</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-red-800">
                {JOB.offerLock.shopName} แจ้งถอนรับงาน
              </p>
              <p className="text-sm text-red-600 mt-1">
                เหตุผล: "{JOB.offerLock.withdrawReason}"
              </p>
              <p className="text-xs text-red-400 mt-1">
                แจ้งเมื่อ {fmt(JOB.offerLock.withdrawAt)}
              </p>
            </div>
          </div>

          {/* Offer lock summary (สิ่งที่ WeeeR ระบุไว้ — กำหนดค่า settle ถ้ายกเลิก) */}
          {(JOB.offerLock.depositAmount > 0 || JOB.offerLock.travelFee > 0) && (
            <div className="bg-white border border-red-100 rounded-xl p-3 space-y-1">
              <p className="text-xs font-semibold text-gray-500">ข้อเสนอที่ lock ไว้ (อ้างอิง settle)</p>
              {JOB.offerLock.depositAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">มัดจำ (WeeeR รับไว้)</span>
                  <span className="font-medium text-gray-800">{JOB.offerLock.depositAmount} Point</span>
                </div>
              )}
              {JOB.offerLock.travelFee > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">ค่าเดินทาง</span>
                  <span className="font-medium text-gray-800">{JOB.offerLock.travelFee} Point</span>
                </div>
              )}
              <p className="text-xs text-gray-400 pt-1">
                * WeeeR ถอนเป็นผู้ผิด → คืนมัดจำ + WeeeR ไม่ได้ค่าเดินทาง (policy นโยบาย)
              </p>
            </div>
          )}

          {/* 2 ตัวเลือก */}
          {action === "idle" && (
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                onClick={() => setAction("rerouting")}
                className="bg-[#0DC36C] hover:bg-[#0A9B55] text-white font-semibold py-3 rounded-xl transition-colors text-sm"
              >
                🔍 หา WeeeR ใหม่
              </button>
              <button
                onClick={() => setAction("cancel_confirm")}
                className="border border-red-300 text-red-600 hover:bg-red-50 font-medium py-3 rounded-xl transition-colors text-sm"
              >
                ❌ ยกเลิกงาน
              </button>
            </div>
          )}

          {/* Confirm cancel dialog */}
          {action === "cancel_confirm" && (
            <div className="bg-white border border-red-200 rounded-xl p-4 space-y-3">
              <p className="text-sm font-semibold text-gray-800">ยืนยันยกเลิกงาน?</p>
              <p className="text-xs text-gray-500">
                ระบบจะ settle มัดจำ {JOB.offerLock.depositAmount} Point คืนให้คุณ
                เนื่องจาก WeeeR เป็นผู้ถอน
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setAction("cancelled")}
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

      {/* ─── Rerouting state ─── */}
      {action === "rerouting" && (
        <div className="bg-[#E1F7EC] border border-[#0DC36C]/30 rounded-2xl p-4 text-center space-y-2">
          <p className="text-2xl">🔍</p>
          <p className="font-semibold text-[#0A9B55]">กำลังหา WeeeR ใหม่...</p>
          <p className="text-sm text-[#0A9B55]/70">ระบบจะแจ้งเตือนเมื่อมีร้านยื่นข้อเสนอ</p>
          <p className="text-xs text-gray-500">สถานะ: กลับไปรอข้อเสนอ (awaiting_offer)</p>
        </div>
      )}

      {/* ─── Cancelled confirmation ─── */}
      {action === "cancelled" && (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-center space-y-2">
          <p className="text-2xl">✅</p>
          <p className="font-semibold text-gray-700">ยกเลิกงานเรียบร้อย</p>
          <p className="text-sm text-gray-500">มัดจำ {JOB.offerLock.depositAmount} Point จะคืนภายใน 1-3 วันทำการ</p>
        </div>
      )}

      {/* ─── Job info ─── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">ข้อมูลงาน</p>
        </div>
        <div className="p-5 space-y-3">
          <Row label="เครื่อง"   value="เครื่องซักผ้า 🫧 — ล้างทั่วไป 🧼" />
          <Row label="รหัสงาน"  value={JOB.serviceCode} />
          <Row label="วันนัด"   value={fmt(JOB.scheduledAt)} />
          <Row label="ที่อยู่"   value={JOB.address.address} />
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
