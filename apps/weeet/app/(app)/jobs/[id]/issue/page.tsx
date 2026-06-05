"use client";
import { use, useState } from "react";
import { useRouter } from "next/navigation";

// Mockup-only — state-based, no backend calls.
// T-09 "MAINTAIN-M4-ISSUE" — รายงานปัญหาเพิ่ม (M7 branch จาก inspect)
// ช่างพบปัญหาเพิ่มระหว่างทำงาน → เสนอค่าใช้จ่ายเพิ่ม (breakdown อะไหล่/ค่าแรง)
// → ส่งให้ลูกค้าพิจารณา (ฝั่งลูกค้ารับที่ U-14 /maintain/jobs/[id]/extra-cost)
// ≠ M5 (defer) — หน้านี้คือ M4 รายงานปัญหา/เสนอราคาเพิ่มเท่านั้น

const MAX_PHOTOS = 5;

type IssueState = "draft" | "submitted";

const STATE_TABS: { key: IssueState; label: string }[] = [
  { key: "draft", label: "กรอกรายงาน" },
  { key: "submitted", label: "ส่งแล้ว · รออนุมัติ" },
];

const ISSUE_OPTIONS: { key: string; label: string }[] = [
  { key: "part", label: "อะไหล่เสื่อม/ชำรุด ต้องเปลี่ยน" },
  { key: "extra_work", label: "งานเพิ่มนอกเหนือที่ประเมินไว้" },
  { key: "hidden", label: "พบความเสียหายซ่อนเร้น" },
  { key: "other", label: "อื่นๆ" },
];

// Mock photo placeholders — some intentionally "broken" to demo onError-hide
const MOCK_PHOTOS = [
  { id: 1, src: "/mock/maintain-issue-1.jpg" },
  { id: 2, src: "/broken-image-demo.jpg" },
];

type ExtraItem = { id: number; label: string; parts: string; labor: string };

