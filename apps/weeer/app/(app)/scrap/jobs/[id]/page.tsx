"use client";

// ── WeeeR Scrap Job Detail — 2.3 Mockup (S5-S12: decision, withdraw, re-offer, dispute) ─

import { use, useState } from "react";
import Link from "next/link";
import type { ScrapJob, ScrapJobOption } from "../../_lib/types";
import {
  SCRAP_JOB_STATUS_LABEL, SCRAP_JOB_STATUS_COLOR,
  SCRAP_JOB_OPTION_LABEL,
  CONDITION_GRADE_LABEL, CONDITION_GRADE_COLOR,
} from "../../_lib/types";

// ── Mock ScrapJobs (Mockup 2.3) ───────────────────────────────────────────
const MOCK_JOBS: Record<string, ScrapJob> = {
  SJ001: {
    id: "SJ001", scrapItemId: "SC001", buyerId: "S1", buyerType: "WeeeR",
    decision: "resell_parts", decisionAt: "2026-05-21",
    status: "in_progress",
    createdAt: "2026-05-20", updatedAt: "2026-05-22",
    scrapItemDescription: "Samsung เครื่องซักผ้า WW12T",
    conditionGrade: "grade_A",
    offerPrice: 1200, isFree: false,
    weeeTId: "T01", weeeTName: "ช่างสมชาย",
    escrowStatus: "locked",
  },
  SJ002: {
    id: "SJ002", scrapItemId: "SC002", buyerId: "S1", buyerType: "WeeeR",
    decision: "repair_and_sell",
    status: "pending_decision",
    createdAt: "2026-05-21", updatedAt: "2026-05-22",
    scrapItemDescription: "Daikin แอร์ FTKF25XV2S",
    conditionGrade: "grade_B",
    offerPrice: 800, isFree: false,
    escrowStatus: "locked",
    reOfferReason: "T แจ้ง: คอมเพรสเซอร์มีรอยรั่ว ซากไม่ตรงปก",
  },
  SJ003: {
    id: "SJ003", scrapItemId: "SC003", buyerId: "S1", buyerType: "WeeeR",
    decision: "dispose",
    status: "completed",
    certificateId: "CERT-003",
    createdAt: "2026-05-15", updatedAt: "2026-05-20",
    scrapItemDescription: "ตู้เย็น LG GN-B202SQBB",
    conditionGrade: "grade_C",
    offerPrice: 0, isFree: true,
    escrowStatus: "released",
    feeSettled: true,
  },
  SJ004: {
    id: "SJ004", scrapItemId: "SC004", buyerId: "S1", buyerType: "WeeeR",
    decision: "resell_parts",
    status: "in_progress",
    createdAt: "2026-05-17", updatedAt: "2026-05-22",
    scrapItemDescription: "HP Notebook 15s-fq5xxx",
    conditionGrade: "grade_B",
    offerPrice: 1500, isFree: false,
    weeeTId: "T02", weeeTName: "ช่างวิทย์",
    escrowStatus: "locked",
    fromRepairJobId: "R-2024-089",
  },
  SJ005: {
    id: "SJ005", scrapItemId: "SC005", buyerId: "S1", buyerType: "WeeeR",
    decision: "resell_as_scrap",
    status: "cancelled",
    createdAt: "2026-05-16", updatedAt: "2026-05-18",
    scrapItemDescription: "Panasonic เครื่องซักผ้า NA-F70LG1",
    conditionGrade: "grade_A",
    offerPrice: 950, isFree: false,
    escrowStatus: "refunded",
    withdrawReason: "ราคาสูงเกินไป ไม่คุ้มค่าซ่อม",
  },
  SJ006: {
    id: "SJ006", scrapItemId: "SC005", buyerId: "S1", buyerType: "WeeeR",
    decision: "resell_parts",
    status: "in_progress",
    createdAt: "2026-05-19", updatedAt: "2026-05-22",
    scrapItemDescription: "Panasonic เครื่องซักผ้า NA-F70LG1",
    conditionGrade: "grade_A",
    offerPrice: 700, isFree: false,
    escrowStatus: "locked",
    disputeReason: "WeeeU ส่งซากผิดชิ้น ไม่ตรงตามที่ลงประกาศ",
  },
};

