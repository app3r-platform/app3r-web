"use client";

import { useState } from "react";
import Link from "next/link";

const PURCHASES = [
  {
    id: "r001",
    name: "แอร์ Daikin 12000 BTU",
    price: 4200,
    status: "รอจัดส่ง",
    statusColor: "bg-yellow-100 text-yellow-700",
  },
  {
    id: "r002",
    name: "ทีวี Sony 43\"",
    price: 5500,
    status: "ตรวจรับแล้ว",
    statusColor: "bg-blue-100 text-blue-700",
  },
  {
    id: "r003",
    name: "เครื่องซักผ้า LG",
    price: 2800,
    status: "เสร็จสิ้น",
    statusColor: "bg-gray-100 text-gray-600",
  },
];

const TABS = ["ทั้งหมด", "รอจัดส่ง", "ระหว่างตรวจรับ", "เสร็จสิ้น"];

const TAB_FILTER: Record<string, string | null> = {
  "ทั้งหมด": null,
  "รอจัดส่ง": "รอจัดส่ง",
  "ระหว่างตรวจรับ": "ตรวจรับแล้ว",
  "เสร็จสิ้น": "เสร็จสิ้น",
};

export default function ResellPurchasesPage() {
  const [activeTab, setActiveTab] = useState("ทั้งหมด");

  const filtered = TAB_FILTER[activeTab]
    ? PURCHASES.filter((p) => p.status === TAB_FILTER[activeTab])
    : PURCHASES;

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">การซื้อ C2C (Marketplace)</h1>
        <p className="text-xs text-gray-400 mt-0.5">รายการสินค้าที่ซื้อจาก WeeeU</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 text-xs font-medium py-2 rounded-lg transition-colors
              ${activeTab === tab ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Purchase list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-xl p-8 text-center">
            <p className="text-sm text-gray-400">ไม่มีรายการในหมวดนี้</p>
          </div>
        ) : (
          filtered.map((p) => (
            <Link
              key={p.id}
              href={`/resell/purchases/r001`}
              className="block bg-white border border-gray-100 rounded-xl p-4 hover:border-gray-200 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{p.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">ราคา: {p.price != null ? `${p.price.toLocaleString()} ฿` : "ไม่ระบุ"}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-3">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${p.statusColor}`}>
                    {p.status}
                  </span>
                  <span className="text-gray-300 text-sm">›</span>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
