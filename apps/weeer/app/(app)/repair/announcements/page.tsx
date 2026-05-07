"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { repairApi } from "../_lib/api";
import type { RepairAnnouncement } from "../_lib/types";

export default function RepairAnnouncementsPage() {
  const [items, setItems] = useState<RepairAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    repairApi.getAnnouncements()
      .then(setItems)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">ประกาศรับงาน (On-site)</h1>
          <p className="text-xs text-gray-500 mt-0.5">ประกาศที่ยังไม่มีข้อเสนอ — ยื่นข้อเสนอได้เลย</p>
        </div>
      </div>

      {loading && <div className="flex items-center justify-center h-40 text-gray-400">กำลังโหลด…</div>}
      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">{error}</div>}

      {!loading && !error && items.length === 0 && (
        <div className="flex flex-col items-center justify-center h-48 text-gray-400">
          <span className="text-4xl mb-3">📢</span>
          <p className="text-sm">ไม่มีประกาศใหม่ในขณะนี้</p>
        </div>
      )}

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="bg-white border border-gray-100 rounded-xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs bg-blue-100 text-blue-700 font-medium px-2 py-0.5 rounded-full">On-site</span>
                  {item.offer_count > 0 && (
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{item.offer_count} ข้อเสนอ</span>
                  )}
                </div>
                <p className="text-sm font-semibold text-gray-800">{item.appliance_name}</p>
                <p className="text-xs text-gray-600 mt-1 line-clamp-2">{item.problem_description}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                  <span className="text-xs text-gray-400">📍 {item.address}</span>
                  <span className="text-xs text-gray-400">
                    📅 {new Date(item.preferred_datetime).toLocaleDateString("th-TH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </span>
                  {item.budget_max && (
                    <span className="text-xs text-green-600 font-medium">งบ ≤ {item.budget_max.toLocaleString()} pts</span>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
              <span className="text-xs text-gray-400">
                โพสต์: {new Date(item.created_at).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}
              </span>
              <Link href={`/repair/announcements/${item.id}/offer`}
                className="bg-green-700 hover:bg-green-800 text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors">
                ยื่นข้อเสนอ
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
