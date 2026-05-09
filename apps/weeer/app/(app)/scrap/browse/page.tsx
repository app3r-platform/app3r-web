"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { scrapApi } from "../_lib/api";
import type { ScrapItem } from "../_lib/types";
import { CONDITION_GRADE_LABEL, CONDITION_GRADE_COLOR, SCRAP_ITEM_STATUS_COLOR, SCRAP_ITEM_STATUS_LABEL } from "../_lib/types";

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
      .catch((e: Error) => setError(e.message))
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
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          <span className="text-gray-400 text-sm">—</span>
          <input type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)}
            placeholder="ราคาสูงสุด"
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
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
                <p className="text-lg font-bold text-indigo-700 mt-1">{item.price.toLocaleString()} pts</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
