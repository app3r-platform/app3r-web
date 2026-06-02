"use client";
/**
 * WeeeU — Maintain Job: WeeeR ถอนหลังยืนยัน
 * Route: /maintain/jobs/[id]/withdraw
 *
 * แสดงเมื่อ WeeeR ถอนรับงาน — WeeeU ตัดสินใจ:
 *   1. 🔍 หา WeeeR ใหม่ (reroute → awaiting_offer)
 *   2. ❌ ยกเลิกงาน (settle ตาม offer lock)
 *
 * Data: GET /api/v1/services/:id → MOCK_JOB fallback ถ้า API ไม่ตอบ
 * Source: copy + adapt จาก mockup/m6-weeer-withdrew/page.tsx
 *
 * Maintain Gen 4 · 2026-05-26
 */

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";
import type { MaintainJob } from "@/lib/types";

// ── Labels ─────────────────────────────────────────────────────────────────────
const APPLIANCE_LABEL: Record<MaintainJob["applianceType"], string> = {
  AC:             "แอร์ 🌡️",
  WashingMachine: "เครื่องซักผ้า 🫧",
};

const CLEANING_LABEL: Record<MaintainJob["cleaningType"], string> = {
  general:  "ล้างทั่วไป 🧼",
  deep:     "ล้างลึก 🔬",
  sanitize: "ล้าง+ฆ่าเชื้อ 🦠",
};

// ── Withdraw notification (รอ API จริง — ยังไม่มีใน types.ts) ─────────────────
interface WithdrawNotification {
  shopName:       string;
  depositAmount:  number;
  travelFee:      number;
  withdrawReason: string;
  withdrawAt:     string;
}

interface MaintainJobWithdraw extends MaintainJob {
  withdrawNotification?: WithdrawNotification;
}

// ── MOCK fallback — M6: WeeeR ถอนงานหลังยืนยัน (ลบก่อน prod) ─────────────────
const MOCK_JOB: MaintainJobWithdraw = {
  id:                "mock-m6-001",
  serviceCode:       "MTN-20260519-0055",
  customerId:        "mock-user",
  applianceType:     "WashingMachine",
  cleaningType:      "general",
  status:            "weeer_withdrawn",
  serviceMethod:     "on_site",
  scheduledAt:       "2026-05-22T09:00:00+07:00",
  estimatedDuration: 2,
  address:           { lat: 13.7563, lng: 100.5018, address: "88/2 ถ.ศรีนครินทร์ สาทร กรุงเทพ 10120" },
  totalPrice:        450,
  createdAt:         "2026-05-19T10:00:00+07:00",
  updatedAt:         "2026-05-21T14:30:00+07:00",
  withdrawNotification: {
    shopName:       "ร้านเย็นสบาย แอร์เซอร์วิส",
    depositAmount:  200,
    travelFee:      50,
    withdrawReason: "ช่างติดนัดฉุกเฉิน ไม่สามารถรับงานได้ตามกำหนด",
    withdrawAt:     "2026-05-21T14:30:00+07:00",
  },
};

