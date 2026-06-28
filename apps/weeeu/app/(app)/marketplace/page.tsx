"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { NearMeFilter, type NearbyTambonDto } from "@app3r/ui";
import { listingsApi } from "@/lib/api/listings";
import type { Listing } from "@/lib/types";

// backend browse อาจ return display fields เพิ่มเติม (applianceName, sellerName)
type BrowseListing = Listing & {
  applianceName?: string;
  sellerName?: string;
};

const CONDITION_LABEL: Record<string, string> = {
  grade_A: "ดีมาก",
  grade_B: "ดี",
  grade_C: "พอใช้",
};

const CONDITION_COLORS: Record<string, string> = {
  "ดีมาก": "bg-green-100 text-green-700",
  "ดี": "bg-blue-100 text-blue-700",
  "พอใช้": "bg-yellow-100 text-yellow-700",
};

const CONDITION_FILTERS = ["ดีมาก", "ดี", "พอใช้"] as const;
const PRICE_RANGES = [
  { label: "ทุกราคา", min: 0, max: Infinity },
  { label: "< 1,000", min: 0, max: 1000 },
  { label: "1,000–3,000", min: 1000, max: 3000 },
  { label: "3,000–6,000", min: 3000, max: 6000 },
  { label: "> 6,000", min: 6000, max: Infinity },
] as const;

export default function MarketplacePage() {
  const [nearby, setNearby] = useState<NearbyTambonDto[] | null>(null);
  const [conditionFilter, setConditionFilter] = useState<string>("");
  const [priceRange, setPriceRange] = useState(0);
  const [searchText, setSearchText] = useState("");
  const [pageSize, setPageSize] = useState<number | "all">(20);

  const [items, setItems] = useState<BrowseListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setFetchError(null);
    listingsApi
      .browse({ listingType: "used_appliance" })
      .then(res => setItems((res.results ?? []) as BrowseListing[]))
      .catch(() => setFetchError("โหลดสินค้าไม่สำเร็จ กรุณารีเฟรชหน้า"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = items.filter(item => {
    const condLabel = CONDITION_LABEL[item.conditionGrade ?? ""] ?? "";
    const displayName = item.applianceName ?? "";
    if (searchText && !displayName.includes(searchText)) return false;
    if (conditionFilter && condLabel !== conditionFilter) return false;
    // money-safe: ห้าม ??0 — null price ไม่นับเข้า price filter
    const price = typeof item.price === "number" ? item.price : null;
    if (price !== null) {
      const range = PRICE_RANGES[priceRange];
      if (price < range.min || price >= range.max) return false;
    }
    return true;
  });

  const visible = pageSize === "all" ? filtered : filtered.slice(0, pageSize);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-xl mx-auto px-4 py-6 space-y-4">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-weeeu-dark">🛒 ตลาดสินค้ามือสอง</h1>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-400">แสดง:</span>
              {([20, 50, "ทั้งหมด"] as const).map(s => (
                <button key={String(s)} type="button"
                  onClick={() => setPageSize(s === "ทั้งหมด" ? "all" : s)}
                  className={`px-2 py-0.5 rounded-lg text-xs border transition-colors ${(s === "ทั้งหมด" ? pageSize === "all" : pageSize === s) ? "bg-weeeu-primary text-white border-weeeu-primary" : "border-gray-200 text-gray-400 hover:border-weeeu-primary"}`}>
                  {String(s)}
                </button>
              ))}
            </div>
          </div>
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

        {/* Filters */}
        <div className="space-y-2">
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            <span className="text-xs text-gray-400 flex-shrink-0 self-center">สภาพ:</span>
            {CONDITION_FILTERS.map(c => (
              <button key={c} type="button" onClick={() => setConditionFilter(c === conditionFilter ? "" : c)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 border transition-colors ${conditionFilter === c ? "bg-weeeu-primary text-white border-weeeu-primary" : "bg-white text-gray-500 border-gray-200 hover:border-weeeu-primary"}`}>
                {c}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            <span className="text-xs text-gray-400 flex-shrink-0 self-center">ราคา:</span>
            {PRICE_RANGES.map((r, i) => (
              <button key={r.label} type="button" onClick={() => setPriceRange(i)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 border transition-colors ${priceRange === i ? "bg-weeeu-primary text-white border-weeeu-primary" : "bg-white text-gray-500 border-gray-200 hover:border-weeeu-primary"}`}>
                {r.label}
              </button>
            ))}
          </div>
          {(conditionFilter || priceRange > 0 || searchText) && (
            <button type="button"
              onClick={() => { setConditionFilter(""); setPriceRange(0); setSearchText(""); }}
              className="text-xs text-weeeu-primary font-medium hover:underline">
              ✕ ล้างตัวกรองทั้งหมด
            </button>
          )}
        </div>

        {/* GR-10 NearMeFilter */}
        <div className="space-y-2">
          <NearMeFilter
            roleTheme={{ primary: "#0DC36C" }}
            backendUrl=""
            defaultRadiusKm={20}
            onResults={(its) => setNearby(its)}
          />
          {nearby && nearby.length > 0 && (
            <div className="bg-weeeu-surface border border-weeeu-primary/20 rounded-xl px-3 py-2 flex items-center justify-between">
              <span className="text-xs text-weeeu-text">📍 กรองตามตำบลใกล้คุณ ({nearby.length} ตำบล)</span>
              <button type="button" onClick={() => setNearby(null)} className="text-xs text-weeeu-primary font-medium hover:underline">ล้างตัวกรอง</button>
            </div>
          )}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="py-16 text-center text-gray-400 text-sm">⟳ กำลังโหลด...</div>
        ) : fetchError ? (
          <div className="py-8 text-center text-red-500 text-sm">{fetchError}</div>
        ) : visible.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">ไม่พบสินค้า</div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {visible.map((item) => {
              const condLabel = CONDITION_LABEL[item.conditionGrade ?? ""] ?? "";
              const displayName = item.applianceName ?? "สินค้ามือสอง";
              // money-safe: null/undefined price → ราคาไม่ระบุ (ห้าม ??0)
              const priceDisplay = typeof item.price === "number"
                ? item.price.toLocaleString() + " พอยต์ทอง"
                : "ราคาไม่ระบุ";
              return (
                <Link key={item.id} href={`/marketplace/${item.id}`}>
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    <div className="w-full h-32 bg-gray-100 flex items-center justify-center">
                      <span className="text-3xl">📦</span>
                    </div>
                    <div className="p-3 space-y-1.5">
                      <p className="text-xs font-semibold text-weeeu-dark leading-snug line-clamp-2">{displayName}</p>
                      <p className="text-sm font-bold text-weeeu-primary">{priceDisplay}</p>
                      {condLabel && (
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full inline-block ${CONDITION_COLORS[condLabel] ?? "bg-gray-100 text-gray-500"}`}>
                          {condLabel}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
