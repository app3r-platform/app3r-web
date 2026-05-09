"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { listingsApi } from "@/lib/api/listings";
import { offersApi } from "@/lib/api/offers";
import type { Listing } from "@/lib/types";

type ListingDetail = Listing & {
  appliance_name?: string;
  seller_name?: string;
  images?: { url: string }[];
  description?: string;
};

const DELIVERY_LABEL: Record<string, string> = {
  on_site: "ส่งเอง / นัดรับ",
  parcel: "ส่งพัสดุ (ขนส่ง)",
};

const GRADE_LABEL: Record<string, string> = {
  grade_A: "เกรด A — สภาพดีมาก",
  grade_B: "เกรด B — สภาพพอใช้",
  grade_C: "เกรด C — ต้องซ่อม / อะไหล่",
};

const GRADE_COLOR: Record<string, string> = {
  grade_A: "bg-green-100 text-green-700",
  grade_B: "bg-yellow-100 text-yellow-700",
  grade_C: "bg-red-100 text-red-600",
};

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Offer form
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [offerPrice, setOfferPrice] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [offerSent, setOfferSent] = useState(false);

  useEffect(() => {
    listingsApi.get(id)
      .then(setListing)
      .catch(() => setError("ไม่สามารถโหลดข้อมูลได้"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleMakeOffer = async () => {
    if (!offerPrice || isNaN(Number(offerPrice)) || Number(offerPrice) <= 0) {
      setError("กรุณาระบุราคาที่เสนอ"); return;
    }
    if (!deliveryMethod) { setError("กรุณาเลือกวิธีจัดส่ง"); return; }
    setError("");
    setSubmitting(true);
    try {
      const res = await offersApi.create({
        listing_id: id,
        offer_price: Number(offerPrice),
        delivery_method: deliveryMethod,
        message: message.trim() || undefined,
      });
      if (!res.ok) throw new Error(await res.text());
      setOfferSent(true);
      setShowOfferForm(false);
    } catch {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-16 text-gray-400">กำลังโหลด...</div>;
  if (error && !listing) return (
    <div className="text-center py-16">
      <p className="text-4xl mb-3">📦</p>
      <p className="text-gray-600 font-medium">{error}</p>
      <Link href="/listings" className="mt-3 inline-block text-indigo-600 text-sm font-medium hover:underline">← กลับตลาด</Link>
    </div>
  );
  if (!listing) return null;

  // D61 Rule: hide offer button for scrap listings for WeeeU users
  const canMakeOffer = listing.listingType !== "scrap" &&
    (listing.status === "announced" || listing.status === "receiving_offers");

  return (
    <div className="max-w-xl space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/listings" className="text-gray-500 hover:text-gray-800 text-xl">‹</Link>
        <h1 className="text-xl font-bold text-gray-900">รายละเอียดสินค้า</h1>
      </div>

      {/* Images */}
      {listing.images && listing.images.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {listing.images.map((img, i) => (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img key={i} src={img.url} alt="" className="w-32 h-32 object-cover rounded-xl border border-gray-200 shrink-0" />
          ))}
        </div>
      )}

      {/* Main info */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-gray-800">
              {listing.listingType === "scrap" ? "🔩 ชิ้นส่วน / ซากเครื่อง" : `📱 ${listing.appliance_name ?? "เครื่องใช้ไฟฟ้า"}`}
            </p>
            {listing.seller_name && (
              <p className="text-xs text-gray-400 mt-0.5">โดย {listing.seller_name}</p>
            )}
          </div>
          {listing.conditionGrade && (
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${GRADE_COLOR[listing.conditionGrade] ?? "bg-gray-100 text-gray-500"}`}>
              {GRADE_LABEL[listing.conditionGrade] ?? listing.conditionGrade}
            </span>
          )}
        </div>

        <p className="text-2xl font-bold text-indigo-600">{listing.price.toLocaleString()} ฿</p>

        <div className="border-t border-gray-50 pt-3 space-y-2">
          <InfoRow label="จัดส่ง" value={listing.deliveryMethods.map(d => DELIVERY_LABEL[d] ?? d).join(", ")} />
          {listing.warranty && (
            <InfoRow
              label="ประกัน"
              value={`ผู้ผลิต ${listing.warranty.sourceWarranty} เดือน / เพิ่มเติม ${listing.warranty.additionalWarranty} เดือน`}
            />
          )}
          <InfoRow label="ประกาศเมื่อ" value={new Date(listing.createdAt).toLocaleDateString("th-TH")} />
        </div>

        {listing.description && (
          <div className="border-t border-gray-50 pt-3">
            <p className="text-xs text-gray-500 mb-1">รายละเอียด</p>
            <p className="text-sm text-gray-700 leading-relaxed">{listing.description}</p>
          </div>
        )}

        {listing.listingType === "scrap" && (
          <div className="bg-gray-50 rounded-xl p-3 mt-1">
            <p className="text-xs text-gray-500">🔩 สินค้าประเภทชิ้นส่วน/ซาก — สำหรับร้านซ่อมเท่านั้น (WeeeR)</p>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Offer success */}
      {offerSent && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center space-y-2">
          <p className="text-2xl">✅</p>
          <p className="text-sm font-semibold text-green-800">ส่งข้อเสนอแล้ว!</p>
          <p className="text-xs text-green-600">ผู้ขายจะพิจารณาข้อเสนอของคุณ</p>
          <Link href="/offers" className="block text-sm text-indigo-600 font-medium hover:underline">ดูข้อเสนอของฉัน →</Link>
        </div>
      )}

      {/* Offer button — D61: hide for scrap (WeeeU users cannot buy scrap) */}
      {canMakeOffer && !offerSent && !showOfferForm && (
        <button
          onClick={() => setShowOfferForm(true)}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3.5 rounded-2xl transition-colors text-sm"
        >
          🤝 ยื่นข้อเสนอ
        </button>
      )}

      {/* Offer form */}
      {canMakeOffer && showOfferForm && !offerSent && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <p className="text-sm font-semibold text-gray-800">ยื่นข้อเสนอ</p>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-gray-600">ราคาที่เสนอ (บาท) *</label>
            <input
              type="number"
              min="1"
              value={offerPrice}
              onChange={e => setOfferPrice(e.target.value)}
              placeholder={`ราคาประกาศ ${listing.price.toLocaleString()} ฿`}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-gray-600">วิธีจัดส่ง *</label>
            <div className="space-y-1.5">
              {listing.deliveryMethods.map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDeliveryMethod(d)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl border text-sm transition-colors ${
                    deliveryMethod === d
                      ? "bg-indigo-50 border-indigo-400 text-indigo-800 font-medium"
                      : "border-gray-200 text-gray-600 hover:border-indigo-200"
                  }`}
                >
                  {deliveryMethod === d && <span className="mr-2">✅</span>}
                  {DELIVERY_LABEL[d] ?? d}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-gray-600">ข้อความถึงผู้ขาย</label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="เช่น สนใจมาก ต่อราคาได้บ้างไหม"
              rows={2}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setShowOfferForm(false); setError(""); }}
              className="flex-1 border border-gray-200 text-gray-600 font-medium py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleMakeOffer}
              disabled={submitting}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
            >
              {submitting ? "กำลังส่ง..." : "ส่งข้อเสนอ"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <p className="text-sm text-gray-500 shrink-0">{label}</p>
      <p className="text-sm font-medium text-gray-800 text-right">{value}</p>
    </div>
  );
}
