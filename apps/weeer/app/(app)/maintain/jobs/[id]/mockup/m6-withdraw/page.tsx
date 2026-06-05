"use client";
/**
 * MOCKUP — M6 (WeeeR view): ถอนรับงานหลังยืนยัน
 * Blueprint WeeeU Maintain (369813ec-7277-813f-abdf-e1bb3faac08e)
 * ผังเคส M6: WeeeR กดถอนงาน → modal เหตุผล + ยืนยัน → แจ้ง WeeeU + settle
 *
 * สิ่งที่เพิ่ม (delta จาก jobs/[id]/page.tsx เดิม):
 *  1. ปุ่ม "ถอนรับงาน" ปรากฏเมื่อ status === "assigned" (หลังยืนยันรับแล้ว)
 *  2. Withdraw modal: แสดงผลกระทบ (WeeeR ผิดสัญญา → ไม่ได้ค่าเดินทาง + penalty policy)
 *  3. Reason textarea บังคับ (≥ 10 ตัวอักษร) ก่อน submit
 *  4. หลัง confirm → สถานะเปลี่ยนเป็น "withdrawn" + แจ้งคืนพอยต์ทองที่ล็อกให้ WeeeU
 *
 *
 * mock-anno §5: มาจาก R-14 MAINTAIN-JOB-DETAIL (status = "assigned") — WeeeR กด "ถอนรับงาน"
 * mock-anno §6: success → R-12 MAINTAIN-JOBS (/maintain/jobs)
 * mock-anno §8: WeeeU (U-16/m6-weeer-withdrew): ได้รับ notification → เห็น banner M6
 *               WeeeU ตัดสิน: หาร้านใหม่ → queue เปิดใหม่ / ยกเลิก → U-15 cancel
 *               Admin (A-07): เห็น audit log WeeeR withdraw + penalty
 *
 * Maintain Gen 4 · 2026-05-24 · Mockup เคส M6 WeeeR
 */

import { useState } from "react";
import Link from "next/link";

const JOB = {
  id: "mock-m6-weeer-001",
  serviceCode: "MTN-20260519-0055",
  applianceType: "WashingMachine" as const,
  cleaningType: "general" as const,
  status: "assigned" as const,
  scheduledAt: "2026-05-22T09:00:00+07:00",
  address: { address: "88/2 ถ.ศรีนครินทร์ สาทร กรุงเทพ 10120" },
  customerName: "คุณสมหมาย ใจดี",
  offerLock: {
    depositAmount: 200,   // พอยต์ทองที่ล็อก (รับแล้ว)
    travelFee:     50,    // ค่าเดินทาง (จะไม่ได้รับ ถ้าถอน)
    penalty:       100,   // ค่าปรับ ถ้าถอนเกิน 2 ชม. ก่อนงาน
  },
};

const APPLIANCE_LABEL = { AC: "แอร์ 🌡️", WashingMachine: "เครื่องซักผ้า 🫧" };
const CLEANING_LABEL  = { general: "ล้างทั่วไป 🧼", deep: "ล้างลึก 🔬", sanitize: "ล้าง+ฆ่าเชื้อ 🦠" };

