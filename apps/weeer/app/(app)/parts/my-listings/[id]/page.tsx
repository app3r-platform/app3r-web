"use client";

// ── My Listing Detail (Seller View) — WeeeR ─────────────────────────────────
// แสดงรายละเอียด listing ที่ตัวเองลงขาย
// Screen: R-29c / PARTS-LISTING-DETAIL
// §5 มาจาก: R-29 (My Listings) · §6 ← R-29 (back) · เคส P2

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getListings, setListingStatus, partsSync } from "../../../../../lib/utils/parts-sync";
import { PART_LISTINGS_MOCK } from "../../_lib/mock-data";
import type { PartListing } from "../../_lib/types";
import {
  B2B_CONDITION_LABEL, LISTING_STATUS_LABEL, LISTING_STATUS_COLOR, isListingActive,
} from "../../_lib/types";
import { MockAnnoOrigin } from "@/components/MockAnno";

export default function MyListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [listing, setListing] = useState<PartListing | null>(null);

  useEffect(() => {
    const stored = getListings();
    const all = stored.length > 0 ? stored : PART_LISTINGS_MOCK;
    setListing(all.find((l) => l.id === id) ?? null);
  }, [id]);

  // P02 (Gen78): ปิดขาย / เปิดขายอีกครั้ง — toggle status active ⇄ paused
  const handleToggleStatus = () => {
    if (!listing) return;
    const next = isListingActive(listing) ? "paused" : "active";
    setListingStatus(listing.id, next);
    partsSync.emit({ type: "listing_updated", partId: listing.id });
    setListing({ ...listing, status: next });
  };

  if (!listing) {
    return (
      <div className="px-4 pt-10 text-center text-gray-500 space-y-3">
        <p className="text-4xl">📦</p>
        <p className="text-sm">ไม่พบรายการ #{id}</p>
        <button onClick={() => router.back()} className="text-[#D63B12] text-sm hover:underline">← กลับ</button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* §5 Flow Origin — P2 */}
      {/* §5 Flow Origin — เคส P2 */}
      <MockAnnoOrigin from={["R-29"]} />

      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-500 text-sm">
          ← กลับ {/* §6 → R-29 */}
        </button>
        <h1 className="text-lg font-bold text-gray-900">รายละเอียดสินค้า (P2)</h1>
      </div>

      {/* Photo */}
      {listing.images && listing.images.length > 0 && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={listing.images[0]} alt={listing.name} className="w-full h-48 object-cover rounded-2xl" />
      )}

      {/* Info */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="font-bold text-gray-900">{listing.name}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{listing.brand}</p>
          </div>
          <p className="text-lg font-bold text-[#D63B12] flex-shrink-0">
            {listing.pricePoints.toLocaleString()} pts
          </p>
        </div>

        {/* P02 (Gen78): สถานะการขาย */}
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${LISTING_STATUS_COLOR[isListingActive(listing) ? "active" : "paused"]}`}>
            {isListingActive(listing) ? "🟢" : "⏸️"} {LISTING_STATUS_LABEL[isListingActive(listing) ? "active" : "paused"]}
          </span>
          {!isListingActive(listing) && (
            <span className="text-xs text-gray-400">— ไม่แสดงในตลาด B2B</span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-y-2 text-sm">
          <div><p className="text-xs text-gray-400">สต็อก</p><p className="font-medium text-gray-800">{listing.stock} ชิ้น</p></div>
          <div><p className="text-xs text-gray-400">หมวด</p><p className="font-medium text-gray-800">{listing.category}</p></div>
          <div><p className="text-xs text-gray-400">สภาพ</p><p className="font-medium text-gray-800">{B2B_CONDITION_LABEL[listing.condition]}</p></div>
        </div>

        {listing.description && (
          <p className="text-sm text-gray-600 border-t border-gray-100 pt-3">{listing.description}</p>
        )}
      </div>

      {/* P02 (Gen78): ปิดขาย / เปิดขายอีกครั้ง */}
      {isListingActive(listing) ? (
        <button
          onClick={handleToggleStatus}
          className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-3 rounded-xl text-sm transition-colors"
        >
          ⏸️ ปิดขายรายการนี้ (ซ่อนจากตลาด)
        </button>
      ) : (
        <button
          onClick={handleToggleStatus}
          className="w-full bg-[#FF663A] hover:bg-[#F04E20] text-white font-semibold py-3 rounded-xl text-sm transition-colors"
        >
          🟢 เปิดขายอีกครั้ง
        </button>
      )}
    </div>
  );
}
