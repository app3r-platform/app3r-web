"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { resellApi } from "../../_lib/api";
import type { Listing } from "../../_lib/types";
import { LISTING_STATUS_LABEL, LISTING_STATUS_COLOR } from "../../_lib/types";

const DELIVERY_OPTIONS = ["ส่ง Kerry", "ส่ง Flash", "รับเอง", "ส่งเอง (ช่างไปส่ง)"];

export default function MarketplaceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Offer form
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [offerPrice, setOfferPrice] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState("รับเอง");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [offerSuccess, setOfferSuccess] = useState(false);
  const [offerError, setOfferError] = useState("");

  useEffect(() => {
    resellApi.marketplaceGet(id)
      .then(setListing)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleOffer(e: React.FormEvent) {
    e.preventDefault();
    if (!offerPrice || Number(offerPrice) <= 0) return;
    setSubmitting(true);
    setOfferError("");
    try {
      await resellApi.submitOffer({
        listingId: id,
        offerPrice: Number(offerPrice),
        deliveryMethod,
        message: message.trim() || undefined,
      });
      setOfferSuccess(true);
      setShowOfferForm(false);
    } catch (err) {
      setOfferError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="flex items-center justify-center h-48 text-gray-400">กำลังโหลด…</div>;
  if (error) return <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-yellow-700 text-sm">⚠️ ระบบขายมือสองกำลังพัฒนา — {error}</div>;
  if (!listing) return null;

  const canOffer = listing.status === "announced" || listing.status === "receiving_offers";
  // D61 frontend layer: hide for scrap listings (C-3.2 will add scrap listings)
  const showOfferButton = canOffer && listing.listingType !== "scrap";

  return (
    <div className="space-y-5 max-w-xl">
      <div className="flex items-center gap-3">
        <Link href="/resell/marketplace" className="text-gray-400 hover:text-gray-600">←</Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900 truncate">{listing.applianceName ?? "ประกาศขาย"}</h1>
        </div>
        <span className={`shrink-0 text-xs px-2.5 py-1 rounded-full font-medium ${LISTING_STATUS_COLOR[listing.status]}`}>
          {LISTING_STATUS_LABEL[listing.status]}
        </span>
      </div>

      {listing.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={listing.imageUrl} alt={listing.applianceName ?? ""} className="w-full max-h-56 object-cover rounded-xl border border-gray-100" />
      )}

      {/* Info */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3 text-sm">
        <div className="grid grid-cols-2 gap-3">
          <div><p className="text-xs text-gray-400">ราคา</p><p className="text-2xl font-bold text-indigo-700">{listing.price.toLocaleString()} pts</p></div>
          <div>
            <p className="text-xs text-gray-400">ผู้ขาย</p>
            <p className="font-medium">{listing.sellerType === "WeeeR" ? "🏪 ร้านค้า" : "👤 บุคคล"}</p>
          </div>
          <div><p className="text-xs text-gray-400">จัดส่ง</p><p className="font-medium">{listing.deliveryMethods.join(", ")}</p></div>
          {listing.warranty && (
            <div><p className="text-xs text-gray-400">รับประกัน</p>
              <p className="font-medium">{listing.warranty.sourceWarranty + listing.warranty.additionalWarranty} เดือน</p>
            </div>
          )}
          {listing.applianceBrand && <div><p className="text-xs text-gray-400">ยี่ห้อ</p><p className="font-medium">{listing.applianceBrand}</p></div>}
          {listing.applianceModel && <div><p className="text-xs text-gray-400">รุ่น</p><p className="font-medium">{listing.applianceModel}</p></div>}
        </div>
        {listing.description && (
          <div className="border-t border-gray-50 pt-3">
            <p className="text-xs text-gray-400 mb-1">รายละเอียด</p>
            <p className="text-gray-700">{listing.description}</p>
          </div>
        )}
        <div className="border-t border-gray-50 pt-3">
          <p className="text-xs text-gray-400">หมดอายุ {new Date(listing.expiresAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}</p>
        </div>
      </div>

      {/* Offer success */}
      {offerSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <span className="text-3xl">✅</span>
          <p className="text-sm font-semibold text-green-700 mt-2">ยื่นข้อเสนอสำเร็จ</p>
          <Link href="/resell/offers" className="text-xs text-green-600 underline mt-1 block">ดูข้อเสนอของฉัน</Link>
        </div>
      )}

      {/* Offer form */}
      {showOfferButton && !offerSuccess && (
        <>
          {!showOfferForm ? (
            <button onClick={() => setShowOfferForm(true)}
              className="w-full bg-indigo-700 hover:bg-indigo-800 text-white font-semibold py-3 rounded-xl transition-colors">
              🤝 ยื่นข้อเสนอ
            </button>
          ) : (
            <form onSubmit={handleOffer} className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 space-y-3">
              <p className="text-sm font-semibold text-indigo-800">ยื่นข้อเสนอ</p>
              <div>
                <label className="block text-xs text-gray-600 mb-1">ราคาที่เสนอ (pts)</label>
                <input type="number" min={1} value={offerPrice} onChange={e => setOfferPrice(e.target.value)}
                  required
                  className="w-full border border-indigo-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">วิธีจัดส่ง</label>
                <select value={deliveryMethod} onChange={e => setDeliveryMethod(e.target.value)}
                  className="w-full border border-indigo-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                  {DELIVERY_OPTIONS.filter(d => listing.deliveryMethods.includes(d)).map(d => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">ข้อความ (ถ้ามี)</label>
                <input type="text" value={message} onChange={e => setMessage(e.target.value)}
                  placeholder="ข้อความถึงผู้ขาย"
                  className="w-full border border-indigo-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>
              {offerError && <p className="text-xs text-red-500">{offerError}</p>}
              <div className="flex gap-2">
                <button type="submit" disabled={submitting}
                  className="flex-1 bg-indigo-700 hover:bg-indigo-800 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-60">
                  {submitting ? "กำลังส่ง…" : "✅ ยืนยัน"}
                </button>
                <button type="button" onClick={() => setShowOfferForm(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl text-sm transition-colors">
                  ยกเลิก
                </button>
              </div>
            </form>
          )}
        </>
      )}

      {!canOffer && !offerSuccess && (
        <div className="text-center py-3 text-sm text-gray-400">
          ประกาศนี้ไม่รับข้อเสนอในขณะนี้
        </div>
      )}
    </div>
  );
}