function fmt(iso: string) {
  return new Date(iso).toLocaleString("th-TH", {
    day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function M6WithdrawWeeeRMockupPage() {
  const [showModal, setShowModal]   = useState(false);
  const [reason, setReason]         = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [withdrawn, setWithdrawn]   = useState(false);

  const canSubmit = reason.trim().length >= 10 && !submitting;

  const handleWithdraw = () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setTimeout(() => {
      setWithdrawn(true);
      setShowModal(false);
      setSubmitting(false);
    }, 800);
  };

  return (
    <div className="space-y-5 max-w-xl pb-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/maintain/jobs" className="text-gray-400 hover:text-gray-600">←</Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900 truncate">
              {APPLIANCE_LABEL[JOB.applianceType]}
            </h1>
            <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${
              withdrawn
                ? "bg-gray-100 text-gray-500"
                : "bg-blue-50 text-blue-700"
            }`}>
              {withdrawn ? "ถอนรับงานแล้ว" : "มอบหมายแล้ว"}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{JOB.serviceCode}</p>
        </div>
        <span className="text-[10px] font-mono text-gray-300 bg-gray-100 px-2 py-0.5 rounded shrink-0">
          MOCKUP M6-WeeeR
        </span>
      </div>

      {/* ─── Withdrawn confirmation ─── */}
      {withdrawn && (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="font-semibold text-gray-700">ถอนรับงานเรียบร้อย</p>
              <p className="text-sm text-gray-500">
                แจ้ง WeeeU แล้ว · พอยต์ทองที่ล็อก (ระบบพักเงินกลาง / Escrow) {JOB.offerLock.depositAmount} Point จะคืนลูกค้าภายใน 1-3 วัน
              </p>
              <p className="text-xs text-[#FF663A] mt-1">
                ⚠️ ค่าเดินทาง {JOB.offerLock.travelFee} Point — ไม่ได้รับ (WeeeR เป็นผู้ถอน)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─── Job info card ─── */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">รายละเอียดงาน</p>
        <div className="space-y-2.5">
          <Row label="ประเภทล้าง"  value={CLEANING_LABEL[JOB.cleaningType]} />
          <Row label="ลูกค้า"       value={JOB.customerName} />
          <Row label="วันนัด"       value={fmt(JOB.scheduledAt)} />
          <Row label="สถานที่"      value={JOB.address.address} />
        </div>
      </div>

      {/* ─── Offer lock summary ─── */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">ข้อเสนอที่ lock ไว้</p>
        <div className="space-y-2.5">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">พอยต์ทองที่ล็อก (รับไว้)</span>
            <span className="font-semibold text-gray-800">{JOB.offerLock.depositAmount} Point</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">ค่าเดินทาง</span>
            <span className="font-semibold text-gray-800">{JOB.offerLock.travelFee} Point</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">ค่าปรับ (ถอนล่วงหน้า &lt;2 ชม.)</span>
            <span className="font-semibold text-[#FF663A]">{JOB.offerLock.penalty} Point</span>
          </div>
        </div>
      </div>

      {/* ─── M6: ปุ่มถอนรับงาน ─── */}
      {!withdrawn && !showModal && (
        <button
          onClick={() => setShowModal(true)}
          className="w-full border border-[#FF663A]/50 text-[#FF663A] hover:bg-[#FF663A]/5 font-medium py-3 rounded-2xl transition-colors text-sm"
        >
          ⚠️ ถอนรับงาน
        </button>
      )}

      {/* ─── M6: Withdraw modal ─── */}
      {showModal && !withdrawn && (
        <div className="bg-white border border-[#FF663A]/30 rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="text-2xl shrink-0">⚠️</span>
            <div>
              <p className="font-semibold text-gray-800">ยืนยันถอนรับงาน?</p>
              <p className="text-sm text-gray-500 mt-1">
                การถอนหลังยืนยัน: WeeeR เป็นผู้ผิดนัด — ไม่ได้ค่าเดินทาง และ WeeeU จะได้คืนพอยต์ทองที่ล็อกเต็มจำนวน
              </p>
            </div>
          </div>

          {/* Policy warning */}
          <div className="bg-[#FF663A]/8 border border-[#FF663A]/20 rounded-xl p-3 space-y-1.5">
            <p className="text-xs font-semibold text-gray-600">ผลกระทบ (Policy ถอนหลังยืนยัน)</p>
            <div className="space-y-1 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>พอยต์ทองที่ล็อก — คืนให้ WeeeU</span>
                <span className="font-medium text-[#FF663A]">−{JOB.offerLock.depositAmount} Point</span>
              </div>
              <div className="flex justify-between">
                <span>ค่าเดินทาง — ไม่ได้รับ</span>
                <span className="font-medium text-[#FF663A]">−{JOB.offerLock.travelFee} Point</span>
              </div>
              <div className="flex justify-between">
                <span>ค่าปรับ (ถ้าแจ้งล่าช้า)</span>
                <span className="font-medium text-[#FF663A]">−{JOB.offerLock.penalty} Point</span>
              </div>
            </div>
          </div>

          {/* Reason textarea — บังคับ */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              เหตุผลที่ถอน <span className="text-[#FF663A]">*</span>
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
              placeholder="ระบุเหตุผลอย่างน้อย 10 ตัวอักษร เช่น ช่างติดอุบัติเหตุ..."
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#FF663A]/60 resize-none"
            />
            <p className="text-xs text-gray-400">{reason.trim().length}/10 ตัวอักษรขั้นต่ำ</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleWithdraw}
              disabled={!canSubmit}
              className="flex-1 bg-[#FF663A] hover:bg-[#e5522a] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors text-sm"
            >
              {submitting ? "กำลังส่ง..." : "ยืนยันถอนรับงาน"}
            </button>
            <button
              onClick={() => { setShowModal(false); setReason(""); }}
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <p className="text-sm text-gray-500 shrink-0">{label}</p>
      <p className="text-sm font-medium text-gray-800 text-right">{value}</p>
    </div>
  );
}
