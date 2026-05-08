"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { repairApi } from "../../_lib/api";
import type { PickupJob, PickupQueue } from "../../_lib/types";
import { PICKUP_STATUS_LABEL, PICKUP_STATUS_COLOR } from "../../_lib/types";

function getActionHref(job: PickupJob): { href: string; label: string } {
  switch (job.status) {
    case "pending_dispatch": return { href: `/repair/pickup/${job.id}/dispatch`, label: "มอบหมายช่าง" };
    case "dispatched":
    case "en_route":
    case "at_customer":     return { href: `/repair/pickup/${job.id}/track`, label: "ติดตาม" };
    case "appliance_at_shop": return { href: `/repair/pickup/${job.id}/intake`, label: "รับเครื่อง" };
    case "diagnosing":      return { href: `/repair/pickup/${job.id}/diagnose`, label: "วินิจฉัย" };
    case "repairing":       return { href: `/repair/pickup/${job.id}/diagnose`, label: "ดูงาน" };
    case "ready":           return { href: `/repair/pickup/${job.id}/ready-to-deliver`, label: "จัดส่งคืน" };
    case "out_for_delivery": return { href: `/repair/pickup/${job.id}/track`, label: "ติดตามส่ง" };
    default:                return { href: `/repair/pickup/${job.id}/track`, label: "ดูรายละเอียด" };
  }
}

export default function PickupQueuePage() {
  const [data, setData] = useState<PickupQueue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    repairApi.getPickupQueue()
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Pickup Queue</h1>
          <p className="text-xs text-gray-500 mt-0.5">งานรับ-ส่งเครื่องถึงบ้าน — มอบหมายช่าง ติดตาม ซ่อม ส่งคืน</p>
        </div>
        <Link href="/repair/dashboard" className="text-gray-400 hover:text-gray-600 text-sm">← Dashboard</Link>
      </div>

      {/* Summary */}
      {data && (
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "รอมอบหมาย", value: data.pending_dispatch, color: "text-orange-700", bg: "bg-orange-50" },
            { label: "ระหว่างทาง", value: data.in_transit,      color: "text-indigo-700", bg: "bg-indigo-50" },
            { label: "ที่ร้าน",    value: data.at_shop,          color: "text-yellow-700", bg: "bg-yellow-50" },
            { label: "พร้อมส่ง",  value: data.ready,             color: "text-teal-700",   bg: "bg-teal-50"   },
          ].map((k) => (
            <div key={k.label} className={`${k.bg} rounded-xl p-3 text-center`}>
              <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{k.label}</p>
            </div>
          ))}
        </div>
      )}

      {loading && <div className="flex items-center justify-center h-40 text-gray-400">กำลังโหลด…</div>}
      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">{error}</div>}

      {!loading && !error && data?.items.length === 0 && (
        <div className="flex flex-col items-center justify-center h-48 text-gray-400">
          <span className="text-4xl mb-3">🚛</span>
          <p className="text-sm">ไม่มีงาน Pickup ในขณะนี้</p>
        </div>
      )}

      <div className="space-y-3">
        {data?.items.map((job) => {
          const action = getActionHref(job);
          return (
            <div key={job.id} className="bg-white border border-gray-100 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PICKUP_STATUS_COLOR[job.status]}`}>
                      {PICKUP_STATUS_LABEL[job.status]}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-gray-800">{job.appliance_name}</p>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{job.problem_description}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                    <span className="text-xs text-gray-400">👤 {job.customer_name}</span>
                    <span className="text-xs text-gray-400">📍 {job.customer_address}</span>
                    {job.weeet_name && <span className="text-xs text-gray-400">👷 {job.weeet_name}</span>}
                  </div>
                  {job.status === "pending_dispatch" && (
                    <div className="mt-2 flex items-center gap-1.5 bg-orange-50 rounded-lg px-2.5 py-1.5">
                      <span className="text-xs">⚠️</span>
                      <span className="text-xs font-medium text-orange-700">ยังไม่ได้มอบหมายช่าง</span>
                    </div>
                  )}
                  {job.scheduled_pickup_time && ["dispatched","en_route"].includes(job.status) && (
                    <p className="text-xs text-gray-400 mt-1">
                      นัดรับ: {new Date(job.scheduled_pickup_time).toLocaleDateString("th-TH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  )}
                </div>
                <Link href={action.href}
                  className="shrink-0 bg-green-700 hover:bg-green-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                  {action.label}
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
