"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { maintainApi } from "../../_lib/api";
import type { MaintainJob } from "../../_lib/types";
import {
  MAINTAIN_STATUS_LABEL,
  MAINTAIN_STATUS_COLOR,
  APPLIANCE_LABEL,
  CLEANING_LABEL,
  WITHDRAW_REASON_LABEL,
} from "../../_lib/types";

const RECURRING_LABEL: Record<string, string> = {
  "3_months":  "ทุก 3 เดือน",
  "6_months":  "ทุก 6 เดือน",
  "12_months": "ทุก 12 เดือน",
};

const DAMAGE_POLICY_LABEL: Record<string, string> = {
  none:              "ไม่รับผิดชอบ",
  no_service_fee:    "คืนค่าบริการ",
  up_to_service_fee: "ไม่เกินค่าบริการ",
};

export default function MaintainJobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [job, setJob] = useState<MaintainJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // M7: No-show settle
  const [confirmingNoShow, setConfirmingNoShow] = useState(false);
  const [noShowError, setNoShowError] = useState("");

  // M9: Termination response
  const [terminationDecision, setTerminationDecision] = useState<"continue" | "terminate" | null>(null);
  const [respondingTermination, setRespondingTermination] = useState(false);
  const [terminationError, setTerminationError] = useState("");

  const reload = () => {
    setLoading(true);
    maintainApi.getJob(id)
      .then(setJob)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { reload(); }, [id]);

  // M7: confirm no-show
  async function handleConfirmNoShow() {
    setConfirmingNoShow(true);
    setNoShowError("");
    try {
      const updated = await maintainApi.confirmNoShow(id);
      setJob(updated);
    } catch (e) {
      setNoShowError((e as Error).message);
    } finally {
      setConfirmingNoShow(false);
    }
  }

  // M9: respond to termination
  async function handleRespondTermination(decision: "continue" | "terminate") {
    setRespondingTermination(true);
    setTerminationError("");
    try {
      const updated = await maintainApi.respondToTermination(id, decision);
      setJob(updated);
      if (decision === "terminate") router.push("/maintain/jobs");
    } catch (e) {
      setTerminationError((e as Error).message);
    } finally {
      setRespondingTermination(false);
    }
  }

  if (loading) return <div className="flex items-center justify-center h-48 text-gray-400">กำลังโหลด…</div>;
  if (error) return <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">{error}</div>;
  if (!job) return null;

  // canAssign: only when job is assigned (pending is now handled via offer flow)
  const canAssign = job.status === "assigned";

  // M6: ถอนงานได้เมื่อยังไม่ล้าง (awaiting_offer / assigned / departed)
  const canWithdraw = ["awaiting_offer", "assigned", "departed"].includes(job.status);

  return (
    <div className="space-y-5 max-w-xl">
      <div className="flex items-center gap-3">
        <Link href="/maintain/jobs" className="text-gray-400 hover:text-gray-600">←</Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900 truncate">
              {APPLIANCE_LABEL[job.applianceType]}
            </h1>
            <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${MAINTAIN_STATUS_COLOR[job.status]}`}>
              {MAINTAIN_STATUS_LABEL[job.status]}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{job.serviceCode}</p>
        </div>
      </div>

      {/* awaiting_offer banner (ขั้น 2.1) */}
      {job.status === "awaiting_offer" && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 flex items-start gap-2">
          <span className="text-lg">⏳</span>
          <div>
            <p className="text-sm font-semibold text-yellow-800">รอลูกค้าตอบรับข้อเสนอ</p>
            <p className="text-xs text-yellow-600 mt-0.5">ยื่นข้อเสนอแล้ว — รอ WeeeU ยืนยันก่อนมอบหมายช่าง</p>
          </div>
        </div>
      )}

      {/* closed_for_repair banner (GAP D-M-2) — auto-lock declarative */}
      {job.status === "closed_for_repair" && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-start gap-2">
          <span className="text-lg">🔒</span>
          <div>
            <p className="text-sm font-semibold text-gray-700">🔒 ล็อก — ปรับเป็นซ่อมแล้ว</p>
            <p className="text-xs text-gray-500 mt-0.5">งานนี้ถูกปิดและส่งต่อเป็นงานซ่อมแล้ว — ถูกล็อค ไม่สามารถดำเนินการต่อได้</p>
          </div>
        </div>
      )}

      {/* M7: No-show settle banner */}
      {job.status === "no_show" && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 space-y-3">
          <div className="flex items-start gap-2">
            <span className="text-lg">🚫</span>
            <div>
              <p className="text-sm font-semibold text-orange-800">ลูกค้าไม่อยู่บ้าน (No-show)</p>
              <p className="text-xs text-orange-600 mt-0.5">WeeeT รายงานว่าลูกค้าไม่อยู่/ไม่รับสาย — รอยืนยัน settle</p>
            </div>
          </div>
          {job.offerData && (
            <div className="bg-white rounded-xl px-3 py-2.5 space-y-1 text-sm border border-orange-100">
              <p className="text-xs font-semibold text-orange-700 uppercase tracking-wider">settle ตาม offer</p>
              <div className="flex justify-between text-gray-700">
                <span>ค่า No-show</span>
                <span className="font-bold text-orange-700">{job.offerData.noShow.fee.toLocaleString()} pts</span>
              </div>
              <p className="text-xs text-gray-400">{job.offerData.noShow.condition}</p>
            </div>
          )}
          {noShowError && <p className="text-xs text-red-500">{noShowError}</p>}
          <button
            onClick={handleConfirmNoShow}
            disabled={confirmingNoShow}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-60">
            {confirmingNoShow ? "กำลังดำเนินการ…" : "✅ ยืนยัน No-show Settle"}
          </button>
        </div>
      )}

      {/* M9: Terminated by customer banner */}
      {job.status === "terminated_by_customer" && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
          <div className="flex items-start gap-2">
            <span className="text-lg">⛔</span>
            <div>
              <p className="text-sm font-semibold text-red-800">WeeeU แจ้งยุติระหว่างล้าง</p>
              <p className="text-xs text-red-600 mt-0.5">ลูกค้าขอหยุดงานกลางคัน — เลือกดำเนินการ</p>
            </div>
          </div>
          {job.offerData && (
            <div className="bg-white rounded-xl px-3 py-2.5 space-y-1 text-sm border border-red-100">
              <p className="text-xs font-semibold text-red-700 uppercase tracking-wider">settle ตาม offer (ถ้ายุติ)</p>
              <div className="flex justify-between text-gray-700">
                <span>ความรับผิดเสียหาย</span>
                <span className="font-medium">{DAMAGE_POLICY_LABEL[job.offerData.damagePolicy]}</span>
              </div>
              {job.offerData.damagePolicyNote && (
                <p className="text-xs text-gray-400">{job.offerData.damagePolicyNote}</p>
              )}
            </div>
          )}
          {terminationError && <p className="text-xs text-red-500">{terminationError}</p>}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleRespondTermination("continue")}
              disabled={respondingTermination}
              className="bg-[#FF663A] hover:bg-[#D8491F] text-white font-semibold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-60">
              {respondingTermination && terminationDecision === "continue" ? "…" : "🔄 ทำต่อ"}
            </button>
            <button
              onClick={() => { setTerminationDecision("terminate"); handleRespondTermination("terminate"); }}
              disabled={respondingTermination}
              className="bg-white border border-red-300 text-red-600 hover:bg-red-50 font-semibold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-60">
              {respondingTermination && terminationDecision === "terminate" ? "…" : "⛔ ยุติ + Settle"}
            </button>
          </div>
        </div>
      )}

      {/* M6: withdrawn banner + info */}
      {job.status === "withdrawn" && job.withdrawal && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
          <span className="text-lg">↩️</span>
          <div>
            <p className="text-sm font-semibold text-red-700">ถอนงานแล้ว</p>
            <p className="text-xs text-red-500 mt-0.5">
              สาเหตุ: {WITHDRAW_REASON_LABEL[job.withdrawal.reason]}
            </p>
            {job.withdrawal.evidence && (
              <a href={job.withdrawal.evidence} target="_blank" rel="noopener noreferrer"
                className="text-xs text-[#FF663A] underline mt-0.5 block">ดูหลักฐาน →</a>
            )}
          </div>
        </div>
      )}

      {/* Service info card */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">รายละเอียดงาน</p>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-gray-400">ประเภทเครื่อง</p>
            <p className="font-medium text-gray-800">
              {job.applianceType === "AC" ? "❄️" : "🫧"} {APPLIANCE_LABEL[job.applianceType]}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">ประเภทล้าง</p>
            <p className="font-medium text-gray-800">{CLEANING_LABEL[job.cleaningType]}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">วันเวลานัด</p>
            <p className="font-medium text-gray-800 text-xs">
              {new Date(job.scheduledAt).toLocaleDateString("th-TH", {
                day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
              })}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">ระยะเวลา</p>
            <p className="font-medium text-gray-800">{job.estimatedDuration} ชั่วโมง</p>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-gray-400">ที่อยู่</p>
            <p className="font-medium text-gray-800 text-xs">{job.address.address}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">ราคารวม</p>
            <p className="font-bold text-[#FF663A]">{job.totalPrice.toLocaleString()} pts</p>
          </div>
        </div>
      </div>

      {/* Offer lock display (ขั้น 2.1) — show when offerData is set */}
      {job.offerData && (
        <div className="bg-[#FCEAE3] border border-[#FFD5C4] rounded-xl p-4 space-y-2">
          <p className="text-xs font-semibold text-[#4A1B0C] uppercase tracking-wider">ข้อเสนอที่ยื่นไว้</p>
          <div className="space-y-1.5 text-sm">
            {job.offerData.deposit.required && (
              <div className="flex justify-between">
                <span className="text-gray-600">พอยต์ทองพักเงินกลาง (Escrow)</span>
                <span className="font-medium text-gray-800">{job.offerData.deposit.amount?.toLocaleString()} pts</span>
              </div>
            )}
            {job.offerData.travelFee.required && (
              <div className="flex justify-between">
                <span className="text-gray-600">ค่าเดินทาง</span>
                <span className="font-medium text-gray-800">{job.offerData.travelFee.amount?.toLocaleString()} pts</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">รับประกันงาน</span>
              <span className="font-medium text-gray-800">{job.offerData.warranty.days} วัน</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">No-show fee</span>
              <span className="font-medium text-gray-800">{job.offerData.noShow.fee.toLocaleString()} pts</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">ความรับผิดเสียหาย</span>
              <span className="font-medium text-gray-800">{DAMAGE_POLICY_LABEL[job.offerData.damagePolicy] ?? job.offerData.damagePolicy}</span>
            </div>
          </div>
        </div>
      )}

      {/* Recurring */}
      {job.recurring?.enabled && (
        <div className="bg-[#FFF1ED] border border-[#FFE0D6] rounded-xl p-3 flex items-start gap-2">
          <span className="text-lg">🔁</span>
          <div>
            <p className="text-sm font-medium text-[#D63B12]">นัดซ้ำ — {RECURRING_LABEL[job.recurring.interval]}</p>
            <p className="text-xs text-[#F04E20] mt-0.5">
              นัดครั้งต่อไป: {new Date(job.recurring.nextScheduledAt).toLocaleDateString("th-TH", {
                day: "numeric", month: "short", year: "numeric",
              })}
            </p>
            <p className="text-xs text-[#F04E20] mt-0.5">✨ ส่วนลด 10% สำหรับนัดซ้ำ</p>
          </div>
        </div>
      )}

      {/* Technician */}
      <div className="bg-white border border-gray-100 rounded-xl p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">ช่างผู้รับผิดชอบ</p>
        {job.technicianId ? (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#FCEAE3] rounded-full flex items-center justify-center text-[#FF663A] font-bold text-sm">👷</div>
            <div>
              <p className="text-sm font-semibold text-gray-800">Technician ID: {job.technicianId}</p>
              <p className="text-xs text-gray-400">มอบหมายแล้ว</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-orange-600">
            <span className="text-base">⚠️</span>
            <p className="text-sm">ยังไม่ได้มอบหมายช่าง</p>
          </div>
        )}
      </div>

      {/* Parts used */}
      {job.parts_used && job.parts_used.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">อุปกรณ์/สารที่ใช้</p>
          <div className="space-y-1">
            {job.parts_used.map((p, i) => (
              <div key={i} className="flex justify-between text-sm text-gray-700">
                <span>{p.name}</span>
                <span className="text-gray-400">× {p.qty}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progress link — locked when closed_for_repair (auto-lock declarative) */}
      {job.status === "closed_for_repair" ? (
        <div aria-disabled="true"
          className="w-full block text-center bg-gray-50 border border-gray-200 text-gray-400 font-medium py-2.5 rounded-xl text-sm cursor-not-allowed select-none">
          🔒 ดูความคืบหน้า (Progress) — ล็อก
        </div>
      ) : (
        <Link href={`/maintain/jobs/${id}/progress`}
          className="w-full block text-center bg-white border border-[#FFD5C4] text-[#FF663A] hover:bg-[#FCEAE3] font-medium py-2.5 rounded-xl transition-colors text-sm">
          📊 ดูความคืบหน้า (Progress)
        </Link>
      )}

      {/* Action: assign */}
      {canAssign && (
        <Link href={`/maintain/jobs/${id}/assign`}
          className="w-full block text-center bg-[#FF663A] hover:bg-[#D8491F] text-white font-semibold py-3 rounded-xl transition-colors text-sm">
          👷 มอบหมายช่าง →
        </Link>
      )}

      {/* M6: ถอนงาน button */}
      {canWithdraw && (
        <Link href={`/maintain/jobs/${id}/withdraw`}
          className="w-full block text-center bg-white border border-red-200 text-red-600 hover:bg-red-50 font-medium py-2.5 rounded-xl transition-colors text-sm">
          ↩️ ถอนงาน (ระบุสาเหตุ)
        </Link>
      )}
    </div>
  );
}
