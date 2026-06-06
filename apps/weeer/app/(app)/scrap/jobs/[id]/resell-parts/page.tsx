"use client";

// ── WeeeR Scrap R-28c — resell-parts (S2 แยกอะไหล่) ──────────────────────────

import { use, useEffect, useState } from "react";
import { MockAnnoOrigin, MockAnnoXApp } from "@/components/MockAnno";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { scrapApi } from "../../../_lib/api";
import type { ScrapJob } from "../../../_lib/types";

// ── MOCK_JOB — hardcoded fallback สำหรับ dev (ใช้เมื่อ API ไม่ตอบ) ──────────
const MOCK_JOB: ScrapJob = {
  id: "SJ001",
  scrapItemId: "SC001",
  buyerId: "S1",
  buyerType: "WeeeR",
  decision: "resell_parts",
  status: "in_progress",
  createdAt: "2026-05-21T10:00:00+07:00",
  updatedAt: "2026-05-24T10:00:00+07:00",
  scrapItemDescription: "Samsung เครื่องซักผ้า WW12T แยกอะไหล่",
  conditionGrade: "grade_A",
};

type PartRow = { name: string; qty: string };

export default function ResellPartsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [job, setJob] = useState<ScrapJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rows, setRows] = useState<PartRow[]>([{ name: "", qty: "1" }]);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    scrapApi.getJob(id)
      .then(setJob)
      .catch(() => {
        // DEV fallback: API ไม่ตอบ → ใช้ MOCK_JOB แทน (ไม่แสดง error)
        setJob(MOCK_JOB);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const addRow = () => setRows(r => [...r, { name: "", qty: "1" }]);
  const removeRow = (i: number) => setRows(r => r.filter((_, idx) => idx !== i));
  const updateRow = (i: number, field: keyof PartRow, val: string) =>
    setRows(r => r.map((row, idx) => idx === i ? { ...row, [field]: val } : row));

  const handleSubmit = async () => {
    const valid = rows.filter(r => r.name.trim());
    if (valid.length === 0) { setSubmitError("กรอกชื่ออะไหล่อย่างน้อย 1 รายการ"); return; }
    setSubmitting(true);
    setSubmitError("");
    try {
      await scrapApi.submitResellParts(id, {
        partNames: valid.map(r => r.name.trim()),
        quantities: valid.map(r => Math.max(1, parseInt(r.qty) || 1)),
        notes: notes.trim() || undefined,
      });
      router.push(`/scrap/jobs/${id}`);
    } catch (e) {
      setSubmitError((e as Error).message);
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-48 text-gray-400">กำลังโหลด…</div>;
  if (error) return <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-yellow-700 text-sm">⚠️ {error}</div>;

  return (
    <div className="space-y-5 max-w-xl">
      {/* §5 Origin + §8 Cross-app annotations */}
      <MockAnnoOrigin text='◀ มาจาก: R-28 · /scrap/jobs/[id] (เลือก "แยกอะไหล่")' />
      <MockAnnoXApp screenLabel="R-28c: แยกอะไหล่">
        <p>• <strong>WeeeU :3002</strong> [U-33] เจ้าของซากเห็นสถานะ in_progress → ซากอยู่ระหว่างแยกชิ้นส่วน
          <a href="http://localhost:3002/scrap/SC001" className="underline ml-1">/scrap/[id]</a>
        </p>
        <p>• <strong>Admin :3000</strong> [A-08] Admin เห็น decision = resell_parts + Parts สต๊อกเพิ่ม
          <a href="http://localhost:3000/scrap/jobs" className="underline ml-1">/scrap/jobs</a>
        </p>
        <p>• หลัง submit → อะไหล่เข้าสต๊อก Parts (WeeeR R-29 My Listings)</p>
      </MockAnnoXApp>

      <div className="flex items-center gap-3">
        <Link href={`/scrap/jobs/${id}`} className="text-gray-400 hover:text-gray-600">←</Link>
        <h1 className="text-xl font-bold text-gray-900">🔩 แยกอะไหล่</h1>
      </div>

      {job && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700">
          ซาก: {job.scrapItemDescription ?? job.scrapItemId}
        </div>
      )}

      <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
        <p className="text-xs text-gray-500 font-medium">รายการอะไหล่ที่แยกได้</p>
        {rows.map((row, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              value={row.name}
              onChange={e => updateRow(i, "name", e.target.value)}
              placeholder={`ชื่ออะไหล่ #${i + 1}`}
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF663A]" />
            <input
              type="number" min="1"
              value={row.qty}
              onChange={e => updateRow(i, "qty", e.target.value)}
              className="w-16 border border-gray-200 rounded-xl px-2 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#FF663A]" />
            {rows.length > 1 && (
              <button onClick={() => removeRow(i)} className="text-red-400 hover:text-red-600 text-lg leading-none">×</button>
            )}
          </div>
        ))}
        <button onClick={addRow}
          className="text-xs text-[#F04E20] hover:text-[#D63B12] font-medium">
          + เพิ่มรายการ
        </button>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl p-4">
        <label className="block text-xs text-gray-500 mb-1">หมายเหตุ (ไม่บังคับ)</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF663A] resize-none" />
      </div>

      {submitError && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-red-600 text-sm">{submitError}</div>
      )}

      <div>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className={`w-full py-3 rounded-xl text-sm font-semibold transition-colors
            ${submitting ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-[#FF663A] hover:bg-[#F04E20] text-white"}`}>
          {submitting ? "กำลังบันทึก…" : "✅ บันทึกและเพิ่มเข้าสต๊อก Parts"}
        </button>
        {/* §6 Nav annotation */}
        <p className="mock-anno mock-anno-nav text-[10px] text-blue-500 font-mono mt-1">→ กลับ R-28 /scrap/jobs/[id] + อะไหล่เพิ่มใน R-29 /parts/my-listings</p>
      </div>
    </div>
  );
}
