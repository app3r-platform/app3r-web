// ============================================================
// components/ads/SponsoredListing.tsx — Sponsored listing card
// ============================================================
import Image from "next/image";
import Link from "next/link";
import TypeBadge from "../listings/TypeBadge";
import type { ResellListing } from "../../lib/types";

interface SponsoredListingProps {
  listing: ResellListing;
}

export default function SponsoredListing({ listing }: SponsoredListingProps) {
  const href = `/listings/resell/${listing.id}`;

  return (
    <div className="relative bg-yellow-50 border border-yellow-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow group">
      {/* Sponsored ribbon */}
      <div className="absolute top-2 left-2 z-10 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
        Sponsored
      </div>

      {/* Image */}
      <div className="relative h-44 bg-yellow-100">
        <Image
          src={listing.images[0]}
          alt={listing.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      </div>

      <div className="p-4 space-y-2">
        <TypeBadge type="resell" />
        <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 group-hover:text-purple-700 transition-colors">
          {listing.title}
        </h3>
        <p className="text-xs text-gray-500">{listing.condition}</p>
        <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
          <span>{listing.location}</span>
          <span>{listing.postedAt}</span>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-yellow-200">
          <span className="font-bold text-purple-700 text-sm">{listing.priceLabel}</span>
          <Link href={href} className="text-xs text-purple-700 hover:underline font-medium">
            ดูรายละเอียด →
          </Link>
        </div>
      </div>
    </div>
  );
}
