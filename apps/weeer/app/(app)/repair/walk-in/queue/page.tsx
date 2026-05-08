"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { repairApi } from "../../_lib/api";
import type { WalkInJob, WalkInQueue } from "../../_lib/types";
import { WALKIN_STATUS_LABEL, WALKIN_STATUS_COLOR } from "../../_lib/types";

export default function WalkInQueuePage() {
  const [data, setData] = useState<WalkInQueue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    repairApi.getWalkInQueue()
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  function getActionHref(job: WalkInJob): string {
    switch (job.status) {
      case "waiting":   return `/repair/walk-in/${job.id}/receive`;
      case "received":  return `/repair/walk-in/${job.id}/inspect`;
      case "inspecting":return `/repair/walk-in/${job.id}/inspect`;
      case "in_progress":return `/repair/walk-in/${job.id}/in-progress`;
      case "ready":     return `/repair/walk-in/${job.id}/ready`;
      case "abandoned": return `/repair/walk-in/${job.id}/abandoned`;
      default:          return `/repair/walk-in/${job.id}/ready`;
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Walk-in Queue</h1>
          <p className="text-xs text-gray-500 mt-0.5">ลูกค้าเดินมาหน้าร้าน — รับเครื่อง ตรวจ ซ่อม</p>
        </div>
        <Link href="/repair/dashboard" className="text-gray-400 hover:text-gray-600 text-sm">← Dashboard</Link>
      </div>

      {/* Summary cards */}
      {data && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-orange-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-orange-700">{data.waiting}</p>
            <p className="text-xs text-gray-500 mt-0.5">รอรับ / ตรวจ</p>
          </div>
          <div className="bg-teal-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-teal-700">{data.ready_for_pickup}</p>
            <p className="text-xs text-gray-500 mt-0.5">รอรับคืน</p>
          </div>
          <div className="bg-yellow-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-yellow-700">{data.storage_fee_total.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-0.5">Storage fee (pts)</p>
          </div>
        </div>
      )}

      {loading && <div className="flex items-center justify-center h-40 text-gray-400">กำลังโหลด…</div>}
      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">{error}</div>}

      {!loading && !error && data?.items.length === 0 && (
        <div className="flex flex-col items-center justify-center h-48 text-gray-400">
          <span className="text-4xl mb-3">🚶</span>
          <p className="text-sm">ไม่มีลูกค้า Walk-in ในขณะนี้</p>
        </div>
      )}

      <div className="space-y-3">
        {data?.items.map((job) => (
          <div key={job.id} className="bg-white border border-gray-100 rounded-xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${WALKIN_STATUS_COLOR[job.status]}`}>
                    {WALKIN_STATUS_LABEL[job.status]}
                  </span>
                  <span className="text-xs font-mono text-gray-400">{job.receipt_code}</span>
                </div>
                <p className="text-sm font-semibold text-gray-800">{job.appliance_name}</p>
                <p className="text-xs text-gray-500 mt-0.5 truncate">{job.problem_description}</p>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-xs text-gray-400">👤 {job.customer_name}</span>
                  <span className="text-xs text-gray-400">📞 {job.customer_phone}</span>
                  {job.estimated_price && (
                    <span className="text-xs text-green-700 font-medium">{job.estimated_price.toLocaleString()} pts</span>
                  )}
                </div>
                {job.status === "ready" && job.storage_fee_accrued && job.storage_fee_accrued > 0 && (
                  <div className="mt-2 flex items-center gap-1.5 bg-yellow-50 rounded-lg px-2.5 py-1.5">
                    <span className="text-xs">🕐</span>
                    <span className="text-xs font-medium text-yellow-700">
                      Storage fee: {job.storage_fee_accrued.toLocaleString()} pts ({job.storage_fee_days} วัน)
                    </span>
                  </div>
                )}
              </div>
              <Link href={getActionHref(job)}
                className="shrink-0 bg-green-700 hover:bg-green-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                {job.status === "waiting" ? "รับเครื่อง" :
                 job.status === "received" || job.status === "inspecting" ? "ตรวจสภาพ" :
                 job.status === "in_progress" ? "ดูงาน" :
                 job.status === "ready" ? "รับคืน" :
                 job.status === "abandoned" ? "จัดการ" : "ดูรายละเอียด"}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
