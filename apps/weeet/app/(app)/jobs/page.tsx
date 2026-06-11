"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { repairApi } from "@/lib/api";
import type { RepairJob, RepairJobStatus } from "@/lib/types";

// walk_in jobs belong to WeeeR (in-store) — never show on WeeeT
const EXCLUDED_SERVICE_TYPES = ["walk_in"] as const;

// ── Wave1: mock job list (aligned with services.fixtures.ts from Wave0 deliverable #6) ──
// Used as placeholder when real API is unavailable (no backend in Wave1 shell).
// Shape mirrors RepairJob (lib/types.ts) — serviceType on_site/pickup/parcel only.
const WAVE1_MOCK_JOBS: RepairJob[] = [
  {
    id: "service-repair-001",
    job_no: "JOB-W1-001",
    status: "assigned",
    service_type: "on_site",
    scheduled_at: "2026-06-20T09:00:00Z",
    title: "ซ่อมแอร์ Mitsubishi 12000 BTU",
    appliance_name: "เครื่องปรับอากาศ",
    customer_name: "คุณสมชาย",
    customer_address: "123 ถ.สุขุมวิท กรุงเทพฯ",
    point_amount: 800,
    deadline: "2026-06-20T00:00:00Z",
  },
  {
    id: "service-repair-002",
    job_no: "JOB-W1-002",
    status: "in_progress",
    service_type: "pickup",
    scheduled_at: "2026-06-12T10:00:00Z",
    title: "ซ่อมเครื่องซักผ้า Samsung 8kg",
    appliance_name: "เครื่องซักผ้า",
    customer_name: "คุณมาลี",
    customer_address: "456 ถ.รัชดา กรุงเทพฯ",
    point_amount: 450,
    deadline: "2026-06-12T00:00:00Z",
  },
  {
    id: "service-maintain-001",
    job_no: "JOB-W1-003",
    status: "awaiting_decision",
    service_type: "on_site",
    scheduled_at: "2026-06-15T08:00:00Z",
    title: "ล้างแอร์ 2 เครื่อง",
    appliance_name: "เครื่องปรับอากาศ",
    customer_name: "คุณวิชัย",
    customer_address: "789 ถ.ลาดพร้าว กรุงเทพฯ",
    point_amount: 500,
    deadline: "2026-06-15T00:00:00Z",
  },
];

type TabKey = "all" | "on_site" | "pickup" | "parcel" | "done";

const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "ทั้งหมด" },
  { key: "on_site", label: "ออนไซต์" },
  { key: "pickup", label: "🚛 รับเครื่อง" },
  { key: "parcel", label: "📦 พัสดุ" },
  { key: "done", label: "เสร็จ/ปิด" },
];

const DONE_STATUSES: RepairJobStatus[] = [
  "completed", "closed", "cancelled", "converted_scrap", "delivered",
  "handed_off_to_weeer",
];
const AWAITING_STATUSES: RepairJobStatus[] = [
  "awaiting_entry", "awaiting_decision", "awaiting_user", "awaiting_review",
];

function statusLabel(s: RepairJobStatus): string {
  const map: Record<RepairJobStatus, string> = {
    assigned: "รับงาน",
    traveling: "กำลังเดินทาง",
    arrived: "ถึงที่แล้ว",
    awaiting_entry: "รออนุมัติเข้า",
    inspecting: "กำลังตรวจสอบ",
    awaiting_decision: "รอตัดสินใจ",
    awaiting_user: "รอลูกค้า",
    in_progress: "กำลังซ่อม",
    completed: "ซ่อมเสร็จ",
    awaiting_review: "รอตรวจ",
    closed: "ปิดงาน",
    cancelled: "ยกเลิก",
    converted_scrap: "โอนรับซื้อ",
    // Pickup states
    en_route_pickup: "กำลังไปรับ",
    picked_up: "รับเครื่องแล้ว",
    appliance_at_shop: "เครื่องถึงร้าน",
    tested_ok: "ทดสอบผ่าน",
    en_route_delivery: "กำลังส่งคืน",
    delivered: "ส่งคืนแล้ว",
    // Parcel states
    handed_off_to_weeer: "ส่งกลับ WeeeR",
  };
  return map[s] ?? s;
}

