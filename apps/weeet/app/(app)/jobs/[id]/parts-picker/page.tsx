"use client";
// WeeeT — B3.5 Smart Picker ระบุรายละเอียดอะไหล่ (final override ของ B2) — REP-C06
// SoT Gen 55 · B3.5 RECONCILED Gen 58 · Zero-typing first · ตัด OTP
// จุดเข้า: /jobs/[id]/parts-picker (หลัง B3 เลือก "ซ่อมได้" ก่อน B2.5)
// Phase D-6 mockup · state local · auto-load จาก B2 + mock WeeeR inventory
// TODO backend: POST /api/v1/repair/jobs/:id/parts-picker/ → state parts_picker_submitted
import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { MockAnno } from "@/components/MockAnno";
import {
  PART_STOCK_STATUS_META,
  REPAIR_WORKTYPE_LABELS,
  type PartStockStatus,
  type RepairWorktype,
  type SmartPickerPartCard,
  type AwaitingPartsChoice,
} from "@/lib/types";
import { SEED_SMARTPICKER_PARTS } from "@/lib/mock-data/repair-bforms";

const STOCK_ORDER: PartStockStatus[] = ["IN_VAN", "IN_SHOP", "NEED_ORDER"];
const WORKTYPES: RepairWorktype[] = ["replace", "clean", "repair", "refill"];

