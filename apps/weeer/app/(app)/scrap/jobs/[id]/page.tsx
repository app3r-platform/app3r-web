"use client";

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
  const [job, setJob] = useState<ScrapJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deciding, setDeciding] = useState<ScrapJobOption | null>(null);

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
    </div>
  );
}
