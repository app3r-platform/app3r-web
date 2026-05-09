"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listingsApi } from "@/lib/api/listings";
import type { Listing } from "@/lib/types";

const STATUS_LABEL: Record<string, string> = {
  announced: "ประกาศขาย",
  receiving_offers: "รับข้อเสนอ",
  offer_selected: "เลือกข้อเสนอแล้ว",
  buyer_confirmed: "ผู้ซื้อยืนยัน",
  in_progress: "กำลังดำเนินการ",
  delivered: "ส่งแล้ว",
  inspection_period: "ช่วงตรวจสอบ",
  completed: "เสร็จสิ้น",
  cancelled: "ยกเลิก",
  disputed: "มีข้อพิพาท",
};

const STATUS_COLOR: Record<string, string> = {
  announced: "bg-indigo-100 text-indigo-700",
  receiving_offers: "bg-blue-100 text-blue-700",
  offer_selected: "bg-purple-100 text-purple-700",
  buyer_confirmed: "bg-orange-100 text-orange-700",
  in_progress: "bg-yellow-100 text-yellow-700",
  delivered: "bg-teal-100 text-teal-700",
  inspection_period: "bg-cyan-100 text-cyan-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-gray-100 text-gray-500",
  disputed: "bg-red-100 text-red-700",
};

const STATUS_TABS = [
  { value: "", label: "ทั้งหมด" },
  { value: "announced", label: "ประกาศขาย" },
  { value: "receiving_offers", label: "รับข้อเสนอ" },
  { value: "completed", label: "เสร็จสิ้น" },
  { value: "cancelled", label: "ยกเลิก" },
];

type ListingTypeTab = "" | "used_appliance" | "scrap";

export default function SellPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusTab, setStatusTab] = useState("");
  const [typeTab, setTypeTab] = useState<ListingTypeTab>("");

  useEffect(() => {
    setLoading(true);
    listingsApi.mine({
      status: statusTab || undefined,
      listingType: typeTab || undefined,
    })
      .then(setListings)
      .catch(() => setListings([]))
      .finally(() => setLoading(false));
  }, [statusTab, typeTab]);

  const isScrapMode = typeTab === "scrap";

  return (
    <div className="max-w-xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">ประกาศขายของฉัน</h1>
        <Link
          href="/sell/new"
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
        >
          + ประกาศขาย
        </Link>
      </div>

      {/* Type toggle — ของมือสอง / ขายซาก */}
      <div className="grid grid-cols-3 gap-1.5 bg-gray-100 p-1 rounded-xl">
        {([
          { value: "" as ListingTypeTab, label: "ทั้งหมด", icon: "📦" },
          { value: "used_appliance" as ListingTypeTab, label: "ของมือสอง", icon: "📱" },
          { value: "scrap" as ListingTypeTab, label: "ขายซาก", icon: "♻️" },
        ] as const).map(t => (
          <button
            key={t.value}
            onClick={() => setTypeTab(t.value)}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
              typeTab === t.value
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Status tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {STATUS_TABS.map(t => (
          <button
            key={t.value}
            onClick={() => setStatusTab(t.value)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusTab === t.value
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">กำลังโหลด...</div>
      ) : listings.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <p className="text-4xl">{isScrapMode ? "♻️" : "📦"}</p>
          <p className="text-gray-500 font-medium">
            {isScrapMode ? "ยังไม่มีประกาศขายซาก" : "ยังไม่มีประกาศขาย"}
          </p>
          <p className="text-sm text-gray-400">
            {isScrapMode ? "ขายซากเครื่องใช้ไฟฟ้าเก่าได้เงิน" : "เริ่มขายเครื่องใช้ไฟฟ้ามือสองได้เลย"}
          </p>
          <Link
            href="/sell/new"
            className="inline-block mt-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            + ประกาศขายใหม่
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map(l => (
            <Link
              key={l.id}
              href={`/sell/${l.id}`}
              className="block bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {l.listingType === "scrap" ? "♻️ ขายซาก / ชิ้นส่วน" : "📱 เครื่องใช้ไฟฟ้ามือสอง"}
                  </p>
                  <p className="text-xs text-gray-400">{new Date(l.createdAt).toLocaleDateString("th-TH")}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[l.status] ?? "bg-gray-100 text-gray-500"}`}>
                    {STATUS_LABEL[l.status] ?? l.status}
                  </span>
                  <p className="text-sm font-bold text-indigo-600">{l.price.toLocaleString()} ฿</p>
                </div>
              </div>
              {(l.status === "announced" || l.status === "receiving_offers") && (
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="text-xs text-indigo-500 font-medium">ดูรายละเอียด →</span>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
