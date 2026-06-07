"use client";

// ── WeeeR Marketplace Detail — 2.2 Mockup (Q&A placeholder + brand colors) ──

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { resellApi } from "../../_lib/api";
import type { Listing } from "../../_lib/types";
import { LISTING_STATUS_LABEL, LISTING_STATUS_COLOR } from "../../_lib/types";

const DELIVERY_OPTIONS = ["ส่ง Kerry", "ส่ง Flash", "รับเอง", "ส่งเอง (ช่างไปส่ง)"];

// Mock listing (Mockup 2.2)
const MOCK_LISTING: Listing = {
  id: "MKT001", sellerId: "U999", sellerType: "WeeeU", listingType: "used_appliance",
  applianceName: "Sony Bravia XR 55\" A80K", applianceBrand: "Sony", applianceModel: "XR55A80K",
  price: 16500, deliveryMethods: ["ส่ง Kerry", "รับเอง"],
  status: "receiving_offers", expiresAt: "2026-06-05", createdAt: "2026-05-20", updatedAt: "2026-05-22",
  description: "สภาพ 90% ขึ้นตู้ดีมาก มีรีโมท มีกล่อง ขาตั้งครบ ไม่มีรอยขีดข่วน",
  warranty: { sourceWarranty: 4, additionalWarranty: 0 },
  terms3: { shipping: "ผู้ซื้อรับผิดชอบ", usedWarranty: "14 วัน", liability: "ผู้ขายรับผิด" },
  offerCount: 1,
};

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
      .catch(() => setListing(MOCK_LISTING))  // Mockup fallback
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
      }).catch(() => null);  // Mockup: ignore API error
      setOfferSuccess(true);
      setShowOfferForm(false);
    } catch (err) {
      setOfferError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="flex items-center justify-center h-48 text-gray-400">กำลังโหลด…</div>;
  if (error) return <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-yellow-700 text-sm">⚠️ {error}</div>;
  if (!listing) return null;

  const canOffer = listing.status === "announced" || listing.status === "receiving_offers";
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
          <div>
            <p className="text-xs text-gray-400">ราคา</p>
            <p className="text-2xl font-bold text-[#FF663A]">{listing.price.toLocaleString()} pts</p>
          </div>
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

        {/* Terms 3 แกน */}
        {listing.terms3 && (
          <div className="border-t border-gray-50 pt-3">
            <p className="text-xs font-semibold text-gray-500 mb-2">📋 เงื่อนไข 3 แกน</p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="bg-gray-50 rounded-lg p-2"><p className="text-gray-400">ค่าส่ง</p><p className="font-medium text-gray-700">{listing.terms3.shipping}</p></div>
              <div className="bg-gray-50 rounded-lg p-2"><p className="text-gray-400">ประกันมือสอง</p><p className="font-medium text-gray-700">{listing.terms3.usedWarranty}</p></div>
              <div className="bg-gray-50 rounded-lg p-2"><p className="text-gray-400">ไม่ตรงปก</p><p className="font-medium text-gray-700">{listing.terms3.liability}</p></div>
            </div>
          </div>
        )}

        <div className="border-t border-gray-50 pt-3">
          <p className="text-xs text-gray-400">หมดอายุ {new Date(listing.expiresAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}</p>
        </div>
      </div>

      {/* Offer success */}
      {offerSuccess && (
        <div className="bg-[#FCEAE3] border border-[#FFD5C4] rounded-xl p-4 text-center">
          <span className="text-3xl">✅</span>
          <p className="text-sm font-semibold text-[#4A1B0C] mt-2">ยื่นข้อเสนอสำเร็จ</p>
          <Link href="/resell/offers" className="text-xs text-[#FF663A] underline mt-1 block">ดูข้อเสนอของฉัน</Link>
        </div>
      )}

      {/* Offer form */}
      {showOfferButton && !offerSuccess && (
        <>
          {!showOfferForm ? (
            <button onClick={() => setShowOfferForm(true)}
              className="w-full bg-[#FF663A] hover:bg-[#D8491F] text-white font-semibold py-3 rounded-xl transition-colors">
              🤝 ยื่นข้อเสนอ
            </button>
          ) : (
            <form onSubmit={handleOffer} className="bg-[#FCEAE3] border border-[#FFD5C4] rounded-xl p-4 space-y-3">
              <p className="text-sm font-semibold text-[#4A1B0C]">ยื่นข้อเสนอ</p>
              <div>
                <label className="block text-xs text-gray-600 mb-1">ราคาที่เสนอ (pts)</label>
                <input type="number" min={1} value={offerPrice} onChange={e => setOfferPrice(e.target.value)}
                  required
                  className="w-full border border-[#FFD5C4] rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF663A]/30" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">วิธีจัดส่ง</label>
                <select value={deliveryMethod} onChange={e => setDeliveryMethod(e.target.value)}
                  className="w-full border border-[#FFD5C4] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF663A]/30">
                  {DELIVERY_OPTIONS.filter(d => listing.deliveryMethods.includes(d)).map(d => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">ข้อความ (ถ้ามี)</label>
                <input type="text" value={message} onChange={e => setMessage(e.target.value)}
                  placeholder="ข้อความถึงผู้ขาย"
                  className="w-full border border-[#FFD5C4] rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF663A]/30" />
              </div>
              {offerError && <p className="text-xs text-red-500">{offerError}</p>}
              <div className="flex gap-2">
                <button type="submit" disabled={submitting}
                  className="flex-1 bg-[#FF663A] hover:bg-[#D8491F] text-white font-semibold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-60">
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
        <div className="text-center py-3 text-sm text-gray-400">ประกาศนี้ไม่รับข้อเสนอในขณะนี้</div>
      )}

      {/* Q&A Placeholder (FLAG-3 · D82) */}
      <div className="bg-white border border-gray-100 rounded-xl p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">💬 Q&A ถามผู้ขาย{/* PHASE-4: D82 */}</p>
        <div className="bg-gray-50 rounded-xl p-4 text-center">
          <p className="text-sm text-gray-400">ฟีเจอร์ถาม-ตอบกำลังพัฒนา</p>
          <p className="text-xs text-gray-300 mt-1">คุณจะเห็นเฉพาะคำถามของตัวเอง · ผู้ขายเห็นทุกคำถาม</p>
        </div>
      </div>
    </div>
  );
}
