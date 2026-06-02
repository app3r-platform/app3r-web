"use client";

import { useState } from "react";
import Link from "next/link";
import { NearMeFilter, type NearbyTambonDto } from "@app3r/ui";

const MOCK_ITEMS = [
  { id: "r001", name: "แอร์ Daikin 12000 BTU มือสอง", price: 4500, condition: "ดี", category: "เครื่องปรับอากาศ", shop: "ร้านดีเจริญ", image: "https://picsum.photos/seed/r001/300/200" },
  { id: "r002", name: "ตู้เย็น Samsung 2 ประตู 14 คิว", price: 3200, condition: "ดีมาก", category: "ตู้เย็น", shop: "ร้านอิเล็กทรอ", image: "https://picsum.photos/seed/r002/300/200" },
  { id: "r003", name: "เครื่องซักผ้า LG 8 kg", price: 2800, condition: "พอใช้", category: "เครื่องซักผ้า", shop: "ร้านช่างเย็น จำกัด", image: "https://picsum.photos/seed/r003/300/200" },
  { id: "r004", name: "ทีวี Sony 43\" Smart TV", price: 5500, condition: "ดีมาก", category: "โทรทัศน์", shop: "ร้านดีเจริญ", image: "https://picsum.photos/seed/r004/300/200" },
  { id: "r005", name: "ไมโครเวฟ Sharp 25L", price: 900, condition: "ดี", category: "ไมโครเวฟ", shop: "ร้านอิเล็กทรอ", image: "https://picsum.photos/seed/r005/300/200" },
  { id: "r006", name: "เครื่องทำน้ำอุ่น Panasonic", price: 650, condition: "พอใช้", category: "เครื่องทำน้ำอุ่น", shop: "ร้านช่างเย็น จำกัด", image: "https://picsum.photos/seed/r006/300/200" },
];

const CONDITION_COLORS: Record<string, string> = {
  "ดีมาก": "bg-green-100 text-green-700",
  "ดี": "bg-blue-100 text-blue-700",
  "พอใช้": "bg-yellow-100 text-yellow-700",
};

// A4: filter options
const CATEGORY_FILTERS = ["เครื่องปรับอากาศ", "ตู้เย็น", "เครื่องซักผ้า", "โทรทัศน์", "ไมโครเวฟ"] as const;
const CONDITION_FILTERS = ["ดีมาก", "ดี", "พอใช้"] as const;
const PRICE_RANGES = [
  { label: "ทุกราคา", min: 0, max: Infinity },
  { label: "< 1,000", min: 0, max: 1000 },
  { label: "1,000–3,000", min: 1000, max: 3000 },
  { label: "3,000–6,000", min: 3000, max: 6000 },
  { label: "> 6,000", min: 6000, max: Infinity },
] as const;

