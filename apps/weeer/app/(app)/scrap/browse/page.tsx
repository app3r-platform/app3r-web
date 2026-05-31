"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { scrapApi } from "../_lib/api";
import type { ScrapItem } from "../_lib/types";
import { CONDITION_GRADE_LABEL, CONDITION_GRADE_COLOR, SCRAP_ITEM_STATUS_COLOR, SCRAP_ITEM_STATUS_LABEL } from "../_lib/types";

// ── MOCK_ITEMS — hardcoded fallback สำหรับ dev (ใช้เมื่อ API ไม่ตอบ) ──────────
const MOCK_ITEMS: ScrapItem[] = [
  {
    id: "SC002", sellerId: "U102", sellerType: "WeeeU",
    applianceName: "Daikin แอร์ FTKF25XV2S", applianceBrand: "Daikin", applianceType: "ac",
    conditionGrade: "grade_B", workingParts: ["คอมเพรสเซอร์", "พัดลม"],
    description: "แอร์เก่าถอดออกจากห้องพัก คอมเพรสเซอร์ยังดี เหมาะซ่อมขายต่อ",
    photos: [], price: 800, isFree: false, status: "available",
    createdAt: "2026-05-19", updatedAt: "2026-05-21",
  },
  {
    id: "SC001", sellerId: "U101", sellerType: "WeeeU",
    applianceName: "Samsung เครื่องซักผ้า WW12T", applianceBrand: "Samsung", applianceType: "washing_machine",
    conditionGrade: "grade_A", workingParts: ["มอเตอร์", "แผงควบคุม", "ฝาปิด"],
    description: "ซากเครื่องซักผ้า Samsung สภาพดี มอเตอร์ยังใช้ได้ อะไหล่ครบ",
    photos: [], price: 1200, isFree: false, status: "available",
    createdAt: "2026-05-20", updatedAt: "2026-05-22",
  },
  {
    id: "SC003", sellerId: "U103", sellerType: "WeeeU",
    applianceName: "ตู้เย็น LG GN-B202SQBB", applianceBrand: "LG", applianceType: "refrigerator",
    conditionGrade: "grade_C", workingParts: ["ชั้นวาง", "ลิ้นชัก"],
    description: "ตู้เย็นเสีย ถอดชิ้นส่วนได้ ไม่รวมคอมเพรสเซอร์ ทิ้งฟรี",
    photos: [], price: 0, isFree: true, status: "available",
    createdAt: "2026-05-18", updatedAt: "2026-05-22",
  },
];

const GRADES = ["", "grade_A", "grade_B", "grade_C"] as const;

export default function ScrapBrowsePage() {
  const [items, setItems] = useState<ScrapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [grade, setGrade] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  useEffect(() => {
    setLoading(true);
    scrapApi.browseList({
      conditionGrade: grade || undefined,
      minPrice: minPrice || undefined,
      maxPrice: maxPrice || undefined,
    })
      .then(setItems)
      .catch(() => {
        // DEV fallback: API ไม่ตอบ → ใช้ MOCK_ITEMS แทน (ไม่แสดง error)
        setItems(MOCK_ITEMS);
      })
      .finally(() => setLoading(false));
  }, [grade, minPrice, maxPrice]);

  if (loading) return <div className="flex items-center justify-center h-48 text-gray-400">กำลังโหลด…</div>;
  if (error) return <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-yellow-700 text-sm">⚠️ ระบบซากกำลังพัฒนา — {error}</div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/scrap" className="text-gray-400 hover:text-gray-600">←</Link>
        <h1 className="text-xl font-bold text-gray-900">🔍 เลือกซื้อซาก</h1>
        <span className="ml-auto text-xs text-gray-400">{items.length} รายการ</span>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">เกรดสภาพ</label>
          <div className="flex gap-2 flex-wrap">
            {GRADES.map(g => (
              <button key={g} onClick={() => setGrade(g)}
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors
                  ${grade === g ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                {g ? CONDITION_GRADE_LABEL[g as keyof typeof CONDITION_GRADE_LABEL] : "ทั้งหมด"}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)}
            placeholder="ราคาต่ำสุด"
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF663A]" />
          <span className="text-gray-400 text-sm">—</span>
          <input type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)}
            placeholder="ราคาสูงสุด"
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF663A]" />
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">ไม่พบซากที่วางขาย</div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {items.map(item => (
            <Link key={item.id} href={`/scrap/browse/${item.id}`}
              className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-sm transition-shadow">
              {item.photos[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.photos[0]} alt={item.description} className="w-full h-32 object-cover" />
              ) : (
                <div className="w-full h-32 bg-gray-50 flex items-center justify-center text-4xl text-gray-300">♻️</div>
              )}
              <div className="p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${CONDITION_GRADE_COLOR[item.conditionGrade]}`}>
                    {CONDITION_GRADE_LABEL[item.conditionGrade]}
                  </span>
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${SCRAP_ITEM_STATUS_COLOR[item.status]}`}>
                    {SCRAP_ITEM_STATUS_LABEL[item.status]}
                  </span>
                </div>
                <p className="text-sm font-semibold text-gray-800 truncate">{item.description}</p>
                {item.workingParts.length > 0 && (
                  <p className="text-xs text-gray-400 truncate mt-0.5">ชิ้นส่วนใช้ได้: {item.workingParts.join(", ")}</p>
                )}
                <p className="text-lg font-bold text-[#D63B12] mt-1">{item.price.toLocaleString()} pts</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
