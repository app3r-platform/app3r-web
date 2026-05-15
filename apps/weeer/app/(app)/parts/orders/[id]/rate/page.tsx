"use client";
// ── Parts B2B Rating — WeeeR (Sub-CMD-9 Wave 3, W3 Carry-over) ───────────────
// Buyer ให้คะแนน Seller: POST /api/v1/parts/orders/:id/rate/
// เงื่อนไข: order ต้องอยู่ใน status = closed เท่านั้น

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  getPartsOrderDetail,
  rateOrder,
  ORDER_STATUS_LABEL,
  ORDER_STATUS_COLOR,
} from "../../../../../../lib/parts-api";
import type { PartsOrderDetailDto } from "../../../../../../lib/parts-api";

export default function RatePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const orderId = params.id;

  const [order, setOrder]         = useState<PartsOrderDetailDto | null>(null);
  const [loading, setLoading]     = useState(true);
  const [score, setScore]         = useState(0);     // 0 = ยังไม่เลือก
  const [comment, setComment]     = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [success, setSuccess]     = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const detail = await getPartsOrderDetail(orderId);
        setOrder(detail);
        // ถ้ามี rating แล้ว ไม่ต้องให้กรอกใหม่
        if (detail.rating) setSuccess(true);
      } catch {
        setError("ไม่พบคำสั่งซื้อนี้");
      } finally {
        setLoading(false);
      }
    })();
  }, [orderId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (score === 0) {
      setError("กรุณาเลือกคะแนน");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await rateOrder(orderId, score, comment.trim() || undefined);
      setSuccess(true);
      setTimeout(() => router.push("/parts/orders"), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "ให้คะแนนล้มเหลว");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-sm text-gray-400">กำลังโหลด…</div>;
  }

  if (error && !order) {
    return (
      <div className="max-w-lg space-y-4">
        <Link href="/parts/orders" className="text-sm text-gray-400 hover:text-gray-600">← คำสั่งซื้อ</Link>
        <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-sm text-red-700">{error}</div>
      </div>
    );
  }

  if (!order) return null;

  const statusLabel = ORDER_STATUS_LABEL[order.status];
  const statusColor = ORDER_STATUS_COLOR[order.status];

  // Order ต้องปิดแล้ว
  if (order.status !== "closed") {
    return (
      <div className="max-w-lg space-y-4">
        <Link href="/parts/orders" className="text-sm text-gray-400 hover:text-gray-600">← คำสั่งซื้อ</Link>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-3">
          <h1 className="text-lg font-bold text-gray-900">⭐ ให้คะแนน</h1>
          <p className="text-sm text-gray-600">
            ให้คะแนนได้เฉพาะ order ที่ปิดแล้ว — ขณะนี้สถานะ:{" "}
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor}`}>
              {statusLabel}
            </span>
          </p>
        </div>
      </div>
    );
  }

  // Already rated
  if (success && order.rating) {
    return (
      <div className="max-w-lg space-y-4">
        <Link href="/parts/orders" className="text-sm text-gray-400 hover:text-gray-600">← คำสั่งซื้อ</Link>
        <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-6 text-center space-y-2">
          <div className="text-4xl">⭐</div>
          <p className="text-sm font-medium text-yellow-800">
            คุณให้คะแนน {order.rating.score}/5 แล้ว
          </p>
          {order.rating.comment && (
            <p className="text-xs text-yellow-700 italic">"{order.rating.comment}"</p>
          )}
        </div>
      </div>
    );
  }

  // Submitted successfully
  if (success) {
    return (
      <div className="max-w-lg space-y-4">
        <div className="bg-green-50 border border-green-100 rounded-2xl p-6 text-center space-y-2">
          <div className="text-4xl">✅</div>
          <p className="text-sm font-medium text-green-800">ให้คะแนนสำเร็จแล้ว ขอบคุณ!</p>
          <p className="text-xs text-green-600">กำลังกลับสู่คำสั่งซื้อ…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/parts/orders" className="text-sm text-gray-400 hover:text-gray-600">← คำสั่งซื้อ</Link>
        <h1 className="text-xl font-bold text-gray-900">⭐ ให้คะแนน Seller</h1>
      </div>

      {/* Order summary */}
      <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4 space-y-1">
        <div className="flex items-center justify-between">
          <p className="text-xs font-mono text-gray-400">#{order.id.slice(0, 8)}…</p>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor}`}>
            {statusLabel}
          </span>
        </div>
        <p className="text-sm text-gray-700">
          {order.quantity} ชิ้น × {Number(order.unitPriceThb).toLocaleString()} บาท
          {" = "}
          <span className="font-bold text-green-700">{Number(order.totalThb).toLocaleString()} บาท</span>
        </p>
        {order.closedAt && (
          <p className="text-xs text-gray-400">ปิด: {new Date(order.closedAt).toLocaleDateString("th-TH")}</p>
        )}
      </div>

      {/* Rating form */}
      <form onSubmit={(e) => void handleSubmit(e)} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-5">

        {/* Star selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            คะแนน <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2 justify-center">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setScore(s)}
                className={`text-3xl transition-transform hover:scale-110 ${
                  s <= score ? "grayscale-0" : "grayscale opacity-30"
                }`}
                aria-label={`${s} ดาว`}
              >
                ⭐
              </button>
            ))}
          </div>
          {score > 0 && (
            <p className="text-center text-xs text-gray-500 mt-2">
              {score === 1 && "แย่มาก"}
              {score === 2 && "แย่"}
              {score === 3 && "ปานกลาง"}
              {score === 4 && "ดี"}
              {score === 5 && "ดีเยี่ยม!"}
            </p>
          )}
        </div>

        {/* Comment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            ความคิดเห็น <span className="text-gray-400">(ไม่บังคับ)</span>
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="แสดงความคิดเห็นเพิ่มเติม เช่น ส่งเร็ว, สินค้าตรงตามที่สั่ง…"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-200 resize-none"
          />
          <p className="text-xs text-gray-400 mt-1 text-right">{comment.length}/500</p>
        </div>

        {error && (
          <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            ⚠️ {error}
          </div>
        )}

        <div className="flex gap-3">
          <Link
            href="/parts/orders"
            className="flex-1 text-center border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium rounded-xl px-4 py-2.5 transition-colors"
          >
            ยกเลิก
          </Link>
          <button
            type="submit"
            disabled={submitting || score === 0}
            className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium rounded-xl px-4 py-2.5 transition-colors disabled:opacity-60"
          >
            {submitting ? "กำลังส่ง…" : "⭐ ส่งคะแนน"}
          </button>
        </div>
      </form>
    </div>
  );
}
