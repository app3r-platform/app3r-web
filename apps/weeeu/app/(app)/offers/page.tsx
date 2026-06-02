"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { offersApi } from "@/lib/api/offers";
import { EscrowInfoIcon } from "@/components/shared/EscrowInfo";
import type { Offer } from "@/lib/types";

type OfferWithListing = Offer & {
  listing_title?: string;
  seller_name?: string;
  // Mockup R4: ถ้า offer ถูกเลือกแต่ Gold ไม่พอ
  gold_shortfall?: number;
  payment_deadline?: string; // ISO — 24ชม. หลัง offer_selected
};

// Mock: สาธิต R4 awaiting_payment (Mockup — local type)
type MockAwaitingOffer = OfferWithListing & {
  mockStatus: "awaiting_payment";
  gold_shortfall: number;
  payment_deadline: string;
};

const STATUS_LABEL: Record<string, string> = {
  pending: "รอพิจารณา",
  selected: "ได้รับเลือก ✅",
  rejected: "ปฏิเสธ",
  withdrawn: "ถอนข้อเสนอแล้ว",
  awaiting_payment: "รอเติม Gold ≤ 24ชม. 💰", // R4 mock
};

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  selected: "bg-weeeu-surface text-weeeu-primary",
  rejected: "bg-red-100 text-red-600",
  withdrawn: "bg-gray-100 text-gray-500",
  awaiting_payment: "bg-orange-100 text-orange-700", // R4 mock
};

const DELIVERY_LABEL: Record<string, string> = {
  on_site: "ส่งเอง / นัดรับ",
  parcel: "ส่งพัสดุ",
};

// Mock R4: offer สาธิต awaiting_payment (Mockup)
const MOCK_AWAITING_OFFER: MockAwaitingOffer = {
  id: "mock-awaiting-001",
  listingId: "mock-listing-001",
  buyerId: "current-user",
  buyerType: "WeeeU",
  offerPrice: 8500,
  deliveryMethod: "parcel",
  message: "สนใจมากครับ",
  status: "selected",
  mockStatus: "awaiting_payment",
  listing_title: "แอร์ Mitsubishi 12000 BTU (เกรด A)",
  seller_name: "คุณสมศักดิ์",
  gold_shortfall: 1200,
  payment_deadline: new Date(Date.now() + 3600000 * 20).toISOString(), // 20ชม. เหลือ
  expiresAt: new Date(Date.now() + 86400000 * 7).toISOString(),
  createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
};

