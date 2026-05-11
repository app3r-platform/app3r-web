"use client";

// ── MultiJobDashboard — Phase C-5 ────────────────────────────────────────────
// Overview widget showing active repair + maintain jobs for the shop dashboard

import Link from "next/link";
import { STATUS_COLOR, STATUS_LABEL } from "../../app/(app)/repair/_lib/types";
import type { RepairJobStatus } from "../../app/(app)/repair/_lib/types";
import { MAINTAIN_STATUS_COLOR, MAINTAIN_STATUS_LABEL } from "../../app/(app)/maintain/_lib/types";
import type { MaintainStatus } from "../../app/(app)/maintain/_lib/types";

interface ActiveRepairJob {
  id: string;
  appliance_name: string;
  status: RepairJobStatus;
  weeet_name: string;
}

interface ActiveMaintainJob {
  id: string;
  serviceCode: string;
  applianceType: "AC" | "WashingMachine";
  status: MaintainStatus;
  technicianId?: string;
}

interface MultiJobDashboardProps {
  repairJobs: ActiveRepairJob[];
  maintainJobs: ActiveMaintainJob[];
}

export function MultiJobDashboard({
  repairJobs,
  maintainJobs,
}: MultiJobDashboardProps) {
  const totalActive = repairJobs.length + maintainJobs.length;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <h2 className="font-semibold text-gray-800 text-sm">งานที่กำลังดำเนิน</h2>
          <p className="text-xs text-gray-400 mt-0.5">{totalActive} งาน</p>
        </div>
      </div>

      {/* Repair jobs */}
      {repairJobs.length > 0 && (
        <div className="px-4 py-2">
          <p className="text-xs font-medium text-gray-400 mb-2">🔧 งานซ่อม</p>
          <div className="space-y-2">
            {repairJobs.map((job) => (
              <Link
                key={job.id}
                href={`/repair/jobs/${job.id}/progress`}
                className="flex items-center justify-between gap-2 hover:bg-green-50 rounded-lg px-2 py-1.5 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-gray-800 truncate">{job.appliance_name}</p>
                  <p className="text-xs text-gray-400 truncate">👷 {job.weeet_name}</p>
                </div>
                <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[job.status]}`}>
                  {STATUS_LABEL[job.status]}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Maintain jobs */}
      {maintainJobs.length > 0 && (
        <div className="px-4 py-2">
          <p className="text-xs font-medium text-gray-400 mb-2">🫧 งาน Maintain</p>
          <div className="space-y-2">
            {maintainJobs.map((job) => (
              <Link
                key={job.id}
                href={`/maintain/jobs/${job.id}/progress`}
                className="flex items-center justify-between gap-2 hover:bg-green-50 rounded-lg px-2 py-1.5 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-gray-800 truncate">
                    {job.applianceType === "AC" ? "❄️ แอร์" : "🫧 เครื่องซักผ้า"} — {job.serviceCode}
                  </p>
                  {!job.technicianId && (
                    <p className="text-xs text-orange-600">⚠️ ยังไม่ได้มอบหมายช่าง</p>
                  )}
                </div>
                <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${MAINTAIN_STATUS_COLOR[job.status]}`}>
                  {MAINTAIN_STATUS_LABEL[job.status]}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {totalActive === 0 && (
        <div className="px-4 py-6 text-center text-sm text-gray-400">
          ไม่มีงานที่กำลังดำเนิน
        </div>
      )}

      {/* Footer links */}
      <div className="flex divide-x divide-gray-100">
        <Link href="/repair/jobs" className="flex-1 text-center text-xs text-green-700 hover:text-green-900 py-3 transition-colors">
          ดูงานซ่อม →
        </Link>
        <Link href="/maintain/jobs" className="flex-1 text-center text-xs text-green-700 hover:text-green-900 py-3 transition-colors">
          ดูงาน Maintain →
        </Link>
      </div>
    </div>
  );
}
