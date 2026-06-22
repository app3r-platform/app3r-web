"use client";
import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { SEED_AWAITING_PARTS_PRICING } from "@/lib/mock-data/repair-bforms";

// Mockup-only — state-based, no backend calls.
// T-05 "REPAIR-C3-SCHEDULE" — รออะไหล่ / นัดหมายใหม่
// REP-C08: awaiting_parts binary choice — ช่างถามลูกค้าหน้างาน 2 ทาง (ราคา WeeeR ตั้ง):
//   (a) ยกเครื่องกลับร้าน  (b) ช่างกลับมาใหม่ + ค่าเดินทาง. เลือก return_visit → ฟอร์มนัดหมายใหม่.

type ScheduleState = "draft" | "awaiting" | "confirmed";

// REP-C08 — 2 ทางเลือก awaiting_parts (per-option price จาก WeeeR seed)
type AwaitingOption = "take_back" | "return_visit";
const AWAITING_OPTIONS: { key: AwaitingOption; icon: string; title: string; desc: string }[] = [
  { key: "take_back", icon: "🏠", title: "ยกเครื่องกลับร้าน", desc: "ช่างยกเครื่องไปซ่อมที่ร้าน นำกลับมาคืนเมื่อเสร็จ" },
  { key: "return_visit", icon: "🚐", title: "ช่างกลับมาใหม่ + ค่าเดินทาง", desc: "รออะไหล่พร้อม ช่างเดินทางกลับมาซ่อมที่บ้านอีกครั้ง" },
];

const STATE_TABS: { key: ScheduleState; label: string }[] = [
  { key: "draft", label: "ฟอร์มนัดหมาย" },
  { key: "awaiting", label: "รอยืนยันนัด" },
  { key: "confirmed", label: "ลูกค้ายืนยันแล้ว" },
];

