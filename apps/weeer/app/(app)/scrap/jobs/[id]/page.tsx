"use client";

/**
 * WeeeR — รายละเอียดงานซาก (patch S7 + S8)
 * S7: ปุ่ม "ถอน offer" + confirm dialog + เหตุผล (หลังยืนยัน รอ T ไปรับ)
 * S8: แสดง mismatch report จาก WeeeT + ปุ่ม "เสนอราคาใหม่" / ยืนยัน settle ตาม offer เดิม
 */

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { scrapApi } from "../../_lib/api";
import type { ScrapJob, ScrapJobOption } from "../../_lib/types";
import { SCRAP_JOB_STATUS_LABEL, SCRAP_JOB_STATUS_COLOR } from "../../_lib/types";

/* S7/S8 — extended fields (mock patch — ไม่แก้ shared type) */
interface MismatchReport {
  reportedAt: string;
  weeeTName: string;
  originalPrice: number;
  proposedByWeeeT?: number;
  reason: string;
  photos: string[];
  weeeUResponse?: "accepted" | "disputed" | "pending";
}

interface ScrapJobExtended extends ScrapJob {
  /* S7 */ canWithdraw?: boolean;
  /* S8 */ mismatchReport?: MismatchReport;
  /* S12 */ sourceRepairJobId?: string;
}

