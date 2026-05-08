"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { repairApi } from "../../../_lib/api";
import type { PickupJob } from "../../../_lib/types";
import { PICKUP_STATUS_LABEL, PICKUP_STATUS_COLOR } from "../../../_lib/types";

interface TimelineEvent {
  status: string;
  timestamp: string;
  note?: string;
}

const STATUS_ICON: Record<string, string> = {
  pending_dispatch: "📋",
  dispatched: "👷",
  en_route: "🚗",
  at_customer: "🏠",
  appliance_at_shop: "🏪",
  diagnosing: "🔍",
  repairing: "🔧",
  ready: "✅",
  out_for_delivery: "🚚",
  delivered: "🏁",
  cancelled: "❌",
};

export default function PickupTrackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [job, setJob] = useState<PickupJob | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    repairApi.trackPickup(id)
      .then(({ job: j, timeline: t }) => { setJob(j); setTimeline(t); })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex items-center justify-center h-48 text-gray-400">กำลังโหลด…</div>;
  if (error) return <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">{error}</div>;
  if (!job) return null;

  const isTerminal = ["delivered", "cancelled"].includes(job.status);

  return (
    <div className="space-y-5 max-w-xl">
      <div className="flex items-center gap-3">
        <Link href="/repair/pickup/queue" className="text-gray-400 hover:text-gray-600">←</Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900 truncate">{job.appliance_name}</h1>
        </div>
        <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${PICKUP_STATUS_COLOR[job.status]}`}>
          {PICKUP_STATUS_LABEL[job.status]}
        </span>
      </div>

      {/* Job info */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-gray-400">ลูกค้า</p>
          <p className="font-medium text-gray-800">{job.customer_name}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">WeeeT</p>
          <p className="font-medium text-gray-800">{job.weeet_name ?? "ยังไม่ได้มอบหมาย"}</p>
        </div>
        <div className="col-span-2">
          <p className="text-xs text-gray-400">ที่อยู่</p>
          <p className="font-medium text-gray-800 text-xs">{job.customer_address}</p>
        </div>
        {job.scheduled_pickup_time && (
          <div>
            <p className="text-xs text-gray-400">นัดรับ</p>
            <p className="font-medium text-gray-800 text-xs">
              {new Date(job.scheduled_pickup_time).toLocaleDateString("th-TH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        )}
        {job.scheduled_delivery_time && (
          <div>
            <p className="text-xs text-gray-400">นัดส่ง</p>
            <p className="font-medium text-gray-800 text-xs">
              {new Date(job.scheduled_delivery_time).toLocaleDateString("th-TH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        )}
      </div>

      {/* GPS location */}
      {job.gps_track && job.gps_track.length > 0 && (
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 flex items-center gap-3">
          <span className="text-2xl">📍</span>
          <div>
            <p className="text-xs font-medium text-gray-700">ตำแหน่ง WeeeT ล่าสุด (GPS)</p>
            {(() => {
              const last = job.gps_track[job.gps_track.length - 1];
              return (
                <p className="text-xs text-gray-500">
                  {last.lat.toFixed(5)}, {last.lng.toFixed(5)} ·{" "}
                  {new Date(last.timestamp).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
                </p>
              );
            })()}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="bg-white border border-gray-100 rounded-xl p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Timeline</p>
        {timeline.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">ยังไม่มีประวัติ</p>
        ) : (
          <div className="space-y-3">
            {timeline.map((event, i) => {
              const isLast = i === timeline.length - 1;
              return (
                <div key={i} className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0
                    ${isLast && !isTerminal ? "bg-green-100 ring-2 ring-green-400" : "bg-green-600 text-white"}`}>
                    {isLast && !isTerminal ? (STATUS_ICON[event.status] ?? "●") : "✓"}
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    <p className={`text-sm font-medium ${isLast ? "text-gray-800" : "text-gray-500"}`}>
                      {PICKUP_STATUS_LABEL[event.status as keyof typeof PICKUP_STATUS_LABEL] ?? event.status}
                    </p>
                    {event.note && <p className="text-xs text-gray-500 mt-0.5">{event.note}</p>}
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(event.timestamp).toLocaleDateString("th-TH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  {isLast && !isTerminal && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium shrink-0">ปัจจุบัน</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Next action */}
      {job.status === "appliance_at_shop" && (
        <Link href={`/repair/pickup/${id}/intake`}
          className="w-full block text-center bg-green-700 hover:bg-green-800 text-white font-semibold py-3 rounded-xl transition-colors text-sm">
          📥 รับเครื่องเข้าร้าน →
        </Link>
      )}
      {job.status === "ready" && (
        <Link href={`/repair/pickup/${id}/ready-to-deliver`}
          className="w-full block text-center bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-xl transition-colors text-sm">
          🚚 จัดการส่งคืน →
        </Link>
      )}
    </div>
  );
}