function fmt(iso: string) {
  return new Date(iso).toLocaleString("th-TH", {
    day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function MaintainWithdrawPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [job,     setJob]     = useState<MaintainJobWithdraw | null>(null);
  const [loading, setLoading] = useState(true);
  const [action,  setAction]  = useState<"idle" | "cancel_confirm" | "cancelled" | "rerouting">("idle");

  useEffect(() => {
    apiFetch(`/api/v1/services/${id}`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => setJob(d ?? MOCK_JOB))
      .catch(() => setJob(MOCK_JOB))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="flex items-center justify-center h-48 text-gray-400">กำลังโหลด…</div>;
  }
  if (!job) return null;

  // withdrawNotification: ใช้จาก API ถ้ามี, fallback เป็น mock
  const notify = job.withdrawNotification ?? MOCK_JOB.withdrawNotification!;

  return (
    <div className="max-w-xl space-y-5">

      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <Link href="/maintain/jobs" className="text-gray-500 hover:text-gray-800 text-xl">‹</Link>
        <h1 className="text-xl font-bold text-gray-900">รายละเอียดงานล้าง</h1>
      </div>

      {/* ── M6 Alert: WeeeR ถอนงาน ──────────────────────────────────────────── */}
      {action !== "cancelled" && action !== "rerouting" && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-3">

          {/* Notification header */}
          <div className="flex items-start gap-3">
            <span className="text-2xl shrink-0">🚨</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-red-800">
                {notify.shopName} แจ้งถอนรับงาน
              </p>
              <p className="text-sm text-red-600 mt-1">
                เหตุผล: &ldquo;{notify.withdrawReason}&rdquo;
              </p>
              <p className="text-xs text-red-400 mt-1">
                แจ้งเมื่อ {fmt(notify.withdrawAt)}
              </p>
            </div>
          </div>

          {/* Offer lock summary — กำหนดค่า settle ถ้ายกเลิก */}
          {(notify.depositAmount > 0 || notify.travelFee > 0) && (
            <div className="bg-white border border-red-100 rounded-xl p-3 space-y-1">
              <p className="text-xs font-semibold text-gray-500">ข้อเสนอที่ lock ไว้ (อ้างอิง settle)</p>
              {notify.depositAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">พอยต์ทองที่ล็อก (WeeeR รับไว้)</span>
                  <span className="font-medium text-gray-800">{notify.depositAmount} พอยต์ทอง</span>
                </div>
              )}
              {notify.travelFee > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">ค่าเดินทาง</span>
                  <span className="font-medium text-gray-800">{notify.travelFee} พอยต์ทอง</span>
                </div>
              )}
              <p className="text-xs text-gray-400 pt-1">
                * WeeeR ถอนเป็นผู้ผิด → คืนพอยต์ทองที่ล็อก + WeeeR ไม่ได้ค่าเดินทาง (policy นโยบาย)
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
                ระบบจะ settle พอยต์ทองที่ล็อก {notify.depositAmount} พอยต์ทอง คืนให้คุณ
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

      {/* ── Rerouting state ──────────────────────────────────────────────────── */}
      {action === "rerouting" && (
        <div className="bg-[#E1F7EC] border border-[#0DC36C]/30 rounded-2xl p-4 text-center space-y-2">
          <p className="text-2xl">🔍</p>
          <p className="font-semibold text-[#0A9B55]">กำลังหา WeeeR ใหม่...</p>
          <p className="text-sm text-[#0A9B55]/70">ระบบจะแจ้งเตือนเมื่อมีร้านยื่นข้อเสนอ</p>
          <p className="text-xs text-gray-500">สถานะ: กลับไปรอข้อเสนอ (awaiting_offer)</p>
        </div>
      )}

      {/* ── Cancelled confirmation ───────────────────────────────────────────── */}
      {action === "cancelled" && (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-center space-y-2">
          <p className="text-2xl">✅</p>
          <p className="font-semibold text-gray-700">ยกเลิกงานเรียบร้อย</p>
          <p className="text-sm text-gray-500">
            พอยต์ทองที่ล็อก {notify.depositAmount} พอยต์ทอง จะคืนภายใน 1-3 วันทำการ
          </p>
        </div>
      )}

      {/* ── Job info card ─────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">ข้อมูลงาน</p>
        </div>
        <div className="p-5 space-y-3">
          <Row label="เครื่อง"  value={`${APPLIANCE_LABEL[job.applianceType]} — ${CLEANING_LABEL[job.cleaningType]}`} />
          <Row label="รหัสงาน" value={job.serviceCode} />
          <Row label="วันนัด"  value={fmt(job.scheduledAt)} />
          <Row label="ที่อยู่"  value={job.address.address} />
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
