"use client";

import type { PartListing } from "../../app/(app)/parts/_lib/types";
import { PartCategoryBadge } from "./PartCategoryBadge";
import { PartConditionBadge } from "./PartConditionBadge";
import { PartStockIndicator } from "./PartStockIndicator";

interface PartDetailHeaderProps {
  listing: PartListing;
  isOwn: boolean;
}

export function PartDetailHeader({ listing, isOwn }: PartDetailHeaderProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5 items-center">
        <PartCategoryBadge category={listing.category} size="md" />
        <PartConditionBadge condition={listing.condition} size="md" />
        {isOwn && (
          <span className="text-xs bg-green-100 text-green-700 font-medium px-2.5 py-1 rounded-full">
            🏪 รายการของร้านคุณ
          </span>
        )}
      </div>
      <h1 className="text-xl font-bold text-gray-900">{listing.name}</h1>
      <p className="text-sm text-gray-500">
        ยี่ห้อ (Brand): <span className="font-medium text-gray-700">{listing.brand}</span>
        &nbsp;·&nbsp;
        ร้าน: <span className="font-medium text-gray-700">{listing.shopName}</span>
      </p>
      <div className="flex items-center justify-between">
        <p className="text-2xl font-bold text-green-700">{listing.pricePoints.toLocaleString()} pts</p>
        <PartStockIndicator stock={listing.stock} />
      </div>
      {listing.description && (
        <p className="text-sm text-gray-600 bg-gray-50 rounded-xl px-4 py-3 leading-relaxed">{listing.description}</p>
      )}
    </div>
  );
}
