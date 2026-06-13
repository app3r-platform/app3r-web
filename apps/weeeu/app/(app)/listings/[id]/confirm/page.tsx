"use client";

import { use, useState } from "react";
import Link from "next/link";
import { EscrowInfoIcon } from "@/components/shared/EscrowInfo";

const MOCK_OFFER = {
  buyer: "ร้านอิเล็กทรอ",
  price: 4200,
  rating: 4.8,
  reviewCount: 126,
  completedTx: 98,
  joinedYear: "2565",
};

const TERMS_TEXT = `1. ผู้ขายยืนยันว่าสินค้าตรงตามที่ประกาศไว้ทุกประการ
2. หลังยืนยัน ระบบจะล็อก Escrow — พอยต์ทองของผู้ซื้อจะถูกพักไว้ และปล่อยให้ผู้ขายเมื่อผู้ซื้อยืนยันรับสินค้า
3. ผู้ขายต้องจัดส่งสินค้าภายใน 3 วันทำการหลังได้รับการยืนยัน
4. หากเกิดข้อพิพาท Admin จะตรวจสอบหลักฐานทั้งสองฝ่ายและตัดสินใจภายใน 7 วัน
5. การยกเลิกหลังยืนยันมีค่าธรรมเนียม 5% ของราคาขาย`;

export default function ListingConfirmPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [ackChecked, setAckChecked] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-xl mx-auto px-4 py-6 space-y-4">
        {/* Back link */}
        <Link href={`/listings/${id}/offers`} className="text-gray-400 hover:text-gray-700 text-sm flex items-center gap-1">
          ← กลับดูข้อเสนอ
        </Link>

        {/* Header */}
        <h1 className="text-xl font-bold text-weeeu-dark">ยืนยันข้อเสนอ</h1>

        {/* Offer summary card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400">ข้อเสนอจาก</p>
              <p className="text-sm font-semibold text-weeeu-dark">{MOCK_OFFER.buyer}</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400">ราคา</p>
              <p className="text-lg font-bold text-weeeu-primary">{MOCK_OFFER.price.toLocaleString()} ฿</p>
            </div>
          </div>
        </div>

        {/* Buyer history */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
          <p className="text-sm font-semibold text-weeeu-dark">ประวัติผู้ซื้อ</p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-weeeu-surface rounded-xl p-2.5">
              <p className="text-base font-bold text-weeeu-primary">{MOCK_OFFER.rating}</p>
              <p className="text-xs text-gray-500 mt-0.5">คะแนน ⭐</p>
            </div>
            <div className="bg-green-50 rounded-xl p-2.5">
              <p className="text-base font-bold text-green-700">{MOCK_OFFER.completedTx}</p>
              <p className="text-xs text-gray-500 mt-0.5">ธุรกรรมสำเร็จ</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-2.5">
              <p className="text-base font-bold text-gray-700">{MOCK_OFFER.reviewCount}</p>
              <p className="text-xs text-gray-500 mt-0.5">รีวิว</p>
            </div>
          </div>
          <p className="text-xs text-gray-400">สมาชิกตั้งแต่ปี {MOCK_OFFER.joinedYear}</p>
        </div>

        {/* Escrow note */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
          <p className="text-sm text-amber-700">
            หลังยืนยัน ระบบจะล็อกระบบพักเงินกลาง (Escrow) <EscrowInfoIcon /> และแจ้งผู้ซื้อเตรียมชำระเงิน
          </p>
        </div>

        {/* Terms expandable */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-2">
          <button
            type="button"
            onClick={() => setShowTerms(v => !v)}
            className="w-full flex items-center justify-between text-sm font-semibold text-weeeu-dark"
          >
            <span>📋 เงื่อนไขการขาย</span>
            <span className="text-gray-400 text-xs">{showTerms ? "▲ ย่อ" : "▼ อ่านเพิ่ม"}</span>
          </button>
          {showTerms && (
            <pre className="text-xs text-gray-600 whitespace-pre-wrap font-sans leading-relaxed bg-gray-50 rounded-xl p-3">
              {TERMS_TEXT}
            </pre>
          )}
        </div>

        {/* Acknowledge checkbox */}
        <label className="flex items-start gap-3 cursor-pointer bg-weeeu-surface border border-weeeu-primary/20 rounded-xl p-3">
          <div
            onClick={() => setAckChecked(v => !v)}
            className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${ackChecked ? "bg-weeeu-primary border-weeeu-primary" : "border-gray-300"}`}
          >
            {ackChecked && <span className="text-white text-xs font-bold">✓</span>}
          </div>
          <p className="text-sm text-weeeu-text">ฉันอ่านและยอมรับเงื่อนไขการขาย และยืนยันว่าสินค้าตรงตามประกาศ</p>
        </label>

        {/* Action buttons */}
        <div className="space-y-3 pt-2">
          <button
            disabled={!ackChecked}
            className="w-full bg-weeeu-primary hover:bg-weeeu-dark disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl text-sm transition-colors"
          >
            ✅ ยืนยันขาย
          </button>
          <Link href={`/listings/${id}/offers`}>
            <button className="w-full border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold py-3 rounded-xl text-sm transition-colors">
              ยกเลิก — กลับไปดูข้อเสนออื่น
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