// ── MOCK_JOB — hardcoded fallback สำหรับ dev (ใช้เมื่อ API ไม่ตอบ) ────────────
const MOCK_JOB: ScrapJobExtended = {
  id: "SPJ-001",
  scrapItemId: "SCR-002",
  buyerId: "weeer-demo-001",
  buyerType: "WeeeR",
  decision: "resell_parts",
  status: "in_progress",
  createdAt: "2026-05-20T10:00:00+07:00",
  updatedAt: "2026-05-24T10:00:00+07:00",
  scrapItemDescription: "แอร์ Mitsubishi 12000 BTU ซ่อมไม่คุ้ม",
  conditionGrade: "grade_C",
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

  // S7 — Withdraw state
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [withdrawReason, setWithdrawReason]         = useState("");
  const [withdrawing, setWithdrawing]               = useState(false);

  // S8 — Mismatch counter-offer state
  const [showMismatchCounter, setShowMismatchCounter]   = useState(false);
  const [counterPrice, setCounterPrice]                 = useState("");

  useEffect(() => {
    scrapApi.getJob(id)
      .then(d => {
        // Inject S7/S8/S12 fields for demo (backend จะส่ง field จริงใน Phase D)
        const extended = d as ScrapJobExtended;
        extended.canWithdraw = true;  // S7 demo: แสดงปุ่มถอน offer เสมอ
        extended.mismatchReport = MOCK_JOB.mismatchReport;  // S8 demo: mismatch report
        extended.sourceRepairJobId = "REP-0042";             // S12 demo: Repair badge
        setJob(extended);
      })
      .catch(() => {
        // DEV fallback: API ไม่ตอบ → ใช้ MOCK_JOB แทน (ไม่แสดง error)
        setJob(MOCK_JOB);
      })
      .finally(() => setLoading(false));
  }, [id]);

  // S7 — ถอน offer
  const handleWithdraw = async () => {
    if (!withdrawReason.trim()) return;
    setWithdrawing(true);
    try {
      // mock: จริงๆ เรียก scrapApi.withdrawJob(id, withdrawReason)
      await new Promise(r => setTimeout(r, 800));
      setJob(prev => prev ? { ...prev, status: "cancelled", canWithdraw: false } : prev);
      setShowWithdrawDialog(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setWithdrawing(false);
    }
  };

  // S8 — เสนอราคาใหม่ (counter-offer หลัง mismatch)
  const handleCounterOffer = async () => {
    if (!counterPrice.trim()) return;
    setWithdrawing(true);
    try {
      await new Promise(r => setTimeout(r, 800));
      setJob(prev => prev ? {
        ...prev,
        mismatchReport: prev.mismatchReport
          ? { ...prev.mismatchReport, proposedByWeeeT: Number(counterPrice) }
          : undefined,
      } : prev);
      setShowMismatchCounter(false);
      alert(`✅ ส่งราคาใหม่ ${counterPrice} Gold ให้ลูกค้าพิจารณาแล้ว`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setWithdrawing(false);
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
      <div className="flex items-center gap-3">
        <Link href="/scrap/jobs" className="text-gray-400 hover:text-gray-600">←</Link>
        <h1 className="text-xl font-bold text-gray-900">งานซาก</h1>
        <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium ${SCRAP_JOB_STATUS_COLOR[job.status]}`}>
          {SCRAP_JOB_STATUS_LABEL[job.status]}
        </span>
        {/* S12 badge */}
        {job.sourceRepairJobId && (
          <span className="text-xs bg-orange-50 text-orange-600 border border-orange-200 px-2 py-0.5 rounded-full whitespace-nowrap">
            🔧 Repair
          </span>
        )}
      </div>

      {/* S8 — Mismatch report panel */}
      {job.mismatchReport && (
        <div className="bg-orange-50 border-2 border-orange-300 rounded-2xl p-4 space-y-3">
          <div className="flex items-start gap-2">
            <span className="text-orange-500 text-xl">⚠️</span>
            <div>
              <p className="text-sm font-bold text-orange-800">ช่างรายงาน: ซากไม่ตรงประกาศ</p>
              <p className="text-xs text-orange-600 mt-0.5">
                {job.mismatchReport.weeeTName} · {new Date(job.mismatchReport.reportedAt).toLocaleString("th-TH")}
              </p>
            </div>
          </div>
          <p className="text-sm text-orange-800 bg-orange-100 rounded-xl px-3 py-2">
            {job.mismatchReport.reason}
          </p>
          <div className="text-xs text-orange-700 space-y-1">
            <p>ราคาเดิม: <span className="font-mono">{job.mismatchReport.originalPrice} Gold</span></p>
            {job.mismatchReport.proposedByWeeeT && (
              <p>ราคาที่ WeeeT เสนอ: <span className="font-mono font-bold">{job.mismatchReport.proposedByWeeeT} Gold</span></p>
            )}
            <p>ลูกค้าตอบ: <span className={`font-medium ${
              job.mismatchReport.weeeUResponse === "accepted" ? "text-green-700" :
              job.mismatchReport.weeeUResponse === "disputed" ? "text-red-700" :
              "text-yellow-700"
            }`}>
              {job.mismatchReport.weeeUResponse === "accepted" ? "✅ ยินยอม" :
               job.mismatchReport.weeeUResponse === "disputed" ? "🚫 โต้แย้ง" :
               "⏳ รอตอบ"}
            </span></p>
          </div>
          {!job.mismatchReport.weeeUResponse || job.mismatchReport.weeeUResponse === "pending" ? (
            !showMismatchCounter ? (
              <button
                onClick={() => { setShowMismatchCounter(true); setCounterPrice(String(job.mismatchReport!.originalPrice)); }}
                className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-xl"
              >
                💱 เสนอราคาใหม่
              </button>
            ) : (
              <div className="space-y-2">
                <label className="text-xs font-medium text-orange-700">ราคาใหม่ที่เสนอ (Gold)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={counterPrice}
                    onChange={e => setCounterPrice(e.target.value)}
                    min={0}
                    className="flex-1 border border-orange-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-500"
                  />
                  <button
                    onClick={handleCounterOffer}
                    disabled={withdrawing || !counterPrice.trim()}
                    className="px-4 py-2 bg-orange-500 text-white text-sm rounded-xl disabled:opacity-50"
                  >
                    ส่ง
                  </button>
                  <button onClick={() => setShowMismatchCounter(false)}
                    className="px-3 py-2 bg-gray-100 text-gray-600 text-sm rounded-xl">
                    ยกเลิก
                  </button>
                </div>
              </div>
            )
          ) : null}
        </div>
      )}

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
                    ? "border-indigo-400 bg-indigo-50"
                    : opt.disabled
                    ? "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
                    : isDisabled
                    ? "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
                    : "border-gray-100 bg-white hover:border-indigo-200 hover:bg-indigo-50/30"}`}>
                <span className="text-xl">{opt.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-semibold ${isSelected ? "text-indigo-700" : opt.disabled ? "text-gray-400" : "text-gray-800"}`}>
                    {opt.label}
                  </p>
                  <p className="text-xs text-gray-400">{opt.desc}</p>
                </div>
                {deciding === opt.value && <span className="text-xs text-indigo-500">กำลังบันทึก…</span>}
                {isSelected && <span className="text-indigo-500 text-sm">✓</span>}
                {!isSelected && !opt.disabled && deciding === null && <span className="text-gray-300 text-sm">→</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Link back to item */}
      <Link href={`/scrap/browse/${job.scrapItemId}`}
        className="block w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold py-3 rounded-xl transition-colors">
        ดูรายละเอียดซาก →
      </Link>

      {/* S7 — ถอน offer (เฉพาะ in_progress) */}
      {job.canWithdraw && job.status !== "cancelled" && (
        <div className="border-t border-gray-200 pt-4">
          {!showWithdrawDialog ? (
            <button
              onClick={() => setShowWithdrawDialog(true)}
              className="w-full py-3 bg-white hover:bg-red-50 text-red-600 border-2 border-red-200 text-sm font-semibold rounded-xl transition-colors"
            >
              🚫 ถอน offer (S7 — WeeeR ยกเลิกหลังยืนยัน)
            </button>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-3">
              <p className="text-sm font-bold text-red-700">⚠️ ยืนยันถอน offer?</p>
              <p className="text-xs text-red-600">
                การถอนหลังยืนยันอาจถูกหักค่าเสียหาย (ตามนโยบาย 1: 3 สาเหตุ)
              </p>
              <div>
                <label className="block text-xs font-medium text-red-700 mb-1">
                  สาเหตุ <span className="text-red-500">*</span>
                </label>
                <select
                  value={withdrawReason}
                  onChange={e => setWithdrawReason(e.target.value)}
                  className="w-full border border-red-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-red-500"
                >
                  <option value="">-- เลือกสาเหตุ --</option>
                  <option value="capacity_full">ความจุคลังเต็ม</option>
                  <option value="vehicle_breakdown">รถเสีย/อุบัติเหตุ</option>
                  <option value="force_majeure">สุดวิสัย (ระบุใน notes)</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleWithdraw}
                  disabled={withdrawing || !withdrawReason}
                  className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-bold rounded-xl disabled:opacity-50"
                >
                  {withdrawing ? "กำลังถอน..." : "ยืนยันถอน offer"}
                </button>
                <button
                  onClick={() => { setShowWithdrawDialog(false); setWithdrawReason(""); }}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl"
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* S7 — cancelled state */}
      {job.status === "cancelled" && (
        <div className="bg-gray-100 border border-gray-200 rounded-2xl p-4 text-center text-sm text-gray-600">
          ❌ offer ถูกถอนแล้ว — ลูกค้าได้รับแจ้งแล้ว
        </div>
      )}
    </div>
  );
}
