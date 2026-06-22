"use client";
// WeeeT — B2 ฟอร์มประเมินก่อนซ่อม (rough estimate) — REP-C04
// SoT Gen 55 · B2 v3.2 RECONCILED Gen 58 · 10-field spec
// จุดเข้า: /jobs/[id]/estimate (หลัง inspect ก่อน checklist B3)
// Phase D-6 mockup · state local · ไม่ fetch API จริง
// Role-visibility: ช่าง(WeeeT) เห็นแค่ total · WeeeR+WeeeU เห็นทุก breakdown (SoT Role-based Visibility)
// TODO backend: POST /api/v1/repair/jobs/:id/estimate/ (settle/verify = backend)
import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { MockAnno } from "@/components/MockAnno";
import {
  REPAIR_VIEW_ROLE_LABELS,
  REPAIR_WORKTYPE_LABELS,
  type RepairViewRole,
  type RepairWorktype,
  type B2SymptomConfirm,
  type B2PartRow,
} from "@/lib/types";
import {
  SEED_B1_SYMPTOMS,
  SEED_B2_EXTRA_SYMPTOM_OPTIONS,
  SEED_B2_PRICE_BREAKDOWN,
} from "@/lib/mock-data/repair-bforms";

const WORKTYPES: RepairWorktype[] = ["repair", "replace", "clean", "refill"];

