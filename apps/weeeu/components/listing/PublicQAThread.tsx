"use client";
// ─── PublicQAThread (Mockup — FLAG-3 placeholder · ไม่ wire API จริง) ──────────
// Q&A สาธารณะสำหรับ listing ประเภท repair / maintain / scrap
// ต่างจาก Resell (used_appliance) ที่ผู้ซื้อเห็นเฉพาะคำถามของตัวเอง —
// ที่นี่ WeeeU เห็น "ทุก thread" (คำถาม+คำตอบของทุกคน) เพราะเป็นประกาศบริการสาธารณะ

import { useState } from "react";

export type QAEntry = {
  id: string;
  asker: string;
  question: string;
  answer?: string;
  mine?: boolean;
};

const DEFAULT_SEED: QAEntry[] = [
  {
    id: "qa-seed-1",
    asker: "สมชาย",
    question: "รับงานแถวบางเขนไหมครับ?",
    answer: "รับครับ ในรัศมี 15 กม. ไม่มีค่าเดินทางเพิ่ม",
  },
  {
    id: "qa-seed-2",
    asker: "มานี",
    question: "มีรับประกันงานกี่วันคะ?",
    answer: "รับประกันงานซ่อม 30 วันค่ะ",
  },
];

export function PublicQAThread({
  seed = DEFAULT_SEED,
  isPrivate = false, // A5: true = ซ่อนผู้ไม่เกี่ยว (repair/[id] job detail, scrap/[id] accepted job)
}: { seed?: QAEntry[]; isPrivate?: boolean }) {
  const [items, setItems] = useState<QAEntry[]>(seed);
  const [question, setQuestion] = useState("");
  const [open, setOpen] = useState(false);

  const ask = () => {
    const q = question.trim();
    if (!q) return;
    setItems(prev => [...prev, { id: `qa-new-${prev.length + 1}`, asker: "คุณ", question: q, mine: true }]);
    setQuestion("");
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-left"
      >
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          {isPrivate ? "🔒 ถาม-ตอบ (ไม่สาธารณะ)" : "💬 ถาม-ตอบสาธารณะ"}{" "}
          <span className="text-gray-400">({items.length} คำถาม)</span>
        </p>
        <span className="text-gray-400 text-sm">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="space-y-3">
          <div className={`rounded-xl p-3 ${isPrivate ? "bg-gray-50 border border-gray-200" : "bg-weeeu-surface"}`}>
            <p className="text-xs text-weeeu-text">
              {isPrivate
                ? "🔒 ข้อความเฉพาะผู้เกี่ยวข้อง — มองเห็นเฉพาะคุณและผู้ให้บริการที่รับงาน"
                : "📢 ถาม-ตอบนี้เป็นสาธารณะ — ทุกคนเห็นคำถามและคำตอบทั้งหมด"}
            </p>
          </div>

          {items.map(qa => (
            <div key={qa.id} className="border border-gray-100 rounded-xl p-3 space-y-1.5">
              <p className="text-xs text-gray-800 font-medium">
                <span className={qa.mine ? "text-weeeu-primary" : "text-gray-400"}>{qa.mine ? "คุณ" : qa.asker}</span> ❓ {qa.question}
              </p>
              {qa.answer ? (
                <p className="text-xs text-weeeu-primary font-medium">💬 {qa.answer}</p>
              ) : (
                <p className="text-xs text-gray-400 italic">รอผู้ให้บริการตอบ...</p>
              )}
            </div>
          ))}

          <div className="flex gap-2">
            <input
              type="text"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={e => e.key === "Enter" && ask()}
              placeholder="พิมพ์คำถามถึงผู้ให้บริการ..."
              className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-weeeu-primary/40"
            />
            <button
              onClick={ask}
              disabled={!question.trim()}
              className="px-3 py-2 bg-weeeu-primary hover:bg-weeeu-dark disabled:bg-gray-200 text-white text-xs font-semibold rounded-xl transition-colors"
            >
              ถาม
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
