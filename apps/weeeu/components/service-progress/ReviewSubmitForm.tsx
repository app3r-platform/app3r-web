"use client";

import { useState } from "react";
import { submitReview } from "@/lib/utils/service-progress-sync";

interface Props {
  jobId: string;
  onSubmitted: () => void;
}

export function ReviewSubmitForm({ jobId, onSubmitted }: Props) {
  const [rating, setRating] = useState<1 | 2 | 3 | 4 | 5 | 0>(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (rating === 0) { setError("กรุณาเลือกคะแนน"); return; }
    if (comment.trim().length < 5) { setError("กรุณาเขียนความคิดเห็น (อย่างน้อย 5 ตัวอักษร)"); return; }
    setSubmitting(true);
    setError("");
    try {
      const ok = submitReview(jobId, rating as 1 | 2 | 3 | 4 | 5, comment.trim());
      if (!ok) throw new Error("ไม่สามารถบันทึกรีวิวได้");
      onSubmitted();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 space-y-4">
      <div>
        <p className="text-sm font-semibold text-indigo-800 mb-1">⭐ รีวิวบริการ</p>
        <p className="text-xs text-indigo-600">งานเสร็จสมบูรณ์แล้ว — กรุณาให้คะแนนและความคิดเห็น</p>
      </div>

      {/* Star rating */}
      <div className="space-y-1.5">
        <p className="text-xs text-gray-600 font-medium">คะแนนความพึงพอใจ</p>
        <div className="flex gap-2">
          {([1, 2, 3, 4, 5] as const).map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              className={`text-2xl transition-transform hover:scale-110 ${
                star <= rating ? "opacity-100" : "opacity-30"
              }`}
            >
              ⭐
            </button>
          ))}
        </div>
        {rating > 0 && (
          <p className="text-xs text-indigo-600 font-medium">
            {rating === 5 ? "ยอดเยี่ยม!" : rating === 4 ? "ดีมาก" : rating === 3 ? "ปานกลาง" : rating === 2 ? "พอใช้" : "ต้องปรับปรุง"}
          </p>
        )}
      </div>

      {/* Comment */}
      <div className="space-y-1.5">
        <p className="text-xs text-gray-600 font-medium">ความคิดเห็น</p>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="เขียนความคิดเห็นของคุณ..."
          rows={3}
          className="w-full rounded-xl border border-indigo-200 bg-white px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
        />
      </div>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={submitting || rating === 0}
        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
      >
        {submitting ? "กำลังบันทึก..." : "📝 ส่งรีวิว"}
      </button>
    </div>
  );
}
