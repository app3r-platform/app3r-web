"use client";

// ── WeeeR Scrap Job Detail — R-28 (S1-S4: ตัดสินใจจัดการซาก) ─────────────────

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { scrapApi } from "../../_lib/api";
import type { ScrapJob, ScrapJobOption, ScrapWithdrawReason } from "../../_lib/types";
import {
  SCRAP_JOB_STATUS_LABEL,
  SCRAP_JOB_STATUS_COLOR,
  SCRAP_WITHDRAW_REASON_LABEL,
  SCRAP_WITHDRAW_REASON_DESC,
} from "../../_lib/types";

import { MockAnnoOrigin, MockAnnoNav, MockAnnoXApp } from "@/components/MockAnno";

/* S8 — verify-at-pickup mismatch report (WeeeT → price-adjust proposal) */
/* WeeeR เห็นแบบ read-only mirror — WeeeU เป็นผู้ตัดสิน accept/decline */
interface MismatchReport {
  reportedAt: string;
  weeeTName: string;
  originalPrice: number;
  proposedByWeeeT?: number;
  reason: string;
  photos: string[];
  weeeUResponse?: "accepted" | "declined" | "pending";
}

interface ScrapJobExtended extends ScrapJob {
  /* S7 */ canWithdraw?: boolean;
  /* S8 */ mismatchReport?: MismatchReport;
  /* S12 */ sourceRepairJobId?: string;
}

// ── MOCK_JOB — hardcoded fallback สำหรับ dev (ใช้เมื่อ API ไม่ตอบ) ────────────
const MOCK_JOB: ScrapJobExtended = {
  id: "SPJ-001",
  scrapItemId: "SC002",
  buyerId: "weeer-demo-001",
  buyerType: "WeeeR",
  decision: "resell_parts",
  status: "in_progress",
  createdAt: "2026-05-20T10:00:00+07:00",
  updatedAt: "2026-05-24T10:00:00+07:00",
  scrapItemDescription: "แอร์ Mitsubishi 12000 BTU ซ่อมไม่คุ้ม",
  conditionGrade: "grade_C",
  offerPrice: 380,            // S7: ราคา escrow ที่ WeeeR ล็อกไว้ (REVERSE: R→U)
  isFree: false,
  escrowStatus: "locked",
  // S7 demo — ปุ่มถอน offer เห็นได้ทันที
  canWithdraw: true,
  // S8 demo — mismatch report จาก WeeeT
  mismatchReport: {
    reportedAt: "2026-05-24T09:30:00+07:00",
    weeeTName: "ช่างสมศักดิ์ มานะดี",
    originalPrice: 380,
    proposedByWeeeT: 250,
    reason: "คอมเพรสเซอร์แตกรุนแรงกว่าที่แจ้ง — น้ำหนักจริงน้อยกว่า 20% สภาพต่ำกว่าเกรด C ที่ประกาศ",
    photos: ["/mock/mismatch-weeet-1.jpg", "/mock/mismatch-weeet-2.jpg"],
    weeeUResponse: "pending",
  },
  // S12 demo — มาจาก Repair Job
  sourceRepairJobId: "REP-0042",
};
const OPTIONS: {
  value: ScrapJobOption;
  label: string;
  route: string;
  disabled: boolean;
  icon: string;
  desc: string;
}[] = [
  { value: "resell_parts",    label: "แยกอะไหล่",          route: "resell-parts",    disabled: false, icon: "🔩", desc: "สร้างชิ้นส่วนเข้าสต๊อก Parts" },
  { value: "repair_and_sell", label: "ซ่อมขาย",             route: "repair-and-sell", disabled: false, icon: "🛠", desc: "ส่งซ่อมแล้วขายใน Marketplace" },
  { value: "resell_as_scrap", label: "ขายต่อซาก",           route: "resell-as-scrap", disabled: false, icon: "🏷", desc: "ประกาศขายซากต่อใน Marketplace" },
  { value: "dispose",         label: "รีไซเคิล",             route: "dispose",         disabled: false, icon: "♻️", desc: "ออกใบรับรองการทำลาย e-waste" },
];