export default function MarketplacePage() {
  // GR-10 near-me — ผลตำบลใกล้เคียงจาก shared NearMeFilter (@app3r/ui)
  const [nearby, setNearby] = useState<NearbyTambonDto[] | null>(null);
  // A4: local filter state (UI mockup — server-side filter = BE จังหวะ2)
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [conditionFilter, setConditionFilter] = useState<string>("");
  const [priceRange, setPriceRange] = useState(0); // index into PRICE_RANGES
  const [searchText, setSearchText] = useState("");

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-xl mx-auto px-4 py-6 space-y-4">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-weeeu-dark">🛒 ตลาดสินค้ามือสอง</h1>
          <p className="text-sm text-gray-400 mt-0.5">สินค้าจากร้านที่ผ่านการรับรอง</p>
        </div>

        {/* Search bar */}
        <div className="relative">
          <input
            type="text"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            placeholder="ค้นหาสินค้า..."
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-weeeu-primary/30"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 text-lg">🔍</span>
        </div>

        {/* A4: Filter chips — ประเภท / เงื่อนไข / ราคา + ล้างตัวกรอง */}
        <div className="space-y-2">
          {/* ประเภท */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            <button type="button" onClick={() => setCategoryFilter("")}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 border transition-colors ${!categoryFilter ? "bg-weeeu-primary text-white border-weeeu-primary" : "bg-white text-gray-500 border-gray-200 hover:border-weeeu-primary"}`}>
              ทุกประเภท
            </button>
            {CATEGORY_FILTERS.map(c => (
              <button key={c} type="button" onClick={() => setCategoryFilter(c === categoryFilter ? "" : c)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 border transition-colors ${categoryFilter === c ? "bg-weeeu-primary text-white border-weeeu-primary" : "bg-white text-gray-500 border-gray-200 hover:border-weeeu-primary"}`}>
                {c}
              </button>
            ))}
          </div>
          {/* เงื่อนไขสภาพ */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            <span className="text-xs text-gray-400 flex-shrink-0 self-center">สภาพ:</span>
            {CONDITION_FILTERS.map(c => (
              <button key={c} type="button" onClick={() => setConditionFilter(c === conditionFilter ? "" : c)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 border transition-colors ${conditionFilter === c ? "bg-weeeu-primary text-white border-weeeu-primary" : "bg-white text-gray-500 border-gray-200 hover:border-weeeu-primary"}`}>
                {c}
              </button>
            ))}
          </div>
          {/* ราคา */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            <span className="text-xs text-gray-400 flex-shrink-0 self-center">ราคา:</span>
            {PRICE_RANGES.map((r, i) => (
              <button key={r.label} type="button" onClick={() => setPriceRange(i)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 border transition-colors ${priceRange === i ? "bg-weeeu-primary text-white border-weeeu-primary" : "bg-white text-gray-500 border-gray-200 hover:border-weeeu-primary"}`}>
                {r.label}
              </button>
            ))}
          </div>
          {/* Clear filters */}
          {(categoryFilter || conditionFilter || priceRange > 0 || searchText) && (
            <button type="button"
              onClick={() => { setCategoryFilter(""); setConditionFilter(""); setPriceRange(0); setSearchText(""); }}
              className="text-xs text-weeeu-primary font-medium hover:underline">
              ✕ ล้างตัวกรองทั้งหมด
            </button>
          )}
        </div>

        {/* GR-10 NearMeFilter (shared @app3r/ui · roleTheme weeeu · proxy /api → backend) */}
        <div className="space-y-2">
          <NearMeFilter
            roleTheme={{ primary: "#0DC36C" }}
            backendUrl=""
            defaultRadiusKm={20}
            onResults={(items) => setNearby(items)}
          />
          {nearby && nearby.length > 0 && (
            <div className="bg-weeeu-surface border border-weeeu-primary/20 rounded-xl px-3 py-2 flex items-center justify-between">
              <span className="text-xs text-weeeu-text">📍 กรองตามตำบลใกล้คุณ ({nearby.length} ตำบล)</span>
              <button
                type="button"
                onClick={() => setNearby(null)}
                className="text-xs text-weeeu-primary font-medium hover:underline"
              >
                ล้างตัวกรอง
              </button>
            </div>
          )}
        </div>

        {/* Grid — filtered */}
        <div className="grid grid-cols-2 gap-3">
          {MOCK_ITEMS.filter(item =>
            (!searchText || item.name.includes(searchText) || item.shop.includes(searchText)) &&
            (!categoryFilter || item.category === categoryFilter) &&
            (!conditionFilter || item.condition === conditionFilter) &&
            (item.price >= PRICE_RANGES[priceRange].min && item.price < PRICE_RANGES[priceRange].max)
          ).map((item) => (
            <Link key={item.id} href={`/marketplace/${item.id}`}>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-32 object-cover"
                />
                <div className="p-3 space-y-1.5">
                  <p className="text-xs font-semibold text-weeeu-dark leading-snug line-clamp-2">{item.name}</p>
                  <p className="text-sm font-bold text-weeeu-primary">{item.price.toLocaleString()} ฿</p>
                  <div className="flex items-center justify-between gap-1 flex-wrap">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${CONDITION_COLORS[item.condition] ?? "bg-gray-100 text-gray-500"}`}>
                      {item.condition}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 truncate">{item.shop}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
