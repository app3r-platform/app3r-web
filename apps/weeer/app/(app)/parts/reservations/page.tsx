"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { partsApi } from "../_lib/api";

type ReservationItem = {
  partId: string;
  partName: string;
  qty: number;
  jobId: string;
  jobType: string;
  reservedAt: string;
};

const JOB_TYPE_LABEL: Record<string, string> = {
  repair: "งานซ่อม",
  maintain: "งานบำรุง",
  other: "อื่นๆ",
};

const JOB_TYPE_COLOR: Record<string, string> = {
  repair: "bg-blue-50 text-blue-700",
  maintain: "bg-green-50 text-green-700",
  other: "bg-gray-100 text-gray-600",
};

export default function PartsReservationsPage() {
  const [reservations, setReservations] = useState<ReservationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    partsApi.reservations()
      .then(setReservations)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-48 text-gray-400">กำลังโหลด…</div>;
  if (error) return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-yellow-700 text-sm">
      ⚠️ ระบบอะไหล่กำลังพัฒนา — {error}
    </div>
  );

  const totalReserved = reservations.reduce((s, r) => s + r.qty, 0);
  const repairCount = reservations.filter(r => r.jobType === "repair").length;
  const maintainCount = reservations.filter(r => r.jobType === "maintain").length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/parts" className="text-gray-400 hover:text-gray-600">←</Link>
          <h1 className="text-xl font-bold text-gray-900">อะไหล่ที่จองอยู่</h1>
        </div>
        <span className="text-xs bg-orange-100 text-orange-700 font-semibold px-2.5 py-1 rounded-full">
          {totalReserved} ชิ้น
        </span>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-orange-50 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-orange-600">{reservations.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">รายการจอง</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-blue-700">{repairCount}</p>
          <p className="text-xs text-gray-500 mt-0.5">งานซ่อม</p>
        </div>
        <div className="bg-green-50 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-green-700">{maintainCount}</p>
          <p className="text-xs text-gray-500 mt-0.5">งานบำรุง</p>
        </div>
      </div>

      {reservations.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">ไม่มีอะไหล่ที่จองอยู่</div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl divide-y divide-gray-50">
          {reservations.map((r, i) => (
            <Link key={`${r.partId}-${r.jobId}-${i}`} href={`/parts/${r.partId}`}
              className="block px-4 py-3 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${JOB_TYPE_COLOR[r.jobType] ?? "bg-gray-100 text-gray-600"}`}>
                      {JOB_TYPE_LABEL[r.jobType] ?? r.jobType}
                    </span>
                    <span className="text-xs text-gray-400 font-mono">{r.jobId}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-800 truncate">{r.partName}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-lg font-bold text-orange-600">{r.qty}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(r.reservedAt).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
