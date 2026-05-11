"use client";

import Link from "next/link";
import Image from "next/image";
import type { PartListing } from "../../app/(app)/parts/_lib/types";
import { PartCategoryBadge } from "./PartCategoryBadge";
import { PartConditionBadge } from "./PartConditionBadge";
import { PartStockIndicator } from "./PartStockIndicator";

interface PartCardProps {
  listing: PartListing;
  currentShopId?: string;
}

export function PartCard({ listing, currentShopId }: PartCardProps) {
  const isOwn = listing.shopId === currentShopId;
  const thumb = listing.images[0] ?? `https://picsum.photos/400/300?seed=${listing.id}`;

  return (
    <Link
      href={`/parts/marketplace/${listing.id}`}
      className={`block bg-white border rounded-xl overflow-hidden hover:shadow-sm transition-all ${
        isOwn ? "border-green-200 bg-green-50/30" : "border-gray-100 hover:border-green-200"
      }`}
    >
      {/* รูปภาพ */}
      <div className="relative w-full aspect-[4/3] bg-gray-50">
        <Image
          src={thumb}
          alt={listing.name}
          fill
          className="object-cover"
          unoptimized
        />
        {listing.stock === 0 && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-white text-xs font-bold bg-red-600 px-2 py-1 rounded-full">หมดสต็อก</span>
          </div>
        )}
        {isOwn && (
          <div className="absolute top-1 right-1 bg-green-700 text-white text-xs px-1.5 py-0.5 rounded-full font-medium">
            ร้านคุณ
          </div>
        )}
      </div>

      {/* เนื้อหา */}
      <div className="p-3 space-y-1.5">
        <p className="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug">{listing.name}</p>
        <p className="text-xs text-gray-400 truncate">{listing.brand} · {listing.shopName}</p>
        <div className="flex flex-wrap gap-1">
          <PartCategoryBadge category={listing.category} />
          <PartConditionBadge condition={listing.condition} />
        </div>
        <div className="flex items-center justify-between pt-0.5">
          <p className="text-sm font-bold text-green-700">{listing.pricePoints.toLocaleString()} pts</p>
          <PartStockIndicator stock={listing.stock} />
        </div>
      </div>
    </Link>
  );
}
