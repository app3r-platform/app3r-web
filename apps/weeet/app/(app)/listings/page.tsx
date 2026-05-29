"use client";
// T-17 — ประกาศบริการของฉัน (service listings · listing_meta)
// W-Round-1 Wave 2 · entry → detail (D83 + Escrow)
import { useEffect, useState } from "react";
import Link from "next/link";
import { getListing, MOCK_LISTING_IDS } from "@/lib/listing-api";
import {
  type ListingMetaDto,
  LISTING_STATE_LABELS,
  LISTING_TYPE_LABELS,
} from "@/lib/types/listing-meta";

const STATE_DOT: Record<string, string> = {
  matched: "bg-weeet-primary",
  completed: "bg-green-500",
  cancelled: "bg-red-500",
  has_offer: "bg-yellow-500",
  published: "bg-blue-500",
  draft: "bg-gray-500",
};

export default function ServiceListingsPage() {
  const [items, setItems] = useState<ListingMetaDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all(MOCK_LISTING_IDS.map((id) => getListing(id).then((r) => r.data).catch(() => null)))
      .then((rows) => setItems(rows.filter((r): r is ListingMetaDto => r !== null)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="pb-8">
      <div className="sticky top-[41px] bg-gray-950/90 backdrop-blur-sm border-b border-gray-800 px-4 py-3 z-10">
        <h1 className="font-bold text-white">ประกาศบริการของฉัน</h1>
        <p className="text-xs text-gray-500 mt-0.5">งานที่จับคู่แล้ว — ยืนยันส่งมอบเพื่อปล่อยเงิน Escrow</p>
      </div>

      <div className="px-4 pt-4 space-y-3">
        {loading && (
          <div className="space-y-3 animate-pulse">
            <div className="bg-gray-800 rounded-xl h-20" />
            <div className="bg-gray-800 rounded-xl h-20" />
          </div>
        )}

        {!loading && items.length === 0 && (
          <div className="text-center py-12 space-y-2">
            <p className="text-3xl">📋</p>
            <p className="text-gray-400 text-sm">ยังไม่มีประกาศบริการ</p>
          </div>
        )}

        {!loading &&
          items.map((it) => (
            <Link
              key={it.listingId}
              href={`/listings/${it.listingId}`}
              className="block bg-gray-800 border border-gray-700 rounded-xl p-4 hover:border-weeet-primary/60 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white">
                  {LISTING_TYPE_LABELS[it.listingType]}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-gray-400">
                  <span className={`w-2 h-2 rounded-full ${STATE_DOT[it.state] ?? "bg-gray-500"}`} />
                  {LISTING_STATE_LABELS[it.state]}
                </span>
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                <span className="font-mono">{it.listingId}</span>
                <span>👁 {it.viewCount.toLocaleString()}</span>
              </div>
            </Link>
          ))}
      </div>
    </div>
  );
}
