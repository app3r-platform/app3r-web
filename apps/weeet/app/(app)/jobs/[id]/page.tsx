"use client";
import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { repairApi } from "@/lib/api";
import type { RepairJob, RepairJobStatus } from "@/lib/types";

const STATUS_LABEL: Record<RepairJobStatus, string> = {
  assigned: "รับงาน",
  traveling: "กำลังเดินทาง",
  arrived: "ถึงที่แล้ว",
  awaiting_entry: "รออนุมัติเข้า",
  inspecting: "กำลังตรวจสอบ",
  awaiting_decision: "รอวินิจฉัย",
  awaiting_user: "รอลูกค้า",
  in_progress: "กำลังซ่อม",
  completed: "ซ่อมเสร็จ",
  awaiting_review: "รอ WeeeR ตรวจ",
  closed: "ปิดงาน",
  cancelled: "ยกเลิก",
  converted_scrap: "โอนรับซื้อ",
};

const STATUS_COLOR: Record<RepairJobStatus, string> = {
  assigned: "bg-blue-900/60 text-blue-300",
  traveling: "bg-blue-900/60 text-blue-300",
  arrived: "bg-blue-900/60 text-blue-300",
  awaiting_entry: "bg-amber-900/60 text-amber-300",
  inspecting: "bg-blue-900/60 text-blue-300",
  awaiting_decision: "bg-amber-900/60 text-amber-300",
  awaiting_user: "bg-amber-900/60 text-amber-300",
  in_progress: "bg-orange-900/60 text-orange-300",
  completed: "bg-green-900/60 text-green-300",
  awaiting_review: "bg-amber-900/60 text-amber-300",
  closed: "bg-green-900/60 text-green-300",
  cancelled: "bg-red-900/60 text-red-300",
  converted_scrap: "bg-purple-900/60 text-purple-300",
};

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2 text-sm">
      <span className="text-gray-400 w-20 shrink-0">{label}</span>
      <span className="text-gray-200 flex-1">{value}</span>
    </div>
  );
}

