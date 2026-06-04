"use client";
import { use, useState } from "react";
import { useRouter } from "next/navigation";

// Mockup-only — state-based, no backend calls.
// T-10 "SCRAP-S8-MISMATCH" — ของไม่ตรงประกาศ

const MAX_PHOTOS = 5;

type MismatchState = "pending" | "repriced" | "rejected";

const STATE_TABS: { key: MismatchState; label: string }[] = [
  { key: "pending", label: "รอตัดสิน" },
  { key: "repriced", label: "ปรับราคาแล้ว" },
  { key: "rejected", label: "ปฏิเสธรับซาก" },
];

const MISMATCH_OPTIONS: { key: string; label: string }[] = [
  { key: "condition", label: "สภาพไม่ตรง (เสียหาย/ชำรุดกว่าที่ประกาศ)" },
  { key: "model", label: "รุ่น/ยี่ห้อไม่ตรง" },
  { key: "quantity", label: "จำนวนไม่ตรง" },
  { key: "other", label: "อื่นๆ" },
];

// Mock photo placeholders — some intentionally "broken" to demo onError-hide
const MOCK_PHOTOS = [
  { id: 1, src: "/mock/scrap-actual-1.jpg" },
  { id: 2, src: "/mock/scrap-actual-2.jpg" },
  { id: 3, src: "/broken-image-demo.jpg" },
];

