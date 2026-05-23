"use client";
// WeeeT Scrap — งานรับซากที่ assign ให้ช่าง
// Sub-CMD C ขั้น 2.3 · Mockup คลิกได้ · escrow R→U (กลับทิศ)
// เคส: S1-S4 ปกติ · S8 ของไม่ตรง · S9 No-show · S12 ลิงก์ Repair
import { useRouter } from "next/navigation";

type ScrapStatus =
  | "assigned"       // S1-S4: รอรับงาน
  | "gps_checked"    // GPS check-in แล้ว
  | "confirmed"      // S1-S4: ยืนยันรับซากแล้ว
  | "mismatch"       // S8: แจ้งของไม่ตรง
  | "noshow"         // S9: ลูกค้าไม่อยู่
  | "cancelled";     // ถูกยกเลิก

type ScrapGrade = "A" | "B" | "C";

type ScrapJob = {
  id: string;
  customerName: string;
  customerAddress: string;
  itemType: string;
  grade: ScrapGrade;
  status: ScrapStatus;
  assignedAt: string;
  repairJobId?: string; // S12 — ถ้ามาจากงานซ่อม
  offerPrice?: number;  // null = ทิ้งฟรี
};

// Mock data — replace with API in Phase 4
const MOCK_SCRAP_JOBS: ScrapJob[] = [
  {
    id: "scrap-001",
    customerName: "คุณสมชาย ใจดี",
    customerAddress: "123 ถ.พหลโยธิน แขวงลาดยาว เขตจตุจักร กทม.",
    itemType: "แอร์ Daikin 12000 BTU",
    grade: "B",
    status: "assigned",
    assignedAt: "2026-05-23T09:00:00Z",
    offerPrice: 800,
  },
  {
    id: "scrap-002",
    customerName: "คุณสุดา รักสะอาด",
    customerAddress: "456 ถ.ลาดพร้าว แขวงจอมพล เขตจตุจักร กทม.",
    itemType: "แอร์ Mitsubishi 9000 BTU",
    grade: "C",
    status: "gps_checked",
    assignedAt: "2026-05-23T10:30:00Z",
    repairJobId: "R-2026-0412", // S12 — มาจากงานซ่อม
    offerPrice: undefined, // ทิ้งฟรี
  },
  {
    id: "scrap-003",
    customerName: "คุณวิชัย ประสิทธิ์",
    customerAddress: "789 ซ.รัชดา 18 เขตห้วยขวาง กทม.",
    itemType: "แอร์ Samsung 18000 BTU",
    grade: "A",
    status: "confirmed",
    assignedAt: "2026-05-22T14:00:00Z",
    offerPrice: 1500,
  },
  {
    id: "scrap-004",
    customerName: "คุณมาลี สวรรค์",
    customerAddress: "101 ถ.เพชรบุรี เขตราชเทวี กทม.",
    itemType: "แอร์ LG 12000 BTU",
    grade: "B",
    status: "mismatch",
    assignedAt: "2026-05-22T11:00:00Z",
    offerPrice: 700,
  },
  {
    id: "scrap-005",
    customerName: "คุณปิยะ หาญกล้า",
    customerAddress: "202 ถ.อโศก เขตวัฒนา กทม.",
    itemType: "แอร์ Carrier 24000 BTU",
    grade: "C",
    status: "noshow",
    assignedAt: "2026-05-21T09:00:00Z",
    offerPrice: 300,
  },
];

const STATUS_CONFIG: Record<ScrapStatus, { label: string; color: string }> = {
  assigned:    { label: "รอรับงาน",        color: "bg-weeet-primary/20 text-weeet-primary border-weeet-dark/40" },
  gps_checked: { label: "GPS แล้ว — ตรวจซาก", color: "bg-blue-900/30 text-blue-300 border-blue-700/40" },
  confirmed:   { label: "รับซากแล้ว",      color: "bg-green-900/30 text-green-300 border-green-700/40" },
  mismatch:    { label: "แจ้งของไม่ตรง",   color: "bg-amber-900/30 text-amber-300 border-amber-700/40" },
  noshow:      { label: "ลูกค้าไม่อยู่",   color: "bg-orange-900/30 text-orange-300 border-orange-700/40" },
  cancelled:   { label: "ถูกยกเลิก",       color: "bg-gray-700/40 text-gray-400 border-gray-600/40" },
};