export default function B35SmartPickerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [parts, setParts] = useState<SmartPickerPartCard[]>(
    // clone seed (auto-load จาก B2 + check WeeeR inventory)
    SEED_SMARTPICKER_PARTS.map((p) => ({ ...p, worktypes: [...p.worktypes] })),
  );
  const [awaitingChoice, setAwaitingChoice] = useState<AwaitingPartsChoice>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const updatePart = (cid: string, patch: Partial<SmartPickerPartCard>) =>
    setParts((prev) => prev.map((p) => (p.id === cid ? { ...p, ...patch } : p)));

  const setQty = (cid: string, delta: number) =>
    setParts((prev) => prev.map((p) => (p.id === cid ? { ...p, qty: Math.max(1, p.qty + delta) } : p)));

  const toggleWorktype = (cid: string, w: RepairWorktype) =>
    setParts((prev) =>
      prev.map((p) =>
        p.id === cid
          ? { ...p, worktypes: p.worktypes.includes(w) ? p.worktypes.filter((x) => x !== w) : [...p.worktypes, w] }
          : p,
      ),
    );

  // Quick action — set ทุกตัวพร้อมกัน
  const setAllStock = (s: PartStockStatus) =>
    setParts((prev) => prev.map((p) => ({ ...p, stock: s })));

  // Section 1 counts
  const counts = STOCK_ORDER.reduce<Record<PartStockStatus, number>>(
    (acc, s) => ({ ...acc, [s]: parts.filter((p) => p.stock === s).length }),
    { IN_VAN: 0, IN_SHOP: 0, NEED_ORDER: 0 },
  );
  // section 5 แสดงเฉพาะมี IN_SHOP หรือ NEED_ORDER (ช่างไม่ได้นำมา)
  const notInVanCount = counts.IN_SHOP + counts.NEED_ORDER;
  const needsChoice = notInVanCount > 0;

  const canSubmit =
    parts.every((p) => p.worktypes.length > 0) &&
    (!needsChoice || awaitingChoice !== null) &&
    !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 900)); // mockup — TODO backend
    setSubmitting(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="pb-6 px-4 pt-6 space-y-5">
        <div className="text-center space-y-2">
          <p className="text-5xl">🔧</p>
          <p className="font-bold text-white text-lg">ส่งรายละเอียดอะไหล่แล้ว</p>
          <p className="text-sm text-gray-400">WeeeR จะใช้ข้อมูลนี้ทำ B2.5 (เสนอ 2 packages แท้/มือสอง)</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-gray-400">ทั้งหมด</span><span className="text-gray-200">{parts.length} รายการ</span></div>
          <div className="flex justify-between"><span className="text-gray-400">🚐 ในรถช่าง</span><span className="text-gray-200">{counts.IN_VAN}</span></div>
          <div className="flex justify-between"><span className="text-gray-400">🏪 ที่ร้าน</span><span className="text-gray-200">{counts.IN_SHOP}</span></div>
          <div className="flex justify-between"><span className="text-gray-400">📦 ต้องสั่ง</span><span className="text-gray-200">{counts.NEED_ORDER}</span></div>
        </div>
        <button
          onClick={() => router.push(`/jobs/${id}`)}
          className="w-full bg-weeet-primary hover:bg-weeet-dark text-white font-semibold py-3.5 rounded-xl transition-colors"
        >
          ← กลับหน้างาน
        </button>
      </div>
    );
  }

  return (
    <div className="pb-28">
      <MockAnno
        origin="B3 ใบตรวจ /jobs/[id]/checklist (เลือก ซ่อมได้)"
        nav="B2.5 ร้านเสนอ package (WeeeR)"
        xapp="→ WeeeR ใช้ทำ B2.5 · WeeeU เห็น (ยังไม่มีราคา) + รับทราบ"
      />
      <div className="sticky top-0 bg-gray-950/90 backdrop-blur-sm border-b border-gray-800 px-4 py-3 flex items-center gap-3 z-10">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-white text-lg">←</button>
        <div>
          <h1 className="font-bold text-white">B3.5 — ระบุอะไหล่</h1>
          <p className="text-xs text-gray-400">Smart Picker · กดเลือกไม่ต้องพิมพ์</p>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-5">
        {/* Section 1 — Info strip (auto จาก B2) */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-xs text-gray-300">
          auto จาก B2: <span className="text-white font-semibold">{parts.length} รายการ</span> · stock:{" "}
          🚐 {counts.IN_VAN} ในรถ / 🏪 {counts.IN_SHOP} ที่ร้าน / 📦 {counts.NEED_ORDER} ต้องสั่ง
        </div>

        {/* Section 2 — Quick action toolbar */}
        <div className="space-y-2">
          <p className="text-xs text-gray-400">ตั้งสถานะทุกตัวพร้อมกัน:</p>
          <div className="flex gap-2">
            {STOCK_ORDER.map((s) => {
              const m = PART_STOCK_STATUS_META[s];
              return (
                <button
                  key={s}
                  onClick={() => setAllStock(s)}
                  className={`flex-1 text-xs px-2 py-2 rounded-lg border ${m.cls}`}
                >
                  {m.icon} {m.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 3 — Part Cards */}
        <div className="space-y-3">
          {parts.map((p) => (
            <div key={p.id} className="bg-gray-800 border border-gray-700 rounded-xl p-4 space-y-3">
              {/* name + tag + prices */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white text-sm leading-snug">{p.name}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {p.fromB2 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-weeet-surface/40 text-weeet-primary border border-weeet-dark/40">จาก B2</span>
                    )}
                    {p.code && <span className="text-[10px] text-gray-500 font-mono">{p.code}</span>}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    แท้ ฿{p.price_genuine.toLocaleString()}
                    {p.price_used > 0 && <span> · มือสอง ฿{p.price_used.toLocaleString()}</span>}
                  </p>
                </div>
                {/* qty stepper */}
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => setQty(p.id, -1)} disabled={p.qty <= 1}
                    className="w-7 h-7 rounded-full bg-gray-700 hover:bg-gray-600 text-white disabled:opacity-30 flex items-center justify-center text-sm">−</button>
                  <span className="text-white font-semibold w-5 text-center text-sm">{p.qty}</span>
                  <button onClick={() => setQty(p.id, 1)}
                    className="w-7 h-7 rounded-full bg-gray-700 hover:bg-gray-600 text-white flex items-center justify-center text-sm">+</button>
                  <span className="text-[10px] text-gray-500">{p.unit}</span>
                </div>
              </div>

              {/* 3 status pills (active 1) */}
              <div className="flex gap-2">
                {STOCK_ORDER.map((s) => {
                  const m = PART_STOCK_STATUS_META[s];
                  const active = p.stock === s;
                  return (
                    <button
                      key={s}
                      onClick={() => updatePart(p.id, { stock: s })}
                      className={`flex-1 rounded-lg border px-2 py-1.5 text-left transition-colors ${
                        active ? m.cls : "bg-gray-900 border-gray-700 text-gray-500"
                      }`}
                    >
                      <p className="text-xs font-semibold">{m.icon} {m.label}</p>
                      <p className="text-[10px] opacity-80">{m.sub}</p>
                    </button>
                  );
                })}
              </div>

              {/* worktype chips (multi-select) */}
              <div className="flex flex-wrap gap-1.5">
                {WORKTYPES.map((w) => (
                  <button
                    key={w}
                    onClick={() => toggleWorktype(p.id, w)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                      p.worktypes.includes(w)
                        ? "bg-weeet-surface/50 text-weeet-primary border-weeet-dark"
                        : "bg-gray-900 text-gray-400 border-gray-700"
                    }`}
                  >
                    {p.worktypes.includes(w) ? "✓ " : ""}{REPAIR_WORKTYPE_LABELS[w]}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Section 4 — เพิ่มอะไหล่นอก B2 (mock) */}
        <button
          onClick={() =>
            setParts((prev) => [
              ...prev,
              {
                id: `sp-extra-${prev.length}`,
                name: "อะไหล่เพิ่มเติม",
                fromB2: false,
                price_genuine: 0,
                price_used: 0,
                qty: 1,
                unit: "ชิ้น",
                stock: "NEED_ORDER",
                worktypes: ["replace"],
              },
            ])
          }
          className="w-full border border-dashed border-gray-600 hover:border-weeet-dark text-gray-400 hover:text-weeet-primary rounded-xl py-3 text-sm transition-colors"
        >
          + เพิ่มอะไหล่นอก B2 (ค้นจาก master parts)
        </button>

        {/* Section 5 — ทางเลือก ยก/กลับมา (เฉพาะมี IN_SHOP / NEED_ORDER) */}
        {needsChoice && (
          <div className="space-y-2">
            <div className="bg-amber-950/40 border border-amber-800/60 rounded-xl px-4 py-2.5 text-xs text-amber-300">
              ⚠️ มี {notInVanCount} รายการช่างไม่ได้นำมา → ลูกค้าต้องเลือก 1 ทาง
            </div>
            <button
              onClick={() => setAwaitingChoice("take_back")}
              className={`w-full text-left border-2 rounded-xl p-3 transition-colors ${
                awaitingChoice === "take_back" ? "border-weeet-dark bg-weeet-surface/30" : "border-gray-700 bg-gray-800"
              }`}
            >
              <p className="text-sm font-semibold text-white">🏠 ยกเครื่องกลับร้าน</p>
              <p className="text-xs text-gray-400">ช่างยกไปซ่อม คืนเมื่อเสร็จ (ไม่มีค่าเดินทางเพิ่ม)</p>
            </button>
            <button
              onClick={() => setAwaitingChoice("return_visit")}
              className={`w-full text-left border-2 rounded-xl p-3 transition-colors ${
                awaitingChoice === "return_visit" ? "border-weeet-dark bg-weeet-surface/30" : "border-gray-700 bg-gray-800"
              }`}
            >
              <p className="text-sm font-semibold text-white">🚐 ช่างกลับมาใหม่</p>
              <p className="text-xs text-gray-400">รออะไหล่ ช่างกลับมาซ่อมที่บ้าน · +ค่าเดินทาง + ค่าแรงเดินทาง</p>
            </button>
          </div>
        )}

        {/* Section 6 — สรุปสำหรับ WeeeR */}
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 space-y-1 text-sm">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">สรุปสำหรับ WeeeR (B2.5)</p>
          <div className="flex justify-between"><span className="text-gray-400">ทั้งหมด</span><span className="text-gray-200">{parts.length}</span></div>
          <div className="flex justify-between"><span className="text-gray-400">🚐 ในรถ / 🏪 ที่ร้าน / 📦 ต้องสั่ง</span><span className="text-gray-200">{counts.IN_VAN} / {counts.IN_SHOP} / {counts.NEED_ORDER}</span></div>
          {needsChoice && (
            <div className="flex justify-between"><span className="text-gray-400">ทางเลือกลูกค้า</span><span className="text-gray-200">{awaitingChoice === "take_back" ? "ยกเครื่องกลับร้าน" : awaitingChoice === "return_visit" ? "ช่างกลับมาใหม่" : "ยังไม่เลือก"}</span></div>
          )}
        </div>
      </div>

      {/* Section 7 — Submit (ตัด OTP) */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-950/95 backdrop-blur-sm border-t border-gray-800 px-4 py-3 z-20">
        {needsChoice && awaitingChoice === null && (
          <p className="text-xs text-amber-400 mb-2 text-center">⚠️ เลือกทางเลือกการดำเนินงานก่อนส่ง</p>
        )}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full bg-weeet-primary hover:bg-weeet-dark disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {submitting ? <><span className="animate-spin">⏳</span> กำลังส่ง...</> : "ส่งให้ร้านทำ B2.5"}
        </button>
      </div>
    </div>
  );
}