const OPTIONS: {
  value: ScrapJobOption;
  label: string;
  route: string;
  icon: string;
  desc: string;
}[] = [
  { value: "resell_parts",    label: "แยกอะไหล่",   route: "resell-parts",    icon: "🔩", desc: "สร้างชิ้นส่วนเข้าสต๊อก Parts" },
  { value: "repair_and_sell", label: "ซ่อมขาย",      route: "repair-and-sell", icon: "🛠", desc: "ส่งซ่อมแล้วขายใน Marketplace" },
  { value: "resell_as_scrap", label: "ขายต่อซาก",    route: "resell-as-scrap", icon: "🏷", desc: "ประกาศขายซากต่อใน Marketplace" },
  { value: "dispose",         label: "รีไซเคิล",     route: "dispose",         icon: "♻️", desc: "ออกใบรับรองการทำลาย e-waste" },
];

// Active statuses where WeeeR can still act
const ACTIVE_STATUSES: ScrapJob["status"][] = ["pending_decision", "in_progress"];

export default function ScrapJobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  // Load mock or show not-found
  const [job, setJob] = useState<ScrapJob | null>(() => MOCK_JOBS[id] ?? null);

  // Decision (S5)
  const [deciding, setDeciding] = useState<ScrapJobOption | null>(null);
  const [decisionDone, setDecisionDone] = useState(false);

  // S7: Withdraw
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawReason, setWithdrawReason] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawDone, setWithdrawDone] = useState(false);

  // S8: Re-offer (T แจ้งซากไม่ตรง)
  const [showReOfferForm, setShowReOfferForm] = useState(false);
  const [reOfferPrice, setReOfferPrice] = useState("");
  const [reOffering, setReOffering] = useState(false);
  const [reOfferDone, setReOfferDone] = useState(false);

  // S11: Dispute
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeNote, setDisputeNote] = useState("");
  const [disputing, setDisputing] = useState(false);
  const [disputeDone, setDisputeDone] = useState(false);

  if (!job) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/scrap/jobs" className="text-gray-400 hover:text-gray-600">←</Link>
          <h1 className="text-xl font-bold text-gray-900">ไม่พบงาน</h1>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-yellow-700 text-sm">
          ⚠️ ไม่พบงาน ID: {id}
        </div>
      </div>
    );
  }

  const isPending = job.status === "pending_decision";
  const isActive = ACTIVE_STATUSES.includes(job.status);

  function handleDecision(opt: typeof OPTIONS[0]) {
    if (!isPending) return;
    setDeciding(opt.value);
    setTimeout(() => {
      setJob(prev => prev ? { ...prev, decision: opt.value, status: "in_progress" } : prev);
      setDecisionDone(true);
      setDeciding(null);
    }, 700);
  }

  function handleWithdraw() {
    if (!withdrawReason.trim()) return;
    setWithdrawing(true);
    setTimeout(() => {
      setJob(prev => prev ? { ...prev, status: "cancelled", escrowStatus: "refunded", withdrawReason } : prev);
      setWithdrawDone(true);
      setWithdrawing(false);
      setShowWithdrawModal(false);
    }, 700);
  }

  function handleReOffer(e: React.FormEvent) {
    e.preventDefault();
    if (!reOfferPrice || Number(reOfferPrice) <= 0) return;
    setReOffering(true);
    setTimeout(() => {
      setJob(prev => prev ? { ...prev, offerPrice: Number(reOfferPrice), reOfferReason: undefined, escrowStatus: "locked" } : prev);
      setReOfferDone(true);
      setReOffering(false);
      setShowReOfferForm(false);
    }, 700);
  }

  function handleDispute(e: React.FormEvent) {
    e.preventDefault();
    if (!disputeNote.trim()) return;
    setDisputing(true);
    setTimeout(() => {
      setJob(prev => prev ? { ...prev, disputeReason: disputeNote } : prev);
      setDisputeDone(true);
      setDisputing(false);
      setShowDisputeModal(false);
    }, 700);
  }

  return (
    <div className="space-y-5 max-w-xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/scrap/jobs" className="text-gray-400 hover:text-gray-600">←</Link>
        <h1 className="text-xl font-bold text-gray-900 truncate flex-1">งานซาก</h1>
        <span className={`shrink-0 text-xs px-2.5 py-1 rounded-full font-medium ${SCRAP_JOB_STATUS_COLOR[job.status]}`}>
          {SCRAP_JOB_STATUS_LABEL[job.status]}
        </span>
      </div>

      {/* S12: Repair badge */}
      {job.fromRepairJobId && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-2.5">
          <p className="text-xs font-semibold text-orange-800">
            🔧 ซากนี้มาจากงาน Repair #{job.fromRepairJobId}
          </p>
          <p className="text-xs text-orange-600 mt-0.5">ประวัติการซ่อมสามารถตรวจสอบได้ใน WeeeT</p>
        </div>
      )}

      {/* S11: Dispute banner (existing) */}
      {job.disputeReason && !disputeDone && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <p className="text-xs font-bold text-red-700">🚨 มีการพิพาท</p>
          <p className="text-xs text-red-600 mt-0.5">{job.disputeReason}</p>
          <p className="text-xs text-gray-400 mt-1">Admin กำลังตรวจสอบ · Escrow ถูก freeze</p>
        </div>
      )}
      {disputeDone && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <p className="text-xs font-bold text-red-700">🚨 ส่งเรื่องพิพาทแล้ว</p>
          <p className="text-xs text-red-600 mt-0.5">{disputeNote}</p>
          <p className="text-xs text-gray-400 mt-1">Admin กำลังตรวจสอบ · Escrow ถูก freeze</p>
        </div>
      )}

      {/* S8: Re-offer banner */}
      {job.reOfferReason && !reOfferDone && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <p className="text-xs font-bold text-amber-800">⚠️ ช่างแจ้ง: ซากไม่ตรงปก</p>
          <p className="text-xs text-amber-700 mt-0.5">{job.reOfferReason}</p>
          {!showReOfferForm ? (
            <div className="flex gap-2 mt-2">
              <button onClick={() => setShowReOfferForm(true)}
                className="text-xs bg-[#FF663A] hover:bg-[#D8491F] text-white font-semibold px-3 py-1.5 rounded-lg transition-colors">
                🔄 ยื่นราคาใหม่ (S8)
              </button>
              <button onClick={() => setShowWithdrawModal(true)}
                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium px-3 py-1.5 rounded-lg transition-colors">
                ถอนงาน (S7)
              </button>
            </div>
          ) : (
            <form onSubmit={handleReOffer} className="mt-3 space-y-2">
              <div>
                <label className="block text-xs text-gray-600 mb-1">ราคาใหม่ที่เสนอ (pts)</label>
                <input type="number" min={1} value={reOfferPrice} onChange={e => setReOfferPrice(e.target.value)}
                  required
                  className="w-full border border-amber-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/30" />
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={reOffering}
                  className="flex-1 text-xs bg-[#FF663A] hover:bg-[#D8491F] text-white font-semibold py-2 rounded-lg disabled:opacity-60 transition-colors">
                  {reOffering ? "กำลังส่ง…" : "✅ ยืนยันราคาใหม่"}
                </button>
                <button type="button" onClick={() => setShowReOfferForm(false)}
                  className="flex-1 text-xs bg-gray-100 text-gray-600 font-medium py-2 rounded-lg">
                  ยกเลิก
                </button>
              </div>
            </form>
          )}
        </div>
      )}
      {reOfferDone && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2.5">
          <p className="text-xs font-semibold text-green-700">✅ ยื่นราคาใหม่แล้ว — รอ WeeeU ยืนยัน</p>
        </div>
      )}

      {/* Withdraw done */}
      {withdrawDone && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5">
          <p className="text-xs font-semibold text-gray-700">↩️ ถอนงานแล้ว — Gold คืนเรียบร้อย</p>
          <p className="text-xs text-gray-500 mt-0.5">เหตุผล: {withdrawReason}</p>
        </div>
      )}

      {/* Job info */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3 text-sm">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs text-gray-400">ซาก</p>
            <p className="font-semibold text-gray-800">{job.scrapItemDescription ?? "—"}</p>
          </div>
          {job.conditionGrade && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CONDITION_GRADE_COLOR[job.conditionGrade]}`}>
              {CONDITION_GRADE_LABEL[job.conditionGrade]}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-gray-50 pt-3">
          <div>
            <p className="text-xs text-gray-400">ราคาที่ตกลง</p>
            <p className="text-base font-bold text-[#FF663A]">
              {job.isFree ? "ฟรี" : `${(job.offerPrice ?? 0).toLocaleString()} pts`}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Escrow</p>
            <p className="text-sm font-medium">
              {job.escrowStatus === "locked" && <span className="text-purple-700">🔐 Lock อยู่</span>}
              {job.escrowStatus === "released" && <span className="text-green-700">✅ Release แล้ว</span>}
              {job.escrowStatus === "refunded" && <span className="text-gray-600">↩️ คืน Gold แล้ว</span>}
            </p>
          </div>

          {/* WeeeT (S6) */}
          {job.weeeTName && (
            <div>
              <p className="text-xs text-gray-400">WeeeT ที่รับงาน</p>
              <p className="font-medium">🔧 {job.weeeTName}</p>
            </div>
          )}

          {/* Fee Settle */}
          {job.feeSettled && (
            <div>
              <p className="text-xs text-gray-400">ค่าบริการ</p>
              <p className="text-green-700 font-medium text-xs">✅ ชำระแล้ว</p>
            </div>
          )}

          {/* Certificate (dispose) */}
          {job.certificateId && (
            <div className="col-span-2">
              <p className="text-xs text-gray-400">ใบรับรอง e-waste</p>
              <p className="text-xs text-blue-600 font-mono">{job.certificateId}</p>
            </div>
          )}
        </div>
      </div>

      {/* S5: Decision 4 ทาง (pending_decision) */}
      {isPending && !decisionDone && (
        <div>
          <p className="text-xs text-gray-500 font-medium mb-2">เลือกวิธีจัดการซาก</p>
          <div className="space-y-2">
            {OPTIONS.map(opt => (
              <button key={opt.value} onClick={() => handleDecision(opt)}
                disabled={deciding !== null}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all
                  ${deciding === opt.value
                    ? "border-[#FF663A] bg-[#FCEAE3]"
                    : "border-gray-100 bg-white hover:border-[#FFD5C4] hover:bg-[#FCEAE3]/30"}`}>
                <span className="text-xl">{opt.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-800">{opt.label}</p>
                  <p className="text-xs text-gray-400">{opt.desc}</p>
                </div>
                {deciding === opt.value
                  ? <span className="text-xs text-[#FF663A]">กำลังบันทึก…</span>
                  : <span className="text-gray-300 text-sm">→</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Decision done confirmation */}
      {decisionDone && (
        <div className="bg-[#FCEAE3] border border-[#FFD5C4] rounded-xl p-4 text-center">
          <p className="text-sm font-bold text-[#4A1B0C]">
            ✅ เลือก: {job.decision ? SCRAP_JOB_OPTION_LABEL[job.decision] : "—"}
          </p>
          <p className="text-xs text-[#FF663A] mt-1">งานเปลี่ยนเป็น "กำลังดำเนินการ" แล้ว</p>
        </div>
      )}

      {/* Already decided — show selected option */}
      {!isPending && !decisionDone && job.decision && (
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-2">วิธีจัดการที่เลือก</p>
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-[#FFD5C4] bg-[#FCEAE3]">
            <span className="text-xl">{OPTIONS.find(o => o.value === job.decision)?.icon}</span>
            <div>
              <p className="text-sm font-semibold text-[#4A1B0C]">{SCRAP_JOB_OPTION_LABEL[job.decision]}</p>
              <p className="text-xs text-gray-400">{OPTIONS.find(o => o.value === job.decision)?.desc}</p>
            </div>
          </div>
        </div>
      )}

      {/* Actions panel for active jobs */}
      {isActive && !withdrawDone && (
        <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">การจัดการ</p>

          <div className="flex flex-col gap-2">
            {/* S7: Withdraw */}
            {!job.withdrawReason && !job.disputeReason && (
              <button onClick={() => setShowWithdrawModal(true)}
                className="w-full text-left text-sm text-red-500 hover:underline">
                ↩️ ถอนงานนี้ (S7)
              </button>
            )}

            {/* S11: Dispute */}
            {!job.disputeReason && !disputeDone && (
              <button onClick={() => setShowDisputeModal(true)}
                className="w-full text-left text-sm text-red-600 hover:underline">
                🚨 แจ้งพิพาท (S11)
              </button>
            )}
          </div>
        </div>
      )}

      {/* S7: Withdraw Modal */}
      {showWithdrawModal && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
          <p className="text-sm font-bold text-red-700">↩️ ถอนงานซาก (S7)</p>
          <p className="text-xs text-red-500">
            Gold {(job.offerPrice ?? 0).toLocaleString()} pts จะถูกคืน · งานนี้จะถูกยกเลิก
          </p>
          <div>
            <label className="block text-xs text-gray-600 mb-1">เหตุผลในการถอน *</label>
            <textarea value={withdrawReason} onChange={e => setWithdrawReason(e.target.value)}
              rows={2} required placeholder="เช่น ราคาสูงเกินไป / ซากไม่ตรงตามที่ต้องการ"
              className="w-full border border-red-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400/30 resize-none" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleWithdraw} disabled={withdrawing || !withdrawReason.trim()}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-60">
              {withdrawing ? "กำลังถอน…" : "✅ ยืนยันถอนงาน"}
            </button>
            <button onClick={() => setShowWithdrawModal(false)}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl text-sm transition-colors">
              ยกเลิก
            </button>
          </div>
        </div>
      )}

      {/* S11: Dispute Modal */}
      {showDisputeModal && (
        <form onSubmit={handleDispute} className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
          <p className="text-sm font-bold text-red-700">🚨 แจ้งพิพาท (S11)</p>
          <p className="text-xs text-red-500">Escrow จะถูก freeze · Admin จะตรวจสอบ</p>
          <div>
            <label className="block text-xs text-gray-600 mb-1">รายละเอียดปัญหา *</label>
            <textarea value={disputeNote} onChange={e => setDisputeNote(e.target.value)}
              rows={3} required placeholder="เช่น ซากผิดชิ้น / อะไหล่ขาดหาย / ไม่ตรงตามปก"
              className="w-full border border-red-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400/30 resize-none" />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={disputing || !disputeNote.trim()}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-60">
              {disputing ? "กำลังส่ง…" : "🚨 ส่งเรื่องพิพาท"}
            </button>
            <button type="button" onClick={() => setShowDisputeModal(false)}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl text-sm transition-colors">
              ยกเลิก
            </button>
          </div>
        </form>
      )}

      {/* View ScrapItem */}
      <Link href={`/scrap/${job.scrapItemId}`}
        className="block w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold py-3 rounded-xl transition-colors">
        ดูรายละเอียดซาก #{job.scrapItemId} →
      </Link>
    </div>
  );
}
