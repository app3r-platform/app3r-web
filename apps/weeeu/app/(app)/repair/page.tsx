"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";

type RepairStatus =
  | "draft" | "open" | "matching" | "assigned"
  | "traveling" | "arrived" | "awaiting_entry"
  | "inspecting" | "awaiting_decision" | "awaiting_user"
  | "in_progress" | "completed" | "awaiting_review"
  | "closed" | "cancelled" | "converted_scrap";

type RepairListing = {
  id: string;
  appliance_name: string;
  issue_summary: string;
  status: string;
  offer_count: number;
  created_at: string;
};

type RepairJob = {
  id: string;
  listing_id: string;
  appliance_name: string;
  issue_summary: string;
  status: RepairStatus;
  weeer_name: string;
  decision_branch: string | null;
  scheduled_at: string;
};

const STATUS_LABEL: Record<RepairStatus, string> = {
  draft: "ร่าง",
  open: "รอ Offer",
  matching: "กำลังจับคู่",
  assigned: "มอบหมายแล้ว",
  traveling: "ช่างกำลังเดินทาง",
  arrived: "ช่างถึงแล้ว",
  awaiting_entry: "รออนุมัติเข้าหน้างาน",
  inspecting: "กำลังตรวจสอบ",
  awaiting_decision: "รอ WeeeR อนุมัติ",
  awaiting_user: "รอคุณตัดสินใจ",
  in_progress: "กำลังซ่อม",
  completed: "ซ่อมเสร็จแล้ว",
  awaiting_review: "รอตรวจรับงาน",
  closed: "สำเร็จ",
  cancelled: "ยกเลิก",
  converted_scrap: "เปลี่ยนเป็นซาก",
};

const STATUS_COLOR: Record<RepairStatus, string> = {
  draft: "bg-gray-100 text-gray-600",
  open: "bg-blue-100 text-blue-700",
  matching: "bg-blue-100 text-blue-700",
  assigned: "bg-indigo-100 text-indigo-700",
  traveling: "bg-amber-100 text-amber-700",
  arrived: "bg-amber-100 text-amber-700",
  awaiting_entry: "bg-orange-100 text-orange-700",
  inspecting: "bg-purple-100 text-purple-700",
  awaiting_decision: "bg-purple-100 text-purple-700",
  awaiting_user: "bg-red-100 text-red-700",
  in_progress: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  awaiting_review: "bg-yellow-100 text-yellow-700",
  closed: "bg-green-100 text-green-700",
  cancelled: "bg-gray-100 text-gray-500",
  converted_scrap: "bg-teal-100 text-teal-700",
};

const ACTIVE_STATUSES: RepairStatus[] = [
  "open", "matching", "assigned", "traveling", "arrived",
  "awaiting_entry", "inspecting", "awaiting_decision",
  "awaiting_user", "in_progress", "completed", "awaiting_review",
];

const CLOSED_STATUSES: RepairStatus[] = ["closed", "cancelled", "converted_scrap"];

function getActionLink(job: RepairJob): string {
  if (job.status === "awaiting_entry") return `/repair/${job.id}/approve-entry`;
  if (job.status === "awaiting_user") {
    return job.decision_branch === "B2.2"
      ? `/repair/${job.id}/decision/b2-2`
      : `/repair/${job.id}/decision/b1-2`;
  }
  if (job.status === "awaiting_review") return `/repair/${job.id}/review`;
  return `/repair/${job.id}`;
}

function needsAction(status: RepairStatus): boolean {
  return ["awaiting_entry", "awaiting_user", "awaiting_review"].includes(status);
}

export default function RepairListPage() {
  const [listings, setListings] = useState<RepairListing[]>([]);
  const [jobs, setJobs] = useState<RepairJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"active" | "closed">("active");

  useEffect(() => {
    Promise.all([
      apiFetch("/api/v1/repair/listings?role=weeeu").then(r => r.ok ? r.json() : { items: [] }),
      apiFetch("/api/v1/repair/jobs?role=weeeu").then(r => r.ok ? r.json() : { items: [] }),
    ]).then(([ld, jd]) => {
      setListings(ld.items ?? []);
      setJobs(jd.items ?? []);
    }).finally(() => setLoading(false));
  }, []);

  const filteredListings =
    filter === "active" ? listings.filter(l => ["open", "matching"].includes(l.status)) : [];
  const filteredJobs = jobs.filter(j =>
    filter === "active" ? ACTIVE_STATUSES.includes(j.status) : CLOSED_STATUSES.includes(j.status)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">งานซ่อม</h1>
        <Link
          href="/repair/new"
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
        >
          + แจ้งซ่อมใหม่
        </Link>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        {(["active", "closed"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`pb-2.5 px-3 text-sm font-medium border-b-2 transition-colors ${
              filter === tab
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab === "active" ? "งานที่ใช้งานอยู่" : "งานที่สำเร็จ/ยกเลิก"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">กำลังโหลด...</div>
      ) : (
        <div className="space-y-3">
          {filteredListings.map(listing => (
            <Link
              key={listing.id}
              href={`/repair/${listing.id}/offers`}
              className="block bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-blue-200 hover:shadow transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900 truncate">{listing.appliance_name}</p>
                  <p className="text-sm text-gray-500 truncate mt-0.5">{listing.issue_summary}</p>
                </div>
                <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap">
                  {listing.offer_count > 0 ? `${listing.offer_count} Offer` : "รอ Offer"}
                </span>
              </div>
              {listing.offer_count > 0 && (
                <p className="text-xs text-blue-600 font-medium mt-2">→ กดเพื่อดูและเลือก Offer</p>
              )}
            </Link>
          ))}

          {filteredJobs.map(job => (
            <Link
              key={job.id}
              href={getActionLink(job)}
              className={`block bg-white rounded-2xl border shadow-sm p-5 hover:shadow transition-all ${
                needsAction(job.status)
                  ? "border-orange-200 ring-1 ring-orange-200"
                  : "border-gray-100 hover:border-blue-200"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900 truncate">{job.appliance_name}</p>
                    {needsAction(job.status) && (
                      <span className="text-xs bg-orange-100 text-orange-700 font-medium px-2 py-0.5 rounded-full">
                        ต้องดำเนินการ
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 truncate mt-0.5">{job.issue_summary}</p>
                  {job.weeer_name && (
                    <p className="text-xs text-gray-400 mt-1">🏪 {job.weeer_name}</p>
                  )}
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${STATUS_COLOR[job.status]}`}>
                  {STATUS_LABEL[job.status]}
                </span>
              </div>
            </Link>
          ))}

          {filteredListings.length === 0 && filteredJobs.length === 0 && (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">🔧</p>
              <p className="text-gray-500 font-medium">
                {filter === "active" ? "ยังไม่มีงานซ่อมที่ใช้งานอยู่" : "ยังไม่มีงานที่สำเร็จ/ยกเลิก"}
              </p>
              {filter === "active" && (
                <Link href="/repair/new" className="mt-3 inline-block text-blue-600 text-sm font-medium hover:underline">
                  + แจ้งซ่อมเครื่องใช้ไฟฟ้า
                </Link>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
