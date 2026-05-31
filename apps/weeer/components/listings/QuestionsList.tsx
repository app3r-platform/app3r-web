/**
 * W-Round-1 Wave 2 (WeeeR) — QuestionsList (GR-5)
 *
 * Renders Q&A. Backend applies visibility filter server-side (anonymous = is_visible=true).
 * snake_case contract (Ruling 1E/1F). Structural ref: apps/app3r/components/listings/QuestionsList.tsx.
 */
import type { Question } from "@/lib/types/listing-meta";

function formatDateTh(iso: string): string {
  try {
    return new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function QuestionsList({
  questions,
  isClosed,
}: {
  questions: Question[];
  isClosed: boolean;
}) {
  return (
    <section className="bg-white border border-gray-200 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-lg font-bold text-gray-900">
          คำถาม-คำตอบ (Q&amp;A){" "}
          <span className="text-gray-500 text-sm font-normal">({questions.length})</span>
        </h2>
        {isClosed && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            ปิดรับคำถาม
          </span>
        )}
      </div>

      {questions.length === 0 ? (
        <p className="text-center text-gray-500 text-sm py-4">
          ยังไม่มีคำถาม (No questions yet)
        </p>
      ) : (
        <ul className="space-y-4">
          {questions.map((q) => (
            <li key={q.id} className="border-l-4 border-[#FFD0BF] pl-4 py-2">
              <div className="flex items-start justify-between gap-2 mb-2 flex-wrap">
                <p className="text-sm text-gray-900 whitespace-pre-line font-medium">
                  ถาม: {q.body}
                </p>
                <span className="text-xs text-gray-500 shrink-0">
                  {formatDateTh(q.created_at)}
                </span>
              </div>

              {q.replies.length > 0 ? (
                <ul className="mt-2 ml-4 pl-4 border-l-2 border-gray-200 space-y-2">
                  {q.replies.map((rep) => (
                    <li key={rep.id} className="text-xs text-gray-700">
                      <span className="font-semibold text-[#D63B12]">ตอบ:</span>{" "}
                      <span className="whitespace-pre-line">{rep.body}</span>
                      <div className="text-gray-400 mt-0.5">{formatDateTh(rep.created_at)}</div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-gray-400 italic mt-1">รอเจ้าของประกาศตอบ</p>
              )}
            </li>
          ))}
        </ul>
      )}

      <p className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
        ต้องการถามคำถาม? เข้าสู่ระบบเป็น WeeeR (ร้าน) เพื่อยื่นคำถาม — ลดการติดต่อส่วนตัว (GR-5)
      </p>
    </section>
  );
}
