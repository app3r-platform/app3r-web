"use client";

import { useState } from "react";
import Link from "next/link";

const MOCK_OFFERS = [
  { id: "off-001", buyer: "ร้านอิเล็กทรอ", price: 4200, note: "สนใจซื้อ ราคาต่อรองได้", date: "25 พ.ค. 2569", status: "pending" },
  { id: "off-002", buyer: "ร้านช่างเย็น", price: 3800, note: "ขอตรวจสินค้าก่อน", date: "25 พ.ค. 2569", status: "pending" },
  { id: "off-003", buyer: "ร้านดีเจริญ", price: 4000, note: "", date: "24 พ.ค. 2569", status: "pending" },
];

export default function ListingOffersPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [accepted, setAccepted] = useState<string | null>(null);
  const [rejected, setRejected] = useState<string[]>([]);

  const handleAccept = (offerId: string) => {
    setAccepted(offerId);
  };

  const handleReject = (offerId: string) => {
    setRejected((prev) => [...prev, offerId]);
  };

  const activeOffers = MOCK_OFFERS.filter((o) => !rejected.includes(o.id));

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-xl mx-auto px-4 py-6 space-y-4">
        {/* Back link */}
        <Link href={`/listings/${id}`} className="text-gray-400 hover:text-gray-700 text-sm flex items-center gap-1">
          ← กลับหน้าประกาศ
        </Link>

        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-weeeu-dark">ข้อเสนอที่ได้รับ ({activeOffers.length})</h1>
          <p className="text-xs text-amber-600 mt-0.5">⚠️ ยืนยันข้อเสนอเดียวเท่านั้น</p>
        </div>

        {accepted && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3">
            <p className="text-sm text-green-700 font-medium">✅ ยืนยันข้อเสนอแล้ว — ระบบกำลังแจ้งผู้ซื้อ</p>
          </div>
        )}

        {/* Offers list */}
        <div className="space-y-3">
          {activeOffers.map((offer) => {
            const isAccepted = accepted === offer.id;
            return (
              <div
                key={offer.id}
                className={`bg-white rounded-2xl border shadow-sm p-4 space-y-3 ${isAccepted ? "border-green-300" : "border-gray-100"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-weeeu-dark">{offer.buyer}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{offer.date}</p>
                  </div>
                  <p className="text-lg font-bold text-weeeu-primary">{offer.price.toLocaleString()} ฿</p>
                </div>

                {offer.note && (
                  <p className="text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2">{offer.note}</p>
                )}

                {!accepted && (
                  <div className="flex gap-2 pt-1">
                    <Link href={`/listings/${id}/confirm`} className="flex-1">
                      <button
                        onClick={() => handleAccept(offer.id)}
                        className="w-full bg-weeeu-primary hover:bg-weeeu-dark text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
                      >
                        ✅ ยืนยัน
                      </button>
                    </Link>
                    <button
                      onClick={() => handleReject(offer.id)}
                      className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold py-2.5 rounded-xl text-sm transition-colors"
                    >
                      ✕ ปฏิเสธ
                    </button>
                  </div>
                )}

                {isAccepted && (
                  <div className="bg-green-50 rounded-lg px-3 py-2">
                    <p className="text-xs text-green-700 font-medium">✅ ยืนยันแล้ว</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {activeOffers.length === 0 && !accepted && (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-gray-500 font-medium">ไม่มีข้อเสนอที่รอดำเนินการ</p>
          </div>
        )}
      </div>
    </div>
  );
}
