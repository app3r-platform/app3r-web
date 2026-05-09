"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { listingsApi } from "@/lib/api/listings";
import { offersApi } from "@/lib/api/offers";
import type { Listing, Offer } from "@/lib/types";

type ListingDetail = Listing & {
  appliance_name?: string;
  seller_name?: string;
  images?: { url: string }[];
  description?: string;
};

type OfferWithBuyer = Offer & { buyer_name?: string };

const STATUS_LABEL: Record<string, string> = {
  announced: "ประกาศขาย",
  receiving_offers: "รับข้อเสนอ",
  offer_selected: "เลือกข้อเสนอแล้ว",
  buyer_confirmed: "ผู้ซื้อยืนยัน",
  in_progress: "กำลังดำเนินการ",
  delivered: "ส่งแล้ว",
  inspection_period: "ช่วงตรวจสอบ",
  completed: "เสร็จสิ้น",
  cancelled: "ยกเลิก",
  disputed: "มีข้อพิพาท",
};

const OFFER_STATUS_LABEL: Record<string, string> = {
  pending: "รอพิจารณา",
  selected: "เลือกแล้ว ✅",
  rejected: "ปฏิเสธ",
  withdrawn: "ถอนข้อเสนอ",
};

const DELIVERY_LABEL: Record<string, string> = {
  on_site: "ส่งเอง / นัดรับ",
  parcel: "ส่งพัสดุ",
};

const GRADE_LABEL: Record<string, string> = {
  grade_A: "เกรด A",
  grade_B: "เกรด B",
  grade_C: "เกรด C",
};

