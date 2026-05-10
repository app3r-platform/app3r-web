// ============================================================
// components/listings/ListingCard.tsx — Card for Resell/Scrap
// ============================================================
import Image from "next/image";
import Link from "next/link";
import TypeBadge from "./TypeBadge";
import type { ResellListing, ScrapListing } from "../../lib/types";

type Props = {
  listing: ResellListing | ScrapListing;
  sponsored?: boolean;
};

export default function ListingCard({ listing, sponsored }: Props) {
  const isResell = listing.type === "resell";
  const resell = isResell ? (listing as ResellListing) : null;
  const scrap = !isResell ? (listing as ScrapListing) : null;

  const href = `/listings/${listing.type}/${listing.id}`;
  const imageUrl = listing.images[0];
  const priceDisplay = isResell ? resell!.priceLabel : scrap!.pricePerKgLabel;
  const subInfo = isResell
    ? resell!.condition
    : `น้ำหนัก ${scrap!.totalWeightLabel}`;

  return (
    <div className="relative bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow group">
      {/* Sponsored ribbon */}
      {(sponsored || listing.sponsored) && (
        <div className="absolute top-2 left-2 z-10 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
          Sponsored
        </div>
      )}

      {/* Image */}
      <div className="relative h-44 bg-gray-100">
        <Image
          src={imageUrl}
          alt={listing.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      </div>

      <div className="p-4 space-y-2">
        {/* Badge */}
        <TypeBadge type={listing.type} />

        {/* Title */}
        <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 group-hover:text-purple-700 transition-colors">
          {listing.title}
        </h3>

        {/* Sub info */}
        <p className="text-xs text-gray-500">{subInfo}</p>

        {/* Meta */}
        <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {listing.location}
          </span>
          <span>{listing.postedAt}</span>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <span className="font-bold text-purple-700 text-sm">{priceDisplay}</span>
          <Link
            href={href}
            className="text-xs text-purple-700 hover:underline font-medium"
          >
            ดูรายละเอียด →
          </Link>
        </div>
      </div>
    </div>
  );
}
