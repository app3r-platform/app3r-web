"use client";

// ── Parts Marketplace — Phase C-6 ─────────────────────────────────────────────
// หน้าตลาดซื้อ-ขายอะไหล่ B2B (Business-to-Business ร้านถึงร้าน)
// Screen: R-30 / PARTS-MARKETPLACE
// §5 มาจาก: R-51 (Parts Hub — shortcut ตลาด B2B) · §6 → R-30c · เคส P3,P4,P10,P11

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PART_LISTINGS_MOCK } from "../_lib/mock-data";
import type { PartListing } from "../_lib/types";
import { isListingActive } from "../_lib/types";
import { PartCard } from "../../../../components/parts/PartCard";
import { PartSearchBar } from "../../../../components/parts/PartSearchBar";
import { PartFilterPanel, defaultFilters, type PartFilters } from "../../../../components/parts/PartFilterPanel";
import { MarketplaceStatsCard } from "../../../../components/parts/MarketplaceStatsCard";
import { getCurrentShopId, getListings, saveListings, usePartsSync } from "../../../../lib/utils/parts-sync";
import { FEATURE_FLAGS } from "../../../../lib/dal";
import { catalogApi, mapCatalogToPartListing } from "../_lib/catalog-api";
import { MockAnnoOrigin, MockAnnoXApp } from "@/components/MockAnno";

export default function MarketplacePage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<PartFilters>(defaultFilters);
  const [shopId, setShopId] = useState("S001");
  const [showFilter, setShowFilter] = useState(false);
  const [listings, setListings] = useState<PartListing[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);

  // โหลดข้อมูล — flag เปิด: catalog API จริง / flag ปิด: localStorage mock (D-2)
  useEffect(() => {
    setShopId(getCurrentShopId());
    if (FEATURE_FLAGS.parts) {
      // W-R1 Wave 2: source จาก /api/v1/parts/catalog จริง (Ruling 1A)
      catalogApi
        .list({ status: "active" })
        .then((res) => setListings(res.items.map(mapCatalogToPartListing)))
        .catch((e) => setApiError(e instanceof Error ? e.message : "โหลด catalog ไม่สำเร็จ"));
      return;
    }
    const stored = getListings();
    if (stored.length === 0) {
      saveListings(PART_LISTINGS_MOCK);
      setListings(PART_LISTINGS_MOCK);
    } else {
      setListings(stored);
    }
  }, []);

  // Sync cross-tab (เมื่อ tab อื่นอัปเดต)
  usePartsSync((e) => {
    if (e.type === "refresh_parts" || e.type === "listing_updated" || e.type === "order_placed" || e.type === "order_cancelled") {
      setListings(getListings());
    }
    if (e.type === "shop_switched") setShopId(e.shopId);
  });

  // Client-side filter + search
  const filtered = useMemo(() => {
    return listings.filter((l) => {
      // P02 (Gen78): ซ่อนรายการที่ผู้ขายปิดขายชั่วคราว (paused) ออกจากตลาด
      if (!isListingActive(l)) return false;
      if (search && !l.name.toLowerCase().includes(search.toLowerCase()) && !l.brand.toLowerCase().includes(search.toLowerCase())) return false;
      if (filters.category && l.category !== filters.category) return false;
      if (filters.condition && l.condition !== filters.condition) return false;
      if (filters.shopId && l.shopId !== filters.shopId) return false;
      if (filters.minPrice && l.pricePoints < Number(filters.minPrice)) return false;
      if (filters.maxPrice && l.pricePoints > Number(filters.maxPrice)) return false;
      if (filters.stockOnly && l.stock === 0) return false;
      return true;
    });
  }, [listings, search, filters]);

  const activeFilterCount = Object.values(filters).filter((v) => v !== "" && v !== false).length;
  const shops = new Set(listings.map((l) => l.shopId)).size;

  return (
    <div className="space-y-4">
      {/* §5 Flow Origin — เคส P3, P4, P10, P11 */}
      <MockAnnoOrigin from={["R-51"]} />

      {/* §8 Cross-App — ผู้ขาย WeeeR เห็น R-29 ขณะผู้ซื้อกำลัง browse (เคส P3) */}
      <MockAnnoXApp
        entries={[{
          app: "WeeeR (ร้านผู้ขาย)",
          screen: "R-29 My Listings",
          url: "http://localhost:3001/parts/my-listings",
        }]}
      />

      {apiError && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
          ⚠️ ไม่สามารถโหลดข้อมูลตลาดจากระบบได้ขณะนี้ — กรุณาลองใหม่ภายหลัง
        </div>
      )}
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">ตลาดอะไหล่ B2B</h1>
        <p className="text-xs text-gray-500 mt-0.5">ซื้อ-ขายอะไหล่ระหว่างร้าน — {listings.length} รายการจาก {shops} ร้าน</p>
      </div>

      {/* Stats (สถิติ) */}
      <MarketplaceStatsCard
        totalListings={listings.length}
        totalShops={shops}
        ordersActive={3}
        volumeToday={4200}
      />

      {/* Search */}
      <PartSearchBar value={search} onChange={setSearch} />

      {/* Filter toggle */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">{filtered.length} รายการ</p>
        <button
          onClick={() => setShowFilter(!showFilter)}
          className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
            activeFilterCount > 0 ? "bg-[#FF663A] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          🔧 กรอง{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
        </button>
      </div>

      {/* Filter panel */}
      {showFilter && (
        <PartFilterPanel
          filters={filters}
          onChange={setFilters}
          onReset={() => setFilters(defaultFilters)}
        />
      )}

      {/* §6 mock-anno: แต่ละ card → R-30c (Item Detail) */}
      {filtered.length > 0 && (
        <p className="mock-anno text-xs text-orange-600 bg-orange-50 border border-orange-100 rounded-lg px-2 py-1">
          §6 คลิก card → <span className="font-mono font-semibold">R-30c</span> รายละเอียดอะไหล่ (P3, P4, P10, P11)
        </p>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-gray-400">
          <span className="text-4xl mb-3">🔍</span>
          <p className="text-sm">ไม่พบรายการที่ตรงกัน</p>
          <button onClick={() => { setSearch(""); setFilters(defaultFilters); }} className="text-xs text-[#D63B12] mt-2 hover:underline">ล้างตัวกรอง</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((l) => (
            <div key={l.id} onClick={() => router.push(`/parts/marketplace/${l.id}`)} className="cursor-pointer">
              <PartCard listing={l} currentShopId={shopId} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
