"use client";

// ── WeeeR Scrap Hub — R-70 (S1-S12 public feed + ซื้อซาก) ─────────────────

import { useState } from "react";
import Link from "next/link";
import type { ScrapItem, ConditionGrade } from "./_lib/types";
import {
  CONDITION_GRADE_LABEL,
  CONDITION_GRADE_COLOR,
} from "./_lib/types";

// ── mock-anno §5/§6/§8 (ลบก่อน production) ──────────────────────────────────
const AnnoOriginHub = () => (
  <div className="mock-anno mock-anno-origin text-[10px] bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-1 text-yellow-700 font-mono">
    ◀ มาจาก: sidebar WeeeR (Dashboard) หรือ push notification มีซากใหม่
  </div>
);
const AnnoXAppHub = () => (
  <details className="mock-anno mock-anno-xapp">
    <summary className="cursor-pointer text-xs bg-purple-50 border border-purple-200 text-purple-700 rounded-lg px-3 py-1.5 inline-flex items-center gap-1.5 font-medium">
      👁 แอพฯอื่น ณ จังหวะนี้ (WeeeR Hub)
    </summary>
    <div className="mt-1 bg-purple-50 border border-purple-200 rounded-xl p-3 text-xs text-purple-800 space-y-1">
      <p>• <strong>WeeeU :3002</strong> [U-55] เจ้าของซากดูรายการที่ประกาศ
        <a href="http://localhost:3002/scrap" className="underline ml-1">/scrap</a>
      </p>
      <p>• <strong>WeeeU :3002</strong> [U-29] บางรายใหม่กำลังสร้างประกาศ
        <a href="http://localhost:3002/scrap/new" className="underline ml-1">/scrap/new</a>
      </p>
    </div>
  </details>
);

// ── Mock ScrapItems (public feed) ─────────────────────────────────────────
const MOCK_ITEMS: ScrapItem[] = [
  {
    id: "SC001", sellerId: "U101", sellerType: "WeeeU",
    applianceName: "Samsung เครื่องซักผ้า WW12T", applianceBrand: "Samsung", applianceType: "washing_machine",
    conditionGrade: "grade_A", workingParts: ["มอเตอร์", "แผงควบคุม", "ฝาปิด"],
    description: "ซากเครื่องซักผ้า Samsung สภาพดี มอเตอร์ยังใช้ได้ อะไหล่ครบ",
    photos: [], price: 1200, isFree: false, status: "available",
    createdAt: "2026-05-20", updatedAt: "2026-05-22",
  },
  {
    id: "SC002", sellerId: "U102", sellerType: "WeeeU",
    applianceName: "Daikin แอร์ FTKF25XV2S", applianceBrand: "Daikin", applianceType: "ac",
    conditionGrade: "grade_B", workingParts: ["คอมเพรสเซอร์", "พัดลม"],
    description: "แอร์เก่าถอดออกจากห้องพัก คอมเพรสเซอร์ยังดี เหมาะซ่อมขายต่อ",
    photos: [], price: 800, isFree: false, status: "available",
    createdAt: "2026-05-19", updatedAt: "2026-05-21",
  },
  {
    id: "SC003", sellerId: "U103", sellerType: "WeeeU",
    applianceName: "ตู้เย็น LG GN-B202SQBB", applianceBrand: "LG", applianceType: "refrigerator",
    conditionGrade: "grade_C", workingParts: ["ชั้นวาง", "ลิ้นชัก"],
    description: "ตู้เย็นเสีย ถอดชิ้นส่วนได้ ไม่รวมคอมเพรสเซอร์ ทิ้งฟรี",
    photos: [], price: 0, isFree: true, status: "available",
    createdAt: "2026-05-18", updatedAt: "2026-05-22",
  },
  {
    id: "SC004", sellerId: "U104", sellerType: "WeeeU",
    applianceName: "HP Notebook 15s-fq5xxx", applianceBrand: "HP", applianceType: "notebook",
    conditionGrade: "grade_B", workingParts: ["RAM 8GB", "SSD 512GB", "จอ 15.6\""],
    description: "โน้ตบุ๊กซากจากงานซ่อม — มาจากงาน Repair #R-2024-089 อะไหล่ยังดีหลายชิ้น",
    photos: [], price: 1500, isFree: false, status: "available",
    fromRepairJobId: "R-2024-089",
    createdAt: "2026-05-17", updatedAt: "2026-05-22",
  },
  {
    id: "SC005", sellerId: "U105", sellerType: "WeeeU",
    applianceName: "Panasonic เครื่องซักผ้า NA-F70LG1", applianceBrand: "Panasonic", applianceType: "washing_machine",
    conditionGrade: "grade_A", workingParts: ["มอเตอร์", "ปั๊มน้ำ", "ฝาบน"],
    description: "ซากเครื่องซักผ้าฝาบน อะไหล่ครบ สภาพดีมาก",
    photos: [], price: 950, isFree: false, status: "available",
    createdAt: "2026-05-16", updatedAt: "2026-05-21",
  },
  {
    id: "SC006", sellerId: "U106", sellerType: "WeeeU",
    applianceName: "Mitsubishi แอร์ MS-GK13VF", applianceBrand: "Mitsubishi", applianceType: "ac",
    conditionGrade: "grade_C", workingParts: ["พัดลม", "แผงวงจร"],
    description: "แอร์เก่ามาก ทิ้งฟรี รับเองที่บ้าน",
    photos: [], price: 0, isFree: true, status: "available",
    createdAt: "2026-05-15", updatedAt: "2026-05-20",
  },
];