export default function B2EstimatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  // #3 — ยืนยันอาการ WeeeU แจ้ง ต่อข้อ (radio: ตรง/ไม่พบ)
  const [symptomConfirms, setSymptomConfirms] = useState<Record<string, B2SymptomConfirm>>({});
  // #4 — อาการที่ WeeeT พบเพิ่ม (multi-chips)
  const [extraSymptoms, setExtraSymptoms] = useState<string[]>([]);
  // #5 + #6 — อะไหล่ + worktype + stock (multi-row)
  const [parts, setParts] = useState<B2PartRow[]>([]);
  // #8 — ข้อเสนอค่าใช้จ่ายจากช่าง
  const [techFee, setTechFee] = useState("");
  const [notes, setNotes] = useState("");
  // #10 — role-aware price display (mockup toggle เพื่อ verify ทั้ง 3 มุมมอง)
  const [viewRole, setViewRole] = useState<RepairViewRole>("weeet");
  const [submitting, setSubmitting] = useState(false);

  const bd = SEED_B2_PRICE_BREAKDOWN;

  const toggleExtra = (s: string) =>
    setExtraSymptoms((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  const addPart = () =>
    setParts((p) => [...p, { name: "", worktype: "repair", inStock: true }]);
  const updatePart = (i: number, patch: Partial<B2PartRow>) =>
    setParts((prev) => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  const removePart = (i: number) => setParts((prev) => prev.filter((_, idx) => idx !== i));

  // ทุกอาการ B1 ต้องยืนยัน + ระบุอะไหล่ ≥1 (field #5 required)
  const allSymptomsConfirmed = SEED_B1_SYMPTOMS.every((s) => symptomConfirms[s]);
  const canSubmit = allSymptomsConfirmed && parts.length > 0 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    // mockup — state local · TODO backend POST estimate
    await new Promise((r) => setTimeout(r, 900));
    router.push(`/jobs/${id}/checklist`);
  };

  return (
    <div className="pb-28">
      <MockAnno
        origin="T-08 ตรวจสอบ /jobs/[id]/inspect"
        nav="B3 ใบตรวจก่อนซ่อม /jobs/[id]/checklist"
        xapp="→ WeeeR+WeeeU เห็น breakdown · ช่างเห็นแค่ยอดรวม"
      />
      <div className="sticky top-0 bg-gray-950/90 backdrop-blur-sm border-b border-gray-800 px-4 py-3 flex items-center gap-3 z-10">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-white text-lg">←</button>
        <div>
          <h1 className="font-bold text-white">B2 — ประเมินก่อนซ่อม</h1>
          <p className="text-xs text-gray-400">ประเมินคร่าวๆ หน้างาน (rough estimate)</p>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-5">
        {/* #1 Header (display จาก B1) */}
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 space-y-1 text-sm">
          <p className="text-white font-semibold">เครื่องปรับอากาศ Daikin Inverter</p>
          <p className="text-gray-400 text-xs">ลูกค้า: คุณสุภา รักดี · ประกาศ #{id}</p>
          {/* #2 มัดจำ/รับประกัน — read-only 🔒 จาก repair_offer */}
          <p className="text-gray-400 text-xs flex items-center gap-1">
            <span>🔒</span> พอยต์ทองที่ล็อก ฿500 · รับประกันงานซ่อม 90 วัน (จากข้อเสนอ WeeeR)
          </p>
        </div>

        {/* #3 ยืนยันอาการ WeeeU แจ้ง ต่อข้อ */}
        <div className="space-y-2">
          <p className="text-sm font-semibold text-white">
            ยืนยันอาการที่ลูกค้าแจ้ง <span className="text-red-400">*</span>
          </p>
          {SEED_B1_SYMPTOMS.map((s) => (
            <div key={s} className="bg-gray-800 border border-gray-700 rounded-xl p-3 flex items-center justify-between gap-2">
              <span className="text-sm text-gray-200 flex-1">{s}</span>
              <div className="flex gap-1.5 shrink-0">
                {(["match", "not_found"] as B2SymptomConfirm[]).map((c) => (
                  <button
                    key={c}
                    onClick={() => setSymptomConfirms((p) => ({ ...p, [s]: c }))}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                      symptomConfirms[s] === c
                        ? c === "match"
                          ? "bg-green-900/50 text-green-300 border-green-600"
                          : "bg-red-900/50 text-red-300 border-red-600"
                        : "bg-gray-900 text-gray-400 border-gray-700"
                    }`}
                  >
                    {c === "match" ? "ตรง" : "ไม่พบ"}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* #4 อาการที่ WeeeT พบเพิ่ม (multi-chips) */}
        <div className="space-y-2">
          <p className="text-sm font-semibold text-white">อาการที่ช่างพบเพิ่ม</p>
          <div className="flex flex-wrap gap-2">
            {SEED_B2_EXTRA_SYMPTOM_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => toggleExtra(s)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  extraSymptoms.includes(s)
                    ? "bg-weeet-surface/50 text-weeet-primary border-weeet-dark"
                    : "bg-gray-800 text-gray-300 border-gray-700"
                }`}
              >
                {extraSymptoms.includes(s) ? "✓ " : ""}{s}
              </button>
            ))}
          </div>
        </div>

        {/* #5 + #6 อะไหล่ที่ต้องใช้ + worktype + stock badge */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-white">
              อะไหล่ที่ต้องใช้ + ประเภทงาน <span className="text-red-400">*</span>
            </p>
            <button onClick={addPart} className="text-xs text-weeet-primary hover:text-weeet-dark">+ เพิ่มแถว</button>
          </div>
          {parts.map((p, i) => (
            <div key={i} className="bg-gray-800 border border-gray-700 rounded-xl p-3 space-y-2">
              <div className="flex gap-2 items-center">
                <input
                  value={p.name}
                  onChange={(e) => updatePart(i, { name: e.target.value })}
                  placeholder="ชื่ออะไหล่"
                  className="flex-1 bg-gray-900 border border-gray-600 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-weeet-dark"
                />
                {/* #6 — stock badge auto (mock toggle) */}
                <button
                  onClick={() => updatePart(i, { inStock: !p.inStock })}
                  className={`text-xs px-2 py-1 rounded border shrink-0 ${
                    p.inStock
                      ? "bg-green-900/40 text-green-300 border-green-700"
                      : "bg-amber-900/40 text-amber-300 border-amber-700"
                  }`}
                >
                  {p.inStock ? "มีในสต๊อก" : "ไม่มี"}
                </button>
                <button onClick={() => removePart(i)} className="text-red-400 text-xs">✕</button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {WORKTYPES.map((w) => (
                  <button
                    key={w}
                    onClick={() => updatePart(i, { worktype: w })}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                      p.worktype === w
                        ? "bg-weeet-surface/50 text-weeet-primary border-weeet-dark"
                        : "bg-gray-900 text-gray-400 border-gray-700"
                    }`}
                  >
                    {REPAIR_WORKTYPE_LABELS[w]}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {parts.length === 0 && (
            <p className="text-xs text-amber-400">⚠️ ต้องระบุอะไหล่อย่างน้อย 1 รายการ</p>
          )}
          <p className="text-[11px] text-gray-500">
            * ช่างไม่เลือกแท้/มือสอง — WeeeR เป็นผู้เสนอลูกค้า (B2.5)
          </p>
        </div>

        {/* #8 ข้อเสนอค่าใช้จ่ายจากช่าง */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-white">ข้อเสนอค่าใช้จ่ายจากช่าง (บาท)</label>
          <input
            type="number" min="0" value={techFee}
            onChange={(e) => setTechFee(e.target.value)}
            placeholder="ค่าแรงเพิ่ม + ค่าเดินทางกลับ-มาใหม่"
            className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-weeet-dark"
          />
          <p className="text-[11px] text-gray-500">WeeeR จะปรับ + รวมกับค่าอะไหล่ก่อนเสนอลูกค้าจริง</p>
        </div>

        {/* notes */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-white">📝 หมายเหตุประเมิน</label>
          <textarea
            value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="รายละเอียดเพิ่มเติม..." rows={3}
            className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-weeet-dark resize-none"
          />
        </div>

        {/* #10 สรุปยอด — ROLE-AWARE PRICE DISPLAY */}
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white text-sm flex items-center gap-2">
              <span>💰</span> สรุปยอด
            </h2>
            {/* mockup role toggle เพื่อ verify ทั้ง 3 มุมมอง */}
            <div className="flex gap-1 bg-gray-900 rounded-lg p-0.5">
              {(["weeet", "weeer", "weeeu"] as RepairViewRole[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setViewRole(r)}
                  className={`text-[10px] px-2 py-1 rounded transition-colors ${
                    viewRole === r ? "bg-weeet-primary text-white" : "text-gray-400"
                  }`}
                >
                  {REPAIR_VIEW_ROLE_LABELS[r]}
                </button>
              ))}
            </div>
          </div>

          {/* GATE: breakdown เห็นเฉพาะ WeeeR + WeeeU · ช่าง(WeeeT) เห็นแค่ total */}
          {viewRole !== "weeet" ? (
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">ค่าอะไหล่</span><span className="text-gray-200">฿{bd.parts_cost.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">ค่าแรง</span><span className="text-gray-200">฿{bd.labor_cost.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">ค่าเดินทาง</span><span className="text-gray-200">฿{bd.travel_cost.toLocaleString()}</span></div>
              <div className="border-t border-gray-700 my-1" />
            </div>
          ) : (
            <div className="bg-gray-900/60 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-500 flex items-center gap-2">
              <span>🔒</span> ช่างเห็นเฉพาะยอดรวม — รายละเอียดอยู่ที่ร้าน/ลูกค้า
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-white font-semibold">รวมทั้งสิ้น</span>
            <span className="text-weeet-primary font-bold text-lg">฿{bd.total.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Sticky submit */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-950/95 backdrop-blur-sm border-t border-gray-800 px-4 py-3 z-20">
        {!allSymptomsConfirmed && (
          <p className="text-xs text-amber-400 mb-2 text-center">⚠️ ยืนยันอาการที่ลูกค้าแจ้งให้ครบทุกข้อ</p>
        )}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full bg-weeet-primary hover:bg-weeet-dark disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {submitting ? <><span className="animate-spin">⏳</span> กำลังส่ง...</> : "ส่งประเมิน → ใบตรวจก่อนซ่อม (B3)"}
        </button>
      </div>
    </div>
  );
}
