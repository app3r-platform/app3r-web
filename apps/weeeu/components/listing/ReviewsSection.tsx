"use client";

import { useCallback, useEffect, useState } from "react";
import { reviewsApi, type ListingReview } from "@/lib/api/reviews";

/**
 * ReviewsSection — D86 รีวิว listing + ฟอร์มให้คะแนน (W-Round-1 Wave 2)
 * ต่อ endpoint จริง: GET/POST /api/v1/listings/{id}/reviews
 */
export function ReviewsSection({ listingId }: { listingId: string }) {
  const [items, setItems] = useState<ListingReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState<0 | 1 | 2 | 3 | 4 | 5>(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await reviewsApi.list(listingId);
      setItems(res.items ?? []);
    } catch {
      // ประกาศนี้อาจยังไม่มีข้อมูลจริง (mock id) — แสดงว่ายังไม่มีรีวิว
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [listingId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async () => {
    if (rating === 0) {
      setError("กรุณาเลือกคะแนน (rating)");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await reviewsApi.create(listingId, {
        rating,
        comment: comment.trim() || undefined,
      });
      if (res.status === 201) {
        setDone(true);
        setRating(0);
        setComment("");
        await load();
      } else if (res.status === 401) {
        setError("กรุณาเข้าสู่ระบบ (login) ก่อนให้คะแนน");
      } else if (res.status === 409) {
        setError("คุณรีวิวประกาศนี้ไปแล้ว");
      } else if (res.status === 404) {
        setError("ไม่พบประกาศนี้");
      } else {
        setError("ส่งรีวิวไม่สำเร็จ กรุณาลองใหม่");
      }
    } catch {
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อ (connection)");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">
      <p className="text-sm font-semibold text-weeeu-dark">รีวิวและคะแนน (review)</p>

      {/* รายการรีวิว */}
      {loading ? (
        <p className="text-xs text-gray-400">กำลังโหลดรีวิว...</p>
      ) : items.length === 0 ? (
        <p className="text-xs text-gray-400">ยังไม่มีรีวิวสำหรับประกาศนี้ — เป็นคนแรกที่ให้คะแนน</p>
      ) : (
        <ul className="space-y-3">
          {items.map((r) => (
            <li key={r.id} className="border-b border-gray-50 pb-3 last:border-0 last:pb-0">
              <div className="flex items-center gap-1 text-amber-500 text-sm">
                {"⭐".repeat(r.rating)}
                <span className="ml-1 text-[10px] text-gray-400">
                  {new Date(r.createdAt).toLocaleDateString("th-TH")}
                </span>
              </div>
              {r.comment && <p className="text-sm text-gray-600 mt-1">{r.comment}</p>}
              {r.replies.map((rep) => (
                <div key={rep.id} className="mt-2 ml-3 bg-gray-50 rounded-lg px-3 py-2">
                  <p className="text-[10px] text-gray-400 mb-0.5">ผู้ขายตอบกลับ</p>
                  <p className="text-xs text-gray-600">{rep.body}</p>
                </div>
              ))}
            </li>
          ))}
        </ul>
      )}

      <hr className="border-gray-100" />

      {/* ฟอร์มให้คะแนน */}
      {done ? (
        <p className="text-sm text-weeeu-primary font-medium">✅ ขอบคุณสำหรับรีวิวของคุณ</p>
      ) : (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <p className="text-xs text-gray-600 font-medium">ให้คะแนนความพึงพอใจ</p>
            <div className="flex gap-2">
              {([1, 2, 3, 4, 5] as const).map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`text-2xl transition-transform hover:scale-110 ${
                    star <= rating ? "opacity-100" : "opacity-30"
                  }`}
                  aria-label={`ให้ ${star} ดาว`}
                >
                  ⭐
                </button>
              ))}
            </div>
          </div>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="เขียนความคิดเห็นของคุณ (ไม่บังคับ)..."
            rows={3}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-weeeu-primary/40 resize-none"
          />

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || rating === 0}
            className="w-full bg-weeeu-primary hover:bg-weeeu-dark disabled:opacity-40 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
          >
            {submitting ? "กำลังส่ง..." : "ส่งรีวิว"}
          </button>
        </div>
      )}
    </div>
  );
}
