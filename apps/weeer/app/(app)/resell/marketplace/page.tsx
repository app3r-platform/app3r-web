"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { resellApi } from "../_lib/api";
import type { Listing } from "../_lib/types";
import { LISTING_STATUS_LABEL, LISTING_STATUS_COLOR } from "../_lib/types";

const CATEGORIES = ["", "เครื่องปรับอากาศ", "ตู้เย็น", "เครื่องซักผ้า", "ทีวี", "อื่นๆ"];
const SELLER_TYPES: { value: string; label: string }[] = [
  { value: "", label: "ทุกผู้ขาย" },
  { value: "WeeeR", label: "ร้านค้า (WeeeR)" },
  { value: "WeeeU", label: "บุคคล (WeeeU)" },
];

export default function ResellMarketplacePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [category, setCategory] = useState("");
  const [sellerType, setSellerType] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  useEffect(() => {
    resellApi.marketplaceList({
      category: category || undefined,
      sellerType: sellerType || undefined,
      minPrice: minPrice || undefined,
      maxPrice: maxPrice || undefined,
    })
      .then(setListings)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [category, sellerType, minPrice, maxPrice]);

  if (loading) return <div className="flex items-center justify-center h-48 text-gray-400">กำลังโหลด…</div>;
  if (error) return <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-yellow-700 text-sm">⚠️ ระบบขายมือสองกำลังพัฒนา — {error}</div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/resell" className="text-gray-400 hover:text-gray-600">←</Link>
        <h1 className="text-xl font-bold text-gray-900">🛒 Marketplace</h1>
        <span className="ml-auto text-xs text-gray-400">{listings.length} รายการ</span>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">หมวดหมู่</label>
            <select value={category} onChange={e => setCategory(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
              {CATEGORIES.map(c => <option key={c} value={c}>{c || "ทั้งหมด"}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">ผู้ขาย</label>
            <select value={sellerType} onChange={e => setSellerType(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
              {SELLER_TYPES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
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
                  <p className="text-lg font-bold text-indigo-700">{l.price.toLocaleString()} pts</p>
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
