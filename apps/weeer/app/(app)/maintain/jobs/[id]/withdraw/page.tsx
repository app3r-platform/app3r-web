"use client";
/**
 * WeeeR — Maintain Job Withdraw
 * Route: /maintain/jobs/[id]/withdraw
 * Flow: WeeeR ถอนรับงานหลังยืนยัน → modal เหตุผล + ยืนยัน → POST withdraw → แจ้ง WeeeU
 *
 * Logic mirrors: /maintain/jobs/[id]/mockup/m6-withdraw/page.tsx
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
  const [reason,     setReason]     = useState("");
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
  const canSubmit   = reason.trim().length >= 10 && !submitting;

  const handleWithdraw = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setApiError(null);
    try {
      await maintainApi.withdrawJob(id, reason.trim());
      setWithdrawn(true);
      setShowModal(false);
    } catch (e) {
      setApiError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
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
              <p className="text-xs text-[#FF663A] mt-1">
                ⚠️ ค่าเดินทาง — ไม่ได้รับ (WeeeR เป็นผู้ถอน)
              </p>
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
            <Row label="เครื่อง"    value={`${APPLIANCE_LABEL[job.applianceType]} — ${CLEANING_LABEL[job.cleaningType]}`} />
            <Row label="วันนัด"     value={fmt(job.scheduledAt)} />
            <Row label="ที่อยู่"    value={job.address.address} />
            <Row label="ราคารวม"   value={`${job.totalPrice.toLocaleString()} pts`} />
            {job.technicianId && (
              <Row label="ช่าง"    value={job.technicianId} />
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
              <span>ค่าเดินทาง — ไม่ได้รับ (WeeeR เป็นผู้ถอน)</span>
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

          {/* Consequence summary */}
          <div className="bg-[#FF663A]/8 border border-[#FF663A]/20 rounded-xl p-3 space-y-1.5 text-xs text-gray-600">
            <p className="font-semibold text-gray-700">ผลกระทบ (ตาม Policy ถอนหลังยืนยัน)</p>
            <div className="flex justify-between">
              <span>มัดจำ — คืน WeeeU</span>
              <span className="text-[#FF663A] font-medium">ไม่ได้รับ</span>
            </div>
            <div className="flex justify-between">
              <span>ค่าเดินทาง</span>
              <span className="text-[#FF663A] font-medium">ไม่ได้รับ</span>
            </div>
          </div>

          {/* Reason textarea — บังคับ ≥ 10 chars */}
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
              onClick={() => { setShowModal(false); setReason(""); setApiError(null); }}
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
