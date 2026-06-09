import type { ListingMeta } from "@/lib/wave0/listings-fixture";

const TYPE_LABEL: Record<string, string> = {
  repair: "ซ่อม",
  maintain: "บำรุงรักษา",
  resell: "ขายมือสอง",
  scrap: "ซาก",
};

const TYPE_COLOR: Record<string, string> = {
  repair: "bg-blue-100 text-blue-700",
  maintain: "bg-teal-100 text-teal-700",
  resell: "bg-purple-100 text-purple-700",
  scrap: "bg-orange-100 text-orange-700",
};

const STATE_BADGE: Record<string, { label: string; color: string }> = {
  announced: { label: "รับข้อเสนอ", color: "bg-green-100 text-green-700" },
  receiving_offers: { label: "มีข้อเสนอ", color: "bg-yellow-100 text-yellow-700" },
  completed: { label: "ปิดแล้ว", color: "bg-gray-100 text-gray-500" },
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

export function ListingPlaceholderGrid({ listings }: { listings: ListingMeta[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {listings.map((item) => {
        const typeBadge = TYPE_COLOR[item.listingType] ?? "bg-gray-100 text-gray-700";
        const state = STATE_BADGE[item.state] ?? { label: item.state, color: "bg-gray-100 text-gray-500" };
        return (
          <div
            key={item.listingId}
            className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-2"
          >
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${typeBadge}`}>
                {TYPE_LABEL[item.listingType]}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${state.color}`}>
                {state.label}
              </span>
            </div>
            <p className="text-xs text-gray-400 font-mono">{item.listingId}</p>
            <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
              <span>👁 {item.viewCount}</span>
              <span>🤝 {item.offerCount}</span>
              <span className="ml-auto">{formatDate(item.createdAt)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
