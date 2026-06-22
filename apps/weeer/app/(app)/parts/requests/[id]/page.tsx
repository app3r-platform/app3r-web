"use client";

// ── D-6 Parts Request Detail + Quotes (WeeeR) ──────────────────────────────────
// ดูใบเสนอราคาที่ได้รับสำหรับคำขอซื้ออะไหล่ของตัวเอง + กดรับ Quote
// Live quote fetch = backend (out of scope) — mockup screen เท่านั้น

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MockAnnoOrigin } from "@/components/MockAnno";
import type { D6PartsRequest } from "../../_lib/d6-types";
import { D6_REQUESTS_MOCK, URGENCY_LABEL, URGENCY_COLOR } from "../../_lib/d6-types";

// ── Mock incoming quotes ────────────────────────────────────────────────────────
interface MockQuote {
  id: string;
  sellerName: string;
  conditionScore: number;
  pricePerUnit: number;
  qtyAvailable: number;
  warrantyDays: number;
  notes?: string;
}

const MOCK_QUOTES: MockQuote[] = [
  {
    id: "QT-001",
    sellerName: "ช่างไฟฟ้า XYZ",
    conditionScore: 9,
    pricePerUnit: 1750,
    qtyAvailable: 2,
    warrantyDays: 30,
    notes: "ของพร้อมส่ง จัดส่งภายใน 1 วัน",
  },
  {
    id: "QT-002",
    sellerName: "อะไหล่เครื่องใช้ไฟฟ้า ดี",
    conditionScore: 7,
    pricePerUnit: 1500,
    qtyAvailable: 1,
    warrantyDays: 14,
  },
  {
    id: "QT-003",
    sellerName: "เทคนิค เครื่องเย็น PRO",
    conditionScore: 10,
    pricePerUnit: 1980,
    qtyAvailable: 5,
    warrantyDays: 90,
    notes: "ของใหม่ มือ 1 รับประกันศูนย์",
  },
];

export default function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [request, setRequest] = useState<D6PartsRequest | null>(null);
  const [acceptedQuote, setAcceptedQuote] = useState<string | null>(null);

  useEffect(() => {
    // Mock lookup: own requests + inbox seed (live fetch = backend, out of scope)
    const myStored: D6PartsRequest[] = JSON.parse(
      localStorage.getItem("d6_my_requests") ?? "[]"
    ) as D6PartsRequest[];
    const pool = [...myStored, ...D6_REQUESTS_MOCK];
    setRequest(pool.find((r) => r.id === id) ?? null);
  }, [id]);

  return (
    <div className="px-4 pt-5 pb-4 space-y-4">
      <MockAnnoOrigin from="R-61" />
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-500">← กลับ</button>
        <div>
          <h1 className="text-lg font-bold text-gray-800">ใบเสนอราคา</h1>
          <p className="text-xs text-gray-500">คำขอ #{id}</p>
        </div>
      </div>

      {/* Request summary */}
      {request ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-2 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-gray-800">{request.partName}</p>
              <p className="text-xs text-gray-500">
                {request.applianceBrand} {request.applianceModel}
                {request.partNumber && <span className="ml-1 text-gray-400">· {request.partNumber}</span>}
              </p>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${URGENCY_COLOR[request.urgency]}`}>
              {URGENCY_LABEL[request.urgency]}
            </span>
          </div>
          <div className="flex gap-3 text-xs text-gray-500">
            <span>📦 ต้องการ {request.qtyNeeded} ชิ้น</span>
            {request.maxPricePerUnit && (
              <span>💰 ไม่เกิน ฿{request.maxPricePerUnit.toLocaleString()}/ชิ้น</span>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
          <p className="text-sm text-gray-500">คำขอ #{id} (ตัวอย่าง mockup)</p>
        </div>
      )}

      {/* Quotes list */}
      <div className="space-y-1">
        <p className="text-sm font-medium text-gray-700">
          ใบเสนอราคาที่ได้รับ ({MOCK_QUOTES.length})
        </p>
      </div>

      {MOCK_QUOTES.map((q) => {
        const isAccepted = acceptedQuote === q.id;
        const isDisabled = acceptedQuote !== null && !isAccepted;

        return (
          <div
            key={q.id}
            className={`bg-white border rounded-2xl p-4 space-y-3 shadow-sm transition-colors
              ${isAccepted ? "border-green-300" : "border-gray-200"} ${isDisabled ? "opacity-50" : ""}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-gray-800">{q.sellerName}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  สภาพ {q.conditionScore}/10 · รับประกัน {q.warrantyDays} วัน
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-[#F04E20]">฿{q.pricePerUnit.toLocaleString()}</p>
                <p className="text-xs text-gray-400">/ชิ้น</p>
              </div>
            </div>

            <div className="flex gap-3 text-xs text-gray-500">
              <span>📦 มี {q.qtyAvailable} ชิ้น</span>
            </div>

            {q.notes && (
              <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">💬 {q.notes}</p>
            )}

            {isAccepted ? (
              <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-2">
                <p className="text-sm text-green-700 font-medium">✅ รับใบเสนอราคาแล้ว</p>
                <p className="text-xs text-green-600 mt-0.5">
                  ระบบจะแจ้งผู้ขายเพื่อดำเนินการต่อ
                </p>
              </div>
            ) : (
              <button
                onClick={() => setAcceptedQuote(q.id)}
                disabled={isDisabled}
                className="w-full py-2 bg-[#FF663A] text-white rounded-xl text-sm font-medium disabled:cursor-not-allowed"
              >
                รับใบเสนอราคานี้
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
