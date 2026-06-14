"use client";

/**
 * R10 — Review & Rating (หลังธุรกรรม Resell สำเร็จ)
 * Screen ID: U-RES-REV  ·  Path: /resell/orders/[id]/review
 *
 * แสดงหลัง completed state ·  ทั้ง buyer และ seller รีวิวกันหลังธุรกรรม
 * mock-anno: ลบ class mock-anno* ทั้งหมดก่อนใช้ production
 */

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { MockAnnoBar } from "@/components/shared/MockAnnoBar";

const MOCK_ORDER = {
  id: "ord-001",
  listing_title: "ตู้เย็น Samsung 2 ประตู สีเงิน",
  agreed_price: 4300,
  is_buyer: true,         // เปลี่ยนเป็น false เพื่อดูมุม seller
  counterparty_name: "นิพนธ์ ใจดี",   // ชื่อคู่ค้า (seller ถ้า is_buyer=true)
  counterparty_type: "seller" as "seller" | "buyer",
};

const REVIEW_TAGS_BUYER = [
  "สินค้าตรงปก", "แพ็คพัสดุดี", "ส่งเร็ว", "ผู้ขายสุภาพ", "ราคาคุ้มค่า"
];
const REVIEW_TAGS_SELLER = [
  "ชำระเร็ว", "ผู้ซื้อสุภาพ", "ไม่มีปัญหา", "สื่อสารดี", "ธุรกรรมราบรื่น"
];

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      <MockAnnoBar />
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(star)}
          className="text-3xl transition-transform hover:scale-110"
        >
          <span className={(hover || value) >= star ? "text-yellow-400" : "text-gray-200"}>★</span>
        </button>
      ))}
    </div>
  );
}

export default function ResellOrderReviewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const order = { ...MOCK_ORDER, id: id ?? MOCK_ORDER.id };

  const tags = order.is_buyer ? REVIEW_TAGS_BUYER : REVIEW_TAGS_SELLER;

  const [rating, setRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const toggleTag = (t: string) =>
    setSelectedTags((prev) => { const s = new Set(prev); s.has(t) ? s.delete(t) : s.add(t); return s; });

  const handleSubmit = async () => {
    if (rating === 0) return;
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));
    setSubmitting(false);
    setDone(true);
  };

  // ─── Success screen ──────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="max-w-xl space-y-5">

        <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center space-y-4">
          <p className="text-5xl">🌟</p>
          <p className="font-bold text-green-800 text-xl">ขอบคุณสำหรับรีวิว!</p>
          <p className="text-sm text-green-600">
            รีวิวของคุณช่วยให้ชุมชน WeeeU ดีขึ้น
          </p>
          <div className="flex justify-center gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <span key={s} className={`text-2xl ${s <= rating ? "text-yellow-400" : "text-gray-200"}`}>★</span>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Link
            href="/sell"
            className="block w-full text-center bg-weeeu-primary hover:bg-weeeu-dark text-white font-semibold py-3.5 rounded-2xl text-sm transition-colors"
          >
            📋 ดูรายการขายของฉัน
          </Link>
          <Link
            href="/marketplace"
            className="block w-full text-center border border-gray-200 text-gray-600 font-medium py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors"
          >
            🛒 กลับตลาดสินค้ามือสอง
          </Link>
        </div>
      </div>
    );
  }

  // ─── Review form ─────────────────────────────────────────────────────────
  return (
    <div className="max-w-xl space-y-5">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/resell/orders/${id}`} className="text-gray-500 hover:text-gray-800 text-xl">‹</Link>
        <h1 className="text-xl font-bold text-gray-900">รีวิวธุรกรรม</h1>
      </div>

      {/* Transaction summary */}
      <div className="bg-green-50 border border-green-200 rounded-2xl p-4 space-y-1">
        <p className="text-xs font-semibold text-green-700 uppercase tracking-wider">ธุรกรรมเสร็จสมบูรณ์ ✅</p>
        <p className="font-semibold text-gray-900">{order.listing_title}</p>
        <p className="text-sm text-gray-600">
          {order.is_buyer ? "ผู้ขาย" : "ผู้ซื้อ"}: {order.counterparty_name}
        </p>
        <p className="text-lg font-bold text-green-700">
          {order.agreed_price.toLocaleString()} พอยต์ทอง ✅ ปลดล็อก Escrow แล้ว
        </p>
      </div>

      {/* Rating */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div>
          <p className="text-sm font-semibold text-gray-800 mb-1">
            ให้คะแนน{order.is_buyer ? "ผู้ขาย" : "ผู้ซื้อ"}: {order.counterparty_name}
          </p>
          <p className="text-xs text-gray-400">
            F1: รีวิวแสดงในโปรไฟล์คู่ค้าหลังธุรกรรมเสร็จ — ไม่ใช่ใต้ประกาศ
          </p>
        </div>
        <StarRating value={rating} onChange={setRating} />
        {rating === 0 && (
          <p className="text-xs text-red-500">⚠️ กรุณาให้คะแนน</p>
        )}
      </div>

      {/* Tag chips */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          เลือกป้ายกำกับ (ไม่บังคับ)
        </p>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                selectedTags.has(tag)
                  ? "bg-weeeu-primary text-white border-weeeu-primary"
                  : "border-gray-200 text-gray-600 hover:border-weeeu-primary/40"
              }`}
            >
              {selectedTags.has(tag) ? "✓ " : ""}{tag}
            </button>
          ))}
        </div>
      </div>

      {/* Comment */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          ความคิดเห็น (ไม่บังคับ)
        </p>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          placeholder="เขียนรีวิวสั้นๆ เกี่ยวกับธุรกรรมนี้..."
          className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-weeeu-primary/40"
        />
      </div>

      {/* Submit */}
      <div className="space-y-2">
        <button
          onClick={handleSubmit}
          disabled={rating === 0 || submitting}
          className="w-full bg-weeeu-primary hover:bg-weeeu-dark disabled:opacity-50 text-white font-semibold py-4 rounded-2xl text-sm transition-colors"
        >
          {submitting ? "⟳ กำลังส่ง..." : "⭐ ส่งรีวิว"}
        </button>
        <button
          onClick={() => router.push(`/resell/orders/${id}`)}
          className="w-full border border-gray-200 text-gray-500 font-medium py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors"
        >
          ข้ามรีวิว
        </button>
      </div>
    </div>
  );
}
