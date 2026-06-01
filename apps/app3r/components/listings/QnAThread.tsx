"use client";

// ============================================================
// components/listings/QnAThread.tsx — C6
// Q&A box with MOCK role-based visibility:
//   - WeeeR viewer  → sees only the questions they asked
//   - WeeeU owner   → sees all questions
// Mockup interactions only (no persist). Local view-model — does NOT
// touch shared schema (lib/types/listing-meta.ts). Mirrors QuestionDto shape.
// ============================================================
import { useState } from "react";
import type { MockRole } from "@/lib/auth/mock-role";

/** Local view-model mirroring the question shape (NOT a shared-schema type) */
export interface QnAItem {
  id: string;
  /** role ของผู้ถาม — ใช้ mock visibility */
  askerRole: MockRole;
  /** ชื่อผู้ถาม (mock) */
  askerName: string;
  question: string;
  answer?: string;
}

export interface QnAThreadProps {
  questions: QnAItem[];
  /** role ของผู้ชมปัจจุบัน */
  currentRole: MockRole;
  /** true = ผู้ชมคือเจ้าของประกาศ (WeeeU owner) เห็นทุกคำถาม */
  isOwner?: boolean;
  className?: string;
}

export default function QnAThread({
  questions,
  currentRole,
  isOwner = false,
  className = "",
}: QnAThreadProps) {
  // Mock filter: owner เห็นทุกอัน; WeeeR เห็นเฉพาะที่ตัวเองถาม; อื่นๆ เห็นเฉพาะที่มีคำตอบแล้ว (public)
  const visible = questions.filter((q) => {
    if (isOwner) return true;
    if (currentRole === "weeer") return q.askerRole === "weeer";
    return q.answer != null; // anonymous/weeeu non-owner → public answered only
  });

  return (
    <section className={`rounded-xl border border-gray-200 bg-white p-6 ${className}`}>
      <h2 className="mb-1 text-lg font-bold text-gray-900">
        คำถาม-คำตอบ (Q&amp;A){" "}
        <span className="text-sm font-normal text-gray-500">({visible.length})</span>
      </h2>
      <p className="mb-4 text-xs text-gray-400 italic">
        * ตัวอย่าง (mock) — การมองเห็นตาม role ยังไม่บันทึกจริง
      </p>

      {visible.length === 0 ? (
        <p className="py-4 text-center text-sm text-gray-500">
          ยังไม่มีคำถามที่คุณดูได้ (No visible questions)
        </p>
      ) : (
        <ul className="space-y-4">
          {visible.map((q) => (
            <li key={q.id} className="border-l-4 border-website-brand-200 pl-4 py-2">
              <p className="text-sm font-medium text-gray-900">
                <span className="text-gray-500">{q.askerName}:</span> {q.question}
              </p>
              {q.answer ? (
                <p className="mt-2 ml-4 border-l-2 border-gray-200 pl-4 text-xs text-gray-700">
                  <span className="font-semibold text-website-brand-700">ตอบ:</span> {q.answer}
                </p>
              ) : (
                <p className="mt-1 text-xs text-gray-400 italic">รอเจ้าของประกาศตอบ</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
