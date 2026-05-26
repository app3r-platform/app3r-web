"use client";
// U-07 REPAIR-C4-SCRAP — ดูข้อเสนอซื้อซาก (C4)
// ช่างวินิจฉัยแล้ว "ซ่อมไม่คุ้ม" → เสนอซื้อซากแทน
// [A] ตกลงขายซาก → /scrap/new | [B] ปฏิเสธ → fee-settle (C5)

import { use, useState } from "react";
import Link from "next/link";

const MOCK_JOB = {
  appliance: "แอร์ Daikin 12000 BTU",
  symptom: "คอมเพรสเซอร์เสีย ซ่อมไม่คุ้ม",
  diagnosedBy: "ร้านคูลเทคแอร์",
  diagnosedAt: "26 พ.ค. 2569",
};

const MOCK_SCRAP_OFFERS = [
  {
    id: "co-001",
    shop: "ร้านคูลเทคแอร์",
    type: "buy" as const,
    price: 850,
    note: "รับซากคอมเพรสเซอร์ ราคาดี — ถอดอะไหล่ขายต่อ",
    transport: "ร้านรับไปเอง",
    date: "26 พ.ค. 2569",
    badge: "ร้านที่วินิจฉัย",
  },
  {
    id: "co-002",
    shop: "ศูนย์ซากเย็น",
    type: "free" as const,
    price: 0,
    note: "รับทิ้งฟรี มีใบรับรอง E-Waste Certificate",
    transport: "ร้านรับไปเอง",
    date: "26 พ.ค. 2569",
    badge: "มีใบ E-Waste",
  },
  {
    id: "co-003",
    shop: "ร้านอิเล็กทรอ",
    type: "buy" as const,
    price: 650,
    note: "",
    transport: "ส่งพัสดุ",
    date: "25 พ.ค. 2569",
    badge: null,
  },
];

export default function RepairScrapOfferPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-xl mx-auto px-4 py-6 space-y-4">
        {/* Back */}
        <Link
          href={`/repair/${id}/progress`}
          className="text-gray-400 hover:text-gray-700 text-sm flex items-center gap-1"
        >
          ← กลับสถานะงานซ่อม
        </Link>

        {/* C4 context banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-1">
          <p className="text-sm font-bold text-amber-800">
            ⚠️ ช่างแจ้ง: ซ่อมไม่คุ้ม — เสนอซื้อซาก
          </p>
          <p className="text-xs text-amber-600">
            {MOCK_JOB.diagnosedBy} · {MOCK_JOB.diagnosedAt}
          </p>
          <div className="mt-2 bg-white rounded-xl p-3 space-y-1">
            <p className="text-xs text-gray-400">เครื่องที่ซ่อม</p>
            <p className="text-sm font-semibold text-gray-800">{MOCK_JOB.appliance}</p>
            <p className="text-xs text-gray-500">ผลวินิจฉัย: {MOCK_JOB.symptom}</p>
          </div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-weeeu-dark">
            ข้อเสนอรับซาก ({MOCK_SCRAP_OFFERS.length})
          </h1>
          <p className="text-xs text-amber-600">⏱️ หมดอายุใน 48 ชั่วโมง</p>
        </div>

        {/* Offers */}
        <div className="space-y-3">
          {MOCK_SCRAP_OFFERS.map((offer) => (
            <div
              key={offer.id}
              onClick={() => setSelected(offer.id)}
              className={`bg-white rounded-2xl border-2 shadow-sm p-4 space-y-3 cursor-pointer transition-all ${
                selected === offer.id
                  ? "border-weeeu-primary ring-2 ring-weeeu-primary/20"
                  : "border-gray-100 hover:border-gray-200"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-weeeu-dark">
                      {offer.shop}
                    </p>
                    {offer.badge && (
                      <span className="text-[10px] bg-weeeu-surface text-weeeu-primary px-2 py-0.5 rounded-full font-medium">
                        {offer.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">
                    {offer.date} · {offer.transport}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  {offer.type === "free" ? (
                    <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full">
                      รับทิ้งฟรี 🆓
                    </span>
                  ) : (
                    <p className="text-lg font-bold text-weeeu-primary">
                      {offer.price.toLocaleString()} ฿
                    </p>
                  )}
                </div>
              </div>

              {offer.note && (
                <p className="text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                  {offer.note}
                </p>
              )}

              {/* Radio indicator */}
              <div className="flex items-center gap-2">
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                    selected === offer.id
                      ? "border-weeeu-primary bg-weeeu-primary"
                      : "border-gray-300"
                  }`}
                >
                  {selected === offer.id && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </div>
                <span className="text-xs text-gray-500">
                  {selected === offer.id ? "เลือกแล้ว" : "เลือกข้อเสนอนี้"}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="space-y-2 pt-2">
          <Link href={`/scrap/new`}>
            <button
              disabled={!selected}
              className="w-full bg-weeeu-primary hover:bg-weeeu-dark disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-2xl text-sm transition-colors"
            >
              ✅ [A] ตกลงขายซาก — ไปหน้าแจ้งซาก
            </button>
          </Link>
          <Link href={`/repair/${id}/fee-settle`}>
            <button className="w-full bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 font-medium py-2.5 rounded-2xl text-sm transition-colors">
              ❌ [B] ปฏิเสธซาก — ชำระค่าตรวจ (C5)
            </button>
          </Link>
        </div>

        <p className="text-xs text-gray-400 text-center pb-4">
          ถ้าไม่เลือกใดภายใน 48 ชั่วโมง ข้อเสนอจะหมดอายุอัตโนมัติ
        </p>
      </div>
    </div>
  );
}
