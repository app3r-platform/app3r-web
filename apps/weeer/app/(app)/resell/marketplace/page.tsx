"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { NearMeFilter, type NearbyTambonDto } from "@app3r/ui";
import { resellApi } from "../_lib/api";
import { getApiBase } from "../../../../lib/api-client";
import type { Listing } from "../_lib/types";
import { LISTING_STATUS_LABEL, LISTING_STATUS_COLOR } from "../_lib/types";

const CATEGORIES = ["", "เครื่องปรับอากาศ", "ตู้เย็น", "เครื่องซักผ้า", "ทีวี", "อื่นๆ"];
const SELLER_TYPES: { value: string; label: string }[] = [
  { value: "", label: "ทุกผู้ขาย" },
  { value: "WeeeR", label: "ร้านค้า (WeeeR)" },
  { value: "WeeeU", label: "บุคคล (WeeeU)" },
];

// ── Dev-mode fallback mock — seeds ตรงกับ WeeeU /marketplace (r001-r006) ──────
const FALLBACK_MOCK_LISTINGS: Listing[] = [
  {
    id: "r001", sellerId: "shop-001", sellerType: "WeeeR", listingType: "used_appliance",
    applianceName: "แอร์ Daikin 12000 BTU มือสอง", applianceBrand: "Daikin", price: 4500,
    imageUrl: "https://picsum.photos/seed/r001/300/200",
    deliveryMethods: ["นัดรับ"], status: "receiving_offers",
    expiresAt: "2026-06-26", createdAt: "2026-05-26", updatedAt: "2026-05-26",
  },
  {
    id: "r002", sellerId: "shop-002", sellerType: "WeeeR", listingType: "used_appliance",
    applianceName: "ตู้เย็น Samsung 2 ประตู 14 คิว", applianceBrand: "Samsung", price: 3200,
    imageUrl: "https://picsum.photos/seed/r002/300/200",
    deliveryMethods: ["นัดรับ", "จัดส่ง"], status: "receiving_offers",
    expiresAt: "2026-06-26", createdAt: "2026-05-26", updatedAt: "2026-05-26",
  },
  {
    id: "r003", sellerId: "shop-003", sellerType: "WeeeU", listingType: "used_appliance",
    applianceName: "เครื่องซักผ้า LG 8 kg", applianceBrand: "LG", price: 2800,
    imageUrl: "https://picsum.photos/seed/r003/300/200",
    deliveryMethods: ["จัดส่ง"], status: "announced",
    expiresAt: "2026-06-26", createdAt: "2026-05-25", updatedAt: "2026-05-25",
  },
  {
    id: "r004", sellerId: "shop-001", sellerType: "WeeeR", listingType: "used_appliance",
    applianceName: "ทีวี Sony 43\" Smart TV", applianceBrand: "Sony", price: 5500,
    imageUrl: "https://picsum.photos/seed/r004/300/200",
    deliveryMethods: ["นัดรับ", "จัดส่ง"], status: "receiving_offers",
    expiresAt: "2026-06-26", createdAt: "2026-05-24", updatedAt: "2026-05-24",
  },
  {
    id: "r005", sellerId: "shop-002", sellerType: "WeeeU", listingType: "used_appliance",
    applianceName: "ไมโครเวฟ Sharp 25L", applianceBrand: "Sharp", price: 900,
    imageUrl: "https://picsum.photos/seed/r005/300/200",
    deliveryMethods: ["จัดส่ง"], status: "announced",
    expiresAt: "2026-06-26", createdAt: "2026-05-24", updatedAt: "2026-05-24",
  },
  {
    id: "r006", sellerId: "shop-003", sellerType: "WeeeU", listingType: "used_appliance",
    applianceName: "เครื่องทำน้ำอุ่น Panasonic", applianceBrand: "Panasonic", price: 650,
    imageUrl: "https://picsum.photos/seed/r006/300/200",
    deliveryMethods: ["นัดรับ"], status: "announced",
    expiresAt: "2026-06-26", createdAt: "2026-05-23", updatedAt: "2026-05-23",
  },
];

