/**
 * W-Round-1 Wave 2 (WeeeR) — ReviewsList (D86)
 *
 * Renders visible reviews (Backend filters server-side). Owner replies inline.
 * snake_case contract (Ruling 1E/1F). Structural ref: apps/app3r/components/listings/ReviewsList.tsx.
 */
import type { Review } from "@/lib/types/listing-meta";

function formatDateTh(iso: string): string {
  try {
    return new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function Star({ filled }: { filled: boolean }) {
  return (
    <span aria-hidden className={filled ? "text-yellow-500" : "text-gray-300"}>
      ★
    </span>
  );
}

function StarRating({ rating }: { rating: number }) {
  const clamped = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <span aria-label={`คะแนน ${clamped} จาก 5 ดาว`} className="text-sm">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} filled={i <= clamped} />
      ))}
    </span>
  );
}

export function ReviewsList({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 text-center text-gray-500 text-sm">
        ยังไม่มีรีวิว (No reviews yet)
      </div>
    );
  }

  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  return (
    <section className="bg-white border border-gray-200 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-lg font-bold text-gray-900">
          รีวิว (Reviews){" "}
          <span className="text-gray-500 text-sm font-normal">({reviews.length})</span>
        </h2>
        <div className="flex items-center gap-2 text-sm">
          <StarRating rating={avg} />
          <span className="text-gray-600">{avg.toFixed(1)} / 5</span>
        </div>
      </div>

      <ul className="space-y-4">
        {reviews.map((r) => (
          <li key={r.id} className="border-l-4 border-green-200 pl-4 py-2">
            <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
              <StarRating rating={r.rating} />
              <span className="text-xs text-gray-500">{formatDateTh(r.created_at)}</span>
            </div>
            {r.comment ? (
              <p className="text-sm text-gray-800 whitespace-pre-line">{r.comment}</p>
            ) : (
              <p className="text-sm text-gray-400 italic">(ไม่มีความคิดเห็น)</p>
            )}

            {r.replies.length > 0 && (
              <ul className="mt-3 ml-4 pl-4 border-l-2 border-gray-200 space-y-2">
                {r.replies.map((rep) => (
                  <li key={rep.id} className="text-xs text-gray-700">
                    <span className="font-semibold text-green-700">
                      เจ้าของประกาศตอบ (Owner reply):
                    </span>{" "}
                    <span className="whitespace-pre-line">{rep.body}</span>
                    <div className="text-gray-400 mt-0.5">{formatDateTh(rep.created_at)}</div>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
