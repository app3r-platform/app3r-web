"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api-client";

type RepairStatus =
  | "assigned" | "traveling" | "arrived" | "awaiting_entry"
  | "inspecting" | "awaiting_decision" | "awaiting_user"
  | "in_progress" | "completed" | "awaiting_review"
  | "closed" | "cancelled" | "converted_scrap";

type TimelineEvent = {
  id: string;
  event_type: string;
  description: string;
  created_at: string;
  actor_role: string;
};

type RepairJobDetail = {
  id: string;
  listing_id: string;
  appliance_name: string;
  issue_summary: string;
  issue_detail: string;
  service_type: string;
  status: RepairStatus;
  decision_branch: string | null;
  weeer_name: string;
  weeer_id: string;
  weeet_name: string | null;
  scheduled_at: string;
  departed_at: string | null;
  arrived_at: string | null;
  entry_approved_at: string | null;
  completed_at: string | null;
  closed_at: string | null;
  original_price: number | null;
  proposed_price: number | null;
  final_price: number | null;
  inspection_fee: number;
  deposit_amount: number | null;
  // Walk-in storage fee fields
  storage_fee_per_day: number | null;
  storage_fee_total: number | null;
  pickup_deadline: string | null;
  receipt_code: string | null;
  timeline: TimelineEvent[];
};

