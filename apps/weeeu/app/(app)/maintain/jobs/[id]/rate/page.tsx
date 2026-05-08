"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";

export default function MaintainRatePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const STAR_LABELS = ["", "ต้องปรับปรุง", "พอใช้", "ดี", "ดีมาก", "ยอดเยี่ยม!"];

  const handleSubmit = async () => {
    if (rating === 0) { setError("กรุณาให้คะแนน 1-5 ดาว"); return; }
    setError("");
    setSubmitting(true);
    try {
      const res = await apiFetch(`/api/v1/maintain/jobs/${id}/rate/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment: comment.trim() }),
      });
      if (!res.ok) throw new Error(await res.text());
      setSubmitted(true);
      setTimeout(() => router.push(`/maintain/jobs/${id}`), 1500);
    } catch {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/maintain/jobs/${id}`} className="text-gray-500 hover:text-gray-800 text-xl">‹</Link>
        <h1 className="text-xl font-bold text-gray-900">ให้คะแนนการบริการ</h1>
      </div>

      {submitted ? (
        <div className="bg-teal-50 border border-teal-200 rounded-2xl p-6 text-center space-y-3">
          <p className="text-4xl">⭐</p>
          <p className="text-sm font-semibold text-teal-800">ขอบคุณสำหรับคะแนน!</p>
          <p className="text-xs text-teal-600">กำลังกลับหน้ารายละเอียดงาน...</p>
        </div>
      ) : (
        <>
          <div className="bg-teal-50 border border-teal-100 rounded-2xl p-4 text-center">
            <p className="text-sm font-semibold text-teal-800">🛁 งานล้างเครื่องเสร็จแล้ว</p>
            <p className="text-xs text-teal-600 mt-1">คะแนนของคุณช่วยพัฒนาคุณภาพบริการ</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Star rating */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">ความพึงพอใจโดยรวม</p>
            <div className="flex justify-center gap-3">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  className="text-4xl transition-transform hover:scale-110 focus:outline-none"
                >
                  <span className={(hovered || rating) >= star ? "text-yellow-400" : "text-gray-200"}>
                    ★
                  </span>
                </button>
              ))}
            </div>
            {(hovered || rating) > 0 && (
              <p className="text-center text-sm font-semibold text-teal-700">
                {STAR_LABELS[hovered || rating]}
              </p>
            )}
          </div>

          {/* Comment */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">ความคิดเห็น (ไม่บังคับ)</p>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="เช่น ช่างมาตรงเวลา / เครื่องสะอาดมาก / บริการดีมาก"
              rows={4}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting || rating === 0}
            className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-teal-300 text-white font-semibold py-3.5 rounded-2xl transition-colors text-sm flex items-center justify-center gap-2"
          >
            {submitting
              ? <><span className="animate-spin">⟳</span> กำลังส่งคะแนน...</>
              : `⭐ ส่งคะแนน ${rating > 0 ? `${rating} ดาว` : ""}`}
          </button>
        </>
      )}
    </div>
  );
}