export default function JobIssuePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [state, setState] = useState<IssueState>("draft");
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [note, setNote] = useState("");
  const [photos] = useState(MOCK_PHOTOS);

  // ค่าใช้จ่ายเพิ่ม — breakdown ที่ช่างสร้าง (mirror สิ่งที่ U-14 แสดงให้ลูกค้า)
  const [items, setItems] = useState<ExtraItem[]>([]);
  const [draftLabel, setDraftLabel] = useState("");
  const [draftParts, setDraftParts] = useState("");
  const [draftLabor, setDraftLabor] = useState("");
  const [nextId, setNextId] = useState(1);

  const toggle = (key: string) => setChecks((c) => ({ ...c, [key]: !c[key] }));
  const anyChecked = Object.values(checks).some(Boolean);
  const selectedLabels = ISSUE_OPTIONS.filter((o) => checks[o.key]).map((o) => o.label);

  const num = (v: string) => (v ? Math.max(0, Number(v) || 0) : 0);
  const itemTotal = (it: ExtraItem) => num(it.parts) + num(it.labor);
  const extraTotal = items.reduce((s, it) => s + itemTotal(it), 0);

  const canAddItem = draftLabel.trim() !== "" && num(draftParts) + num(draftLabor) > 0;
  const addItem = () => {
    if (!canAddItem) return;
    setItems((prev) => [
      ...prev,
      { id: nextId, label: draftLabel.trim(), parts: draftParts, labor: draftLabor },
    ]);
    setNextId((n) => n + 1);
    setDraftLabel("");
    setDraftParts("");
    setDraftLabor("");
  };
  const removeItem = (itemId: number) => setItems((prev) => prev.filter((it) => it.id !== itemId));

  const canSubmit = anyChecked && items.length > 0;
  const handleSubmit = () => {
    if (canSubmit) setState("submitted");
  };

  const fmtBaht = (v: number) => `${v.toLocaleString("th-TH")} ฿`;

  return (
    <div className="pb-6">
      {/* Sticky header */}
      <div className="sticky top-0 bg-gray-950/90 backdrop-blur-sm border-b border-gray-800 px-4 py-3 flex items-center gap-3 z-10">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-white text-lg">←</button>
        <div>
          <h1 className="font-bold text-white">T-09 — รายงานปัญหาเพิ่ม</h1>
          <p className="text-xs text-gray-400">งาน #{id} · บำรุงรักษา (M4)</p>
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
              🔧 พบปัญหาเพิ่มระหว่างทำงาน — ระบุปัญหา แนบหลักฐาน และเสนอค่าใช้จ่ายเพิ่มเพื่อให้ลูกค้าอนุมัติ
            </div>

            {/* What was found — checklist */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-white">📋 ปัญหาที่พบ <span className="text-red-400">*</span></label>
              {ISSUE_OPTIONS.map((o) => (
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
                  <button className="aspect-square bg-gray-800 border border-dashed border-gray-600 hover:border-weeet-primary rounded-lg flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-weeet-primary transition-colors">
                    <span className="text-2xl">📷</span>
                    <span className="text-xs">เพิ่มรูป</span>
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500">แนบได้สูงสุด {MAX_PHOTOS} รูป · รูปที่โหลดไม่ขึ้นจะถูกซ่อนอัตโนมัติ</p>
            </div>

            {/* Extra-cost builder — breakdown ที่ส่งให้ลูกค้า (U-14) */}
            <div className="space-y-3 bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-sm font-semibold text-white">💰 เสนอค่าใช้จ่ายเพิ่ม <span className="text-red-400">*</span></p>

              {/* existing items */}
              {items.length > 0 && (
                <div className="space-y-2">
                  {items.map((it) => (
                    <div key={it.id} className="flex items-start gap-3 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white">{it.label}</p>
                        <div className="flex gap-3 mt-1 text-xs text-gray-400">
                          {num(it.parts) > 0 && <span>อะไหล่ {fmtBaht(num(it.parts))}</span>}
                          {num(it.labor) > 0 && <span>ค่าแรง {fmtBaht(num(it.labor))}</span>}
                        </div>
                      </div>
                      <span className="text-sm font-medium text-amber-300 shrink-0">{fmtBaht(itemTotal(it))}</span>
                      <button
                        onClick={() => removeItem(it.id)}
                        className="text-gray-500 hover:text-red-400 text-sm shrink-0"
                        aria-label="ลบรายการ"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* add-item sub-form */}
              <div className="space-y-2 border-t border-gray-800 pt-3">
                <input
                  type="text"
                  value={draftLabel}
                  onChange={(e) => setDraftLabel(e.target.value)}
                  placeholder="รายการ เช่น เปลี่ยนแคปาซิเตอร์คอมเพรสเซอร์"
                  className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-weeet-primary"
                />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-400">ค่าอะไหล่ (฿)</label>
                    <input
                      type="number"
                      min="0"
                      value={draftParts}
                      onChange={(e) => setDraftParts(e.target.value)}
                      placeholder="0"
                      className="w-full mt-1 bg-gray-800 border border-gray-600 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-weeet-primary"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">ค่าแรง (฿)</label>
                    <input
                      type="number"
                      min="0"
                      value={draftLabor}
                      onChange={(e) => setDraftLabor(e.target.value)}
                      placeholder="0"
                      className="w-full mt-1 bg-gray-800 border border-gray-600 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-weeet-primary"
                    />
                  </div>
                </div>
                <button
                  onClick={addItem}
                  disabled={!canAddItem}
                  className="w-full border border-dashed border-gray-600 hover:border-weeet-primary disabled:opacity-40 disabled:cursor-not-allowed text-gray-300 hover:text-weeet-primary text-sm py-2.5 rounded-xl transition-colors"
                >
                  ＋ เพิ่มรายการค่าใช้จ่าย
                </button>
              </div>

              {/* running total */}
              <div className="flex justify-between items-center border-t border-gray-800 pt-3">
                <span className="text-sm text-gray-400">ค่าใช้จ่ายเพิ่มรวม</span>
                <span className="text-base font-bold text-weeet-primary">{fmtBaht(extraTotal)}</span>
              </div>
            </div>

            {/* Note */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-white">📝 หมายเหตุถึงลูกค้า</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="อธิบายเหตุผล/ความจำเป็นของงานเพิ่ม..."
                rows={4}
                className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-weeet-primary resize-none"
              />
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="w-full bg-weeet-primary hover:bg-weeet-dark disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-colors"
            >
              📤 ส่งให้ลูกค้าพิจารณา
            </button>
            {!canSubmit && (
              <p className="text-xs text-amber-400 -mt-2">
                ⚠️ เลือกปัญหาที่พบอย่างน้อย 1 ข้อ และเพิ่มรายการค่าใช้จ่ายอย่างน้อย 1 รายการ
              </p>
            )}
          </>
        )}

        {/* SUBMITTED — summary (รออนุมัติจากลูกค้า · U-14) */}
        {state === "submitted" && (
          <>
            <div className="flex flex-col items-center text-center gap-2 bg-green-950/30 border border-green-800/50 rounded-xl px-4 py-6">
              <span className="text-4xl">📤</span>
              <p className="text-lg font-bold text-green-300">ส่งรายงานปัญหาแล้ว</p>
              <p className="text-xs text-green-200/70">ส่งข้อเสนอค่าใช้จ่ายเพิ่มให้ลูกค้าพิจารณา — รอการอนุมัติ</p>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl divide-y divide-gray-800">
              <Row
                label="📋 ปัญหาที่พบ"
                value={selectedLabels.length ? selectedLabels.join(", ") : "อะไหล่เสื่อม/ชำรุด ต้องเปลี่ยน"}
              />
              <Row label="📌 สถานะ" value="รอลูกค้าอนุมัติ" valueClass="text-amber-300 font-semibold" />
            </div>

            {/* Breakdown — mirror U-14 */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">รายละเอียดค่าใช้จ่ายเพิ่ม</p>
              {items.length > 0 ? (
                <div className="space-y-2.5">
                  {items.map((it) => (
                    <div key={it.id} className="border-b border-gray-800 last:border-0 pb-2 last:pb-0">
                      <p className="text-sm text-gray-200">{it.label}</p>
                      <div className="flex gap-3 mt-1 text-xs text-gray-500">
                        {num(it.parts) > 0 && <span>อะไหล่ {fmtBaht(num(it.parts))}</span>}
                        {num(it.labor) > 0 && <span>ค่าแรง {fmtBaht(num(it.labor))}</span>}
                        <span className="ml-auto font-medium text-gray-300">{fmtBaht(itemTotal(it))}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">— ไม่มีรายการ —</p>
              )}
              <div className="flex justify-between text-base font-bold border-t border-gray-800 pt-3">
                <span className="text-gray-200">ค่าใช้จ่ายเพิ่มรวม</span>
                <span className="text-weeet-primary">{fmtBaht(extraTotal)}</span>
              </div>
            </div>

            {note.trim() && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3">
                <p className="text-xs text-gray-500 mb-1">📝 หมายเหตุถึงลูกค้า</p>
                <p className="text-sm text-gray-200">{note.trim()}</p>
              </div>
            )}

            <div className="space-y-2">
              <button
                onClick={() => router.push(`/jobs/${id}`)}
                className="w-full bg-weeet-primary hover:bg-weeet-dark text-white font-semibold py-3.5 rounded-xl transition-colors"
              >
                กลับไปหน้างาน
              </button>
              <button
                onClick={() => setState("draft")}
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
