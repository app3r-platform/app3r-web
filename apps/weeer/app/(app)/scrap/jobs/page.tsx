"use client";

// ── WeeeR Scrap Jobs — R-27 (S5-S12: WeeeT assign, withdraw, dispute) ────────

import { useState } from "react";
import Link from "next/link";

import { MockAnnoOrigin, MockAnnoXApp } from "@/components/MockAnno";
import type { ScrapJob, ScrapJobStatus } from "../_lib/types";
import {
  SCRAP_JOB_STATUS_LABEL, SCRAP_JOB_STATUS_COLOR,
  SCRAP_JOB_OPTION_LABEL,
  CONDITION_GRADE_LABEL, CONDITION_GRADE_COLOR,
} from "../_lib/types";

const STATUS_FILTERS: { value: ScrapJobStatus | ""; label: string }[] = [
  { value: "", label: "ทั้งหมด" },
  { value: "pending_decision", label: "รอตัดสินใจ" },
  { value: "in_progress", label: "กำลังดำเนินการ" },
  { value: "completed", label: "เสร็จสิ้น" },
  { value: "cancelled", label: "ยกเลิก" },
];

// Mock ScrapJobs (Mockup 2.3)
const MOCK_JOBS: ScrapJob[] = [
  {
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
  {
    id: "SJ002", scrapItemId: "SC002", buyerId: "S1", buyerType: "WeeeR",
    decision: "repair_and_sell",
    status: "pending_decision",
    createdAt: "2026-05-21", updatedAt: "2026-05-22",
    scrapItemDescription: "Daikin แอร์ FTKF25XV2S",
    conditionGrade: "grade_B",
    offerPrice: 800, isFree: false,
    escrowStatus: "locked",
    reOfferReason: "T แจ้ง: คอมเพรสเซอร์มีรอยรั่ว ซากไม่ตรงปก",  // S8 re-offer scenario
  },
  {
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
  {
    id: "SJ004", scrapItemId: "SC004", buyerId: "S1", buyerType: "WeeeR",
    decision: "resell_parts",
    status: "in_progress",
    createdAt: "2026-05-17", updatedAt: "2026-05-22",
    scrapItemDescription: "HP Notebook 15s-fq5xxx",
    conditionGrade: "grade_B",
    offerPrice: 1500, isFree: false,
    weeeTId: "T02", weeeTName: "ช่างวิทย์",
    escrowStatus: "locked",
    fromRepairJobId: "R-2024-089",  // S12
  },
  {
    id: "SJ005", scrapItemId: "SC005", buyerId: "S1", buyerType: "WeeeR",
    decision: "resell_as_scrap",
    status: "withdrawn",
    createdAt: "2026-05-16", updatedAt: "2026-05-18",
    scrapItemDescription: "Panasonic เครื่องซักผ้า NA-F70LG1",
    conditionGrade: "grade_A",
    offerPrice: 950, isFree: false,
    escrowStatus: "refunded",
    withdrawReason: "shop_fault",  // S7
  },
  {
    id: "SJ006", scrapItemId: "SC005", buyerId: "S1", buyerType: "WeeeR",
    decision: "resell_parts",
    status: "in_progress",
    createdAt: "2026-05-19", updatedAt: "2026-05-22",
    scrapItemDescription: "Panasonic เครื่องซักผ้า NA-F70LG1",
    conditionGrade: "grade_A",
    offerPrice: 700, isFree: false,
    escrowStatus: "locked",
    disputeReason: "WeeeU ส่งซากผิดชิ้น ไม่ตรงตามที่ลงประกาศ",  // S11
  },
];

export default function ScrapJobsPage() {
  const [statusFilter, setStatusFilter] = useState<ScrapJobStatus | "">("");

  const filtered = statusFilter
    ? MOCK_JOBS.filter(j => j.status === statusFilter)
    : MOCK_JOBS;

  const pendingCount = MOCK_JOBS.filter(j => j.status === "pending_decision").length;
  const disputedCount = MOCK_JOBS.filter(j => !!j.disputeReason).length;

  return (
    <div className="space-y-5">
      {/* §5 Origin + §8 Cross-app annotations */}
      <MockAnnoOrigin from="◀ มาจาก: R-70 · /scrap (tab 'งานของฉัน') หรือ push notification งานใหม่" />
      <MockAnnoXApp screenLabel="R-27: Jobs">
        <p>• <strong>WeeeU :3002</strong> [U-33] เจ้าของซากเห็นสถานะ accepted/in_progress</p>
        <p>• <strong>WeeeT :3003</strong> [T-22] ช่างเห็น jobs ที่ได้รับมอบหมาย
          <a href="http://localhost:3003/scrap" className="underline ml-1">/scrap</a>
        </p>
        <p>• <strong>Admin :3000</strong> [A-08] Admin ดูภาพรวม ScrapJobs ทั้งหมด
          <a href="http://localhost:3000/scrap/jobs" className="underline ml-1">/scrap/jobs</a>
        </p>
      </MockAnnoXApp>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/scrap" className="text-gray-400 hover:text-gray-600">←</Link>
          <h1 className="text-xl font-bold text-gray-900">🔧 งานซากของฉัน</h1>
        </div>
        <div className="flex gap-2">
          {pendingCount > 0 && (
            <span className="text-xs bg-yellow-100 text-yellow-700 font-semibold px-2.5 py-1 rounded-full">
              {pendingCount} รอตัดสินใจ
            </span>
          )}
          {disputedCount > 0 && (
            <span className="text-xs bg-red-100 text-red-700 font-semibold px-2.5 py-1 rounded-full">
              ⚠️ {disputedCount} พิพาท
            </span>
          )}
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {STATUS_FILTERS.map(f => (
          <button key={f.value} onClick={() => setStatusFilter(f.value)}
            className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full transition-colors
              ${statusFilter === f.value
                ? "bg-[#FF663A] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">ไม่มีงาน</div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl divide-y divide-gray-50">
          {filtered.map(job => (
            <Link key={job.id} href={`/scrap/jobs/${job.id}`}
              className="block px-4 py-3 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${SCRAP_JOB_STATUS_COLOR[job.status]}`}>
                      {SCRAP_JOB_STATUS_LABEL[job.status]}
                    </span>
                    {/* S7: withdrawn */}
                    {job.withdrawReason && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">ถอนแล้ว</span>
                    )}
                    {/* S8: re-offer */}
                    {job.reOfferReason && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">⚠️ ซากไม่ตรง</span>
                    )}
                    {/* S11: dispute */}
                    {job.disputeReason && (
                      <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium">🚨 พิพาท</span>
                    )}
                    {/* S12: Repair source */}
                    {job.fromRepairJobId && (
                      <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">
                        🔧 Repair #{job.fromRepairJobId}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {job.scrapItemDescription ?? `งาน ${job.id}`}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {job.conditionGrade && (
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${CONDITION_GRADE_COLOR[job.conditionGrade]}`}>
                        {CONDITION_GRADE_LABEL[job.conditionGrade]}
                      </span>
                    )}
                    {job.decision && job.status !== "pending_decision" && (
                      <span className="text-xs text-gray-400">{SCRAP_JOB_OPTION_LABEL[job.decision]}</span>
                    )}
                    {/* WeeeT assign (S6) */}
                    {job.weeeTName && (
                      <span className="text-xs text-gray-400">🔧 {job.weeeTName}</span>
                    )}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold text-[#FF663A]">
                    {job.isFree ? "ฟรี" : `${(job.offerPrice ?? 0).toLocaleString()} pts`}
                  </p>
                  {/* Escrow status */}
                  {job.escrowStatus === "locked" && (
                    <span className="text-xs text-[#F04E20] font-medium">🔐 lock</span>
                  )}
                  {job.escrowStatus === "released" && (
                    <span className="text-xs text-green-600 font-medium">✅ release</span>
                  )}
                  {job.escrowStatus === "refunded" && (
                    <span className="text-xs text-gray-500 font-medium">↩️ คืน</span>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(job.updatedAt).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
