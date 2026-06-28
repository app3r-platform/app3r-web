"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ReportButton } from "@/components/listing/ReportButton";
import { FallbackImg } from "@/components/shared/FallbackImg";
import { listingsApi } from "@/lib/api/listings";
import type { Listing } from "@/lib/types";

type DetailListing = Listing & {
  appliance_name?: string;
  seller_name?: string;
  images?: { url: string }[];
  description?: string;
};

const CONDITION_LABEL: Record<string, string> = {
  grade_A: "ดีมาก",
  grade_B: "ดี",
  grade_C: "พอใช้",
};

export default function MarketplaceDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [item, setItem] = useState<DetailListing | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    listingsApi.get(id)
      .then((data) => setItem(data as DetailListing))
      .catch(() => setFetchError("โหลดข้อมูลสินค้าไม่สำเร็จ — กรุณารีเฟรชหน้า"));
  }, [id]);

  if (!item && !fetchError) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-xl mx-auto px-4 py-16 text-center text-gray-400 text-sm">⟳ กำลังโหลด...</div>
      </div>
    );
  }

  if (fetchError || !item) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-xl mx-auto px-4 py-8 text-center">
          <p className="text-red-500 text-sm">{fetchError}</p>
          <button onClick={() => window.location.reload()} className="mt-3 text-sm text-weeeu-primary underline">
            รีเฟรชหน้า
          </button>
        </div>
      </div>
    );
  }

  const condLabel = CONDITION_LABEL[item.conditionGrade ?? ""] ?? "";
  const displayName = item.appliance_name ?? "สินค้ามือสอง";
  const imageUrl = item.images?.[0]?.url ?? "";
  // money-safe: null → "ราคาไม่ระบุ" (ห้าม ??0)
  const priceDisplay = typeof item.price === "number"
    ? item.price.toLocaleString() + " พอยต์ทอง"
    : "ราคาไม่ระบุ";

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-xl mx-auto px-4 py-6 space-y-4">
        {/* Back link */}
        <Link href="/marketplace" className="text-gray-400 hover:text-gray-700 text-sm flex items-center gap-1">
          ← กลับตลาดสินค้า
        </Link>

        {/* Product image — D1 media fallback via FallbackImg */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <FallbackImg
            src={imageUrl}
            alt={displayName}
            className="w-full h-52 object-cover bg-gray-100"
          />
        </div>

        {/* Product info card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-base font-bold text-weeeu-dark leading-snug flex-1">{displayName}</h1>
            {condLabel && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                {condLabel}
              </span>
            )}
          </div>
          <p className="text-2xl font-bold text-weeeu-primary">{priceDisplay}</p>
          {item.description && (
            <>
              <hr className="border-gray-100" />
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">รายละเอียดสินค้า</p>
                <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
              </div>
            </>
          )}
        </div>

        {/* Shop info card */}
        {item.seller_name && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">ขายโดย</p>
                <p className="text-sm font-semibold text-weeeu-dark">{item.seller_name}</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 border-t border-gray-50 pt-3">
              💬 ดูรีวิวผู้ขายได้ในโปรไฟล์ผู้ขายหลังทำธุรกรรม
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="space-y-3 pt-2">
          <Link href={`/marketplace/${id}/offer`}>
            <button className="w-full bg-weeeu-primary hover:bg-weeeu-dark text-white font-semibold py-3 rounded-xl text-sm transition-colors">
              ยื่นข้อเสนอซื้อ
            </button>
          </Link>
          <button className="w-full border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold py-3 rounded-xl text-sm transition-colors">
            แชทกับร้าน
          </button>
        </div>

        {/* D82 — รายงานประกาศ */}
        <ReportButton listingId={id} />
      </div>
    </div>
  );
}