const STATUS_LABEL: Record<RepairStatus, string> = {
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

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("th-TH", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function RepairJobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<RepairJobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch(`/api/v1/repair/jobs/${id}`)
      .then(r => {
        if (!r.ok) throw new Error("not found");
        return r.json();
      })
      .then(d => setJob({
        ...d,
        storage_fee_per_day: d.storage_fee_per_day ?? null,
        storage_fee_total: d.storage_fee_total ?? null,
        pickup_deadline: d.pickup_deadline ?? null,
        receipt_code: d.receipt_code ?? null,
      }))
      .catch(() => setError("ไม่พบข้อมูลงานซ่อม"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-center py-16 text-gray-400">กำลังโหลด...</div>;
  if (error || !job) return (
    <div className="text-center py-16">
      <p className="text-4xl mb-3">🔍</p>
      <p className="text-gray-600 font-medium">{error || "ไม่พบข้อมูล"}</p>
      <Link href="/repair" className="mt-3 inline-block text-blue-600 text-sm font-medium hover:underline">← กลับรายการ</Link>
    </div>
  );

  const actionLink = (() => {
    if (job.status === "awaiting_entry") return `/repair/${id}/approve-entry`;
    if (job.status === "awaiting_user")
      return job.decision_branch === "B2.2" ? `/repair/${id}/decision/b2-2` : `/repair/${id}/decision/b1-2`;
    if (job.status === "awaiting_review") return `/repair/${id}/review`;
    return null;
  })();

  const actionLabel = (() => {
    if (job.status === "awaiting_entry") return "✅ อนุมัติเข้าหน้างาน";
    if (job.status === "awaiting_user" && job.decision_branch === "B2.2") return "💬 ตอบรับข้อเสนอขายซาก";
    if (job.status === "awaiting_user") return "💬 ตอบรับข้อเสนอราคาใหม่";
    if (job.status === "awaiting_review") return "🔍 ตรวจรับงาน + รีวิว";
    return null;
  })();

  return (
    <div className="max-w-xl space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/repair" className="text-gray-500 hover:text-gray-800 text-xl">‹</Link>
        <h1 className="text-xl font-bold text-gray-900">รายละเอียดงานซ่อม</h1>
      </div>

      {/* Action banner */}
      {actionLink && actionLabel && (
        <Link
          href={actionLink}
          className="block bg-orange-50 border border-orange-200 rounded-2xl p-4 hover:bg-orange-100 transition-colors"
        >
          <p className="text-sm font-semibold text-orange-800">⚠️ ต้องดำเนินการ</p>
          <p className="text-sm text-orange-700 mt-1">{actionLabel}</p>
          <p className="text-xs text-orange-500 mt-2 font-medium">กดที่นี่ →</p>
        </Link>
      )}

      {/* Walk-in receipt link */}
      {job.service_type === "walk_in" && job.receipt_code && (
        <Link
          href={`/repair/${id}/walk-in-receipt`}
          className="block bg-green-50 border border-green-200 rounded-2xl p-4 hover:bg-green-100 transition-colors"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-green-800">🚶 Walk-in — ใบรับเครื่อง</p>
              <p className="font-mono text-lg font-bold text-green-700 mt-0.5 tracking-widest">{job.receipt_code}</p>
            </div>
            <span className="text-green-500 text-xl">›</span>
          </div>
        </Link>
      )}

      {/* Walk-in storage fee accrual warning */}
      {job.service_type === "walk_in" && job.storage_fee_per_day && (
        <div className={`rounded-2xl p-4 border ${
          job.storage_fee_total && job.storage_fee_total > 0
            ? "bg-red-50 border-red-200"
            : "bg-amber-50 border-amber-200"
        }`}>
          <p className={`text-sm font-semibold ${
            job.storage_fee_total && job.storage_fee_total > 0 ? "text-red-800" : "text-amber-800"
          }`}>
            ⏳ ค่าฝากเครื่อง
          </p>
          {job.pickup_deadline && (
            <p className={`text-xs mt-1 ${
              job.storage_fee_total && job.storage_fee_total > 0 ? "text-red-600" : "text-amber-600"
            }`}>
              กำหนดรับ: {formatDate(job.pickup_deadline)}
            </p>
          )}
          {job.storage_fee_total && job.storage_fee_total > 0 ? (
            <p className="text-sm font-bold text-red-700 mt-1">
              ค่าฝากสะสม: {job.storage_fee_total.toLocaleString()} Point
              <span className="text-xs font-normal text-red-500 ml-1">
                ({job.storage_fee_per_day.toLocaleString()} Point/วัน)
              </span>
            </p>
          ) : (
            <p className="text-xs text-amber-600 mt-1">
              หากไม่รับตามกำหนด จะมีค่าฝาก {job.storage_fee_per_day.toLocaleString()} Point/วัน
            </p>
          )}
        </div>
      )}

      {/* Status card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-bold text-gray-900">{job.appliance_name}</p>
            <p className="text-sm text-gray-500 mt-0.5">{job.issue_summary}</p>
          </div>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${STATUS_COLOR[job.status]}`}>
            {STATUS_LABEL[job.status]}
          </span>
        </div>
        {job.issue_detail && (
          <p className="text-sm text-gray-600 border-t border-gray-100 pt-3">{job.issue_detail}</p>
        )}
      </div>

      {/* Job info */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">ข้อมูลงาน</p>
        </div>
        <div className="p-5 space-y-3">
          <Row label="ร้านซ่อม" value={job.weeer_name} />
          <Row label="ช่างที่รับงาน" value={job.weeet_name ?? "ยังไม่มอบหมาย"} />
          <Row label="วันนัดหมาย" value={formatDate(job.scheduled_at)} />
          {job.departed_at && <Row label="ช่างออกเดินทาง" value={formatDate(job.departed_at)} />}
          {job.arrived_at && <Row label="ช่างถึงหน้างาน" value={formatDate(job.arrived_at)} />}
          {job.entry_approved_at && <Row label="อนุมัติเข้างาน" value={formatDate(job.entry_approved_at)} />}
          {job.completed_at && <Row label="ซ่อมเสร็จ" value={formatDate(job.completed_at)} />}
          {job.closed_at && <Row label="ปิดงาน" value={formatDate(job.closed_at)} />}
        </div>
      </div>

      {/* Price info */}
      {(job.original_price || job.inspection_fee) ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">ราคา</p>
          </div>
          <div className="p-5 space-y-3">
            {job.original_price && <Row label="ราคาที่ตกลง" value={`${job.original_price.toLocaleString()} Point`} />}
            {job.proposed_price && job.proposed_price !== job.original_price && (
              <Row label="ราคาที่เสนอใหม่" value={`${job.proposed_price.toLocaleString()} Point`} highlight />
            )}
            {job.final_price && <Row label="ราคาสุดท้าย" value={`${job.final_price.toLocaleString()} Point`} />}
            <Row
              label={job.service_type === "walk_in" ? "ค่าตรวจ (Walk-in)" : "ค่าตรวจ (On-site)"}
              value={`${job.inspection_fee.toLocaleString()} Point`}
            />
            {job.deposit_amount && <Row label="มัดจำ" value={`${job.deposit_amount.toLocaleString()} Point`} />}
          </div>
        </div>
      ) : null}

      {/* Timeline */}
      {job.timeline.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">ประวัติงาน</p>
          </div>
          <div className="p-5">
            <div className="space-y-4">
              {job.timeline.map((ev, i) => (
                <div key={ev.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-2.5 h-2.5 rounded-full mt-1 ${i === 0 ? "bg-blue-500" : "bg-gray-300"}`} />
                    {i < job.timeline.length - 1 && <div className="w-px flex-1 bg-gray-200 mt-1" />}
                  </div>
                  <div className="pb-4">
                    <p className="text-sm text-gray-700">{ev.description}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(ev.created_at)} · {ev.actor_role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* GPS tracking (traveling state) */}
      {(job.status === "traveling" || job.status === "arrived") && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
          <p className="text-sm font-semibold text-amber-800">📍 ติดตามช่าง Real-time</p>
          <p className="text-xs text-amber-600 mt-1">ช่างกำลังเดินทางมาหาคุณ — จะแจ้งเตือนเมื่อถึง</p>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-sm font-medium text-right ${highlight ? "text-orange-600" : "text-gray-800"}`}>{value}</p>
    </div>
  );
}
