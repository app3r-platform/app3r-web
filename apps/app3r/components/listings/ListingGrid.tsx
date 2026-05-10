// ============================================================
// components/listings/ListingGrid.tsx — Responsive grid + pagination
// ============================================================
import Link from "next/link";
import ListingCard from "./ListingCard";
import type { PublicListing } from "../../lib/types";

interface ListingGridProps {
  listings: PublicListing[];
  total: number;
  page: number;
  totalPages: number;
  baseHref: string; // e.g. "/listings/resell" or "/listings"
}

export default function ListingGrid({
  listings,
  total,
  page,
  totalPages,
  baseHref,
}: ListingGridProps) {
  const pages = buildPageList(page, totalPages);

  return (
    <div>
      {/* Count */}
      <p className="text-sm text-gray-500 mb-4">พบ {total} รายการ</p>

      {/* Grid */}
      {listings.length === 0 ? (
        <div className="py-20 text-center text-gray-400">
          <p className="text-4xl mb-2">📭</p>
          <p>ไม่พบรายการที่ตรงกับเงื่อนไข</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-8 gap-1">
          {page > 1 && (
            <Link
              href={`${baseHref}?page=${page - 1}`}
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-white border border-gray-300 text-gray-700 hover:border-purple-500 text-sm"
            >
              ‹
            </Link>
          )}
          {pages.map((p, i) =>
            p === "..." ? (
              <span key={`dot-${i}`} className="w-9 h-9 flex items-center justify-center text-gray-400 text-sm">
                …
              </span>
            ) : (
              <Link
                key={p}
                href={`${baseHref}?page=${p}`}
                className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition ${
                  p === page
                    ? "bg-purple-700 text-white"
                    : "bg-white border border-gray-300 text-gray-700 hover:border-purple-500"
                }`}
              >
                {p}
              </Link>
            )
          )}
          {page < totalPages && (
            <Link
              href={`${baseHref}?page=${page + 1}`}
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-white border border-gray-300 text-gray-700 hover:border-purple-500 text-sm"
            >
              ›
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

function buildPageList(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "...")[] = [];
  pages.push(1);
  if (current > 3) pages.push("...");
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
    pages.push(i);
  }
  if (current < total - 2) pages.push("...");
  pages.push(total);
  return pages;
}
