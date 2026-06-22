"use client";
// WeeeT — B3 ใบตรวจสอบงานซ่อมก่อนซ่อม (Pre-repair Checklist · 7 sections) — REP-C05
// SoT Gen 55 · B3 v4 RECONCILED Gen 58 · ตัดลายเซ็น/OTP (อยู่ B4)
// จุดเข้า: /jobs/[id]/checklist (หลัง B2 estimate ก่อน B3.5 parts-picker)
// Phase D-6 mockup · state local · WeeeR/WeeeU รับทราบ real-time (mock acknowledge state)
// TODO backend: POST /api/v1/repair/jobs/:id/checklist/ → state checklist_submitted
import { use, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MockAnno } from "@/components/MockAnno";
import {
  B3_BASIC_INSPECTION,
  B3_ELECTRICAL_MEASURES,
  B3_PARTS_TEMPLATES,
  B3_DECISION_LABELS,
  type B3CheckState,
  type B3Decision,
  type B3InspectItem,
  type B3Acknowledge,
} from "@/lib/types";
import { SEED_B1_SYMPTOMS } from "@/lib/mock-data/repair-bforms";

const MIN_PHOTOS = 3;
const MAX_PHOTOS = 5;
const MAX_PHOTO_MB = 3;

type PhotoEntry = { file: File; previewUrl: string };

// mock appliance — auto จาก B1 (เลือก template ตามประเภทเครื่อง)
const APPLIANCE = "แอร์";

