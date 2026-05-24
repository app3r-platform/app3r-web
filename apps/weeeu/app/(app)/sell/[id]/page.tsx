"use client";

/**
 * Seller Listing Detail — WeeeU
 * Covers: R2 (SUSPENDED listing + appeal) · R5 (withdraw selection before payment)
 * Path: /sell/[id]
 */

import { useState } from "react";
import Link from "next/link";

// ─── Mock data (replace with API call in production) ───────────────────────────
const MOCK_LISTING = {
  id: "mock-001",
  title: "ตู้เย็น Samsung 2 ประตู สีเงิน",
  price: 4500,
  status: "offer_selected" as ListingStatus, // เปลี่ยนเพื่อทดสอบ: "suspended" | "offer_selected" | "receiving_offers"
  suspended_reason:
    "ข้อมูลสินค้าไม่ครบถ้วน — กรุณาเพิ่มรูปภาพที่ชัดเจนและรายละเอียดสภาพสินค้า",
  suspended_at: "23 พ.ค. 2569",
  offers: [
    { id: "o1", buyer_name: "สมชาย พิมพ์ใจ", price: 4200, status: "pending" },
    { id: "o2", buyer_name: "นิดา ทองดี", price: 4300, status: "selected" },
  ],
};

type ListingStatus =
  | "announced"
  | "receiving_offers"
  | "offer_selected"
  | "suspended"
  | "completed"
  | "cancelled";