export default function ResellMarketplacePage() {
  const [listings, setListings] = useState<Listing[]>(() =>
    process.env.NEXT_PUBLIC_DEV_NAV === "true" ? FALLBACK_MOCK_LISTINGS : []
  );
  const [loading, setLoading] = useState(() => process.env.NEXT_PUBLIC_DEV_NAV !== "true");
  const [usingMock, setUsingMock] = useState(() => process.env.NEXT_PUBLIC_DEV_NAV === "true");
  const [category, setCategory] = useState("");
  const [sellerType, setSellerType] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  // GR-10 near-me (shared NearMeFilter · @app3r/ui)
  const [nearby, setNearby] = useState<NearbyTambonDto[] | null>(null);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_DEV_NAV === "true") return;
    setLoading(true);
    resellApi.marketplaceList({
      category: category || undefined,
      sellerType: sellerType || undefined,
      minPrice: minPrice || undefined,
      maxPrice: maxPrice || undefined,
    })
      .then((data) => {
        if (data.length === 0) {
          setListings(FALLBACK_MOCK_LISTINGS);
          setUsingMock(true);
        } else {
          setListings(data);
          setUsingMock(false);
        }
      })
      .catch(() => {
        setListings(FALLBACK_MOCK_LISTINGS);
        setUsingMock(true);
      })
      .finally(() => setLoading(false));
  }, [category, sellerType, minPrice, maxPrice]);

  if (loading) return <div className="flex items-center justify-center h-48 text-gray-400">กำลังโหลด…</div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/resell" className="text-gray-400 hover:text-gray-600">←</Link>
        <h1 className="text-xl font-bold text-gray-900">🛒 ตลาดซื้อขาย (Marketplace)</h1>
        <span className="ml-auto text-xs text-gray-400">{listings.length} รายการ</span>
      </div>

      {/* Dev mock notice */}
      {usingMock && (
        <div className="bg-[#FFF1ED] border border-[#FFD0BF] rounded-xl px-3 py-2 text-xs text-[#F04E20]">
          🖼️ แสดงข้อมูล mock (seeds r001-r006) — API ยังไม่พร้อม
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">หมวดหมู่</label>
            <select value={category} onChange={e => setCategory(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF663A]">
              {CATEGORIES.map(c => <option key={c} value={c}>{c || "ทั้งหมด"}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">ผู้ขาย</label>
            <select value={sellerType} onChange={e => setSellerType(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF663A]">
              {SELLER_TYPES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
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

        {/* GR-10 · near-me filter (shared component) */}
        <div className="border-t border-gray-50 pt-3">
          <NearMeFilter
            roleTheme={{ primary: "#FF663A" }}
            backendUrl={getApiBase()}
            defaultRadiusKm={20}
            onResults={(items) => setNearby(items)}
          />
          {nearby !== null && (
            <p className="mt-2 text-xs text-gray-500">
              📍 พบ {nearby.length} ตำบลใกล้คุณ — ใช้กรองประกาศตามพื้นที่ (ต้องรอ Backend เพิ่มพิกัดในประกาศ)
            </p>
          )}
        </div>
      </div>

      {listings.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">ไม่พบประกาศ</div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {listings.map(l => (
            <Link key={l.id} href={`/resell/marketplace/${l.id}`}
              className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-sm transition-shadow">
              {l.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={l.imageUrl} alt={l.applianceName ?? ""} className="w-full h-32 object-cover" />
              ) : (
                <div className="w-full h-32 bg-gray-50 flex items-center justify-center text-4xl text-gray-300">📱</div>
              )}
              <div className="p-3">
                <p className="text-sm font-semibold text-gray-800 truncate">{l.applianceName ?? "ไม่ระบุ"}</p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-lg font-bold text-[#D63B12]">{l.price.toLocaleString()} พอยต์</p>
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${LISTING_STATUS_COLOR[l.status]}`}>
                    {LISTING_STATUS_LABEL[l.status]}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  {l.sellerType === "WeeeR" ? "🏪 ร้านค้า" : "👤 บุคคล"} · {l.deliveryMethods.join(", ")}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