function statusColor(s: RepairJobStatus): string {
  if (DONE_STATUSES.includes(s)) {
    if (s === "cancelled") return "bg-red-900/60 text-red-300";
    if (s === "converted_scrap") return "bg-gray-700/40 text-gray-300";
    return "bg-green-900/60 text-green-300";
  }
  if (AWAITING_STATUSES.includes(s)) return "bg-amber-900/60 text-amber-300";
  return "bg-blue-900/60 text-blue-300";
}

function nextActionLabel(s: RepairJobStatus): string | null {
  const map: Partial<Record<RepairJobStatus, string>> = {
    // On-site
    assigned: "ออกเดินทาง →",
    traveling: "บันทึกถึงที่ →",
    arrived: "ขอเข้าบ้าน / ตรวจสอบ →",
    awaiting_entry: "รออนุมัติ...",
    inspecting: "ส่งรายงานตรวจสอบ →",
    awaiting_decision: "วินิจฉัย →",
    awaiting_user: "รอลูกค้า...",
    in_progress: "บันทึกหลังซ่อม →",
    awaiting_review: "รอ WeeeR ตรวจ...",
    // Pickup
    en_route_pickup: "บันทึกถึงที่ (รับเครื่อง) →",
    picked_up: "ยืนยันถึงร้าน →",
    appliance_at_shop: "รอซ่อม / บันทึกผล →",
    tested_ok: "ออกเดินทางส่งคืน →",
    en_route_delivery: "บันทึกส่งคืน →",
  };
  return map[s] ?? null;
}

