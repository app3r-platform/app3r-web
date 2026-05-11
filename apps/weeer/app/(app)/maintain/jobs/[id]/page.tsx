"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { maintainApi } from "../../_lib/api";
import type { MaintainJob } from "../../_lib/types";
import {
  MAINTAIN_STATUS_LABEL,
  MAINTAIN_STATUS_COLOR,
  APPLIANCE_LABEL,
  CLEANING_LABEL,
} from "../../_lib/types";

const RECURRING_LABEL: Record<string, string> = {
  "3_months":  "ทุก 3 เดือน",
  "6_months":  "ทุก 6 เดือน",
  "12_months": "ทุก 12 เดือน",
};

export default function MaintainJobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [job, setJob] = useState<MaintainJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    maintainApi.getJob(id)
      .then(setJob)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex items-center justify-center h-48 text-gray-400">กำลังโหลด…</div>;
  if (error) return <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">{error}</div>;
  if (!job) return null;

  const canAssign = ["pending", "assigned"].includes(job.status);

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
            <p className="font-bold text-green-700">{job.totalPrice.toLocaleString()} pts</p>
          </div>
        </div>
      </div>

      {/* Recurring */}
      {job.recurring?.enabled && (
        <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 flex items-start gap-2">
          <span className="text-lg">🔁</span>
          <div>
            <p className="text-sm font-medium text-purple-800">นัดซ้ำ — {RECURRING_LABEL[job.recurring.interval]}</p>
            <p className="text-xs text-purple-600 mt-0.5">
              นัดครั้งต่อไป: {new Date(job.recurring.nextScheduledAt).toLocaleDateString("th-TH", {
                day: "numeric", month: "short", year: "numeric",
              })}
            </p>
            <p className="text-xs text-purple-500 mt-0.5">✨ ส่วนลด 10% สำหรับนัดซ้ำ</p>
          </div>
        </div>
      )}

      {/* Technician */}
      <div className="bg-white border border-gray-100 rounded-xl p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">ช่างผู้รับผิดชอบ</p>
        {job.technicianId ? (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-sm">👷</div>
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

      {/* Progress link */}
      <Link href={`/maintain/jobs/${id}/progress`}
        className="w-full block text-center bg-white border border-green-200 text-green-700 hover:bg-green-50 font-medium py-2.5 rounded-xl transition-colors text-sm">
        📊 ดูความคืบหน้า (Progress)
      </Link>

      {/* Action */}
      {canAssign && (
        <Link href={`/maintain/jobs/${id}/assign`}
          className="w-full block text-center bg-green-700 hover:bg-green-800 text-white font-semibold py-3 rounded-xl transition-colors text-sm">
          👷 มอบหมายช่าง →
        </Link>
      )}
    </div>
  );
}