function ActionButton({ status, jobId, router }: { status: RepairJobStatus; jobId: string; router: ReturnType<typeof useRouter> }) {
  const go = (path: string) => router.push(`/jobs/${jobId}/${path}`);

  if (status === "assigned") {
    return (
      <button
        onClick={() => go("depart")}
        className="w-full bg-orange-600 hover:bg-orange-500 text-white font-semibold py-3 rounded-xl transition-colors"
      >
        🚗 ออกเดินทาง
      </button>
    );
  }
  if (status === "traveling") {
    return (
      <button
        onClick={() => go("arrive")}
        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition-colors"
      >
        📍 บันทึกถึงที่ (ถ่ายรูป)
      </button>
    );
  }
  if (status === "arrived" || status === "awaiting_entry") {
    return (
      <button
        onClick={() => go("inspect")}
        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition-colors"
      >
        🔍 ส่งรายงานตรวจสอบ
      </button>
    );
  }
  if (status === "inspecting" || status === "awaiting_decision") {
    return (
      <button
        onClick={() => go("diagnose")}
        className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold py-3 rounded-xl transition-colors"
      >
        🛠️ วินิจฉัย / เลือกสาขา
      </button>
    );
  }
  if (status === "in_progress") {
    return (
      <button
        onClick={() => go("post-repair")}
        className="w-full bg-green-700 hover:bg-green-600 text-white font-semibold py-3 rounded-xl transition-colors"
      >
        📸 บันทึกหลังซ่อม
      </button>
    );
  }
  if (status === "awaiting_review") {
    return (
      <button
        onClick={() => go("complete")}
        className="w-full bg-green-700 hover:bg-green-600 text-white font-semibold py-3 rounded-xl transition-colors"
      >
        ✅ ยืนยันปิดงาน
      </button>
    );
  }
  return null;
}

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [job, setJob] = useState<RepairJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    repairApi
      .getJob(id)
      .then(setJob)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        กำลังโหลด...
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="px-4 pt-5 text-center space-y-4">
        <p className="text-4xl">❓</p>
        <p className="text-gray-400">{error ? `โหลดไม่สำเร็จ: ${error}` : "ไม่พบงานนี้"}</p>
        <button onClick={() => router.back()} className="text-orange-400 underline text-sm">
          ← กลับ
        </button>
      </div>
    );
  }

  const mapsUrl = job.customer_lat && job.customer_lng
    ? `https://maps.google.com/?q=${job.customer_lat},${job.customer_lng}`
    : job.customer_address
    ? `https://maps.google.com/?q=${encodeURIComponent(job.customer_address)}`
    : null;

  const scheduledDate = job.scheduled_at
    ? new Date(job.scheduled_at).toLocaleString("th-TH", {
        year: "numeric", month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    : null;

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="sticky top-0 bg-gray-950/90 backdrop-blur-sm border-b border-gray-800 px-4 py-3 flex items-center gap-3 z-10">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-white text-lg">←</button>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400 font-mono">{job.job_no}</p>
          <h1 className="font-bold text-white leading-tight truncate">
            {job.appliance_name ?? job.service_type}
          </h1>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full shrink-0 ${STATUS_COLOR[job.status]}`}>
          {STATUS_LABEL[job.status]}
        </span>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Customer */}
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 space-y-3">
          <h2 className="font-semibold text-white text-sm flex items-center gap-2">
            <span>👤</span> ข้อมูลลูกค้า
          </h2>
          <div className="space-y-2">
            <InfoRow label="ชื่อ" value={job.customer_name} />
            {job.customer_phone && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-400 w-20 shrink-0">โทร</span>
                <a href={`tel:${job.customer_phone}`} className="text-orange-400 hover:text-orange-300">
                  {job.customer_phone}
                </a>
              </div>
            )}
            <InfoRow label="ที่อยู่" value={job.customer_address} />
            <InfoRow label="นัดหมาย" value={scheduledDate} />
          </div>
          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm py-2 rounded-lg transition-colors"
            >
              🗺️ เปิดแผนที่นำทาง
            </a>
          )}
        </div>

        {/* Problem */}
        {job.problem_description && (
          <div className="bg-yellow-950/40 border border-yellow-800/60 rounded-xl p-4 text-sm">
            <p className="text-yellow-300 font-semibold mb-1">📋 ปัญหาที่แจ้ง</p>
            <p className="text-yellow-100">{job.problem_description}</p>
          </div>
        )}

        {/* Pricing (if applicable) */}
        {(job.original_price != null || job.proposed_price != null || job.final_price != null) && (
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 space-y-2">
            <h2 className="font-semibold text-white text-sm flex items-center gap-2">
              <span>💰</span> ราคา
            </h2>
            {job.original_price != null && (
              <InfoRow label="ราคาเดิม" value={`฿${job.original_price.toLocaleString()}`} />
            )}
            {job.proposed_price != null && (
              <InfoRow label="ราคาเสนอ" value={`฿${job.proposed_price.toLocaleString()}`} />
            )}
            {job.final_price != null && (
              <InfoRow label="ราคาสุดท้าย" value={`฿${job.final_price.toLocaleString()}`} />
            )}
            {job.decision_branch && (
              <InfoRow label="สาขา" value={job.decision_branch} />
            )}
          </div>
        )}

        {/* Shop */}
        {job.weeer_shop_name && (
          <div className="bg-gray-800/60 rounded-xl px-4 py-3 border border-gray-700/60">
            <p className="text-xs text-gray-400">ร้าน: <span className="text-gray-200">{job.weeer_shop_name}</span></p>
          </div>
        )}

        {/* Action */}
        <ActionButton status={job.status} jobId={job.id} router={router} />

        {/* Readonly closed states */}
        {["closed", "cancelled", "converted_scrap"].includes(job.status) && (
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 text-center text-sm text-gray-400">
            {job.status === "cancelled" && "งานถูกยกเลิก"}
            {job.status === "converted_scrap" && "โอนเป็นงานรับซื้อของเก่าแล้ว"}
            {job.status === "closed" && "งานปิดแล้ว"}
          </div>
        )}
      </div>
    </div>
  );
}