const STATUS_BADGE: Record<ListingStatus, { label: string; color: string }> = {
  announced: { label: "ประกาศแล้ว", color: "bg-indigo-100 text-indigo-700" },
  receiving_offers: { label: "กำลังรับข้อเสนอ", color: "bg-blue-100 text-blue-700" },
  offer_selected: { label: "เลือกผู้ซื้อแล้ว", color: "bg-purple-100 text-purple-700" },
  suspended: { label: "ถูกระงับ 🚫", color: "bg-red-100 text-red-700" },
  completed: { label: "ขายแล้ว", color: "bg-green-100 text-green-700" },
  cancelled: { label: "ยกเลิก", color: "bg-gray-100 text-gray-500" },
};

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function SellerListingDetailPage() {
  const listing = MOCK_LISTING;
  const selectedOffer = listing.offers.find((o) => o.status === "selected");

  // R5 — withdraw selection dialog
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [withdrawReason, setWithdrawReason] = useState("");

  // R2 — appeal dialog
  const [showAppealDialog, setShowAppealDialog] = useState(false);
  const [appealText, setAppealText] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const handleWithdraw = async () => {
    if (!withdrawReason.trim()) return;
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 800)); // mock API
    setSubmitting(false);
    setShowWithdrawDialog(false);
    setWithdrawReason("");
    setSuccessMsg(
      "ถอนการเลือกเรียบร้อยแล้ว — ผู้ซื้อได้รับแจ้งแล้ว ยังอยู่ใน offer pool"
    );
  };

  const handleAppeal = async () => {
    if (!appealText.trim()) return;
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));
    setSubmitting(false);
    setShowAppealDialog(false);
    setAppealText("");
    setSuccessMsg("ส่งคำอุทธรณ์เรียบร้อยแล้ว — Admin จะพิจารณาภายใน 24 ชั่วโมง");
  };

  const badge = STATUS_BADGE[listing.status];

  return (
    <div className="max-w-xl space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/sell" className="text-gray-500 hover:text-gray-800 text-xl">
          ‹
        </Link>
        <h1 className="text-xl font-bold text-gray-900">รายละเอียดประกาศ</h1>
      </div>

      {/* Success banner */}
      {successMsg && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3">
          <p className="text-sm text-green-700">✅ {successMsg}</p>
        </div>
      )}

      {/* Listing card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-0.5">
            <p className="font-semibold text-gray-900">{listing.title}</p>
            <p className="text-xl font-bold text-indigo-600">
              {listing.price.toLocaleString()} ฿
            </p>
          </div>
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${badge.color}`}
          >
            {badge.label}
          </span>
        </div>
      </div>

      {/* ─── R2 — SUSPENDED state ─────────────────────────────────────────── */}
      {listing.status === "suspended" && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🚫</span>
            <p className="font-semibold text-red-800">ประกาศถูกระงับชั่วคราว</p>
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-red-700 uppercase tracking-wide">
              เหตุผลจาก Admin
            </p>
            <div className="bg-white border border-red-200 rounded-xl p-3">
              <p className="text-sm text-gray-800">{listing.suspended_reason}</p>
            </div>
            <p className="text-xs text-red-500">ระงับเมื่อ: {listing.suspended_at}</p>
          </div>

          <div className="flex gap-2">
            <Link
              href={`/sell/${listing.id}/edit`}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-3 rounded-2xl text-center transition-colors"
            >
              ✏️ แก้ไขแล้วประกาศใหม่
            </Link>
            <button
              onClick={() => setShowAppealDialog(true)}
              className="flex-1 border-2 border-red-300 text-red-700 text-sm font-medium py-3 rounded-2xl hover:bg-red-100 transition-colors"
            >
              ⚖️ อุทธรณ์
            </button>
          </div>
        </div>
      )}

      {/* ─── R5 — Offer Selected + Withdraw option ────────────────────────── */}
      {listing.status === "offer_selected" && selectedOffer && (
        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-5 space-y-3">
          <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide">
            ผู้ซื้อที่เลือก
          </p>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900">{selectedOffer.buyer_name}</p>
              <p className="text-lg font-bold text-indigo-600">
                {selectedOffer.price.toLocaleString()} ฿
              </p>
            </div>
            <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium">
              เลือกแล้ว ✅
            </span>
          </div>
          <p className="text-xs text-purple-600">
            รอผู้ซื้อชำระเงิน — Escrow (ล็อค Gold) จะถูกล็อคเมื่อชำระครบ
          </p>
          <button
            onClick={() => setShowWithdrawDialog(true)}
            className="w-full border-2 border-orange-300 text-orange-700 text-sm font-medium py-2.5 rounded-xl hover:bg-orange-50 transition-colors"
          >
            ↩️ ถอนการเลือก (ก่อนชำระเงิน)
          </button>
          <p className="text-xs text-orange-600">
            ⚠️ การถอนการเลือกก่อนผู้ซื้อชำระเงินอาจมีค่าธรรมเนียม (ผิดสัญญา)
          </p>
        </div>
      )}

      {/* ─── All Offers ───────────────────────────────────────────────────── */}
      {listing.offers.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            ข้อเสนอทั้งหมด ({listing.offers.length})
          </p>
          {listing.offers.map((offer) => (
            <div
              key={offer.id}
              className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0"
            >
              <div>
                <p className="text-sm font-medium text-gray-800">{offer.buyer_name}</p>
                <p className="text-sm font-bold text-indigo-600">
                  {offer.price.toLocaleString()} ฿
                </p>
              </div>
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  offer.status === "selected"
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {offer.status === "selected" ? "เลือกแล้ว" : "รอพิจารณา"}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ─── R5 Withdraw Dialog ───────────────────────────────────────────── */}
      {showWithdrawDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-2xl">
            <h3 className="font-bold text-gray-900 text-lg">ยืนยันถอนการเลือก</h3>
            <p className="text-sm text-gray-600">
              ผู้ซื้อ <strong>{selectedOffer?.buyer_name}</strong> จะได้รับแจ้งและยังคงอยู่ใน
              offer pool — คุณสามารถเลือกข้อเสนืออื่นหรือยกเลิกได้
            </p>
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">
                เหตุผล (บังคับ)
              </label>
              <textarea
                value={withdrawReason}
                onChange={(e) => setWithdrawReason(e.target.value)}
                className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-orange-300"
                placeholder="ระบุเหตุผลที่ต้องการถอนการเลือก..."
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowWithdrawDialog(false);
                  setWithdrawReason("");
                }}
                className="flex-1 border border-gray-200 text-gray-600 font-medium py-2.5 rounded-xl text-sm hover:bg-gray-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleWithdraw}
                disabled={submitting || !withdrawReason.trim()}
                className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-300 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
              >
                {submitting ? "กำลังดำเนินการ..." : "ยืนยันถอน"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── R2 Appeal Dialog ─────────────────────────────────────────────── */}
      {showAppealDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-2xl">
            <h3 className="font-bold text-gray-900 text-lg">อุทธรณ์การระงับประกาศ</h3>
            <p className="text-sm text-gray-600">
              อธิบายเหตุผลที่คุณเชื่อว่าประกาศนี้ไม่ควรถูกระงับ Admin จะพิจารณาภายใน 24
              ชั่วโมง
            </p>
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">
                คำอุทธรณ์ (บังคับ)
              </label>
              <textarea
                value={appealText}
                onChange={(e) => setAppealText(e.target.value)}
                className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none h-28 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                placeholder="อธิบายเหตุผล เช่น 'รูปสินค้าครบแล้ว ข้อมูลถูกต้องทุกอย่าง...'"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowAppealDialog(false);
                  setAppealText("");
                }}
                className="flex-1 border border-gray-200 text-gray-600 font-medium py-2.5 rounded-xl text-sm hover:bg-gray-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleAppeal}
                disabled={submitting || !appealText.trim()}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
              >
                {submitting ? "กำลังส่ง..." : "ส่งอุทธรณ์"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
