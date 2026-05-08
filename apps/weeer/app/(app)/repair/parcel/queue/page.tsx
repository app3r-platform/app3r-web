"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { repairApi } from "../../_lib/api";
import type { ParcelJob, ParcelQueue } from "../../_lib/types";
import { PARCEL_STATUS_LABEL, PARCEL_STATUS_COLOR } from "../../_lib/types";

function getActionHref(job: ParcelJob): { href: string; label: string } {
  switch (job.status) {
    case "awaiting_shipping_details": return { href: `/repair/parcel/${job.id}/shipping-details`, label: "ตกลง Shipping" };
    case "in_transit_to_shop":        return { href: `/repair/parcel/${job.id}/receive`,          label: "รอรับพัสดุ" };
    case "received":                  return { href: `/repair/parcel/${job.id}/inspect`,           label: "ตรวจสภาพ" };
    case "inspecting":                return { href: `/repair/parcel/${job.id}/inspect`,           label: "ดูการตรวจ" };
    case "repairing":                 return { href: `/repair/parcel/${job.id}/dispatch-tech`,     label: "ดูช่าง" };
    case "ready_to_ship_back":        return { href: `/repair/parcel/${job.id}/ship-back`,         label: "ส่งคืน" };
    default:                          return { href: `/repair/parcel/${job.id}/ship-back`,         label: "ดูรายละเอียด" };
  }
}

export default function ParcelQueuePage() {
  const [data, setData] = useState<ParcelQueue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    repairApi.getParcelQueue()
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Parcel Queue</h1>
          <p className="text-xs text-gray-500 mt-0.5">งานรับซ่อมทางไปรษณีย์ — ตกลง Shipping, รับพัสดุ, ซ่อม, ส่งคืน</p>
        </div>
        <Link href="/repair/dashboard" className="text-gray-400 hover:text-gray-600 text-sm">← Dashboard</Link>
      </div>

      {/* Summary */}
      {data && (
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "รอ Shipping",    value: data.awaiting_shipping, color: "text-orange-700", bg: "bg-orange-50" },
            { label: "กำลังมา",        value: data.in_transit_in,     color: "text-indigo-700", bg: "bg-indigo-50" },
            { label: "ที่ร้าน",        value: data.at_shop,           color: "text-yellow-700", bg: "bg-yellow-50" },
            { label: "พร้อมส่งคืน",   value: data.ready_to_ship,     color: "text-teal-700",   bg: "bg-teal-50"   },
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
          <span className="text-4xl mb-3">📦</span>
          <p className="text-sm">ไม่มีงาน Parcel ในขณะนี้</p>
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
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PARCEL_STATUS_COLOR[job.status]}`}>
                      {PARCEL_STATUS_LABEL[job.status]}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-gray-800">{job.appliance_name}</p>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{job.problem_description}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                    <span className="text-xs text-gray-400">👤 {job.customer_name}</span>
                    <span className="text-xs text-gray-400">📍 {job.customer_address}</span>
                    {job.courier && <span className="text-xs text-gray-400">🚚 {job.courier}</span>}
                    {job.weeet_name && <span className="text-xs text-gray-400">👷 {job.weeet_name}</span>}
                  </div>
                  {job.status === "awaiting_shipping_details" && (
                    <div className="mt-2 flex items-center gap-1.5 bg-orange-50 rounded-lg px-2.5 py-1.5">
                      <span className="text-xs">⚠️</span>
                      <span className="text-xs font-medium text-orange-700">ยังไม่ได้ตกลงรายละเอียดการส่ง</span>
                    </div>
                  )}
                  {job.inbound_tracking && ["in_transit_to_shop"].includes(job.status) && (
                    <p className="text-xs text-gray-400 mt-1">
                      Tracking ขาเข้า: <span className="font-mono">{job.inbound_tracking}</span>
                    </p>
                  )}
                  {job.return_tracking && ["in_transit_to_customer", "completed"].includes(job.status) && (
                    <p className="text-xs text-gray-400 mt-1">
                      Tracking ขาออก: <span className="font-mono">{job.return_tracking}</span>
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
