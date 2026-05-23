"use client";

// ── M6 — WeeeR ถอนงานหลังยืนยัน ──────────────────────────────────────────────
// 3 สาเหตุ: ร้านเอง / ลูกค้าผิด / สุดวิสัย + แนบหลักฐาน

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { maintainApi } from "../../../_lib/api";
import type { MaintainJob, WithdrawReason } from "../../../_lib/types";
import { WITHDRAW_REASON_LABEL, APPLIANCE_LABEL, CLEANING_LABEL } from "../../../_lib/types";

const WITHDRAW_REASON_NOTE: Record<WithdrawReason, string> = {
  shop_fault:     "ร้านจะถูกหักคะแนน / penalty ตามนโยบาย — lูกค้าได้ reroute ฟรี",
  customer_fault: "ไม่มี penalty ร้าน — ลูกค้าอาจถูกหัก fee ตาม offer",
  force_majeure:  "Admin ตรวจสอบ — ไม่มี penalty ถ้า verify ผ่าน",
};

const REASONS: WithdrawReason[] = ["shop_fault", "customer_fault", "force_majeure"];

export default function MaintainWithdrawPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [job, setJob] = useState<MaintainJob | null>(null);
  const [loadingJob, setLoadingJob] = useState(true);
  const [jobError, setJobError] = useState("");

  const [reason, setReason] = useState<WithdrawReason>("shop_fault");
  const [evidence, setEvidence] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    maintainApi.getJob(id)
      .then(setJob)
      .catch((e: Error) => setJobError(e.message))
      .finally(() => setLoadingJob(false));
  }, [id]);

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError("");
    try {
      await maintainApi.withdrawJob(id, reason, evidence.trim() || undefined);
      router.push("/maintain/jobs");
    } catch (err) {
      setSubmitError((err as Error).message);
      setShowConfirm(false);
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingJob) return <div className="flex items-center justify-center h-48 text-gray-400">กำลังโหลด…</div>;
  if (jobError) return <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">{jobError}</div>;

  return (
    <div className="space-y-5 max-w-xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/maintain/jobs/${id}`} className="text-gray-400 hover:text-gray-600">←</Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">ถอนงาน</h1>
          {job && (
            <p className="text-xs text-gray-500 mt-0.5">
              {APPLIANCE_LABEL[job.applianceType]} — {CLEANING_LABEL[job.cleaningType]} · {job.serviceCode}
            </p>
          )}
        </div>
      </div>

      {/* Warning */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
        <span className="text-base">⚠️</span>
        <p className="text-xs text-red-700">การถอนงานหลังยืนยันอาจมี penalty ตามสาเหตุ — เลือกสาเหตุที่ตรงกับข้อเท็จจริง</p>
      </div>

      {/* Job summary */}
      {job && (
        <div className="bg-[#FCEAE3] border border-[#FFD5C4] rounded-xl p-3 space-y-0.5">
          <p className="text-xs font-semibold text-[#4A1B0C]">
            {job.applianceType === "AC" ? "❄️" : "🫧"} {APPLIANCE_LABEL[job.applianceType]} — {CLEANING_LABEL[job.cleaningType]}
          </p>
          <p className="text-xs text-[#FF663A]">📍 {job.address.address}</p>
          <p className="text-xs text-[#FF9C80]">
            🗓 {new Date(job.scheduledAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      )}

      {/* Reason selector */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-3">
        <p className="text-sm font-semibold text-gray-800">สาเหตุการถอนงาน <span className="text-red-500">*</span></p>
        <div className="space-y-2">
          {REASONS.map((r) => (
            <label key={r}
              className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all
                ${reason === r ? "border-red-300 bg-red-50" : "border-gray-100 hover:border-gray-200"}`}>
              <input type="radio" name="reason" className="sr-only" checked={reason === r} onChange={() => setReason(r)} />
              <div className="w-4 h-4 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center
                ${reason === r ? 'border-red-400' : 'border-gray-300'}">
                {reason === r && <div className="w-2 h-2 rounded-full bg-red-500" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">{WITHDRAW_REASON_LABEL[r]}</p>
                <p className="text-xs text-gray-400 mt-0.5">{WITHDRAW_REASON_NOTE[r]}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Evidence */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-2">
        <p className="text-sm font-semibold text-gray-800">แนบหลักฐาน (ถ้ามี)</p>
        <input
          type="url"
          value={evidence}
          onChange={e => setEvidence(e.target.value)}
          placeholder="URL รูปภาพ / สกรีนช็อต / เอกสาร…"
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
        />
        <p className="text-xs text-gray-400">หลักฐานช่วยลด penalty และเร่ง Admin ตรวจสอบ</p>
      </div>

      {submitError && <p className="text-sm text-red-500 text-center">{submitError}</p>}

      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        disabled={submitting}
        className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60">
        ↩️ ดำเนินการถอนงาน
      </button>

      {/* Confirm modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50 px-4 pb-6">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm space-y-4">
            <h2 className="text-base font-bold text-gray-900">ยืนยันการถอนงาน</h2>
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-xs text-red-800 font-medium">สาเหตุที่เลือก:</p>
              <p className="text-sm font-semibold text-red-700 mt-1">{WITHDRAW_REASON_LABEL[reason]}</p>
              <p className="text-xs text-red-500 mt-0.5">{WITHDRAW_REASON_NOTE[reason]}</p>
            </div>
            <p className="text-sm text-gray-600">ยืนยันการถอนงานนี้? ไม่สามารถยกเลิกได้ภายหลัง</p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)}
                className="flex-1 border border-gray-200 text-gray-600 font-medium py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors">
                กลับ
              </button>
              <button onClick={handleSubmit} disabled={submitting}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-60">
                {submitting ? "กำลังส่ง…" : "ยืนยันถอน"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