export default function JobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<RepairJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    repairApi
      .listMyJobs()
      .then((data) => {
        // Wave1: API may return undefined when no backend — fall back to mock
        const list = data ?? [];
        if (list.length === 0) {
          // Wave1 shell: use mock-fixtures-aligned placeholder jobs
          setJobs(WAVE1_MOCK_JOBS);
          return;
        }
        // Safety filter: exclude walk_in even if backend returns them
        setJobs(
          list.filter(
            (j) =>
              !EXCLUDED_SERVICE_TYPES.includes(
                j.service_type as typeof EXCLUDED_SERVICE_TYPES[number]
              )
          )
        );
      })
      .catch(() => {
        // Wave1: no backend — show mock jobs without error banner
        setJobs(WAVE1_MOCK_JOBS);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = jobs.filter((job) => {
    const matchTab =
      activeTab === "all" ||
      (activeTab === "on_site" &&
        job.service_type === "on_site" &&
        !DONE_STATUSES.includes(job.status)) ||
      (activeTab === "pickup" &&
        job.service_type === "pickup" &&
        !DONE_STATUSES.includes(job.status)) ||
      (activeTab === "parcel" &&
        job.service_type === "parcel" &&
        !DONE_STATUSES.includes(job.status)) ||
      (activeTab === "done" && DONE_STATUSES.includes(job.status));
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      (job.customer_name ?? "").toLowerCase().includes(q) ||
      job.job_no.toLowerCase().includes(q) ||
      (job.appliance_name ?? "").toLowerCase().includes(q);
    return matchTab && matchSearch;
  });

  function tabCount(key: TabKey): number {
    if (key === "all") return jobs.length;
    if (key === "on_site")
      return jobs.filter(
        (j) => j.service_type === "on_site" && !DONE_STATUSES.includes(j.status)
      ).length;
    if (key === "pickup")
      return jobs.filter(
        (j) => j.service_type === "pickup" && !DONE_STATUSES.includes(j.status)
      ).length;
    if (key === "parcel")
      return jobs.filter(
        (j) => j.service_type === "parcel" && !DONE_STATUSES.includes(j.status)
      ).length;
    return jobs.filter((j) => DONE_STATUSES.includes(j.status)).length;
  }

  // Wave1: detect mock mode (jobs from placeholder, not real backend)
  const isMockData = jobs.length > 0 && jobs[0].job_no.startsWith("JOB-W1-");

  return (
    <div className="px-4 pt-5 pb-4 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-white">รายการงานซ่อม</h1>
        <p className="text-xs text-gray-400 mt-0.5">ทั้งหมด {jobs.length} รายการ</p>
      </div>

      {/* Wave1 Shell banner — dev/review only */}
      {isMockData && process.env.NEXT_PUBLIC_DEV_NAV === "true" && (
        <div className="bg-blue-950/40 border border-blue-800/60 rounded-xl px-3 py-2 text-xs text-blue-300">
          🧱 Wave1 Shell — แสดงข้อมูล Mock (API ยังไม่พร้อม)
        </div>
      )}

      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
        <input
          type="text"
          placeholder="ค้นหา ชื่อลูกค้า / เลขงาน / เครื่องใช้ไฟฟ้า"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-gray-800 border border-gray-600 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-weeet-primary"
        />
      </div>

      <div className="flex gap-1 bg-gray-800 p-1 rounded-xl overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-weeet-primary text-white"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            {tab.label}
            <span className="ml-1 opacity-70">({tabCount(tab.key)})</span>
          </button>
        ))}
      </div>

      {loading && (
        <div className="text-center py-12 text-gray-400 text-sm">กำลังโหลด...</div>
      )}

      {error && (
        <div className="bg-red-950/50 border border-red-800 rounded-xl p-4 text-sm text-red-300">
          โหลดรายการไม่สำเร็จ: {error}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="bg-gray-800 rounded-xl p-8 text-center border border-gray-700">
          <p className="text-3xl mb-2">📋</p>
          <p className="text-gray-400 text-sm">ไม่พบรายการ</p>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((job) => {
            const action = nextActionLabel(job.status);
            return (
              <button
                key={job.id}
                onClick={() => router.push(`/jobs/${job.id}`)}
                className="w-full bg-gray-800 border border-gray-700 hover:border-weeet-primary/50 rounded-xl p-4 text-left space-y-2 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-gray-500 font-mono">{job.job_no}</p>
                    <p className="text-white font-semibold text-sm mt-0.5">
                      {job.customer_name ?? "ลูกค้า"}
                    </p>
                    {/* Sub-4: แสดง title ถ้ามี ไม่งั้นใช้ appliance_name */}
                    <p className="text-gray-400 text-xs">
                      {job.title ?? job.appliance_name ?? job.service_type}
                    </p>
                    {/* Sub-4: แสดง point_amount ถ้ามี */}
                    {job.point_amount != null && (
                      <p className="text-weeet-primary text-xs mt-0.5">
                        💰 {job.point_amount.toLocaleString()} pts
                      </p>
                    )}
                    {/* Source badge — D64 */}
                    {job.source?.type === "purchased_scrap" ? (
                      <span className="inline-block mt-1 bg-weeet-surface/40 border border-weeet-dark text-weeet-primary text-xs px-2 py-0.5 rounded">
                        ซื้อจากซาก{job.source.refId ? `: ${job.source.refId}` : ""}
                      </span>
                    ) : (
                      <span className="inline-block mt-1 bg-blue-900/40 border border-blue-700 text-blue-300 text-xs px-2 py-0.5 rounded">
                        ลูกค้า
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${statusColor(job.status)}`}
                    >
                      {statusLabel(job.status)}
                    </span>
                    {/* Sub-4: แสดง deadline ถ้ามี */}
                    {job.deadline && (
                      <span className="text-xs text-amber-400 shrink-0">
                        ⏰ {new Date(job.deadline).toLocaleDateString("th-TH", { month: "short", day: "numeric" })}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-500 truncate">
                  {job.customer_address ?? ""}
                </p>
                {action && (
                  <p className="text-xs text-weeet-primary font-medium">{action}</p>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
