"use client";
// ── listings/maintain/page.tsx — WeeeR Maintain Listings (Sub-1 D5) ──────────
// D5: แสดง maintain job listings พร้อม default filter = ลงทะเบียนรับ
// Toggle "ดูทั้งหมด" เพื่อ clear filter
// Source: mock data (Backend endpoint ขาด sensitive fields — Phase D)
// TODO: connect real Backend endpoint when sensitive fields added to DB schema
// หมายเหตุ: maintain ทุก job มี serviceType: 1 (on-site เท่านั้น)

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  WEEER_MAINTAIN_JOBS_SORTED,
} from "../../../../lib/mock-data/maintain-jobs";
import {
  MOCK_WEEER_PROFILE,
} from "../../../../lib/mock-data/weeer-profile";
import {
  SERVICE_TYPE_SHORT,
} from "../../../../lib/types/listings-jobs";
import type { ServiceTypeId } from "../../../../lib/types/listings-jobs";

const SERVICE_TYPE_COLOR: Record<ServiceTypeId, string> = {
  1: "bg-blue-100 text-blue-700",
  2: "bg-purple-100 text-purple-700",
  3: "bg-orange-100 text-orange-700",
  4: "bg-gray-100 text-gray-600",
};

export default function MaintainListingsPage() {
  // D5: default = filter โดย registered service types ของ WeeeR
  const [showAll, setShowAll] = useState(false);

  const registeredTypes = MOCK_WEEER_PROFILE.registeredServiceTypes;

  const displayed = useMemo(() => {
    if (showAll) return WEEER_MAINTAIN_JOBS_SORTED;
    return WEEER_MAINTAIN_JOBS_SORTED.filter((j) =>
      (registeredTypes as number[]).includes(j.serviceType)
    );
  }, [showAll, registeredTypes]);

  const hiddenCount = WEEER_MAINTAIN_JOBS_SORTED.length - displayed.length;

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">🛠️ งานบำรุง (Maintain)</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            ประกาศจากลูกค้า — คลิกเพื่อดูรายละเอียดเต็ม
          </p>
        </div>
        <Link href="/listings/repair" className="text-xs text-green-600 hover:text-green-800 underline">
          ← งานซ่อม
        </Link>
      </div>

      {/* D5 Filter toggle */}
      <div className="bg-green-50 border border-green-100 rounded-2xl p-4 flex items-center justify-between gap-4">
        <div>
          <div className="text-sm font-medium text-green-800">
            {showAll ? "แสดงทุกประเภท" : "แสดงเฉพาะที่ลงทะเบียนรับ"}
          </div>
          <div className="text-xs text-green-600 mt-0.5">
            ลงทะเบียนรับ:{" "}
            {registeredTypes
              .map((t) => SERVICE_TYPE_SHORT[t])
              .join(", ")}
            {!showAll && hiddenCount > 0 && (
              <span className="ml-1 text-gray-400">({hiddenCount} งานซ่อนอยู่)</span>
            )}
          </div>
        </div>
        <button
          onClick={() => setShowAll((v) => !v)}
          className={`text-xs font-medium px-3 py-1.5 rounded-xl border transition-colors shrink-0 ${
            showAll
              ? "bg-white border-green-300 text-green-700 hover:bg-green-50"
              : "bg-green-700 border-green-700 text-white hover:bg-green-800"
          }`}
        >
          {showAll ? "← กรองตามที่ลงทะเบียน" : "ดูทั้งหมด"}
        </button>
      </div>

      {/* Mock data notice */}
      <div className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
        ⚙️ ข้อมูลตัวอย่าง — sensitive fields แสดงในหน้ารายละเอียด
        {/* TODO: connect real Backend endpoint when sensitive fields added to DB schema */}
      </div>

      {/* Info: maintain always serviceType 1 */}
      {!showAll && registeredTypes.includes(1) && (
        <div className="text-xs text-blue-600 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
          ℹ️ งานบำรุงทั้งหมดเป็น on-site เท่านั้น — ร้านของคุณลงทะเบียนรับ on-site ✅
        </div>
      )}

      {/* Job list */}
      {displayed.length === 0 ? (
        <div className="p-10 text-center space-y-2">
          <div className="text-3xl">📭</div>
          <p className="text-sm text-gray-500">ไม่มีงานที่ตรงกับประเภทที่ลงทะเบียน</p>
          <button
            onClick={() => setShowAll(true)}
            className="text-sm text-green-600 underline"
          >
            ดูงานทั้งหมด
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((job) => (
            <Link
              key={job.id}
              href={`/listings/maintain/${job.id}`}
              className="block bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:border-green-200 hover:shadow transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  {/* Badges */}
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${SERVICE_TYPE_COLOR[job.serviceType]}`}>
                      {SERVICE_TYPE_SHORT[job.serviceType]}
                    </span>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                      {job.applianceType}
                    </span>
                    {job.featured && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                        ⭐ แนะนำ
                      </span>
                    )}
                  </div>
                  {/* Title */}
                  <p className="text-sm font-semibold text-gray-800 line-clamp-2">{job.title}</p>
                  {/* Meta */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
                    <span className="text-xs text-gray-400">📍 {job.area}</span>
                    <span className="text-xs text-gray-400">
                      📅 {new Date(job.postedAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" })}
                    </span>
                  </div>
                </div>
                {/* Budget */}
                <div className="text-right shrink-0">
                  <div className="text-xs text-gray-400">งบประมาณ</div>
                  <div className="text-sm font-bold text-green-700">{job.estimatedBudget.toLocaleString()} ฿</div>
                  <div className="text-xs text-gray-400">ค่าบริการ {job.feePreview} pts</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
