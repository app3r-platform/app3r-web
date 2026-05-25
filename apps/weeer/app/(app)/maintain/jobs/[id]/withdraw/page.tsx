"use client";
/**
 * WeeeR — Maintain Job Withdraw
 * Route: /maintain/jobs/[id]/withdraw
 * Flow: WeeeR ถอนรับงานหลังยืนยัน → เลือกเหตุผล enum + evidence → POST withdraw → แจ้ง WeeeU
 *
 * FIX-Wave-1-A: เปลี่ยน free-text textarea → radio enum WithdrawReason
 *   reason: "shop_fault" | "customer_fault" | "force_majeure"
 *   evidence: optional textarea (ส่งเป็น param ที่ 3 ถ้า api.ts รองรับ)
 *
 * canWithdraw mock fallback: status === "assigned" | dev override ด้านล่าง
 *
 * Maintain Gen 4 · 2026-05-25
 */

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { maintainApi } from "../../../_lib/api";
import type { MaintainJob } from "../../../_lib/types";
import {
  APPLIANCE_LABEL,
  CLEANING_LABEL,
  MAINTAIN_STATUS_LABEL,
  MAINTAIN_STATUS_COLOR,
} from "../../../_lib/types";

// ── WithdrawReason enum — D91 withdraw audit log ต้องเป็น enum (ห้าม free string) ──
// Mirror ของ types.ts:28 ในฝั่ง integration branch (a382c60)
type WithdrawReason = "shop_fault" | "customer_fault" | "force_majeure";

const WITHDRAW_REASON_LABEL: Record<WithdrawReason, string> = {
  shop_fault:     "ร้านยกเลิก (ความผิดร้าน)",
  customer_fault: "ลูกค้ายกเลิก (ความผิดลูกค้า)",
  force_majeure:  "เหตุสุดวิสัย",
};

const WITHDRAW_REASON_DESC: Record<WithdrawReason, string> = {
  shop_fault:     "ร้านเป็นผู้ยกเลิก — มัดจำคืน WeeeU เต็มจำนวน ไม่ได้ค่าเดินทาง",
  customer_fault: "ลูกค้าเป็นผู้ยกเลิก — WeeeR ได้รับค่าเดินทาง",
  force_majeure:  "เหตุสุดวิสัย — ไม่มีค่าปรับ settle ตาม policy",
};

/* ─── Mock fallback — ลบก่อน prod ─── */
const DEV_FORCE_CAN_WITHDRAW = process.env.NODE_ENV === "development";

