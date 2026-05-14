"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import type { ExpandedRepairFields, ServicePriority } from "@/lib/types/service-expanded.stub";
import { PRIORITY_CONFIG } from "@/lib/types/service-expanded.stub";

type RepairStatus =
  | "assigned" | "traveling" | "arrived" | "awaiting_entry"
  | "inspecting" | "awaiting_decision" | "awaiting_user"
  | "in_progress" | "completed" | "awaiting_review"
  | "closed" | "cancelled" | "converted_scrap"
  // Pickup workflow states
  | "en_route_pickup" | "picked_up" | "appliance_at_shop"
  | "ready" | "en_route_delivery" | "delivered" | "confirmed"
  // Parcel workflow states (10)
  | "awaiting_shipping_details" | "shipping_confirmed"
  | "in_transit_to_shop" | "received_at_shop" | "parcel_inspecting"
  | "parcel_in_progress" | "ready_to_ship_back"
  | "in_transit_to_customer" | "parcel_delivered" | "parcel_confirmed";

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
  // Parcel fields
  parcel_courier: string | null;
  parcel_tracking_out: string | null;
  parcel_tracking_back: string | null;
  timeline: TimelineEvent[];
  // ─── Sub-4 Expanded fields (stub — รอ Backend @app3r/types/services) ──────────
} & ExpandedRepairFields;

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
  // Pickup workflow
  en_route_pickup: "ช่างกำลังออกรับเครื่อง",
  picked_up: "รับเครื่องแล้ว — รอเซ็นรับ",
  appliance_at_shop: "เครื่องอยู่ที่ร้านแล้ว",
  ready: "ซ่อมเสร็จ — รอส่งคืน",
  en_route_delivery: "ช่างกำลังส่งคืน",
  delivered: "ส่งคืนแล้ว — รอยืนยัน",
  confirmed: "ยืนยันรับเครื่องแล้ว",
  // Parcel workflow
  awaiting_shipping_details: "รอตกลงรายละเอียดขนส่ง",
  shipping_confirmed: "ตกลงขนส่งแล้ว — รอส่งพัสดุ",
  in_transit_to_shop: "พัสดุกำลังเดินทางไปร้าน",
  received_at_shop: "ร้านรับพัสดุแล้ว",
  parcel_inspecting: "กำลังตรวจสอบสภาพเครื่อง",
  parcel_in_progress: "กำลังซ่อม (Parcel)",
  ready_to_ship_back: "ซ่อมเสร็จ — เตรียมส่งคืน",
  in_transit_to_customer: "พัสดุกำลังส่งคืน",
  parcel_delivered: "พัสดุถึงมือคุณแล้ว — รอยืนยัน",
  parcel_confirmed: "ยืนยันรับพัสดุแล้ว",
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
  // Pickup workflow
  en_route_pickup: "bg-purple-100 text-purple-700",
  picked_up: "bg-purple-100 text-purple-700",
  appliance_at_shop: "bg-indigo-100 text-indigo-700",
  ready: "bg-green-100 text-green-700",
  en_route_delivery: "bg-purple-100 text-purple-700",
  delivered: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-green-100 text-green-700",
  // Parcel workflow
  awaiting_shipping_details: "bg-orange-100 text-orange-700",
  shipping_confirmed: "bg-orange-100 text-orange-700",
  in_transit_to_shop: "bg-amber-100 text-amber-700",
  received_at_shop: "bg-indigo-100 text-indigo-700",
  parcel_inspecting: "bg-indigo-100 text-indigo-700",
  parcel_in_progress: "bg-blue-100 text-blue-700",
  ready_to_ship_back: "bg-green-100 text-green-700",
  in_transit_to_customer: "bg-amber-100 text-amber-700",
  parcel_delivered: "bg-yellow-100 text-yellow-700",
  parcel_confirmed: "bg-green-100 text-green-700",
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
        parcel_courier: d.parcel_courier ?? null,
        parcel_tracking_out: d.parcel_tracking_out ?? null,
        parcel_tracking_back: d.parcel_tracking_back ?? null,
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
    // Pickup workflow actions
    if (job.status === "picked_up") return `/repair/${id}/pickup-receipt`;
    if (job.status === "delivered") return `/repair/${id}/delivery-receipt`;
    // Parcel workflow actions
    if (job.status === "awaiting_shipping_details") return `/repair/${id}/shipping-details`;
    if (job.status === "shipping_confirmed") return `/repair/${id}/ship-out`;
    if (job.status === "parcel_delivered") return `/repair/${id}/parcel-receipt`;
    return null;
  })();

  const actionLabel = (() => {
    if (job.status === "awaiting_entry") return "✅ อนุมัติเข้าหน้างาน";
    if (job.status === "awaiting_user" && job.decision_branch === "B2.2") return "💬 ตอบรับข้อเสนอขายซาก";
    if (job.status === "awaiting_user") return "💬 ตอบรับข้อเสนอราคาใหม่";
    if (job.status === "awaiting_review") return "🔍 ตรวจรับงาน + รีวิว";
    // Pickup workflow actions
    if (job.status === "picked_up") return "🚛 เซ็นรับมอบเครื่องให้ช่าง";
    if (job.status === "delivered") return "🚛 ยืนยันรับเครื่องคืน";
    // Parcel workflow actions
    if (job.status === "awaiting_shipping_details") return "📦 ตกลงรายละเอียดการขนส่ง";
    if (job.status === "shipping_confirmed") return "📦 กรอก Tracking + ยืนยันส่งพัสดุ";
    if (job.status === "parcel_delivered") return "📦 ยืนยันรับพัสดุคืน";
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
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-bold text-gray-900">{job.appliance_name}</p>
              {/* Sub-4: Priority badge */}
              {job.priority && job.priority !== "normal" && (
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PRIORITY_CONFIG[job.priority as ServicePriority].cls}`}>
                  {PRIORITY_CONFIG[job.priority as ServicePriority].icon} {PRIORITY_CONFIG[job.priority as ServicePriority].label}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-0.5">{job.issue_summary}</p>
          </div>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${STATUS_COLOR[job.status]}`}>
            {STATUS_LABEL[job.status]}
          </span>
        </div>
        {job.issue_detail && (
          <p className="text-sm text-gray-600 border-t border-gray-100 pt-3">{job.issue_detail}</p>
        )}
        {/* Sub-4: customer_note */}
        {job.customer_note && (
          <div className="border-t border-gray-100 pt-3">
            <p className="text-xs text-gray-400 mb-1">หมายเหตุจากคุณ</p>
            <p className="text-sm text-gray-600 italic">"{job.customer_note}"</p>
          </div>
        )}
        {/* Sub-4: progress_percent bar */}
        {job.progress_percent != null && job.progress_percent > 0 && (
          <div className="border-t border-gray-100 pt-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-gray-500">ความคืบหน้า</p>
              <p className="text-xs font-semibold text-indigo-600">{job.progress_percent}%</p>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all"
                style={{ width: `${job.progress_percent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Sub-4: Cancellation card */}
      {job.status === "cancelled" && job.cancelled_reason && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
          <p className="text-sm font-semibold text-red-800">🚫 สาเหตุการยกเลิก</p>
          <p className="text-sm text-red-600 mt-1">{job.cancelled_reason}</p>
          {job.cancelled_at && (
            <p className="text-xs text-red-400 mt-1">ยกเลิกเมื่อ: {formatDate(job.cancelled_at)}</p>
          )}
        </div>
      )}

      {/* Sub-4: Diagnosis note card */}
      {job.diagnosis_note && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1.5">
            🔍 ผลการวินิจฉัยจากช่าง
          </p>
          <p className="text-sm text-blue-800">{job.diagnosis_note}</p>
          {job.technician_note && (
            <p className="text-xs text-blue-500 mt-2 italic">หมายเหตุช่าง: {job.technician_note}</p>
          )}
        </div>
      )}

      {/* Sub-4: Warranty card */}
      {(job.warranty_days != null && job.warranty_days > 0) && (
        <div className="bg-green-50 border border-green-100 rounded-2xl p-4 flex items-center gap-3">
          <span className="text-2xl">🛡️</span>
          <div>
            <p className="text-sm font-semibold text-green-800">
              ประกันงานซ่อม {job.warranty_days} วัน
            </p>
            {job.warranty_expires_at && (
              <p className="text-xs text-green-600 mt-0.5">
                หมดอายุ: {formatDate(job.warranty_expires_at)}
              </p>
            )}
          </div>
        </div>
      )}

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
              label={
                job.service_type === "walk_in" ? "ค่าตรวจ (Walk-in)"
                : job.service_type === "pickup" ? "ค่าตรวจ (Pickup)"
                : job.service_type === "parcel" ? "ค่าตรวจ (Parcel)"
                : "ค่าตรวจ (On-site)"
              }
              value={`${job.inspection_fee.toLocaleString()} Point`}
            />
            {job.deposit_amount && <Row label="มัดจำ" value={`${job.deposit_amount.toLocaleString()} Point`} />}
            {/* Sub-4: breakdown labor + parts */}
            {job.labor_cost != null && <Row label="ค่าแรง" value={`${job.labor_cost.toLocaleString()} Point`} />}
            {job.parts_cost != null && <Row label="ค่าอะไหล่" value={`${job.parts_cost.toLocaleString()} Point`} />}
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

      {/* GPS tracking (on-site traveling state) */}
      {(job.status === "traveling" || job.status === "arrived") && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
          <p className="text-sm font-semibold text-amber-800">📍 ติดตามช่าง Real-time</p>
          <p className="text-xs text-amber-600 mt-1">ช่างกำลังเดินทางมาหาคุณ — จะแจ้งเตือนเมื่อถึง</p>
        </div>
      )}

      {/* Pickup: en_route_pickup tracking */}
      {job.status === "en_route_pickup" && (
        <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4">
          <p className="text-sm font-semibold text-purple-800">🚛 ช่างกำลังออกมารับเครื่อง</p>
          <p className="text-xs text-purple-600 mt-1">เตรียมเครื่องให้พร้อม — ช่างจะมาถึงตามนัด</p>
        </div>
      )}

      {/* Pickup: appliance_at_shop / in_progress / ready */}
      {(job.status === "appliance_at_shop" || job.status === "ready") && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4">
          <p className="text-sm font-semibold text-indigo-800">
            {job.status === "ready" ? "✅ ซ่อมเสร็จแล้ว — กำลังนัดส่งคืน" : "🏪 เครื่องอยู่ที่ร้านซ่อมแล้ว"}
          </p>
          <p className="text-xs text-indigo-600 mt-1">
            {job.status === "ready" ? "ช่างจะติดต่อนัดเวลาส่งคืนเครื่อง" : "รอผลการตรวจสอบจากร้านซ่อม"}
          </p>
        </div>
      )}

      {/* Pickup: en_route_delivery tracking */}
      {job.status === "en_route_delivery" && (
        <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4">
          <p className="text-sm font-semibold text-purple-800">🚛 ช่างกำลังส่งเครื่องคืน</p>
          <p className="text-xs text-purple-600 mt-1">เตรียมตัวรับเครื่อง — ช่างกำลังเดินทางมาส่ง</p>
        </div>
      )}

      {/* Parcel: in_transit_to_shop — show outbound tracking */}
      {job.status === "in_transit_to_shop" && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2">
          <p className="text-sm font-semibold text-amber-800">🚚 พัสดุกำลังเดินทางไปร้านซ่อม</p>
          {job.parcel_tracking_out && (
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-amber-700 font-mono font-bold">{job.parcel_tracking_out}</p>
              {job.parcel_courier && (
                <a
                  href={`https://track.${job.parcel_courier === "kerry" ? "kerry" : job.parcel_courier === "flash" ? "flashexpress" : "jtexpress"}.co.th`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-orange-600 font-medium hover:underline"
                >
                  ติดตามพัสดุ →
                </a>
              )}
            </div>
          )}
        </div>
      )}

      {/* Parcel: at shop states */}
      {(job.status === "received_at_shop" || job.status === "parcel_inspecting" || job.status === "parcel_in_progress" || job.status === "ready_to_ship_back") && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4">
          <p className="text-sm font-semibold text-indigo-800">
            {job.status === "received_at_shop" && "🏪 ร้านรับพัสดุแล้ว — รอตรวจสภาพ"}
            {job.status === "parcel_inspecting" && "🔍 กำลังตรวจสอบสภาพเครื่อง"}
            {job.status === "parcel_in_progress" && "🔧 กำลังซ่อมเครื่อง"}
            {job.status === "ready_to_ship_back" && "✅ ซ่อมเสร็จแล้ว — รอส่งคืน"}
          </p>
          <p className="text-xs text-indigo-600 mt-1">
            {job.status === "ready_to_ship_back" ? "ร้านจะส่งพัสดุคืนและแจ้ง Tracking ให้คุณ" : "ระบบจะแจ้งเตือนเมื่อมีความคืบหน้า"}
          </p>
        </div>
      )}

      {/* Parcel: in_transit_to_customer — show return tracking */}
      {job.status === "in_transit_to_customer" && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2">
          <p className="text-sm font-semibold text-amber-800">🚚 พัสดุกำลังส่งคืนถึงคุณ</p>
          {job.parcel_tracking_back && (
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-amber-700 font-mono font-bold">{job.parcel_tracking_back}</p>
              {job.parcel_courier && (
                <a
                  href={`https://track.${job.parcel_courier === "kerry" ? "kerry" : job.parcel_courier === "flash" ? "flashexpress" : "jtexpress"}.co.th`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-orange-600 font-medium hover:underline"
                >
                  ติดตามพัสดุ →
                </a>
              )}
            </div>
          )}
          <p className="text-xs text-amber-600">เตรียมรับพัสดุ — ตรวจสอบสภาพเครื่องเมื่อได้รับ</p>
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
