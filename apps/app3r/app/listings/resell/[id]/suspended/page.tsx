"use client";

/**
 * Suspended Listing — app3r (Buyer view)
 * Covers: R3 — buyer เจอ listing ที่ถูก suspend → แสดง "ระงับชั่วคราว" + ปุ่มกลับ
 * Path: /listings/resell/[id]/suspended
 *
 * ใช้งาน: redirect จาก /listings/resell/[id] เมื่อ listing.status === "suspended"
 */

import Link from "next/link";
import { useParams } from "next/navigation";

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_SUSPENDED = {
  title: "ตู้เย็น Samsung 2 ประตู สีเงิน",
  category: "ตู้เย็น",
  price: 4500,
};

export default function SuspendedListingPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto py-16 px-4 text-center space-y-6">
        {/* Icon */}
        <div className="text-7xl select-none">🚫</div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-gray-900">
            ประกาศนี้ถูกระงับชั่วคราว
          </h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            ขณะนี้ประกาศนี้ไม่สามารถรับข้อเสนอได้
            <br />
            เนื่องจากอยู่ระหว่างการตรวจสอบโดย Admin
          </p>
        </div>

        {/* Listing preview (readonly) */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 text-left space-y-2 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            ข้อมูลประกาศ
          </p>
          <p className="font-semibold text-gray-800">{MOCK_SUSPENDED.title}</p>
          <p className="text-sm text-gray-500">ประเภท: {MOCK_SUSPENDED.category}</p>
          <p className="text-sm text-gray-500">
            ราคาที่ตั้งไว้: {MOCK_SUSPENDED.price.toLocaleString()} ฿
          </p>
          <div className="pt-1">
            <span className="inline-block text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full font-semibold">
              🚫 ถูกระงับ
            </span>
          </div>
        </div>

        {/* Info note */}
        <p className="text-xs text-gray-400 max-w-xs mx-auto">
          หากคุณสนใจสินค้าลักษณะนี้ สามารถค้นหาประกาศอื่นที่มีอยู่ได้
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-3 items-center w-full max-w-xs mx-auto">
          <Link
            href="/listings/resell"
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3.5 rounded-2xl text-sm text-center transition-colors"
          >
            ← ดูประกาศอื่น
          </Link>
          <Link
            href="/"
            className="w-full border border-gray-200 text-gray-600 font-medium py-3 rounded-2xl text-sm text-center hover:bg-gray-50 transition-colors"
          >
            กลับหน้าหลัก
          </Link>
        </div>
      </div>
    </div>
  );
}
