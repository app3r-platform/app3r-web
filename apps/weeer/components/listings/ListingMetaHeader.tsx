/**
 * W-Round-1 Wave 2 (WeeeR) — ListingMetaHeader
 *
 * Top of /listings/[id] — renders listing_meta core fields (snake_case · Ruling 1E/1F).
 * Structural reference: apps/app3r/components/listings/ListingMetaHeader.tsx.
 * GR-8 visibility: offer_count is null when state=matched + viewer is outsider.
 */
import type { ListingMeta, ListingType, ListingState, TambonDetail } from "@/lib/types/listing-meta";

const TYPE_LABELS: Record<ListingType, string> = {
  repair: "ซ่อม (Repair)",
  maintain: "บำรุงรักษา (Maintain)",
  resell: "ขายมือสอง (Resell)",
  scrap: "ขายซาก (Scrap)",
  parts: "อะไหล่ (Parts)",
};

const STATE_LABELS: Record<ListingState, string> = {
  draft: "ร่าง",
  published: "เผยแพร่",
  has_offer: "มีผู้ยื่นข้อเสนอ",
  matched: "ตกลงแล้ว",
  completed: "เสร็จสิ้น",
  cancelled: "ยกเลิก",
};

const STATE_COLORS: Record<ListingState, string> = {
  draft: "bg-gray-100 text-gray-700",
  published: "bg-green-50 text-green-700",
  has_offer: "bg-yellow-50 text-yellow-800",
  matched: "bg-blue-50 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-50 text-red-700",
};

function formatDateTh(iso: string): string {
  try {
    return new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function ListingMetaHeader({
  meta,
  tambon,
}: {
  meta: ListingMeta;
  tambon: TambonDetail | null;
}) {
  return (
    <header className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <div className="flex flex-wrap items-start gap-3 mb-4">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#FFF1ED] text-[#D63B12] border border-[#FFD0BF]">
          {TYPE_LABELS[meta.listing_type]}
        </span>
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${STATE_COLORS[meta.state]}`}
          title="สถานะของประกาศ (state)"
        >
          {STATE_LABELS[meta.state]}
        </span>
      </div>

      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 break-all">
        ประกาศ #{meta.listing_id.slice(0, 8)}
      </h1>

      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 text-sm">
        <div>
          <dt className="text-xs text-gray-500">จำนวนผู้เข้าชม (Views)</dt>
          <dd className="font-semibold text-gray-900 mt-1">
            {meta.view_count.toLocaleString("th-TH")}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-gray-500">จำนวนข้อเสนอ (Offers)</dt>
          <dd className="font-semibold text-gray-900 mt-1">
            {meta.offer_count === null ? (
              <span
                className="text-gray-400 italic text-xs"
                title="ซ่อนตาม GR-8 — มีผู้ตกลงแล้ว ไม่แสดงให้คนนอก"
              >
                — ซ่อน —
              </span>
            ) : (
              meta.offer_count.toLocaleString("th-TH")
            )}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-gray-500">ที่ตั้ง (Location)</dt>
          <dd className="font-semibold text-gray-900 mt-1">
            {tambon ? (
              <span>
                ต.{tambon.name_th}
                {tambon.zipcode ? (
                  <span className="text-gray-500 ml-1 text-xs">({tambon.zipcode})</span>
                ) : null}
              </span>
            ) : (
              <span className="text-gray-400 italic text-xs">ไม่ระบุ</span>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-gray-500">วันที่เผยแพร่</dt>
          <dd className="font-semibold text-gray-900 mt-1">{formatDateTh(meta.created_at)}</dd>
        </div>
      </dl>
    </header>
  );
}
