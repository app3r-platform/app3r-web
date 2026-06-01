// ============================================================
// components/listings/EngagementCounters.tsx
// Small counter strip: view-count / offer-count / remaining-days.
// MOCKUP — numbers come from lib/mock/listing-engagement.ts.
// "remaining days" แสดงเด่นเฉพาะเมื่อยังไม่มีข้อเสนอ (offerCount === 0).
// Server-friendly (no "use client").
// ============================================================
import type { ListingEngagement } from "@/lib/mock/listing-engagement";

interface EngagementCountersProps {
  engagement: ListingEngagement;
  className?: string;
}

export default function EngagementCounters({
  engagement,
  className = "",
}: EngagementCountersProps) {
  const { viewCount, offerCount, remainingDays } = engagement;
  const noOffersYet = offerCount === 0;

  return (
    <div className={`grid grid-cols-3 gap-2 ${className}`}>
      <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-center">
        <div className="text-lg font-bold text-gray-900">{viewCount.toLocaleString()}</div>
        <div className="text-[11px] text-gray-500">ยอดเข้าชม</div>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-center">
        <div className="text-lg font-bold text-gray-900">{offerCount}</div>
        <div className="text-[11px] text-gray-500">ข้อเสนอ</div>
      </div>
      <div
        className={`rounded-lg border px-3 py-2 text-center ${
          noOffersYet
            ? "border-website-brand-300 bg-website-brand-50"
            : "border-gray-200 bg-white"
        }`}
      >
        <div
          className={`text-lg font-bold ${
            noOffersYet ? "text-website-brand-700" : "text-gray-900"
          }`}
        >
          {remainingDays}
        </div>
        <div className="text-[11px] text-gray-500">
          {noOffersYet ? "วันเหลือ · ยังไม่มีข้อเสนอ" : "วันเหลือ"}
        </div>
      </div>
    </div>
  );
}