const GRADE_FILTERS: { value: ConditionGrade | ""; label: string }[] = [
  { value: "", label: "ทุกเกรด" },
  { value: "grade_A", label: "เกรด A" },
  { value: "grade_B", label: "เกรด B" },
  { value: "grade_C", label: "เกรด C" },
];

const TYPE_FILTERS = [
  { value: "", label: "ทุกประเภท" },
  { value: "washing_machine", label: "เครื่องซักผ้า" },
  { value: "ac", label: "แอร์" },
  { value: "refrigerator", label: "ตู้เย็น" },
  { value: "notebook", label: "โน้ตบุ๊ก" },
];

export default function ScrapFeedPage() {
  const [gradeFilter, setGradeFilter] = useState<ConditionGrade | "">("");
  const [typeFilter, setTypeFilter] = useState("");
  const [onlyFree, setOnlyFree] = useState(false);

  const filtered = MOCK_ITEMS.filter(item => {
    if (gradeFilter && item.conditionGrade !== gradeFilter) return false;
    if (typeFilter && item.applianceType !== typeFilter) return false;
    if (onlyFree && !item.isFree) return false;
    return true;
  });

  return (
    <div className="space-y-5">
      {/* §5 Origin + §8 Cross-app annotations */}
      <AnnoOriginHub />
      <AnnoXAppHub />

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">🔩 ตลาดซาก</h1>
        <Link href="/resell" className="text-xs text-gray-400 hover:text-gray-600">
          ← กลับ Resell
        </Link>
      </div>

      {/* Nav */}
      <div className="flex gap-2">
        <Link href="/scrap"
          className="text-xs bg-[#FF663A] text-white font-semibold px-3 py-1.5 rounded-full">
          ดูซากทั้งหมด
        </Link>
        <div>
          <Link href="/scrap/jobs"
            className="text-xs bg-gray-100 text-gray-600 hover:bg-gray-200 font-medium px-3 py-1.5 rounded-full">
            งานของฉัน
          </Link>
          <p className="mock-anno mock-anno-nav text-[10px] text-blue-500 font-mono">→ R-27 /scrap/jobs</p>
        </div>
      </div>

      {/* Grade filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {GRADE_FILTERS.map(f => (
          <button key={f.value} onClick={() => setGradeFilter(f.value)}
            className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full transition-colors
              ${gradeFilter === f.value
                ? "bg-[#FF663A] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Type + free filters */}
      <div className="flex gap-2 flex-wrap items-center">
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#FF663A]/30">
          {TYPE_FILTERS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
        <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
          <input type="checkbox" checked={onlyFree} onChange={e => setOnlyFree(e.target.checked)}
            className="rounded accent-[#FF663A]" />
          ทิ้งฟรีเท่านั้น 🆓
        </label>
        <span className="text-xs text-gray-400 ml-auto">{filtered.length} รายการ</span>
      </div>

      {/* Feed */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">ไม่พบซากที่ตรงตามเงื่อนไข</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item, idx) => (
            <div key={item.id}>
              <Link href={`/scrap/${item.id}`}
              className="bg-white border border-gray-100 rounded-xl p-4 hover:shadow-sm transition-shadow block">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-800">{item.applianceName}</p>
                    {/* S12: Repair badge */}
                    {item.fromRepairJobId && (
                      <span className="text-xs bg-orange-100 text-orange-700 font-medium px-1.5 py-0.5 rounded">
                        🔧 จาก Repair #{item.fromRepairJobId}
                      </span>
                    )}
                    {item.isFree && (
                      <span className="text-xs bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded">
                        🆓 ฟรี
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.description}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {item.workingParts.slice(0, 3).map(p => (
                      <span key={p} className="text-xs bg-gray-50 border border-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                        ✓ {p}
                      </span>
                    ))}
                    {item.workingParts.length > 3 && (
                      <span className="text-xs text-gray-400">+{item.workingParts.length - 3}</span>
                    )}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CONDITION_GRADE_COLOR[item.conditionGrade]}`}>
                    {CONDITION_GRADE_LABEL[item.conditionGrade]}
                  </span>
                  <p className="text-base font-bold text-[#FF663A] mt-1.5">
                    {item.isFree ? "ฟรี" : `${item.price.toLocaleString()} pts`}
                  </p>
                </div>
              </div>
            </Link>
            {/* §6 Nav annotation (แสดงเฉพาะ card แรก) */}
            {idx === 0 && (
              <p className="mock-anno mock-anno-nav text-[10px] text-blue-500 font-mono mt-0.5">→ R-71 /scrap/[id] (รายละเอียดซาก)</p>
            )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