function fmt(iso: string) {
  return new Date(iso).toLocaleString("th-TH", {
    day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function MaintainWithdrawPage({ params }: { params: Promise<{ id: string }> }) {
  const { id }    = use(params);
  const router    = useRouter();

  const [job,        setJob]        = useState<MaintainJob | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [showModal,  setShowModal]  = useState(false);
  // reason: enum (required) — ห้ามส่ง free string
  const [reason,     setReason]     = useState<WithdrawReason | "">("");
  // evidence: optional free text (param ที่ 3 ของ withdrawJob)
  const [evidence,   setEvidence]   = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [apiError,   setApiError]   = useState<string | null>(null);
  const [withdrawn,  setWithdrawn]  = useState(false);

  useEffect(() => {
    maintainApi.getJob(id)
      .then(setJob)
      .catch((e: Error) => setFetchError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="flex items-center justify-center h-48 text-gray-400">กำลังโหลด…</div>;
  }
  if (fetchError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">
        {fetchError}
      </div>
    );
  }
  if (!job) return null;

  /* canWithdraw: "assigned" เท่านั้น (ก่อน WeeeT ออกเดินทาง) */
  const canWithdraw = DEV_FORCE_CAN_WITHDRAW || job.status === "assigned";
  /* canSubmit: ต้องเลือก reason (enum) — ไม่ใช่ free-text length check */
  const canSubmit   = reason !== "" && !submitting;

  const handleWithdraw = async () => {
    // reason ต้องเป็น WithdrawReason (ไม่ใช่ "") — canSubmit guarantee แล้ว
    if (!canSubmit || !reason) return;
    const withdrawReason = reason as WithdrawReason;
    setSubmitting(true);
    setApiError(null);
    try {
      // reason: WithdrawReason (enum) — ตรงตาม D91 audit log contract
      // api.ts ปัจจุบัน: withdrawJob(id, reason: string) — enum เป็น subtype ของ string → ผ่าน
      // integration branch: withdrawJob(id, reason: WithdrawReason, evidence?) → type match พอดี
      await maintainApi.withdrawJob(id, withdrawReason);
    } catch (e) {
      setApiError((e as Error).message);
      setSubmitting(false);
      return;
    }
    setWithdrawn(true);
    setShowModal(false);
    setSubmitting(false);
  };

  const resetModal = () => {
    setShowModal(false);
    setReason("");
    setEvidence("");
    setApiError(null);
  };

  return (
    <div className="space-y-5 max-w-xl pb-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600">←</button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900 truncate">ถอนรับงาน</h1>
            <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${
              withdrawn ? "bg-red-100 text-red-600" : MAINTAIN_STATUS_COLOR[job.status]
            }`}>
              {withdrawn ? "ถอนรับงานแล้ว" : MAINTAIN_STATUS_LABEL[job.status]}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{job.serviceCode}</p>
        </div>
      </div>

      {/* ─── Withdrawn confirmation ─── */}
      {withdrawn && (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="font-semibold text-gray-700">ถอนรับงานเรียบร้อย</p>
              <p className="text-sm text-gray-500">
                แจ้ง WeeeU แล้ว · ระบบ settle ตามนโยบายที่ lock ไว้
              </p>
              {reason === "shop_fault" && (
                <p className="text-xs text-[#FF663A] mt-1">
                  ⚠️ ค่าเดินทาง — ไม่ได้รับ (WeeeR เป็นผู้ถอน)
                </p>
              )}
            </div>
          </div>
          <Link
            href="/maintain/jobs"
            className="block w-full text-center border border-gray-200 text-gray-500 hover:bg-gray-50 font-medium py-2.5 rounded-xl text-sm transition-colors"
          >
            ← กลับรายการงาน
          </Link>
        </div>
      )}

      {/* ─── Job info card ─── */}
      {!withdrawn && (
        <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">รายละเอียดงาน</p>
          <div className="space-y-2.5">
            <Row label="เครื่อง"   value={`${APPLIANCE_LABEL[job.applianceType]} — ${CLEANING_LABEL[job.cleaningType]}`} />
            <Row label="วันนัด"    value={fmt(job.scheduledAt)} />
            <Row label="ที่อยู่"   value={job.address.address} />
            <Row label="ราคารวม"  value={`${job.totalPrice.toLocaleString()} pts`} />
            {job.technicianId && (
              <Row label="ช่าง"   value={job.technicianId} />
            )}
          </div>
        </div>
      )}

      {/* ─── Not eligible banner ─── */}
      {!withdrawn && !canWithdraw && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
          <div className="flex items-start gap-3">
            <span className="text-xl shrink-0">⚠️</span>
            <div>
              <p className="font-semibold text-amber-800">ไม่สามารถถอนรับงานได้</p>
              <p className="text-sm text-amber-700 mt-1">
                งานสามารถถอนได้เฉพาะขณะสถานะ "มอบหมายช่างแล้ว" เท่านั้น
                (ปัจจุบัน: {MAINTAIN_STATUS_LABEL[job.status]})
              </p>
            </div>
          </div>
          <Link
            href={`/maintain/jobs/${id}`}
            className="block w-full text-center border border-gray-200 text-gray-500 hover:bg-gray-50 font-medium py-2.5 rounded-xl text-sm transition-colors"
          >
            ← กลับรายละเอียดงาน
          </Link>
        </div>
      )}

      {/* ─── Policy card ─── */}
      {!withdrawn && canWithdraw && !showModal && (
        <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-2.5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">นโยบายถอนรับงาน</p>
          <div className="space-y-1.5 text-sm">
            <div className="flex items-start gap-2 text-gray-600">
              <span className="text-[#FF663A] shrink-0 mt-0.5">•</span>
              <span>มัดจำที่รับไว้ — คืนให้ WeeeU เต็มจำนวน</span>
            </div>
            <div className="flex items-start gap-2 text-gray-600">
              <span className="text-[#FF663A] shrink-0 mt-0.5">•</span>
              <span>ค่าเดินทาง — ไม่ได้รับ (กรณีร้านเป็นผู้ถอน)</span>
            </div>
            <div className="flex items-start gap-2 text-gray-600">
              <span className="text-[#FF663A] shrink-0 mt-0.5">•</span>
              <span>อาจมีค่าปรับถ้าแจ้งน้อยกว่า 2 ชั่วโมงก่อนนัด</span>
            </div>
          </div>
          <p className="text-xs text-gray-400">
            * settle จะคำนวณตาม offer lock ที่ระบุตอนยื่นข้อเสนอ
          </p>
        </div>
      )}

      {/* ─── Withdraw trigger button ─── */}
      {!withdrawn && canWithdraw && !showModal && (
        <button
          onClick={() => setShowModal(true)}
          className="w-full border border-[#FF663A]/50 text-[#FF663A] hover:bg-[#FF663A]/5 font-medium py-3 rounded-2xl transition-colors text-sm"
        >
          ⚠️ ถอนรับงาน
        </button>
      )}

      {/* ─── Withdraw modal ─── */}
      {!withdrawn && canWithdraw && showModal && (
        <div className="bg-white border border-[#FF663A]/30 rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="text-2xl shrink-0">⚠️</span>
            <div>
              <p className="font-semibold text-gray-800">ยืนยันถอนรับงาน?</p>
              <p className="text-sm text-gray-500 mt-1">
                การถอนหลังยืนยัน: WeeeR เป็นผู้ผิดนัด — มัดจำคืน WeeeU เต็มจำนวน
                และ WeeeR ไม่ได้ค่าเดินทาง
              </p>
            </div>
          </div>

          {/* ── Reason selector (enum — 3 ค่า บังคับเลือก) ── */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              เหตุผลที่ถอน <span className="text-[#FF663A]">*</span>
            </label>
            <div className="space-y-2">
              {(Object.keys(WITHDRAW_REASON_LABEL) as WithdrawReason[]).map((key) => (
                <label
                  key={key}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    reason === key
                      ? "border-[#FF663A]/60 bg-[#FF663A]/5"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="withdraw-reason"
                    value={key}
                    checked={reason === key}
                    onChange={() => setReason(key)}
                    className="mt-0.5 accent-[#FF663A] shrink-0"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {WITHDRAW_REASON_LABEL[key]}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {WITHDRAW_REASON_DESC[key]}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* ── Consequence summary (แสดงตาม reason ที่เลือก) ── */}
          {reason !== "" && (
            <div className="bg-[#FF663A]/8 border border-[#FF663A]/20 rounded-xl p-3 space-y-1.5 text-xs text-gray-600">
              <p className="font-semibold text-gray-700">
                ผลกระทบ ({WITHDRAW_REASON_LABEL[reason as WithdrawReason]})
              </p>
              <div className="flex justify-between">
                <span>มัดจำ — คืน WeeeU</span>
                <span className="text-[#FF663A] font-medium">ไม่ได้รับ</span>
              </div>
              <div className="flex justify-between">
                <span>ค่าเดินทาง</span>
                <span className={`font-medium ${
                  reason === "customer_fault" ? "text-green-600" : "text-[#FF663A]"
                }`}>
                  {reason === "customer_fault" ? "ได้รับ" : "ไม่ได้รับ"}
                </span>
              </div>
            </div>
          )}

          {/* ── Evidence textarea (optional) ── */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              รายละเอียดเพิ่มเติม{" "}
              <span className="text-gray-400 font-normal">(ไม่บังคับ)</span>
            </label>
            <textarea
              value={evidence}
              onChange={e => setEvidence(e.target.value)}
              rows={2}
              placeholder="เช่น ช่างติดอุบัติเหตุ, ลูกค้าโทรแจ้งยกเลิกเอง..."
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#FF663A]/60 resize-none"
            />
          </div>

          {/* API error */}
          {apiError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              {apiError}
            </p>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleWithdraw}
              disabled={!canSubmit}
              className="flex-1 bg-[#FF663A] hover:bg-[#e5522a] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors text-sm"
            >
              {submitting ? "กำลังส่ง..." : "ยืนยันถอนรับงาน"}
            </button>
            <button
              onClick={resetModal}
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
