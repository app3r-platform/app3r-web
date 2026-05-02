import Link from "next/link";

export type ListingType = "resell" | "repair" | "maintain" | "scrap";

export interface ListingCardProps {
  id: string;
  title: string;
  type: ListingType;
  location: string;
  priceLabel: string;
  postedAt: string;
  imageEmoji?: string;
  limited?: boolean; // public = limited info
}

const typeConfig: Record<ListingType, { label: string; color: string; bg: string }> = {
  resell: { label: "ขายมือสอง", color: "text-green-700", bg: "bg-green-100" },
  repair: { label: "ซ่อม", color: "text-blue-700", bg: "bg-blue-100" },
  maintain: { label: "บำรุงรักษา", color: "text-orange-700", bg: "bg-orange-100" },
  scrap: { label: "ซาก", color: "text-gray-700", bg: "bg-gray-100" },
};

export default function ListingCard({
  id,
  title,
  type,
  location,
  priceLabel,
  postedAt,
  imageEmoji = "🔌",
  limited = true,
}: ListingCardProps) {
  const cfg = typeConfig[type];
  const detailHref = `/${type === "resell" ? "listings/resell" : type === "repair" ? "listings/repair" : "listings/maintain"}/${id}`;

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow group">
      {/* Image placeholder */}
      <div className="bg-gray-100 h-40 flex items-center justify-center text-5xl">
        {imageEmoji}
      </div>

      <div className="p-4 space-y-2">
        {/* Badge */}
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
          {cfg.label}
        </span>

        {/* Title */}
        <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 group-hover:text-purple-700 transition-colors">
          {title}
        </h3>

        {/* Limited info notice */}
        {limited && (
          <p className="text-xs text-gray-400 italic">
            ข้อมูลบางส่วน — สมัครสมาชิกเพื่อดูรายละเอียด
          </p>
        )}

        {/* Meta */}
        <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {location}
          </span>
          <span>{postedAt}</span>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <span className="font-bold text-purple-700 text-sm">{priceLabel}</span>
          <Link
            href={detailHref}
            className="text-xs text-purple-700 hover:underline font-medium"
          >
            ดูรายละเอียด →
          </Link>
        </div>
      </div>
    </div>
  );
}
