"use client";
import { mockJobs } from "@/lib/mock-data";
import { StatusBadge } from "@/components/StatusBadge";

export default function ReportsPage() {
  const total = mockJobs.length;
  const completed = mockJobs.filter((j) => j.status === "completed").length;
  const inProgress = mockJobs.filter((j) => j.status === "in_progress").length;
  const assigned = mockJobs.filter((j) => j.status === "assigned").length;

  const completionRate = Math.round((completed / total) * 100);

  return (
    <div className="px-4 pt-5 pb-4 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white">รายงาน</h1>
        <p className="text-xs text-gray-400 mt-0.5">สรุปผลการทำงาน</p>
      </div>

      {/* Period selector */}
      <div className="flex gap-2">
        {["วันนี้", "สัปดาห์นี้", "เดือนนี้"].map((period, i) => (
          <button
            key={period}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              i === 0 ? "bg-orange-600 text-white" : "bg-gray-800 text-gray-400 border border-gray-700"
            }`}
          >
            {period}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <p className="text-3xl font-bold text-white">{total}</p>
          <p className="text-xs text-gray-400 mt-1">งานทั้งหมด</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <p className="text-3xl font-bold text-green-400">{completed}</p>
          <p className="text-xs text-gray-400 mt-1">เสร็จสิ้น</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <p className="text-3xl font-bold text-orange-400">{inProgress}</p>
          <p className="text-xs text-gray-400 mt-1">กำลังทำ</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <p className="text-3xl font-bold text-blue-400">{assigned}</p>
          <p className="text-xs text-gray-400 mt-1">รอดำเนินการ</p>
        </div>
      </div>

      {/* Completion rate */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-white">อัตราเสร็จสิ้น</span>
          <span className="text-orange-400 font-bold">{completionRate}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2.5">
          <div
            className="bg-orange-500 h-2.5 rounded-full transition-all"
            style={{ width: `${completionRate}%` }}
          />
        </div>
      </div>

      {/* Recent jobs */}
      <div className="space-y-3">
        <h2 className="font-semibold text-white">ประวัติงานล่าสุด</h2>
        {mockJobs.map((job) => (
          <div
            key={job.id}
            className="bg-gray-800 border border-gray-700 rounded-xl p-3 flex items-center justify-between gap-3"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{job.serviceType}</p>
              <p className="text-xs text-gray-400">{job.customer.name} · {job.jobNo}</p>
            </div>
            <StatusBadge status={job.status} />
          </div>
        ))}
      </div>
    </div>
  );
}
