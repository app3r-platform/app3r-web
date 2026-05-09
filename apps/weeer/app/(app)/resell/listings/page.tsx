"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { resellApi } from "../_lib/api";
import type { Listing, ListingStatus } from "../_lib/types";
import { LISTING_STATUS_LABEL, LISTING_STATUS_COLOR } from "../_lib/types";

const TABS: { value: ListingStatus | ""; label: string }[] = [
  { value: "", label: "ทั้งหมด" },
  { value: "announced", label: "ประกาศแล้ว" },
  { value: "receiving_offers", label: "รับข้อเสนอ" },
  { value: "offer_selected", label: "เลือกแล้ว" },
  { value: "in_progress", label: "ดำเนินการ" },
  { value: "completed", label: "เสร็จสิ้น" },
];

export default function ResellListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState<ListingStatus | "">("");

  useEffect(() => {
    resellApi.listingsList({ status: statusFilter || undefined })
      .then(setListings)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  if (loading) return <div className="flex items-center justify-center h-48 text-gray-400">กำลังโหลด…</div>;
  if (error) return <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-yellow-700 text-sm">⚠️ ระบบขายมือสองกำลังพัฒนา — {error}</div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/resell" className="text-gray-400 hover:text-gray-600">←</Link>
          <h1 className="text-xl font-bold text-gray-900">ประกาศของฉัน</h1>
        </div>
        <Link href="/resell/listings/new"
          className="bg-green-700 hover:bg-green-800 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors">
          + ประกาศใหม่
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map(t => (
          <button key={t.value} onClick={() => setStatusFilter(t.value)}
            className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full transition-colors
              ${statusFilter === t.value ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {listings.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">ยังไม่มีประกาศ</div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl divide-y divide-gray-50">
          {listings.map(l => (
            <Link key={l.id} href={`/resell/listings/${l.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-800 truncate">{l.applianceName ?? "—"}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${LISTING_STATUS_COLOR[l.status]}`}>
                    {LISTING_STATUS_LABEL[l.status]}
                  </span>
                  {(l.offerCount ?? 0) > 0 && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">
                      {l.offerCount} ข้อเสนอ
                    </span>
                  )}
                </div>
              </div>
              <div className="shrink-0 ml-3 text-right">
                <p className="text-sm font-bold text-green-700">{l.price.toLocaleString()} pts</p>
                <p className="text-xs text-gray-400">
                  {new Date(l.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