export default function JobSchedulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [state, setState] = useState<ScheduleState>("draft");
  // REP-C08 — ทางเลือกที่ลูกค้าเลือกหน้างาน (null = ยังไม่เลือก)
  const [awaitingChoice, setAwaitingChoice] = useState<AwaitingOption | null>(null);
  const [partName, setPartName] = useState("");
  const [readyDate, setReadyDate] = useState("");
  const [apptDate, setApptDate] = useState("");
  const [apptTime, setApptTime] = useState("");
  const [note, setNote] = useState("");

  // นัดหมายใหม่บังคับเฉพาะ return_visit (ช่างกลับมา); take_back ไม่ต้องนัด (ยกกลับร้านเลย)
  const needsAppointment = awaitingChoice === "return_visit";
  const canSubmit =
    awaitingChoice !== null &&
    partName.trim() &&
    readyDate &&
    (!needsAppointment || (apptDate && apptTime));

  const handleSubmit = () => {
    if (!canSubmit) return;
    // mock — move to awaiting-confirmation state
    setState("awaiting");
  };

  const fmtDate = (d: string) =>
    d ? new Date(d + "T00:00:00").toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" }) : "—";

  // Fallbacks so the awaiting/confirmed panels are always reviewable
  const sChoice: AwaitingOption = awaitingChoice ?? "return_visit";
  const sChoiceMeta = AWAITING_OPTIONS.find((o) => o.key === sChoice)!;
  const sChoicePrice = SEED_AWAITING_PARTS_PRICING[sChoice].price;
  const sPart = partName.trim() || "คอมเพรสเซอร์ตู้เย็น (รุ่น A-200)";
  const sReady = readyDate || "2026-06-10";
  const sApptDate = apptDate || "2026-06-12";
  const sApptTime = apptTime || "14:00";
  const sNote = note.trim() || "ขออะไหล่จากศูนย์ก่อน คาดว่าพร้อมซ่อมตามวันที่นัดใหม่";

  return (
    <div className="pb-6">
      {/* Sticky header */}
      <div className="sticky top-0 bg-gray-950/90 backdrop-blur-sm border-b border-gray-800 px-4 py-3 flex items-center gap-3 z-10">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-white text-lg">←</button>
        <div>
          <h1 className="font-bold text-white">T-05 — รออะไหล่ / นัดหมายใหม่</h1>
          <p className="text-xs text-gray-400">งาน #{id}</p>
        </div>
      </div>

      {/* State toggles (mockup review) */}
      <div className="px-4 pt-3">
        <div className="flex gap-1.5 bg-gray-900 border border-gray-800 rounded-xl p-1">
          {STATE_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setState(t.key)}
              className={`flex-1 text-xs font-medium py-2 rounded-lg transition-colors ${
                state === t.key ? "bg-weeet-primary text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4 space-y-5">
        {/* DRAFT — form */}
        {state === "draft" && (
          <>
            <div className="bg-amber-950/30 border border-amber-800/50 rounded-xl px-4 py-3 text-xs text-amber-300">
              🔧 ต้องสั่งอะไหล่เพิ่ม (รออะไหล่) — ถามลูกค้าหน้างานเลือก 1 ทาง แล้วกรอกรายละเอียด
            </div>

            {/* REP-C08 — binary choice + per-option price (ราคา WeeeR ตั้ง) */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-white">🙋 ลูกค้าเลือกวิธีดำเนินการ <span className="text-red-400">*</span></label>
              {AWAITING_OPTIONS.map((opt) => {
                const price = SEED_AWAITING_PARTS_PRICING[opt.key].price;
                const priceNote = SEED_AWAITING_PARTS_PRICING[opt.key].note;
                const active = awaitingChoice === opt.key;
                return (
                  <button
                    key={opt.key}
                    onClick={() => setAwaitingChoice(opt.key)}
                    className={`w-full text-left border-2 rounded-xl p-3 flex items-start gap-3 transition-colors ${
                      active ? "border-weeet-dark bg-weeet-surface/20" : "border-gray-700 bg-gray-800"
                    }`}
                  >
                    <span className="text-xl">{opt.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-white">{opt.title}</p>
                        <span className={`text-sm font-semibold shrink-0 ${price > 0 ? "text-weeet-primary" : "text-gray-400"}`}>
                          {price > 0 ? `+฿${price.toLocaleString()}` : "ฟรี"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">{opt.desc}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">{priceNote}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-white">🧩 อะไหล่ที่ต้องใช้ <span className="text-red-400">*</span></label>
              <input
                value={partName}
                onChange={(e) => setPartName(e.target.value)}
                placeholder="เช่น คอมเพรสเซอร์ตู้เย็น (รุ่น A-200)"
                className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-weeet-primary"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-white">📦 คาดว่าอะไหล่พร้อม <span className="text-red-400">*</span></label>
              <input
                type="date"
                value={readyDate}
                onChange={(e) => setReadyDate(e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-weeet-primary"
              />
            </div>

            {/* นัดหมายใหม่เฉพาะ return_visit — take_back ยกกลับร้านไม่ต้องนัด */}
            {needsAppointment && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-white">📅 เสนอวันนัดหมายใหม่ <span className="text-red-400">*</span></label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={apptDate}
                    onChange={(e) => setApptDate(e.target.value)}
                    className="flex-1 bg-gray-800 border border-gray-600 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-weeet-primary"
                  />
                  <input
                    type="time"
                    value={apptTime}
                    onChange={(e) => setApptTime(e.target.value)}
                    className="w-32 bg-gray-800 border border-gray-600 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-weeet-primary"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-semibold text-white">📝 ข้อความถึงลูกค้า</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="อธิบายเหตุผลที่ต้องเลื่อนนัด และยืนยันวันใหม่..."
                rows={4}
                className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-weeet-primary resize-none"
              />
            </div>

            {awaitingChoice === null && (
              <p className="text-xs text-amber-400 text-center">⚠️ เลือกวิธีดำเนินการกับลูกค้าก่อน</p>
            )}
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="w-full bg-weeet-primary hover:bg-weeet-dark disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {awaitingChoice === "take_back" ? "📨 ส่งคำขอยกเครื่องกลับร้าน" : "📨 ส่งคำขอนัดหมายใหม่"}
            </button>
          </>
        )}

        {/* AWAITING — sent, waiting for customer */}
        {state === "awaiting" && (
          <>
            <div className="flex items-center gap-3 bg-yellow-950/30 border border-yellow-800/50 rounded-xl px-4 py-3">
              <span className="text-2xl">⏳</span>
              <div>
                <p className="text-sm font-semibold text-yellow-300">รอลูกค้ายืนยัน</p>
                <p className="text-xs text-yellow-200/70">
                  ส่งคำขอ ({sChoiceMeta.title}) ให้ลูกค้าแล้ว
                </p>
              </div>
            </div>

            <SummaryPanel
              choiceLabel={sChoiceMeta.title}
              choiceIcon={sChoiceMeta.icon}
              choicePrice={sChoicePrice}
              part={sPart}
              ready={fmtDate(sReady)}
              apptDate={fmtDate(sApptDate)}
              apptTime={sApptTime}
              note={sNote}
              showAppt={sChoice === "return_visit"}
            />

            <div className="space-y-2">
              <button
                onClick={() => setState("confirmed")}
                className="w-full bg-weeet-primary hover:bg-weeet-dark text-white font-semibold py-3 rounded-xl transition-colors"
              >
                ✅ (จำลอง) ลูกค้ายืนยันนัดแล้ว
              </button>
              <button
                onClick={() => setState("draft")}
                className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-600 text-gray-300 font-medium py-3 rounded-xl transition-colors"
              >
                ✏️ แก้ไขคำขอ
              </button>
            </div>
          </>
        )}

        {/* CONFIRMED — success summary, never dead-end */}
        {state === "confirmed" && (
          <>
            <div className="flex flex-col items-center text-center gap-2 bg-green-950/30 border border-green-800/50 rounded-xl px-4 py-6">
              <span className="text-4xl">✅</span>
              <p className="text-lg font-bold text-green-300">ลูกค้ายืนยันนัดหมายแล้ว</p>
              <p className="text-xs text-green-200/70">งานถูกเลื่อนไปนัดใหม่เรียบร้อย รออะไหล่พร้อมแล้วเข้าซ่อมตามวันนัด</p>
            </div>

            <SummaryPanel
              choiceLabel={sChoiceMeta.title}
              choiceIcon={sChoiceMeta.icon}
              choicePrice={sChoicePrice}
              part={sPart}
              ready={fmtDate(sReady)}
              apptDate={fmtDate(sApptDate)}
              apptTime={sApptTime}
              note={sNote}
              showAppt={sChoice === "return_visit"}
              confirmed
            />

            <div className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 space-y-1.5">
              <p className="text-xs font-semibold text-gray-300">ขั้นตอนถัดไป</p>
              <p className="text-xs text-gray-400">1. ติดตามสถานะอะไหล่จนพร้อม</p>
              <p className="text-xs text-gray-400">
                2. {sChoice === "take_back" ? "ยกเครื่องกลับร้าน ซ่อมแล้วนำมาคืน" : "เข้าซ่อมตามวันนัดใหม่"}
              </p>
            </div>

            <button
              onClick={() => router.push(`/jobs/${id}`)}
              className="w-full bg-weeet-primary hover:bg-weeet-dark text-white font-semibold py-3.5 rounded-xl transition-colors"
            >
              กลับไปหน้างาน
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function SummaryPanel({
  choiceLabel, choiceIcon, choicePrice, part, ready, apptDate, apptTime, note, showAppt, confirmed,
}: {
  choiceLabel: string; choiceIcon: string; choicePrice: number;
  part: string; ready: string; apptDate: string; apptTime: string; note: string;
  showAppt: boolean; confirmed?: boolean;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl divide-y divide-gray-800">
      <Row
        label={`${choiceIcon} ทางเลือกลูกค้า`}
        value={`${choiceLabel}${choicePrice > 0 ? ` · +฿${choicePrice.toLocaleString()}` : " · ฟรี"}`}
        valueClass="text-weeet-primary font-semibold"
      />
      <Row label="🧩 อะไหล่ที่ต้องใช้" value={part} />
      <Row label="📦 คาดว่าอะไหล่พร้อม" value={ready} />
      {showAppt && (
        <Row
          label="📅 นัดหมายใหม่"
          value={`${apptDate} · ${apptTime} น.`}
          valueClass={confirmed ? "text-green-300 font-semibold" : "text-white"}
        />
      )}
      <div className="px-4 py-3">
        <p className="text-xs text-gray-500 mb-1">📝 ข้อความถึงลูกค้า</p>
        <p className="text-sm text-gray-200">{note}</p>
      </div>
    </div>
  );
}

function Row({ label, value, valueClass = "text-white" }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-xs text-gray-500">{label}</span>
      <span className={`text-sm ${valueClass}`}>{value}</span>
    </div>
  );
}
