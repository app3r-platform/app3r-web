"use client";

// ── ขั้น 2.1 — Offer Form (5 แกน) ───────────────────────────────────────────
// WeeeR ยื่นข้อเสนอ → job เข้าสู่ awaiting_offer → WeeeU ตอบรับ → assigned

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { maintainApi } from "../../../_lib/api";
import type { MaintainJob, MaintainOfferPayload } from "../../../_lib/types";
import { APPLIANCE_LABEL, CLEANING_LABEL } from "../../../_lib/types";

export default function MaintainOfferPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [job, setJob] = useState<MaintainJob | null>(null);
  const [loadingJob, setLoadingJob] = useState(true);
  const [jobError, setJobError] = useState("");

  // ── แกน 1: พอยต์ทองที่ล็อก (Escrow) ─────────────────────────────────────────────────────────
  const [depositRequired, setDepositRequired] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositRefund, setDepositRefund] = useState("");

  // ── แกน 2: ค่าเดินทาง ────────────────────────────────────────────────────
  const [travelRequired, setTravelRequired] = useState(false);
  const [travelAmount, setTravelAmount] = useState("");
  const [travelCondition, setTravelCondition] = useState("");

  // ── แกน 3: รับประกันงานล้าง ──────────────────────────────────────────────
  const [warrantyDays, setWarrantyDays] = useState("7");
  const [warrantyScope, setWarrantyScope] = useState("งานล้างเท่านั้น — ไม่รวมอะไหล่");

  // ── แกน 4: No-show ────────────────────────────────────────────────────────
  const [noShowFee, setNoShowFee] = useState("0");
  const [noShowCondition, setNoShowCondition] = useState("ลูกค้าไม่อยู่บ้านเมื่อช่างถึง");

  // ── แกน 5: ความรับผิดเสียหาย ─────────────────────────────────────────────
  const [damagePolicy, setDamagePolicy] = useState<MaintainOfferPayload["damagePolicy"]>("no_service_fee");
  const [damagePolicyNote, setDamagePolicyNote] = useState("");

  // ── Submit state ──────────────────────────────────────────────────────────
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    maintainApi.getJob(id)
      .then(setJob)
      .catch((e: Error) => setJobError(e.message))
      .finally(() => setLoadingJob(false));
  }, [id]);

  function buildPayload(): MaintainOfferPayload {
    return {
      deposit: {
        required: depositRequired,
        ...(depositRequired && depositAmount ? { amount: Number(depositAmount) } : {}),
        ...(depositRequired && depositRefund ? { refundCondition: depositRefund } : {}),
      },
      travelFee: {
        required: travelRequired,
        ...(travelRequired && travelAmount ? { amount: Number(travelAmount) } : {}),
        ...(travelRequired && travelCondition ? { condition: travelCondition } : {}),
      },
      warranty: {
        days: Number(warrantyDays) || 0,
        scope: warrantyScope.trim() || "งานล้างเท่านั้น",
      },
      noShow: {
        fee: Number(noShowFee) || 0,
        condition: noShowCondition.trim() || "ลูกค้าไม่อยู่บ้าน",
      },
      damagePolicy,
      ...(damagePolicyNote.trim() ? { damagePolicyNote: damagePolicyNote.trim() } : {}),
    };
  }

  async function handleConfirmedSubmit() {
    setSubmitting(true);
    setSubmitError("");
    try {
      await maintainApi.submitOffer(id, buildPayload());
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
        <Link href="/maintain/queue" className="text-gray-400 hover:text-gray-600">←</Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">ยื่นข้อเสนอ</h1>
          {job && (
            <p className="text-xs text-gray-500 mt-0.5">
              {APPLIANCE_LABEL[job.applianceType]} — {CLEANING_LABEL[job.cleaningType]} · {job.serviceCode}
            </p>
          )}
        </div>
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
            · 💰 {job.totalPrice.toLocaleString()} pts
          </p>
        </div>
      )}

      <div className="space-y-4">

        {/* ── แกน 1: พอยต์ทองที่ล็อก (Escrow) ── */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-800">💰 แกน 1 — พอยต์ทองที่ล็อก (ระบบพักเงินกลาง / Escrow)</p>
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-xs text-gray-500">เรียกล็อกพอยต์ทอง</span>
              <div
                onClick={() => setDepositRequired(v => !v)}
                className={`w-10 h-5 rounded-full transition-colors cursor-pointer ${depositRequired ? "bg-[#FF663A]" : "bg-gray-200"} relative`}>
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${depositRequired ? "translate-x-5" : "translate-x-0.5"}`} />
              </div>
            </label>
          </div>
          {depositRequired && (
            <div className="space-y-2 pt-1">
              <div>
                <label className="block text-xs text-gray-500 mb-1">จำนวน (pts) <span className="text-red-400">*</span></label>
                <input type="number" min={0} value={depositAmount} onChange={e => setDepositAmount(e.target.value)}
                  placeholder="0"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF663A]" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">เงื่อนไขคืนพอยต์ทองที่ล็อก</label>
                <input type="text" value={depositRefund} onChange={e => setDepositRefund(e.target.value)}
                  placeholder="เช่น คืนเต็มหากยกเลิก 24 ชม.ล่วงหน้า"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF663A]" />
              </div>
            </div>
          )}
          {!depositRequired && (
            <p className="text-xs text-gray-400">⚠️ ไม่ระบุพอยต์ทองที่ล็อก = ไม่มีสิทธิเรียกภายหลัง</p>
          )}
        </div>

        {/* ── แกน 2: ค่าเดินทาง ── */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-800">🚗 แกน 2 — ค่าเดินทาง</p>
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-xs text-gray-500">เรียกค่าเดินทาง</span>
              <div
                onClick={() => setTravelRequired(v => !v)}
                className={`w-10 h-5 rounded-full transition-colors cursor-pointer ${travelRequired ? "bg-[#FF663A]" : "bg-gray-200"} relative`}>
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${travelRequired ? "translate-x-5" : "translate-x-0.5"}`} />
              </div>
            </label>
          </div>
          {travelRequired && (
            <div className="space-y-2 pt-1">
              <div>
                <label className="block text-xs text-gray-500 mb-1">จำนวน (pts) <span className="text-red-400">*</span></label>
                <input type="number" min={0} value={travelAmount} onChange={e => setTravelAmount(e.target.value)}
                  placeholder="0"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF663A]" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">เงื่อนไข</label>
                <input type="text" value={travelCondition} onChange={e => setTravelCondition(e.target.value)}
                  placeholder="เช่น ระยะ >10 km"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF663A]" />
              </div>
            </div>
          )}
          {!travelRequired && (
            <p className="text-xs text-gray-400">⚠️ ไม่ระบุ = ไม่มีสิทธิเรียกค่าเดินทางภายหลัง</p>
          )}
        </div>

        {/* ── แกน 3: รับประกันงานล้าง ── */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-3">
          <p className="text-sm font-semibold text-gray-800">🛡️ แกน 3 — รับประกันงานล้าง</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">รับประกัน (วัน) <span className="text-red-400">*</span></label>
              <input type="number" min={0} value={warrantyDays} onChange={e => setWarrantyDays(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF663A]" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">ขอบเขตการรับประกัน</label>
              <input type="text" value={warrantyScope} onChange={e => setWarrantyScope(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF663A]" />
            </div>
          </div>
        </div>

        {/* ── แกน 4: No-show ── */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-3">
          <p className="text-sm font-semibold text-gray-800">🚫 แกน 4 — No-show fee</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">ค่า No-show (pts)</label>
              <input type="number" min={0} value={noShowFee} onChange={e => setNoShowFee(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF663A]" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">เงื่อนไข</label>
              <input type="text" value={noShowCondition} onChange={e => setNoShowCondition(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF663A]" />
            </div>
          </div>
        </div>

        {/* ── แกน 5: ความรับผิดเสียหาย ── */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-3">
          <p className="text-sm font-semibold text-gray-800">⚠️ แกน 5 — ความรับผิดเสียหาย</p>
          <div className="grid grid-cols-3 gap-2">
            {(["none", "no_service_fee", "up_to_service_fee"] as MaintainOfferPayload["damagePolicy"][]).map(v => (
              <label key={v}
                className={`text-center py-2 px-1 rounded-xl border-2 cursor-pointer transition-all text-xs font-medium
                  ${damagePolicy === v ? "border-[#FF9C80] bg-[#FCEAE3] text-[#4A1B0C]" : "border-gray-100 text-gray-600"}`}>
                <input type="radio" className="sr-only" checked={damagePolicy === v} onChange={() => setDamagePolicy(v)} />
                {v === "none" ? "ไม่รับผิดชอบ" : v === "no_service_fee" ? "คืนค่าบริการ" : "ไม่เกินค่าบริการ"}
              </label>
            ))}
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">หมายเหตุเพิ่มเติม (ถ้ามี)</label>
            <input type="text" value={damagePolicyNote} onChange={e => setDamagePolicyNote(e.target.value)}
              placeholder="เช่น ไม่รับผิดชอบความเสียหายที่เกิดก่อนให้บริการ"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF663A]" />
          </div>
        </div>

      </div>

      {submitError && <p className="text-sm text-red-500 text-center">{submitError}</p>}

      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        disabled={submitting}
        className="w-full bg-[#FF663A] hover:bg-[#D8491F] text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60">
        📝 ยื่นข้อเสนอ →
      </button>

      {/* Confirm modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50 px-4 pb-6">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm space-y-4">
            <h2 className="text-base font-bold text-gray-900">ยืนยันข้อเสนอ</h2>
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
              <p className="text-xs text-yellow-800 font-medium">⚠️ ตรวจสอบก่อนส่ง</p>
              <ul className="text-xs text-yellow-700 mt-1.5 space-y-0.5 list-disc pl-4">
                <li>พอยต์ทองที่ล็อก: {depositRequired ? `${depositAmount || "0"} pts` : "ไม่เรียก"}</li>
                <li>ค่าเดินทาง: {travelRequired ? `${travelAmount || "0"} pts` : "ไม่เรียก"}</li>
                <li>ไม่ระบุ = ไม่มีสิทธิเรียกภายหลัง</li>
              </ul>
            </div>
            <p className="text-sm text-gray-600">ยืนยันยื่นข้อเสนอนี้ให้ลูกค้าตอบรับ?</p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)}
                className="flex-1 border border-gray-200 text-gray-600 font-medium py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors">
                แก้ไข
              </button>
              <button onClick={handleConfirmedSubmit} disabled={submitting}
                className="flex-1 bg-[#FF663A] hover:bg-[#D8491F] text-white font-semibold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-60">
                {submitting ? "กำลังส่ง…" : "ยืนยัน"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