function useCountdown(deadline: string) {
  const [remaining, setRemaining] = useState(() => Math.max(0, Math.floor((new Date(deadline).getTime() - Date.now()) / 1000)));

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  const hours = Math.floor(remaining / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const seconds = remaining % 60;
  return { hours, minutes, seconds, expired: remaining === 0 };
}

export default function OffersPage() {
  const [offers, setOffers] = useState<OfferWithListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [pageSize, setPageSize] = useState<number | "all">(20); // (c) pagination

  // Mock: แสดง R4 awaiting_payment demo (Mockup)
  const [showMockR4, setShowMockR4] = useState(true);

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
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">ข้อเสนอของฉัน</h1>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-400">แสดง:</span>
          {([20, 50, "ทั้งหมด"] as const).map(s => (
            <button key={String(s)} type="button"
              onClick={() => setPageSize(s === "ทั้งหมด" ? "all" : s)}
              className={`px-2 py-0.5 rounded-lg text-xs border transition-colors ${(s === "ทั้งหมด" ? pageSize === "all" : pageSize === s) ? "bg-weeeu-primary text-white border-weeeu-primary" : "border-gray-200 text-gray-400 hover:border-weeeu-primary"}`}>
              {String(s)}
            </button>
          ))}
        </div>
      </div>
      <p className="text-xs text-gray-400">ข้อเสนอที่คุณยื่นซื้อสินค้า (ฐานะผู้ซื้อ)</p>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* R4 Mock: awaiting_payment banner (Mockup) */}
      {showMockR4 && (
        <div className="space-y-0">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">⚠️ ต้องดำเนินการ (Mockup R4)</p>
          <AwaitingPaymentCard
            offer={MOCK_AWAITING_OFFER}
            onDismiss={() => setShowMockR4(false)}
          />
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400">กำลังโหลด...</div>
      ) : offers.length === 0 && !showMockR4 ? (
        <div className="text-center py-16 space-y-3">
          <p className="text-4xl">🤝</p>
          <p className="text-gray-500 font-medium">ยังไม่มีข้อเสนอ</p>
          <Link href="/listings" className="inline-block mt-2 text-weeeu-primary text-sm font-medium hover:underline">
            ดูสินค้าในตลาด →
          </Link>
        </div>
      ) : (
        <>
          {activeOffers.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">ข้อเสนอที่ใช้งานอยู่</p>
              {activeOffers.slice(0, pageSize === "all" ? undefined : pageSize).map(offer => (
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
              {pastOffers.slice(0, pageSize === "all" ? undefined : pageSize).map(offer => (
                <OfferCard key={offer.id} offer={offer} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// R4: Awaiting Payment Card — countdown + top-up button (Mockup)
function AwaitingPaymentCard({
  offer,
  onDismiss,
}: {
  offer: MockAwaitingOffer;
  onDismiss: () => void;
}) {
  const countdown = useCountdown(offer.payment_deadline);

  return (
    <div className="bg-orange-50 border-2 border-orange-300 rounded-2xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-bold text-orange-900">💰 รอยืนยัน Gold — ล็อกระบบพักเงินกลาง (Escrow) <EscrowInfoIcon /></p>
          <p className="text-xs text-orange-700 mt-0.5">{offer.listing_title}</p>
          <p className="text-xs text-orange-600">ผู้ขาย: {offer.seller_name}</p>
        </div>
        <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLOR["awaiting_payment"]}`}>
          {STATUS_LABEL["awaiting_payment"]}
        </span>
      </div>

      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="text-orange-700">ราคาที่เสนอ</span>
        <span className="font-bold text-orange-900">{offer.offerPrice.toLocaleString()} Gold</span>
      </div>

      <div className="bg-orange-100 rounded-xl p-3 space-y-1">
        <p className="text-xs font-semibold text-orange-900">⚠️ Gold ไม่เพียงพอ — ขาด {offer.gold_shortfall.toLocaleString()} Gold</p>
        <p className="text-xs text-orange-700">ระบบจะปลดข้อเสนอนี้อัตโนมัติถ้าไม่เติมในเวลา</p>
      </div>

      {/* Countdown */}
      <div className="bg-white border border-orange-200 rounded-xl p-3 text-center">
        <p className="text-xs text-orange-600 font-medium mb-1">เวลาที่เหลือ</p>
        {countdown.expired ? (
          <p className="text-sm font-bold text-red-600">หมดเวลาแล้ว — ข้อเสนอถูกปลด</p>
        ) : (
          <p className="text-2xl font-bold font-mono text-orange-800">
            {String(countdown.hours).padStart(2, "0")}:
            {String(countdown.minutes).padStart(2, "0")}:
            {String(countdown.seconds).padStart(2, "0")}
          </p>
        )}
      </div>

      <div className="flex gap-2">
        <Link
          href="/wallet"
          className="flex-1 text-center bg-weeeu-primary hover:bg-weeeu-dark text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
        >
          🥇 เติม Gold เดี๋ยวนี้
        </Link>
        <button
          type="button"
          onClick={onDismiss}
          className="px-3 py-2.5 border border-orange-200 text-orange-600 text-sm rounded-xl hover:bg-orange-50 transition-colors"
        >
          ซ่อน
        </button>
      </div>
    </div>
  );
}

function OfferCard({
  offer,
  onWithdraw,
  withdrawing,
}: {
  offer: OfferWithListing;
  onWithdraw?: (id: string) => void;
  withdrawing?: boolean;
}) {
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
        <span className="font-bold text-weeeu-primary">{offer.offerPrice.toLocaleString()} ฿</span>
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
          className="block w-full text-center text-xs font-semibold text-weeeu-primary border border-weeeu-primary/30 py-2 rounded-xl hover:bg-weeeu-surface transition-colors mt-1"
        >
          📋 ดูสถานะธุรกรรม
        </Link>
      )}

      {/* R9: ถอน offer (ฐานะ buyer) */}
      {onWithdraw && (
        <button
          onClick={() => onWithdraw(offer.id)}
          disabled={withdrawing}
          className="w-full text-xs text-red-500 border border-red-100 py-2 rounded-xl hover:bg-red-50 disabled:opacity-50 transition-colors mt-1"
        >
          {withdrawing ? "กำลังถอน..." : "ถอนข้อเสนอ (R9)"}
        </button>
      )}
    </div>
  );
}