const GRADE_COLOR: Record<ScrapGrade, string> = {
  A: "text-green-400 bg-green-900/30 border-green-700/40",
  B: "text-yellow-400 bg-yellow-900/20 border-yellow-700/30",
  C: "text-red-400 bg-red-900/20 border-red-700/30",
};

export default function ScrapListPage() {
  const router = useRouter();

  const activeJobs = MOCK_SCRAP_JOBS.filter(
    (j) => j.status === "assigned" || j.status === "gps_checked"
  );
  const doneJobs = MOCK_SCRAP_JOBS.filter(
    (j) => j.status !== "assigned" && j.status !== "gps_checked"
  );

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="sticky top-[41px] bg-gray-950/90 backdrop-blur-sm border-b border-gray-800 px-4 py-3 z-10">
        <h1 className="font-bold text-white text-base">🗑️ งานรับซาก</h1>
        <p className="text-xs text-gray-400">รายการที่ WeeeR มอบหมายให้คุณ</p>
      </div>

      <div className="px-4 pt-4 space-y-5">
        {/* Active jobs */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            รอดำเนินการ ({activeJobs.length})
          </h2>
          {activeJobs.length === 0 ? (
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 text-center">
              <p className="text-3xl mb-2">✅</p>
              <p className="text-gray-400 text-sm">ไม่มีงานรอดำเนินการ</p>
            </div>
          ) : (
            activeJobs.map((job) => (
              <ScrapJobCard
                key={job.id}
                job={job}
                onClick={() => router.push(`/scrap/${job.id}`)}
              />
            ))
          )}
        </div>

        {/* Done / history */}
        {doneJobs.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              ประวัติ ({doneJobs.length})
            </h2>
            {doneJobs.map((job) => (
              <ScrapJobCard
                key={job.id}
                job={job}
                onClick={() => router.push(`/scrap/${job.id}`)}
                dim
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ScrapJobCard({
  job,
  onClick,
  dim = false,
}: {
  job: ScrapJob;
  onClick: () => void;
  dim?: boolean;
}) {
  const statusCfg = STATUS_CONFIG[job.status];
  const dateLabel = new Date(job.assignedAt).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <button
      onClick={onClick}
      className={`w-full text-left bg-gray-800 border border-gray-700 rounded-xl p-4 space-y-3 transition-colors hover:border-weeet-primary/60 ${dim ? "opacity-60" : ""}`}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white text-sm truncate">{job.itemType}</p>
          <p className="text-xs text-gray-400 truncate">{job.customerName}</p>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className={`text-xs px-2 py-0.5 rounded-full border ${statusCfg.color}`}>
            {statusCfg.label}
          </span>
          <span className={`text-xs px-1.5 py-0.5 rounded border font-semibold ${GRADE_COLOR[job.grade]}`}>
            เกรด {job.grade}
          </span>
        </div>
      </div>

      {/* Address */}
      <p className="text-xs text-gray-500 leading-relaxed">{job.customerAddress}</p>

      {/* Bottom row */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-600">{dateLabel}</span>
        <div className="flex items-center gap-2">
          {/* S12 — from Repair */}
          {job.repairJobId && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-900/30 border border-purple-700/40 text-purple-300">
              🔧 จากงานซ่อม
            </span>
          )}
          {/* Price / Free */}
          {job.offerPrice != null ? (
            <span className="text-xs text-weeet-primary font-semibold">
              ฿{job.offerPrice.toLocaleString()}
            </span>
          ) : (
            <span className="text-xs text-green-400 font-medium">ทิ้งฟรี</span>
          )}
        </div>
      </div>
    </button>
  );
}