export default function ScrapJobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [job, setJob] = useState<ScrapJobExtended | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deciding, setDeciding] = useState<ScrapJobOption | null>(null);

  // S7 (R-S4): withdraw flow state
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawReason, setWithdrawReason] = useState<ScrapWithdrawReason | "">("");
  const [withdrawing, setWithdrawing] = useState(false);

  // S11(ii) (R-S6): dispute-initiate flow state
  const [showDispute, setShowDispute] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [disputing, setDisputing] = useState(false);

  useEffect(() => {
    scrapApi.getJob(id)
      .then(d => {
        // RC-F: ใช้ field จาก API response ตามจริง (ไม่ inject ทุก record)
        // S7 canWithdraw / S8 mismatchReport มาจาก API เมื่อ Backend รองรับ Phase D
        setJob(d as ScrapJobExtended);
      })
      .catch(() => {
        // DEV fallback: API ไม่ตอบ → ใช้ MOCK_JOB แทน (ไม่แสดง error)
        setJob(MOCK_JOB);
      })
      .finally(() => setLoading(false));
  }, [id]);

  // S7: ถอนงานได้เมื่อ status ยัง active (ก่อน WeeeT รับซาก/ก่อน complete)
  const ACTIVE_WITHDRAW_STATUSES: ScrapJob["status"][] = ["pending_decision", "in_progress"];
  const canWithdraw =
    !!job &&
    job.status !== "withdrawn" &&
    job.status !== "disputed" &&
    (job.canWithdraw ?? ACTIVE_WITHDRAW_STATUSES.includes(job.status));

  // S11(ii): เปิดข้อพิพาทได้เมื่อ escrow ค้าง (locked) และยังไม่พิพาท
  const canDispute = !!job && job.status !== "disputed" && job.escrowStatus === "locked";

  const handleWithdraw = async () => {
    if (!job || !withdrawReason || withdrawing) return;
    setWithdrawing(true);
    try {
      const updated = await scrapApi.withdrawJob(id, withdrawReason);
      setJob({ ...job, ...updated } as ScrapJobExtended);
      setShowWithdraw(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setWithdrawing(false);
    }
  };

  const handleDispute = async () => {
    if (!job || !disputeReason.trim() || disputing) return;
    setDisputing(true);
    try {
      const updated = await scrapApi.initiateDispute(id, disputeReason.trim());
      setJob({ ...job, ...updated } as ScrapJobExtended);
      setShowDispute(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setDisputing(false);
    }
  };

  const handleSelect = async (option: (typeof OPTIONS)[0]) => {
    if (!job || option.disabled) return;
    if (job.status !== "pending_decision") {
      // Already decided — navigate directly to sub-flow
      router.push(`/scrap/jobs/${id}/${option.route}`);
      return;
    }
    setDeciding(option.value);
    try {
      await scrapApi.decideJob(id, option.value);
      router.push(`/scrap/jobs/${id}/${option.route}`);
    } catch (e) {
      setError((e as Error).message);
      setDeciding(null);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-48 text-gray-400">กำลังโหลด…</div>;
  if (error) return <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-yellow-700 text-sm">⚠️ {error}</div>;
  if (!job) return null;

  const isPending = job.status === "pending_decision";

  return (
    <div className="space-y-5 max-w-xl">
      {/* §5 Origin + §8 Cross-app annotations */}
      <MockAnnoOrigin from="◀ มาจาก: R-27 · /scrap/jobs หรือ R-78 · /scrap/browse/[id] (กด 'ซื้อซากนี้')" />
      <MockAnnoXApp screenLabel="R-28: Job">
        <p>• <strong>WeeeU :3002</strong> [U-33] เจ้าของซากเห็นสถานะ listing เปลี่ยนเป็น in_progress
          <a href={`http://localhost:3002/scrap/browse/SC002`} className="underline ml-1">/scrap/browse/[id]</a>
        </p>
        <p>• <strong>WeeeT :3003</strong> [T-04] เมื่อ WeeeR เลือก option → ช่างได้รับ assignment รับซาก
          <a href={`http://localhost:3003/jobs/J001/pickup`} className="underline ml-1">/jobs/[id]/pickup</a>
        </p>
        <p>• <strong>Admin :3000</strong> [A-08] Admin เห็นงานนี้ใน overview
          <a href="http://localhost:3000/scrap/jobs" className="underline ml-1">/scrap/jobs</a>
        </p>
      </MockAnnoXApp>

      <div className="flex items-center gap-3">
        <Link href="/scrap/jobs" className="text-gray-400 hover:text-gray-600">←</Link>
        <h1 className="text-xl font-bold text-gray-900">งานซาก</h1>
        <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium ${SCRAP_JOB_STATUS_COLOR[job.status]}`}>
          {SCRAP_JOB_STATUS_LABEL[job.status]}
        </span>
      </div>

      {/* Job info */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 text-sm space-y-2">
        <div>
          <p className="text-xs text-gray-400">รายละเอียดซาก</p>
          <p className="font-medium text-gray-800">{job.scrapItemDescription ?? "—"}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-400">ScrapItem ID</p>
            <p className="text-xs text-gray-600 font-mono truncate">{job.scrapItemId}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">วันที่ซื้อ</p>
            <p className="text-xs text-gray-600">
              {new Date(job.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
        </div>
      </div>

      {/* ── S8 mirror (R-S5): read-only mirror ของ verify-at-pickup mismatch ── */}
      {/* WeeeT รายงานซากไม่ตรง + เสนอราคาใหม่ → WeeeU เป็นผู้ตัดสิน · WeeeR เห็นอย่างเดียว (offer=SoT) */}
      {job.mismatchReport && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
          <div className="flex items-start gap-3">
            <span className="text-xl shrink-0">⚠️</span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-amber-800">ช่างแจ้งซากไม่ตรงประกาศ — เสนอปรับราคา</p>
              <p className="text-xs text-amber-700 mt-0.5">
                รายงานโดย {job.mismatchReport.weeeTName} ·{" "}
                {new Date(job.mismatchReport.reportedAt).toLocaleString("th-TH", {
                  day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
                })}
              </p>
            </div>
          </div>

          {/* เหตุผล */}
          <div className="bg-white/60 rounded-lg p-3">
            <p className="text-xs text-gray-400 mb-0.5">เหตุผลที่แจ้ง</p>
            <p className="text-sm text-gray-700">{job.mismatchReport.reason}</p>
          </div>

          {/* ราคาเดิม → เสนอใหม่ */}
          {job.mismatchReport.proposedByWeeeT != null && (
            <div className="flex items-center justify-center gap-3 text-sm">
              <div className="text-center">
                <p className="text-xs text-gray-400">ราคาเดิม</p>
                <p className="font-semibold text-gray-500 line-through">{job.mismatchReport.originalPrice.toLocaleString()} pts</p>
              </div>
              <span className="text-amber-500">→</span>
              <div className="text-center">
                <p className="text-xs text-gray-400">ช่างเสนอ</p>
                <p className="font-bold text-[#D63B12]">{job.mismatchReport.proposedByWeeeT.toLocaleString()} pts</p>
              </div>
            </div>
          )}

          {/* รูปประกอบ (mock) */}
          {job.mismatchReport.photos.length > 0 && (
            <div className="flex gap-2 overflow-x-auto">
              {job.mismatchReport.photos.map((url, i) => (
                <div key={i} className="h-16 w-16 shrink-0 bg-gray-100 rounded-lg flex items-center justify-center text-2xl text-gray-300" title={url}>📷</div>
              ))}
            </div>
          )}

          {/* สถานะการตอบของ WeeeU (read-only — WeeeU เป็นผู้ตัดสิน) */}
          <div className="border-t border-amber-200/70 pt-2.5 flex items-center justify-between">
            <p className="text-xs text-gray-500">สถานะการตอบของลูกค้า (WeeeU)</p>
            {(() => {
              const r = job.mismatchReport.weeeUResponse ?? "pending";
              const map = {
                pending:  { label: "รอลูกค้าตัดสินใจ", cls: "bg-yellow-100 text-yellow-700" },
                accepted: { label: "ลูกค้ายอมรับราคาใหม่", cls: "bg-green-100 text-green-700" },
                declined: { label: "ลูกค้าปฏิเสธ — คงราคาเดิม", cls: "bg-red-100 text-red-600" },
              } as const;
              return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[r].cls}`}>{map[r].label}</span>;
            })()}
          </div>
          <p className="text-xs text-amber-600/80">
            * ฝั่ง WeeeR ดูได้อย่างเดียว — การปรับราคาขึ้นกับลูกค้า WeeeU เป็นผู้ตัดสิน (offer = source of truth)
          </p>
        </div>
      )}

      {/* Option selector */}
      <div>
        <p className="text-xs text-gray-500 font-medium mb-2">
          {isPending ? "เลือกวิธีจัดการซาก" : "วิธีจัดการที่เลือก"}
        </p>
        <div className="space-y-2">
          {OPTIONS.map(opt => {
            const isSelected = !isPending && job.decision === opt.value;
            const isDisabled = opt.disabled || (deciding !== null && deciding !== opt.value);
            return (
              <button
                key={opt.value}
                onClick={() => handleSelect(opt)}
                disabled={isDisabled}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all
                  ${isSelected
                    ? "border-[#FF8B66] bg-[#FFF1ED]"
                    : opt.disabled
                    ? "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
                    : isDisabled
                    ? "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
                    : "border-gray-100 bg-white hover:border-[#FFD0BF] hover:bg-[#FFF1ED]/30"}`}>
                <span className="text-xl">{opt.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-semibold ${isSelected ? "text-[#D63B12]" : opt.disabled ? "text-gray-400" : "text-gray-800"}`}>
                    {opt.label}
                  </p>
                  <p className="text-xs text-gray-400">{opt.desc}</p>
                </div>
                {deciding === opt.value && <span className="text-xs text-[#F04E20]">กำลังบันทึก…</span>}
                {isSelected && <span className="text-[#F04E20] text-sm">✓</span>}
                {!isSelected && !opt.disabled && deciding === null && (
                  <div className="text-right">
                    <span className="text-gray-300 text-sm">→</span>
                    {/* §6 Nav annotation */}
                    <MockAnnoNav text={`→ R-28${opt.value === "resell_as_scrap" ? "b" : opt.value === "resell_parts" ? "c" : opt.value === "repair_and_sell" ? "d" : "e"}`} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── S7 (R-S4): Withdraw banner (เมื่อถอนแล้ว) ── */}
      {job.status === "withdrawn" && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-start gap-3">
          <span className="text-xl shrink-0">↩️</span>
          <div>
            <p className="text-sm font-semibold text-gray-700">ถอนงานแล้ว</p>
            <p className="text-xs text-gray-500 mt-0.5">
              แจ้ง WeeeU แล้ว · escrow ที่ล็อกไว้ unlock คืน WeeeU เต็มจำนวน (escrow กลับทิศ R→U)
              {job.withdrawReason && ` · เหตุผล: ${SCRAP_WITHDRAW_REASON_LABEL[job.withdrawReason]}`}
            </p>
          </div>
        </div>
      )}

      {/* ── S11(ii) (R-S6): Disputed banner (เมื่อเปิดพิพาทแล้ว) ── */}
      {job.status === "disputed" && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <span className="text-xl shrink-0">🚨</span>
          <div>
            <p className="text-sm font-semibold text-red-700">เปิดข้อพิพาทแล้ว — escrow ค้าง</p>
            <p className="text-xs text-red-600 mt-0.5">
              Admin จะเข้ามาตรวจสอบ (service_type=B) · escrow ค้างจนกว่าจะตัดสิน
              {job.disputeReason && ` · เหตุผล: ${job.disputeReason}`}
            </p>
          </div>
        </div>
      )}

      {/* ── S7 (R-S4): Withdraw action (mirror Maintain M6) ── */}
      {canWithdraw && !showWithdraw && (
        <button
          onClick={() => setShowWithdraw(true)}
          className="w-full border border-[#FF663A]/50 text-[#FF663A] hover:bg-[#FF663A]/5 font-medium py-3 rounded-xl transition-colors text-sm"
        >
          ↩️ ถอนงาน (ระบุสาเหตุ)
        </button>
      )}

      {canWithdraw && showWithdraw && (
        <div className="bg-white border border-[#FF663A]/30 rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="text-2xl shrink-0">⚠️</span>
            <div>
              <p className="font-semibold text-gray-800">ยืนยันถอนงานซาก?</p>
              <p className="text-sm text-gray-500 mt-1">
                escrow กลับทิศ — WeeeR เป็นผู้จ่าย Gold ให้ WeeeU · เมื่อถอน escrow ที่ล็อกไว้จะ unlock คืน WeeeU เต็มจำนวน
              </p>
            </div>
          </div>

          {/* Reason selector (enum 3 ค่า — บังคับเลือก) */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              เหตุผลที่ถอน <span className="text-[#FF663A]">*</span>
            </label>
            <div className="space-y-2">
              {(Object.keys(SCRAP_WITHDRAW_REASON_LABEL) as ScrapWithdrawReason[]).map((key) => (
                <label
                  key={key}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    withdrawReason === key
                      ? "border-[#FF663A]/60 bg-[#FF663A]/5"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="scrap-withdraw-reason"
                    value={key}
                    checked={withdrawReason === key}
                    onChange={() => setWithdrawReason(key)}
                    className="mt-0.5 accent-[#FF663A] shrink-0"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{SCRAP_WITHDRAW_REASON_LABEL[key]}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{SCRAP_WITHDRAW_REASON_DESC[key]}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Settle-confirm: Fee consequence + escrow unlock note */}
          {withdrawReason !== "" && (
            <div className="bg-[#FF663A]/8 border border-[#FF663A]/20 rounded-xl p-3 space-y-1.5 text-xs text-gray-600">
              <p className="font-semibold text-gray-700">ผลกระทบ ({SCRAP_WITHDRAW_REASON_LABEL[withdrawReason]})</p>
              <div className="flex justify-between">
                <span>escrow ที่ล็อก (R→U) — unlock คืน WeeeU</span>
                <span className="text-green-600 font-medium">
                  {(job.offerPrice ?? 0).toLocaleString()} pts
                </span>
              </div>
              <div className="flex justify-between">
                <span>ค่าปรับ (Fee) ฝั่ง WeeeR</span>
                <span className={`font-medium ${withdrawReason === "shop_fault" ? "text-[#FF663A]" : "text-gray-500"}`}>
                  {withdrawReason === "shop_fault" ? "มีค่าปรับ (ร้านเป็นผู้ถอน)" : "ไม่มีค่าปรับ"}
                </span>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleWithdraw}
              disabled={withdrawReason === "" || withdrawing}
              className="flex-1 bg-[#FF663A] hover:bg-[#e5522a] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors text-sm"
            >
              {withdrawing ? "กำลังส่ง..." : "ยืนยันถอนงาน"}
            </button>
            <button
              onClick={() => { setShowWithdraw(false); setWithdrawReason(""); }}
              className="flex-1 border border-gray-200 text-gray-500 hover:bg-gray-50 font-medium py-3 rounded-xl transition-colors text-sm"
            >
              ย้อนกลับ
            </button>
          </div>
        </div>
      )}

      {/* ── S11(ii) (R-S6): Dispute-initiate (minimal — เมื่อ escrow ค้าง) ── */}
      {canDispute && !showDispute && (
        <button
          onClick={() => setShowDispute(true)}
          className="w-full border border-red-300 text-red-600 hover:bg-red-50 font-medium py-3 rounded-xl transition-colors text-sm"
        >
          🚨 เปิดข้อพิพาท (escrow ค้าง)
        </button>
      )}

      {canDispute && showDispute && (
        <div className="bg-white border border-red-200 rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="text-2xl shrink-0">🚨</span>
            <div>
              <p className="font-semibold text-gray-800">เปิดข้อพิพาทงานซาก?</p>
              <p className="text-sm text-gray-500 mt-1">
                ส่งเรื่องให้ Admin (service_type=B) — escrow จะค้างจนกว่า Admin ตัดสิน
              </p>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              เหตุผล <span className="text-red-500">*</span>
            </label>
            <textarea
              value={disputeReason}
              onChange={e => setDisputeReason(e.target.value)}
              rows={3}
              placeholder="เช่น WeeeU ส่งซากผิดชิ้น / escrow ไม่ปล่อยตามตกลง..."
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-red-400 resize-none"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleDispute}
              disabled={!disputeReason.trim() || disputing}
              className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors text-sm"
            >
              {disputing ? "กำลังส่ง..." : "🚩 ยืนยันเปิดข้อพิพาท"}
            </button>
            <button
              onClick={() => { setShowDispute(false); setDisputeReason(""); }}
              className="flex-1 border border-gray-200 text-gray-500 hover:bg-gray-50 font-medium py-3 rounded-xl transition-colors text-sm"
            >
              ย้อนกลับ
            </button>
          </div>
        </div>
      )}

      {/* Link back to item */}
      <Link href={`/scrap/browse/${job.scrapItemId}`}
        className="block w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold py-3 rounded-xl transition-colors">
        ดูรายละเอียดซาก →
      </Link>
    </div>
  );
}
