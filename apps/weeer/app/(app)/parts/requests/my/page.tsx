"use client";

// ── D-6 My Parts Requests (WeeeR) ─────────────────────────────────────────────
// ดู broadcast requests ที่ตัวเองส่งออกไป — GET /api/v1/parts/requests/my

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MockAnnoOrigin, MockAnnoNav } from "@/components/MockAnno";
import type { D6PartsRequest } from "../../_lib/d6-types";
import { URGENCY_LABEL, URGENCY_COLOR } from "../../_lib/d6-types";

const STATUS_LABEL: Record<D6PartsRequest["status"], string> = {
  open:    "รอ Quote",
  quoted:  "มีใบเสนอราคา",
  matched: "จับคู่แล้ว",
  expired: "หมดอายุ",
};
const STATUS_COLOR: Record<D6PartsRequest["status"], string> = {
  open:    "bg-blue-100 text-blue-700",
  quoted:  "bg-amber-100 text-amber-700",
  matched: "bg-green-100 text-green-700",
  expired: "bg-gray-100 text-gray-500",
};

export default function MyRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<D6PartsRequest[]>([]);

  useEffect(() => {
    const stored: D6PartsRequest[] = JSON.parse(
      localStorage.getItem("d6_my_requests") ?? "[]"
    ) as D6PartsRequest[];
    setRequests(stored.reverse());
  }, []);

  return (
    <div className="px-4 pt-5 pb-4 space-y-4">
      <MockAnnoOrigin from="R-61" />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-500">← กลับ</button>
          <div>
            <h1 className="text-lg font-bold text-gray-800">Request ของฉัน</h1>
            <p className="text-xs text-gray-500">คำขอซื้ออะไหล่ที่ส่งออกไป</p>
          </div>
        </div>
        <button
          onClick={() => router.push("/parts/requests/new")}
          className="text-xs bg-[#FF663A] text-white px-3 py-1.5 rounded-lg font-medium"
        >
          + ขอซื้อใหม่
        </button>
      </div>

      {requests.length === 0 && (
        <div className="text-center py-14 space-y-3">
          <p className="text-5xl">📋</p>
          <p className="text-gray-500 text-sm">ยังไม่มีคำขอซื้ออะไหล่</p>
          <button
            onClick={() => router.push("/parts/requests/new")}
            className="mt-1 px-4 py-2 bg-[#FF663A] text-white rounded-xl text-sm"
          >
            ส่งคำขอแรก
          </button>
        </div>
      )}

      {requests.map((req) => {
        const expired = new Date(req.expiresAt).getTime() < Date.now();
        const status = expired && req.status === "open" ? "expired" : req.status;

        return (
          <div key={req.id} className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-gray-800">{req.partName}</p>
                <p className="text-xs text-gray-500">{req.applianceBrand} {req.applianceModel}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${STATUS_COLOR[status]}`}>
                {STATUS_LABEL[status]}
              </span>
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              <span className={`px-2 py-0.5 rounded-full ${URGENCY_COLOR[req.urgency]}`}>
                {URGENCY_LABEL[req.urgency]}
              </span>
              <span className="text-gray-500">📦 {req.qtyNeeded} ชิ้น</span>
              {req.maxPricePerUnit && (
                <span className="text-gray-500">💰 ≤ ฿{req.maxPricePerUnit.toLocaleString()}</span>
              )}
              {req.quoteCount !== undefined && req.quoteCount > 0 && (
                <span className="text-blue-600">💬 {req.quoteCount} Quote</span>
              )}
            </div>

            {!expired && req.status !== "matched" && (
              <p className="text-xs text-amber-600">
                ⏳ หมดอายุ {new Date(req.expiresAt).toLocaleString("th")}
              </p>
            )}

            {req.status === "quoted" && (
              <button
                onClick={() => router.push(`/parts/requests/${req.id}`)}
                className="w-full py-2 bg-amber-500 text-white rounded-xl text-xs font-medium"
              >
                ดูใบเสนอราคา →
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