export default function SellDetailPage() {
  const { listingId } = useParams<{ listingId: string }>();
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [offers, setOffers] = useState<OfferWithBuyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selecting, setSelecting] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      listingsApi.get(listingId),
      offersApi.forListing(listingId).catch(() => []),
    ])
      .then(([l, o]) => { setListing(l); setOffers(o); })
      .catch(() => setError("ไม่สามารถโหลดข้อมูลได้"))
      .finally(() => setLoading(false));
  };

  useEffect(load, [listingId]);

  const handleSelectOffer = async (offerId: string) => {
    setSelecting(offerId);
    try {
      const res = await listingsApi.selectOffer(listingId, offerId);
      if (!res.ok) throw new Error();
      load();
    } catch {
      setError("เกิดข้อผิดพลาด");
    } finally {
      setSelecting(null);
    }
  };

  const handleCancel = async () => {
    if (!confirm("ยืนยันยกเลิกประกาศนี้?")) return;
    setCancelling(true);
    try {
      const res = await listingsApi.cancel(listingId);
      if (!res.ok) throw new Error();
      load();
    } catch {
      setError("เกิดข้อผิดพลาด");
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <div className="text-center py-16 text-gray-400">กำลังโหลด...</div>;
  if (error && !listing) return (
    <div className="text-center py-16">
      <p className="text-4xl mb-3">📦</p>
      <p className="text-gray-600 font-medium">{error}</p>
      <Link href="/sell" className="mt-3 inline-block text-indigo-600 text-sm font-medium hover:underline">← กลับรายการขาย</Link>
    </div>
  );
  if (!listing) return null;

  const canEdit = listing.status === "announced";
  const canCancel = listing.status === "announced" || listing.status === "receiving_offers";
  const pendingOffers = offers.filter(o => o.status === "pending");
  const selectedOffer = offers.find(o => o.status === "selected");

  return (
    <div className="max-w-xl space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/sell" className="text-gray-500 hover:text-gray-800 text-xl">‹</Link>
        <h1 className="text-xl font-bold text-gray-900">รายละเอียดประกาศ</h1>
        {canEdit && (
          <Link
            href={`/sell/${listingId}/edit`}
            className="ml-auto text-sm text-indigo-600 font-medium hover:underline"
          >
            แก้ไข
          </Link>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Listing summary */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-gray-800">
              {listing.listingType === "scrap" ? "🔩 ชิ้นส่วน / ซากเครื่อง" : `📱 ${listing.appliance_name ?? "เครื่องใช้ไฟฟ้า"}`}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{new Date(listing.createdAt).toLocaleDateString("th-TH")}</p>
          </div>
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700">
            {STATUS_LABEL[listing.status] ?? listing.status}
          </span>
        </div>

        <div className="border-t border-gray-50 pt-3 space-y-2">
          <InfoRow label="ราคา" value={`${listing.price.toLocaleString()} ฿`} bold />
          {listing.conditionGrade && <InfoRow label="สภาพ" value={GRADE_LABEL[listing.conditionGrade] ?? listing.conditionGrade} />}
          <InfoRow label="จัดส่ง" value={listing.deliveryMethods.map(d => DELIVERY_LABEL[d] ?? d).join(", ")} />
          {listing.warranty && (
            <InfoRow
              label="ประกัน"
              value={`ผู้ผลิต ${listing.warranty.sourceWarranty} เดือน / เพิ่มเติม ${listing.warranty.additionalWarranty} เดือน`}
            />
          )}
        </div>

        {/* Working parts — scrap only */}
        {listing.listingType === "scrap" && listing.workingParts && listing.workingParts.length > 0 && (
          <div className="border-t border-gray-50 pt-3">
            <p className="text-xs text-gray-500 mb-2">ชิ้นส่วนที่ใช้งานได้</p>
            <div className="flex flex-wrap gap-1.5">
              {listing.workingParts.map((p, i) => (
                <span
                  key={i}
                  className="inline-block bg-green-100 text-green-800 text-xs font-medium px-2.5 py-1 rounded-full"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        )}

        {listing.description && (
          <div className="border-t border-gray-50 pt-3">
            <p className="text-xs text-gray-500 mb-1">รายละเอียด</p>
            <p className="text-sm text-gray-700">{listing.description}</p>
          </div>
        )}
      </div>

      {/* Offers received */}
      {(pendingOffers.length > 0 || selectedOffer) && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            ข้อเสนอที่ได้รับ ({offers.length})
          </p>

          {selectedOffer && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-green-800">{selectedOffer.buyer_name ?? "ผู้ซื้อ"}</p>
                <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">เลือกแล้ว ✅</span>
              </div>
              <p className="text-sm font-bold text-green-700">{selectedOffer.offerPrice.toLocaleString()} ฿</p>
              <p className="text-xs text-green-600">จัดส่ง: {DELIVERY_LABEL[selectedOffer.deliveryMethod] ?? selectedOffer.deliveryMethod}</p>
              {selectedOffer.message && <p className="text-xs text-green-600 italic">"{selectedOffer.message}"</p>}
            </div>
          )}

          {pendingOffers.map(offer => (
            <div key={offer.id} className="border border-gray-100 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-gray-800">{offer.buyer_name ?? "ผู้ซื้อ"}</p>
                <span className="text-xs text-gray-400">{OFFER_STATUS_LABEL[offer.status]}</span>
              </div>
              <p className="text-sm font-bold text-indigo-600">{offer.offerPrice.toLocaleString()} ฿</p>
              <p className="text-xs text-gray-500">จัดส่ง: {DELIVERY_LABEL[offer.deliveryMethod] ?? offer.deliveryMethod}</p>
              {offer.message && <p className="text-xs text-gray-400 italic">"{offer.message}"</p>}
              {listing.status === "receiving_offers" && (
                <button
                  onClick={() => handleSelectOffer(offer.id)}
                  disabled={selecting === offer.id}
                  className="w-full mt-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-xs font-semibold py-2 rounded-lg transition-colors"
                >
                  {selecting === offer.id ? "กำลังเลือก..." : "✅ เลือกข้อเสนอนี้"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      {canCancel && (
        <button
          onClick={handleCancel}
          disabled={cancelling}
          className="w-full border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 font-medium py-3 rounded-2xl transition-colors text-sm"
        >
          {cancelling ? "กำลังยกเลิก..." : "ยกเลิกประกาศ"}
        </button>
      )}

      {listing.status === "inspection_period" && (
        <Link
          href={`/transactions/${listingId}`}
          className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3.5 rounded-2xl text-sm text-center transition-colors"
        >
          📋 ดูสถานะธุรกรรม
        </Link>
      )}
    </div>
  );
}

function InfoRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <p className="text-sm text-gray-500 shrink-0">{label}</p>
      <p className={`text-sm text-right ${bold ? "font-bold text-indigo-600" : "font-medium text-gray-800"}`}>{value}</p>
    </div>
  );
}
