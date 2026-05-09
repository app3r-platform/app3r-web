"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { offersApi } from "@/lib/api/offers";
import type { Offer } from "@/lib/types";

type OfferWithListing = Offer & {
  listing_title?: string;
  seller_name?: string;
};

const STATUS_LABEL: Record<string, string> = {
  pending: "รอพิจารณา",
  selected: "ได้รับเลือก ✅",
  rejected: "ปฏิเสธ",
  withdrawn: "ถอนข้อเสนอแล้ว",
};

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  selected: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-600",
  withdrawn: "bg-gray-100 text-gray-500",
};

const DELIVERY_LABEL: Record<string, string> = {
  on_site: "ส่งเอง / นัดรับ",
  parcel: "ส่งพัสดุ",
};

export default function OffersPage() {
  const [offers, setOffers] = useState<OfferWithListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    offersApi.mine()
      .then(setOffers)
      .catch(() => setOffers([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleWithdraw = async (id: string) => {
    if (!confirm("ถอนข้อเสนอนี้?")) return;
    setWithdrawing(id);
    setError("");
    try {
      const res = await offersApi.withdraw(id);
      if (!res.ok) throw new Error();
      load();
    } catch {
      setError("เกิดข้อผิดพลาด");
    } finally {
      setWithdrawing(null);
    }
  };

  const activeOffers = offers.filter(o => o.status === "pending" || o.status === "selected");
  const pastOffers = offers.filter(o => o.status === "rejected" || o.status === "withdrawn");

  return (
    <div className="max-w-xl space-y-5">
      <h1 className="text-xl font-bold text-gray-900">ข้อเสนอของฉัน</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400">กำลังโหลด...</div>
      ) : offers.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <p className="text-4xl">🤝</p>
          <p className="text-gray-500 font-medium">ยังไม่มีข้อเสนอ</p>
          <Link href="/listings" className="inline-block mt-2 text-indigo-600 text-sm font-medium hover:underline">
            ดูสินค้าในตลาด →
          </Link>
        </div>
      ) : (
        <>
          {activeOffers.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">ข้อเสนอที่ใช้งานอยู่</p>
              {activeOffers.map(offer => (
                <OfferCard
                  key={offer.id}
                  offer={offer}
                  onWithdraw={offer.status === "pending" ? handleWithdraw : undefined}
                  withdrawing={withdrawing === offer.id}
                />
              ))}
            </div>
          )}

          {pastOffers.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">ประวัติข้อเสนอ</p>
              {pastOffers.map(offer => (
                <OfferCard key={offer.id} offer={offer} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function OfferCard({
  offer,
  onWithdraw,
  withdrawing,
}: {
  offer: OfferWithListing & { listing_title?: string; seller_name?: string };
  onWithdraw?: (id: string) => void;
  withdrawing?: boolean;
}) {
  const DELIVERY_LABEL: Record<string, string> = {
    on_site: "ส่งเอง / นัดรับ",
    parcel: "ส่งพัสดุ",
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-800 truncate">
            {offer.listing_title ?? "สินค้า"}
          </p>
          {offer.seller_name && (
            <p className="text-xs text-gray-400">ผู้ขาย: {offer.seller_name}</p>
          )}
        </div>
        <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLOR[offer.status] ?? "bg-gray-100 text-gray-500"}`}>
          {STATUS_LABEL[offer.status] ?? offer.status}
        </span>
      </div>

      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="text-gray-500">ราคาที่เสนอ</span>
        <span className="font-bold text-indigo-600">{offer.offerPrice.toLocaleString()} ฿</span>
      </div>

      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="text-gray-500">จัดส่ง</span>
        <span className="font-medium text-gray-700">{DELIVERY_LABEL[offer.deliveryMethod] ?? offer.deliveryMethod}</span>
      </div>

      {offer.message && (
        <p className="text-xs text-gray-400 italic">"{offer.message}"</p>
      )}

      <p className="text-xs text-gray-400">{new Date(offer.createdAt).toLocaleDateString("th-TH")}</p>

      {offer.status === "selected" && (
        <Link
          href={`/transactions/${offer.listingId}`}
          className="block w-full text-center text-xs font-semibold text-indigo-600 border border-indigo-200 py-2 rounded-xl hover:bg-indigo-50 transition-colors mt-1"
        >
          📋 ดูสถานะธุรกรรม
        </Link>
      )}

      {onWithdraw && (
        <button
          onClick={() => onWithdraw(offer.id)}
          disabled={withdrawing}
          className="w-full text-xs text-red-500 border border-red-100 py-2 rounded-xl hover:bg-red-50 disabled:opacity-50 transition-colors mt-1"
        >
          {withdrawing ? "กำลังถอน..." : "ถอนข้อเสนอ"}
        </button>
      )}
    </div>
  );
}