export default function JobMismatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [state, setState] = useState<MismatchState>("pending");
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [note, setNote] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [photos] = useState(MOCK_PHOTOS);

  const toggle = (key: string) => setChecks((c) => ({ ...c, [key]: !c[key] }));
  const anyChecked = Object.values(checks).some(Boolean);
  const selectedLabels = MISMATCH_OPTIONS.filter((o) => checks[o.key]).map((o) => o.label);

  const handleReprice = () => {
    if (!anyChecked || !newPrice) return;
    setState("repriced");
  };
  const handleReject = () => {
    if (!anyChecked) return;
    setState("rejected");
  };

  const fmtBaht = (v: string) =>
    v ? `${Number(v).toLocaleString("th-TH")} บาท` : "—";

  return (
    <div className="pb-6">
      {/* Sticky header */}
      <div className="sticky top-0 bg-gray-950/90 backdrop-blur-sm border-b border-gray-800 px-4 py-3 flex items-center gap-3 z-10">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-white text-lg">←</button>
        <div>
          <h1 className="font-bold text-white">T-10 — ของไม่ตรงประกาศ</h1>
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
        {/* PENDING — form */}
        {state === "pending" && (
          <>
            <div className="bg-amber-950/30 border border-amber-800/50 rounded-xl px-4 py-3 text-xs text-amber-300">
              ⚠️ ซากจริงไม่ตรงกับที่ลูกค้าประกาศ — ระบุความไม่ตรง แนบหลักฐาน แล้วเลือกแนวทาง
            </div>

            {/* What mismatches — checklist */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-white">📋 อะไรไม่ตรง <span className="text-red-400">*</span></label>
              {MISMATCH_OPTIONS.map((o) => (
                <button
                  key={o.key}
                  onClick={() => toggle(o.key)}
                  className={`w-full text-left flex items-center gap-3 border rounded-xl px-4 py-3 transition-colors ${
                    checks[o.key] ? "border-weeet-primary bg-weeet-primary/10" : "border-gray-700 bg-gray-800 hover:border-gray-500"
                  }`}
                >
                  <span className={`w-5 h-5 rounded flex items-center justify-center text-xs border ${
                    checks[o.key] ? "bg-weeet-primary border-weeet-primary text-white" : "border-gray-500 text-transparent"
                  }`}>✓</span>
                  <span className="text-sm text-white">{o.label}</span>
                </button>
              ))}
            </div>

            {/* Photo evidence — mock upload */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-white">📸 หลักฐานรูปถ่าย</label>
                <span className="text-xs text-gray-400">{photos.length}/{MAX_PHOTOS} รูป</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {photos.map((p) => (
                  <div key={p.id} className="relative aspect-square bg-gray-800 rounded-lg overflow-hidden border border-gray-600 flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.src}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                    />
                    {/* Fallback shown when img hidden on error */}
                    <span className="absolute text-2xl text-gray-600 pointer-events-none">🖼️</span>
                  </div>
                ))}
                {photos.length < MAX_PHOTOS && (
                  <button
                    className="aspect-square bg-gray-800 border border-dashed border-gray-600 hover:border-weeet-primary rounded-lg flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-weeet-primary transition-colors"
                  >
                    <span className="text-2xl">📷</span>
                    <span className="text-xs">เพิ่มรูป</span>
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500">แนบได้สูงสุด {MAX_PHOTOS} รูป · รูปที่โหลดไม่ขึ้นจะถูกซ่อนอัตโนมัติ</p>
            </div>

            {/* Note */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-white">📝 หมายเหตุ</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="อธิบายความไม่ตรงที่พบ ณ จุดรับซาก..."
                rows={4}
                className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-weeet-primary resize-none"
              />
            </div>

            {/* Choice: reprice */}
            <div className="space-y-3 bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-sm font-semibold text-white">เลือกแนวทาง</p>

              <div className="space-y-2">
                <label className="text-xs text-gray-300">เสนอราคาใหม่ (พอยต์ทอง / Gold Point)</label>
                <input
                  type="number"
                  min="0"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  placeholder="0"
                  className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-weeet-primary"
                />
                <button
                  onClick={handleReprice}
                  disabled={!anyChecked || !newPrice}
                  className="w-full bg-weeet-primary hover:bg-weeet-dark disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
                >
                  💰 ปรับราคาใหม่
                </button>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-gray-800" />
                <span className="text-xs text-gray-600">หรือ</span>
                <div className="flex-1 h-px bg-gray-800" />
              </div>

              <button
                onClick={handleReject}
                disabled={!anyChecked}
                className="w-full bg-red-950/40 hover:bg-red-950/60 border border-red-800/60 disabled:opacity-40 disabled:cursor-not-allowed text-red-300 font-semibold py-3 rounded-xl transition-colors"
              >
                🚫 ปฏิเสธรับซาก → เข้ากระบวนการตรวจข้อตกลง
              </button>
              {!anyChecked && (
                <p className="text-xs text-amber-400">⚠️ เลือกรายการที่ไม่ตรงอย่างน้อย 1 ข้อก่อน</p>
              )}
            </div>
          </>
        )}

        {/* REPRICED — summary */}
        {state === "repriced" && (
          <>
            <div className="flex flex-col items-center text-center gap-2 bg-green-950/30 border border-green-800/50 rounded-xl px-4 py-6">
              <span className="text-4xl">💰</span>
              <p className="text-lg font-bold text-green-300">เสนอราคาใหม่แล้ว</p>
              <p className="text-xs text-green-200/70">ส่งราคาที่ปรับให้ลูกค้าพิจารณา รอการตอบรับ</p>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl divide-y divide-gray-800">
              <Row label="📋 ความไม่ตรง" value={selectedLabels.length ? selectedLabels.join(", ") : "สภาพไม่ตรง"} />
              <Row
                label="💰 ราคาใหม่ที่เสนอ"
                value={fmtBaht(newPrice || "0")}
                valueClass="text-green-300 font-semibold"
              />
              <div className="px-4 py-3">
                <p className="text-xs text-gray-500 mb-1">📝 หมายเหตุ</p>
                <p className="text-sm text-gray-200">{note.trim() || "ซากมีสภาพต่ำกว่าที่ประกาศ จึงปรับราคาตามจริง"}</p>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => router.push(`/jobs/${id}`)}
                className="w-full bg-weeet-primary hover:bg-weeet-dark text-white font-semibold py-3.5 rounded-xl transition-colors"
              >
                กลับไปหน้างาน
              </button>
              <button
                onClick={() => setState("pending")}
                className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-600 text-gray-300 font-medium py-3 rounded-xl transition-colors"
              >
                ✏️ แก้ไขรายงาน
              </button>
            </div>
          </>
        )}

        {/* REJECTED — summary, routed to agreement check */}
        {state === "rejected" && (
          <>
            <div className="flex flex-col items-center text-center gap-2 bg-red-950/30 border border-red-800/50 rounded-xl px-4 py-6">
              <span className="text-4xl">🚫</span>
              <p className="text-lg font-bold text-red-300">ปฏิเสธรับซาก</p>
              <p className="text-xs text-red-200/70">ส่งเรื่องเข้ากระบวนการตรวจข้อตกลง (Dispute) แล้ว</p>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl divide-y divide-gray-800">
              <Row label="📋 ความไม่ตรง" value={selectedLabels.length ? selectedLabels.join(", ") : "สภาพไม่ตรง"} />
              <Row label="📌 สถานะ" value="เข้ากระบวนการตรวจข้อตกลง" valueClass="text-red-300 font-semibold" />
              <div className="px-4 py-3">
                <p className="text-xs text-gray-500 mb-1">📝 หมายเหตุ</p>
                <p className="text-sm text-gray-200">{note.trim() || "ซากไม่ตรงประกาศอย่างมีนัยสำคัญ ไม่สามารถรับได้"}</p>
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 space-y-1.5">
              <p className="text-xs font-semibold text-gray-300">ขั้นตอนถัดไป</p>
              <p className="text-xs text-gray-400">1. ทีมตรวจสอบข้อตกลงรับเรื่อง</p>
              <p className="text-xs text-gray-400">2. ตัดสินผลและคืนสถานะให้ทุกฝ่าย (เงินผ่านระบบพักเงินกลาง (Escrow))</p>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => router.push(`/jobs/${id}`)}
                className="w-full bg-weeet-primary hover:bg-weeet-dark text-white font-semibold py-3.5 rounded-xl transition-colors"
              >
                กลับไปหน้างาน
              </button>
              <button
                onClick={() => setState("pending")}
                className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-600 text-gray-300 font-medium py-3 rounded-xl transition-colors"
              >
                ✏️ แก้ไขรายงาน
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, valueClass = "text-white" }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 gap-4">
      <span className="text-xs text-gray-500 shrink-0">{label}</span>
      <span className={`text-sm text-right ${valueClass}`}>{value}</span>
    </div>
  );
}
