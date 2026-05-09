"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { resellApi } from "../../_lib/api";
import type { Listing, Offer } from "../../_lib/types";
import { LISTING_STATUS_LABEL, LISTING_STATUS_COLOR, OFFER_STATUS_LABEL, OFFER_STATUS_COLOR, LISTING_TERMINAL } from "../../_lib/types";

export default function ResellListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [listing, setListing] = useState<Listing | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      resellApi.listingsGet(id),
      resellApi.listingOffers(id),
    ])
      .then(([l, o]) => { setListing(l); setOffers(o); })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleAccept(offerId: string) {
    setActionLoading(offerId);
    try {
      const updated = await resellApi.acceptOffer(id, offerId);
      setListing(updated);
      setOffers(prev => prev.map(o => ({
        ...o,
        status: o.id === offerId ? "selected" : "rejected",
      })));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(offerId: string) {
    setActionLoading(offerId);
    try {
      await resellApi.rejectOffer(id, offerId);
      setOffers(prev => prev.map(o => o.id === offerId ? { ...o, status: "rejected" } : o));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) return <div className="flex items-center justify-center h-48 text-gray-400">กำลังโหลด…</div>;
  if (error && !listing) return <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-yellow-700 text-sm">⚠️ ระบบขายมือสองกำลังพัฒนา — {error}</div>;
  if (!listing) return null;

  const isTerminal = LISTING_TERMINAL.includes(listing.status);
  const pendingOffers = offers.filter(o => o.status === "pending");

  return (
    <div className="space-y-5 max-w-xl">
      <div className="flex items-center gap-3">
        <Link href="/resell/listings" className="text-gray-400 hover:text-gray-600">←</Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900 truncate">{listing.applianceName ?? "ประกาศขาย"}</h1>
          <p className="text-xs text-gray-400">สร้าง {new Date(listing.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "long" })}</p>
        </div>
        <span className={`shrink-0 text-xs px-2.5 py-1 rounded-full font-medium ${LISTING_STATUS_COLOR[listing.status]}`}>
          {LISTING_STATUS_LABEL[listing.status]}
        </span>
      </div>

      {/* Listing info */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3 text-sm">
        <div className="grid grid-cols-2 gap-3">
          <div><p className="text-xs text-gray-400">ราคา</p><p className="text-2xl font-bold text-green-700">{listing.price.toLocaleString()} pts</p></div>
          <div><p className="text-xs text-gray-400">จัดส่ง</p><p className="font-medium">{listing.deliveryMethods.join(", ")}</p></div>
          {listing.warranty && (
            <div className="col-span-2">
              <p className="text-xs text-gray-400">การรับประกัน</p>
              <p className="font-medium">ต้นทาง {listing.warranty.sourceWarranty} เดือน + เพิ่ม {listing.warranty.additionalWarranty} เดือน</p>
            </div>
          )}
          {listing.description && (
            <div className="col-span-2"><p className="text-xs text-gray-400">รายละเอียด</p><p className="text-gray-700">{listing.description}</p></div>
          )}
          <div><p className="text-xs text-gray-400">หมดอายุ</p><p className="font-medium">{new Date(listing.expiresAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}</p></div>
          <div><p className="text-xs text-gray-400">ข้อเสนอ</p><p className="font-bold text-amber-600">{offers.length} ข้อเสนอ</p></div>
        </div>
      </div>

      {/* Offers */}
      <div className="bg-white border border-gray-100 rounded-xl p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          ข้อเสนอที่ได้รับ {pendingOffers.length > 0 && <span className="text-amber-600">({pendingOffers.length} รอตอบ)</span>}
        </p>
        {offers.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">ยังไม่มีข้อเสนอ</p>
        ) : (
          <div className="space-y-3">
            {offers.map(o => (
              <div key={o.id} className="border border-gray-100 rounded-xl p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-gray-800">{o.offerPrice.toLocaleString()} pts</p>
                    <p className="text-xs text-gray-500">{o.buyerName ?? o.buyerId} · {o.buyerType}</p>
                    <p className="text-xs text-gray-400">{o.deliveryMethod}</p>
                    {o.message && <p className="text-xs text-gray-500 mt-1 italic">"{o.message}"</p>}
                  </div>
                  <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${OFFER_STATUS_COLOR[o.status]}`}>
                    {OFFER_STATUS_LABEL[o.status]}
                  </span>
                </div>
                {o.status === "pending" && !isTerminal && (
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => handleAccept(o.id)} disabled={!!actionLoading}
                      className="flex-1 bg-green-700 hover:bg-green-800 text-white text-xs font-semibold py-2 rounded-lg transition-colors disabled:opacity-60">
                      {actionLoading === o.id ? "…" : "✅ รับข้อเสนอ"}
                    </button>
                    <button onClick={() => handleReject(o.id)} disabled={!!actionLoading}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold py-2 rounded-lg transition-colors disabled:opacity-60">
                      ❌ ปฏิเสธ
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-500 text-center">{error}</p>}
    </div>
  );
}
