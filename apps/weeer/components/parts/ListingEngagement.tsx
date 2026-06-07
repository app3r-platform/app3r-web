"use client";

// ── ListingEngagement — W-R1 Wave 2: reviews (D86) + Q&A (GR-5) + transition (D83) ──
// consume /api/v1/listings/{listingMetaId}/* (B2). แสดงเมื่อมี listingMetaId เท่านั้น.
// currency LOCKED · frontend-only · ไม่ mock (ถ้า API ล้ม → error อ่านง่าย)

import { useCallback, useEffect, useState } from "react";
import {
  listingsApi,
  LISTING_TRANSITIONS,
  LISTING_STATE_LABEL,
  type Review,
  type Question,
  type ListingState,
} from "../../app/(app)/parts/_lib/listings-api";

interface Props {
  listingMetaId: string;
  /** state ปัจจุบันของ listing_meta (จาก catalog/GET) — owner ใช้ทำ transition */
  initialState?: ListingState;
  isOwn: boolean;
}

export function ListingEngagement({ listingMetaId, initialState, isOwn }: Props) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [qaClosed, setQaClosed] = useState(false);
  const [state, setState] = useState<ListingState | undefined>(initialState);
  const [err, setErr] = useState<string | null>(null);

  // form state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    listingsApi
      .listReviews(listingMetaId)
      .then((r) => setReviews(r.items))
      .catch(() => setReviews([]));
    listingsApi
      .listQuestions(listingMetaId)
      .then((r) => {
        setQuestions(r.items);
        setQaClosed(r.isClosed);
      })
      .catch(() => setQuestions([]));
    if (!initialState) {
      listingsApi
        .get(listingMetaId)
        .then((m) => setState(m.state))
        .catch(() => {});
    }
  }, [listingMetaId, initialState]);

  useEffect(load, [load]);

  const submitReview = () => {
    if (busy) return;
    setBusy(true);
    setErr(null);
    listingsApi
      .createReview(listingMetaId, { rating, comment: comment.trim() || undefined })
      .then(() => {
        setComment("");
        load();
      })
      .catch((e) => setErr(e instanceof Error ? e.message : "ส่งรีวิวไม่สำเร็จ"))
      .finally(() => setBusy(false));
  };

  const submitQuestion = () => {
    if (busy || !question.trim()) return;
    setBusy(true);
    setErr(null);
    listingsApi
      .createQuestion(listingMetaId, { body: question.trim() })
      .then(() => {
        setQuestion("");
        load();
      })
      .catch((e) => setErr(e instanceof Error ? e.message : "ส่งคำถามไม่สำเร็จ"))
      .finally(() => setBusy(false));
  };

  const doTransition = (to: ListingState) => {
    if (busy) return;
    setBusy(true);
    setErr(null);
    listingsApi
      .transition(listingMetaId, { to })
      .then((r) => setState(r.state))
      .catch((e) => setErr(e instanceof Error ? e.message : "เปลี่ยนสถานะไม่สำเร็จ"))
      .finally(() => setBusy(false));
  };

  const nextStates = state ? LISTING_TRANSITIONS[state] ?? [] : [];

  return (
    <div className="space-y-6">
      {err && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-sm text-red-600">
          ⚠️ {err}
        </div>
      )}

      {/* ── Transition D83 (owner เท่านั้น) ────────────────────────────────── */}
      {isOwn && state && (
        <section className="bg-white border border-gray-100 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">สถานะรายการ{/* PHASE-4: D83 */}</h3>
            <span className="text-xs font-medium bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">
              {LISTING_STATE_LABEL[state]}
            </span>
          </div>
          {nextStates.length > 0 ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {nextStates.map((s) => (
                <button
                  key={s}
                  onClick={() => doTransition(s)}
                  disabled={busy}
                  className="text-xs font-medium px-3 py-1.5 rounded-full bg-[#FF663A] hover:bg-[#F04E20] disabled:opacity-50 text-white transition-colors"
                >
                  → {LISTING_STATE_LABEL[s]}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400">สถานะนี้เป็นขั้นสุดท้าย — เปลี่ยนต่อไม่ได้</p>
          )}
        </section>
      )}

      {/* ── Reviews (D86) ──────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">รีวิว ({reviews.length})</h3>
        {!isOwn && (
          <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-1">
              {([1, 2, 3, 4, 5] as const).map((n) => (
                <button
                  key={n}
                  onClick={() => setRating(n)}
                  className={`text-lg ${n <= rating ? "text-amber-400" : "text-gray-300"}`}
                  aria-label={`${n} ดาว`}
                >
                  ★
                </button>
              ))}
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="เขียนรีวิว (ไม่บังคับ)"
              rows={2}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#FF663A]"
            />
            <button
              onClick={submitReview}
              disabled={busy}
              className="text-sm font-medium px-4 py-1.5 rounded-lg bg-[#FF663A] hover:bg-[#F04E20] disabled:opacity-50 text-white"
            >
              ส่งรีวิว
            </button>
          </div>
        )}
        {reviews.length === 0 ? (
          <p className="text-xs text-gray-400">ยังไม่มีรีวิว</p>
        ) : (
          reviews.map((r) => (
            <div key={r.id} className="bg-gray-50 rounded-xl px-4 py-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-amber-400 text-sm">{"★".repeat(r.rating)}<span className="text-gray-300">{"★".repeat(5 - r.rating)}</span></span>
                <span className="text-[11px] text-gray-400">{new Date(r.createdAt).toLocaleDateString("th-TH")}</span>
              </div>
              {r.comment && <p className="text-sm text-gray-600">{r.comment}</p>}
              {r.replies.map((rep) => (
                <p key={rep.id} className="text-xs text-gray-500 bg-white rounded-lg px-3 py-1.5 ml-3 border-l-2 border-[#FFD0BF]">
                  💬 {rep.body}
                </p>
              ))}
            </div>
          ))
        )}
      </section>

      {/* ── Q&A (GR-5) ─────────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">ถาม-ตอบ ({questions.length})</h3>
        {!isOwn && !qaClosed && (
          <div className="flex gap-2">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="ถามผู้ขาย…"
              className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#FF663A]"
            />
            <button
              onClick={submitQuestion}
              disabled={busy || !question.trim()}
              className="text-sm font-medium px-4 py-1.5 rounded-lg bg-[#FF663A] hover:bg-[#F04E20] disabled:opacity-50 text-white whitespace-nowrap"
            >
              ถาม
            </button>
          </div>
        )}
        {qaClosed && <p className="text-xs text-gray-400">🔒 ปิดการถาม-ตอบแล้ว</p>}
        {questions.length === 0 ? (
          <p className="text-xs text-gray-400">ยังไม่มีคำถาม</p>
        ) : (
          questions.map((q) => (
            <div key={q.id} className="bg-gray-50 rounded-xl px-4 py-3 space-y-1">
              <p className="text-sm text-gray-700">❓ {q.body}</p>
              {q.replies.map((rep) => (
                <p key={rep.id} className="text-xs text-gray-500 bg-white rounded-lg px-3 py-1.5 ml-3 border-l-2 border-[#FFD0BF]">
                  💬 {rep.body}
                </p>
              ))}
            </div>
          ))
        )}
      </section>
    </div>
  );
}
