"use client";
import { useState } from "react";
import { mockJobs } from "@/lib/mock-data";
import { JobCard } from "@/components/JobCard";
import type { JobStatus } from "@/lib/types";

const TABS: { key: JobStatus | "all"; label: string }[] = [
  { key: "all", label: "ทั้งหมด" },
  { key: "assigned", label: "รอดำเนินการ" },
  { key: "in_progress", label: "กำลังทำ" },
  { key: "completed", label: "เสร็จสิ้น" },
];

export default function JobsPage() {
  const [activeTab, setActiveTab] = useState<JobStatus | "all">("all");
  const [search, setSearch] = useState("");

  const filtered = mockJobs.filter((job) => {
    const matchTab = activeTab === "all" || job.status === activeTab;
    const matchSearch =
      !search ||
      job.customer.name.includes(search) ||
      job.jobNo.includes(search) ||
      job.serviceType.includes(search);
    return matchTab && matchSearch;
  });

  return (
    <div className="px-4 pt-5 pb-4 space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white">รายการงาน</h1>
        <p className="text-xs text-gray-400 mt-0.5">ทั้งหมด {mockJobs.length} รายการ</p>
      </div>

      {/* Search */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
        <input
          type="text"
          placeholder="ค้นหา ชื่อลูกค้า / เลขงาน / ประเภท"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-gray-800 border border-gray-600 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-800 p-1 rounded-xl overflow-x-auto">
        {TABS.map((tab) => {
          const count =
            tab.key === "all"
              ? mockJobs.length
              : mockJobs.filter((j) => j.status === tab.key).length;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === tab.key
                  ? "bg-orange-600 text-white"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              {tab.label}
              <span className="ml-1 opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      {/* List */}
      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      ) : (
        <div className="bg-gray-800 rounded-xl p-8 text-center border border-gray-700">
          <p className="text-3xl mb-2">🔍</p>
          <p className="text-gray-400 text-sm">ไม่พบรายการที่ค้นหา</p>
        </div>
      )}
    </div>
  );
}