function StateToggle({
  state,
  onChange,
}: {
  state: B3CheckState;
  onChange: (s: B3CheckState) => void;
}) {
  return (
    <div className="flex gap-1.5 shrink-0">
      {(["ok", "abnormal"] as B3CheckState[]).map((s) => (
        <button
          key={s}
          onClick={() => onChange(s)}
          className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
            state === s
              ? s === "ok"
                ? "bg-green-900/50 text-green-300 border-green-600"
                : "bg-red-900/50 text-red-300 border-red-600"
              : "bg-gray-900 text-gray-400 border-gray-700"
          }`}
        >
          {s === "ok" ? "ปกติ" : "ไม่ปกติ"}
        </button>
      ))}
    </div>
  );
}

export default function B3ChecklistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const photoRef = useRef<HTMLInputElement>(null);

  // section 2 — ตรวจสอบเบื้องต้น
  const [basic, setBasic] = useState<B3InspectItem[]>(
    B3_BASIC_INSPECTION.map((label) => ({ label, state: "unset" as B3CheckState })),
  );
  // section 3 — ระบุอาการเสีย (textarea)
  const [symptomText, setSymptomText] = useState("");
  // section 4 — ตรวจวัดค่าทางไฟฟ้า
  const [electrical, setElectrical] = useState<B3InspectItem[]>(
    B3_ELECTRICAL_MEASURES.map((m) => ({ label: m.label, std: m.std, state: "unset" as B3CheckState })),
  );
  // section 5 — ตรวจสอบชิ้นส่วน (template per appliance)
  const partsTemplate = B3_PARTS_TEMPLATES[APPLIANCE] ?? B3_PARTS_TEMPLATES["อื่นๆ"];
  const [partsCheck, setPartsCheck] = useState<B3InspectItem[]>(
    partsTemplate.map((label) => ({ label, state: "unset" as B3CheckState })),
  );
  // section 6 — สรุปผล + decision
  const [summary, setSummary] = useState("");
  const [decision, setDecision] = useState<B3Decision | null>(null);
  // section 7 — รูป
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [sizeError, setSizeError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  // mock real-time acknowledge จาก WeeeR/WeeeU
  const [acks, setAcks] = useState<B3Acknowledge[]>([
    { role: "weeer", acknowledged: false },
    { role: "weeeu", acknowledged: false },
  ]);

  const setItem = (
    setter: React.Dispatch<React.SetStateAction<B3InspectItem[]>>,
    i: number,
    patch: Partial<B3InspectItem>,
  ) => setter((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));

  const addPhotos = (files: FileList | null) => {
    if (!files) return;
    setSizeError(null);
    const toAdd: PhotoEntry[] = [];
    for (const file of Array.from(files)) {
      if (file.size > MAX_PHOTO_MB * 1024 * 1024) { setSizeError(`${file.name} ใหญ่เกิน ${MAX_PHOTO_MB}MB`); continue; }
      if (photos.length + toAdd.length >= MAX_PHOTOS) break;
      toAdd.push({ file, previewUrl: URL.createObjectURL(file) });
    }
    setPhotos((prev) => [...prev, ...toAdd]);
  };
  const removePhoto = (i: number) =>
    setPhotos((p) => { URL.revokeObjectURL(p[i].previewUrl); return p.filter((_, idx) => idx !== i); });

  // ครบ: ทุก section ตรวจครบ + สรุป + เลือก decision + รูป ≥3
  const basicDone = basic.every((it) => it.state !== "unset");
  const elecDone = electrical.every((it) => it.state !== "unset");
  const partsDone = partsCheck.every((it) => it.state !== "unset");
  const canSubmit =
    basicDone && elecDone && partsDone && summary.trim() !== "" && decision !== null &&
    photos.length >= MIN_PHOTOS && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 900)); // mockup — TODO backend
    setSubmitting(false);
    setSubmitted(true);
    // mock real-time: R/U ทยอยกดรับทราบ
    setTimeout(() => setAcks((a) => a.map((x) => x.role === "weeer" ? { ...x, acknowledged: true, at: new Date().toISOString() } : x)), 1500);
    setTimeout(() => setAcks((a) => a.map((x) => x.role === "weeeu" ? { ...x, acknowledged: true, at: new Date().toISOString() } : x)), 3200);
  };

  // ── Submitted view — แสดง acknowledge real-time ──
  if (submitted) {
    const next =
      decision === "repairable" ? `/jobs/${id}/parts-picker`
      : decision === "scrap_offer" ? `/jobs/${id}/scrap-offer`
      : `/jobs/${id}/diagnose`;
    return (
      <div className="pb-6 px-4 pt-6 space-y-5">
        <div className="text-center space-y-2">
          <p className="text-5xl">📋</p>
          <p className="font-bold text-white text-lg">ส่งใบตรวจก่อนซ่อมแล้ว</p>
          <p className="text-sm text-gray-400">ผลตรวจ: {B3_DECISION_LABELS[decision!]}</p>
        </div>

        {/* Real-time acknowledge */}
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 space-y-3">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">การรับทราบ (real-time)</p>
          {acks.map((a) => (
            <div key={a.role} className="flex items-center justify-between text-sm">
              <span className="text-gray-200">{a.role === "weeer" ? "🏪 ร้าน (WeeeR)" : "👤 ลูกค้า (WeeeU)"}</span>
              {a.acknowledged ? (
                <span className="text-xs px-2.5 py-1 rounded-full bg-green-900/50 text-green-300 border border-green-600">✓ รับทราบแล้ว</span>
              ) : (
                <span className="text-xs px-2.5 py-1 rounded-full bg-gray-900 text-gray-400 border border-gray-700 flex items-center gap-1">
                  <span className="animate-pulse">●</span> รอรับทราบ...
                </span>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={() => router.push(next)}
          className="w-full bg-weeet-primary hover:bg-weeet-dark text-white font-semibold py-3.5 rounded-xl transition-colors"
        >
          {decision === "repairable" ? "ไปต่อ → ระบุอะไหล่ (B3.5)" : "ดำเนินการต่อ →"}
        </button>
      </div>
    );
  }

  return (
    <div className="pb-28">
      <MockAnno
        origin="B2 ประเมิน /jobs/[id]/estimate"
        nav="B3.5 ระบุอะไหล่ /jobs/[id]/parts-picker"
        xapp="→ WeeeR อ่าน+comment · WeeeU อ่าน+รับทราบ (real-time)"
      />
      <div className="sticky top-0 bg-gray-950/90 backdrop-blur-sm border-b border-gray-800 px-4 py-3 flex items-center gap-3 z-10">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-white text-lg">←</button>
        <div>
          <h1 className="font-bold text-white">B3 — ใบตรวจก่อนซ่อม</h1>
          <p className="text-xs text-gray-400">7 ส่วน · ร้าน/ลูกค้าเห็น real-time</p>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-6">
        {/* Section 1 — ข้อมูลสินค้า (auto จาก B1) */}
        <section className="space-y-2">
          <h2 className="text-sm font-bold text-weeet-primary">1. ข้อมูลสินค้า</h2>
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 text-sm space-y-1">
            <p className="text-white font-semibold">เครื่องปรับอากาศ Daikin · รุ่น FTKC18</p>
            <p className="text-gray-400 text-xs">S/N: DK-2024-88123 · ประกัน: หมดอายุ · คิว #{id}</p>
            <p className="text-gray-400 text-xs">ช่าง: สมชาย มั่นคง · ร้าน FixPro Service</p>
          </div>
        </section>

        {/* Section 2 — ตรวจสอบเบื้องต้น */}
        <section className="space-y-2">
          <h2 className="text-sm font-bold text-weeet-primary">2. ตรวจสอบเบื้องต้น</h2>
          {basic.map((it, i) => (
            <div key={it.label} className="bg-gray-800 border border-gray-700 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-gray-200 flex-1">{it.label}</span>
                <StateToggle state={it.state} onChange={(s) => setItem(setBasic, i, { state: s })} />
              </div>
              {it.state === "abnormal" && (
                <input
                  value={it.note ?? ""} onChange={(e) => setItem(setBasic, i, { note: e.target.value })}
                  placeholder="หมายเหตุ"
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-weeet-dark"
                />
              )}
            </div>
          ))}
        </section>

        {/* Section 3 — ระบุอาการเสีย */}
        <section className="space-y-2">
          <h2 className="text-sm font-bold text-weeet-primary">3. ระบุอาการเสีย</h2>
          <p className="text-[11px] text-gray-500">อ้างอิงอาการลูกค้า: {SEED_B1_SYMPTOMS.join(" · ")}</p>
          <textarea
            value={symptomText} onChange={(e) => setSymptomText(e.target.value)}
            placeholder="อธิบายอาการเสียที่ตรวจพบ..." rows={3}
            className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-weeet-dark resize-none"
          />
        </section>

        {/* Section 4 — ตรวจวัดค่าทางไฟฟ้า */}
        <section className="space-y-2">
          <h2 className="text-sm font-bold text-weeet-primary">4. ตรวจวัดค่าทางไฟฟ้า</h2>
          {electrical.map((it, i) => (
            <div key={it.label} className="bg-gray-800 border border-gray-700 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1">
                  <p className="text-sm text-gray-200">{it.label}</p>
                  <p className="text-[11px] text-gray-500">มาตรฐาน: {it.std}</p>
                </div>
                <StateToggle state={it.state} onChange={(s) => setItem(setElectrical, i, { state: s })} />
              </div>
              <input
                value={it.note ?? ""} onChange={(e) => setItem(setElectrical, i, { note: e.target.value })}
                placeholder="ค่าที่วัดได้"
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-weeet-dark"
              />
            </div>
          ))}
        </section>

        {/* Section 5 — ตรวจสอบชิ้นส่วน (template per appliance) */}
        <section className="space-y-2">
          <h2 className="text-sm font-bold text-weeet-primary">5. ตรวจสอบชิ้นส่วน <span className="text-gray-500 font-normal text-xs">({APPLIANCE} · {partsTemplate.length} รายการ)</span></h2>
          {partsCheck.map((it, i) => (
            <div key={it.label} className="bg-gray-800 border border-gray-700 rounded-xl p-3 flex items-center justify-between gap-2">
              <span className="text-sm text-gray-200 flex-1">{it.label}</span>
              <StateToggle state={it.state} onChange={(s) => setItem(setPartsCheck, i, { state: s })} />
            </div>
          ))}
        </section>

        {/* Section 6 — สรุปผล + 3 ทางเลือก */}
        <section className="space-y-2">
          <h2 className="text-sm font-bold text-weeet-primary">6. สรุปผล + ทางเลือก</h2>
          <textarea
            value={summary} onChange={(e) => setSummary(e.target.value)}
            placeholder="สรุปผลตรวจ..." rows={3}
            className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-weeet-dark resize-none"
          />
          <div className="grid grid-cols-1 gap-2">
            {(["repairable", "scrap_offer", "decline"] as B3Decision[]).map((d) => (
              <button
                key={d}
                onClick={() => setDecision(d)}
                className={`text-left border-2 rounded-xl p-3 text-sm font-semibold transition-colors ${
                  decision === d
                    ? d === "repairable" ? "border-green-600 bg-green-950/40 text-green-300"
                    : d === "scrap_offer" ? "border-amber-600 bg-amber-950/40 text-amber-300"
                    : "border-red-600 bg-red-950/40 text-red-300"
                    : "border-gray-700 bg-gray-800 text-gray-300"
                }`}
              >
                {B3_DECISION_LABELS[d]}
              </button>
            ))}
          </div>
        </section>

        {/* Section 7 — รูป+คลิป สภาพก่อนซ่อม */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-weeet-primary">7. รูปสภาพก่อนซ่อม <span className="text-red-400">*</span></h2>
            <span className="text-xs text-gray-400">{photos.length}/{MAX_PHOTOS}</span>
          </div>
          <input ref={photoRef} type="file" accept="image/*" multiple capture="environment" className="hidden" onChange={(e) => addPhotos(e.target.files)} />
          <div className="grid grid-cols-3 gap-2">
            {photos.map((p, i) => (
              <div key={i} className="relative aspect-square bg-gray-800 rounded-lg overflow-hidden border border-gray-600">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.previewUrl} alt="" className="w-full h-full object-cover" />
                <button onClick={() => removePhoto(i)} className="absolute top-1 right-1 bg-black/70 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">✕</button>
              </div>
            ))}
            {photos.length < MAX_PHOTOS && (
              <button onClick={() => photoRef.current?.click()}
                className="aspect-square bg-gray-800 border border-dashed border-gray-600 hover:border-weeet-dark rounded-lg flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-weeet-primary transition-colors">
                <span className="text-2xl">📷</span><span className="text-xs">เพิ่มรูป</span>
              </button>
            )}
          </div>
          {photos.length < MIN_PHOTOS && <p className="text-xs text-amber-400">⚠️ ต้องการอีก {MIN_PHOTOS - photos.length} รูป (รวม 3-5 รูป)</p>}
          {sizeError && <p className="text-amber-400 text-xs">⚠️ {sizeError}</p>}
        </section>
      </div>

      {/* Sticky submit */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-950/95 backdrop-blur-sm border-t border-gray-800 px-4 py-3 z-20">
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full bg-weeet-primary hover:bg-weeet-dark disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {submitting ? <><span className="animate-spin">⏳</span> กำลังส่ง...</> : "ส่งใบตรวจก่อนซ่อม (B3)"}
        </button>
      </div>
    </div>
  );
}
