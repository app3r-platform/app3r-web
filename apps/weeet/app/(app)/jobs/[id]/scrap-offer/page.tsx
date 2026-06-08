"use client";
// 🧪 MOCKUP PAGE — T-06 "เสนอซื้อซากเครื่อง (C4)"
// Mockup-only (no backend). State toggle lets reviewer preview each outcome.
// Escrow direction (C4 scrap): WeeeR pays Gold → WeeeU. POINT-LOCK terminology.
import { use, useState } from "react";
import { useRouter } from "next/navigation";

type OfferState = "pending" | "accepted" | "rejected";

const STATES: { key: OfferState; label: string }[] = [
  { key: "pending", label: "รอยืนยัน" },
  { key: "accepted", label: "ลูกค้ายอมรับ" },
  { key: "rejected", label: "ลูกค้าปฏิเสธ" },
];

export default function ScrapOfferPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  // Form state (mock)
  const [amount, setAmount] = useState("450");
  const [note, setNote] = useState("");
  const [condition, setCondition] = useState(
    "บอร์ดควบคุมเสียหาย คอมเพรสเซอร์ไม่ทำงาน ประเมินแล้วซ่อมไม่คุ้ม"
  );

  // Outcome state — mock toggle so reviewer can see each state
  const [state, setState] = useState<OfferState>("pending");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    // Mock only — just flips to "submitted" then shows pending/lock UI
    setSubmitted(true);
    setState("pending");
  };

  return (
    <div className="pb-10">
      {/* Sticky header */}
      <div className="sticky top-0 bg-gray-950/90 backdrop-blur-sm border-b border-gray-800 px-4 py-3 flex items-center gap-3 z-10">
        <button
          onClick={() => router.back()}
          className="text-gray-400 hover:text-white text-lg"
          aria-label="ย้อนกลับ"
        >
          ←
        </button>
        <h1 className="font-bold text-white">เสนอซื้อซากเครื่อง</h1>
      </div>

      <div className="px-4 pt-4 space-y-5">
        {/* Context banner */}
        <div className="bg-weeet-primary/10 border border-weeet-primary/40 rounded-xl p-4 space-y-1">
          <p className="text-sm font-semibold text-weeet-primary">เสนอซื้อซากเครื่อง (C4)</p>
          <p className="text-xs text-gray-300 leading-relaxed">
            เมื่อประเมินแล้วว่า <span className="text-white font-medium">ซ่อมไม่คุ้ม</span>{" "}
            ช่างสามารถเสนอราคารับซื้อซากเครื่องของลูกค้าได้ 1 ครั้ง
            ลูกค้าจะเป็นผู้ตัดสินใจยอมรับหรือปฏิเสธ
          </p>
          <p className="text-[11px] text-gray-400">งาน #{id}</p>
        </div>

        {/* ─── Mock state toggle (reviewer preview) ─────────────────── */}
        <div className="bg-gray-900 border border-dashed border-gray-600 rounded-xl p-3 space-y-2">
          <p className="text-[11px] text-gray-400 uppercase tracking-wide">
            🧪 ตัวอย่างสถานะ (mock — สำหรับรีวิว)
          </p>
          <div className="flex gap-2">
            {STATES.map((s) => (
              <button
                key={s.key}
                onClick={() => {
                  setState(s.key);
                  setSubmitted(true);
                }}
                className={`flex-1 text-xs py-2 rounded-lg border transition-colors ${
                  submitted && state === s.key
                    ? "bg-weeet-primary border-weeet-primary text-white font-semibold"
                    : "bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-500"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* ─── FORM (shown before/while pending) ────────────────────── */}
        {(!submitted || state === "pending") && (
          <div className="space-y-5">
            {/* Offer amount */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-white">
                ราคาเสนอซื้อ (พอยต์ทอง / Gold Point) <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="w-full bg-gray-800 border border-gray-600 rounded-xl pl-4 pr-24 py-3 text-white text-lg font-semibold focus:outline-none focus:border-weeet-primary"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-yellow-400 font-medium pointer-events-none">
                  🪙 พอยต์ทอง
                </span>
              </div>
              <p className="text-xs text-gray-500">
                จำนวนพอยต์ทอง (Gold Point) ที่เสนอจ่ายให้ลูกค้าเพื่อซื้อซากเครื่อง
              </p>
            </div>

            {/* Condition summary */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-white">สรุปสภาพเครื่อง</label>
              <textarea
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                rows={3}
                placeholder="อธิบายสภาพเครื่อง / ความเสียหาย..."
                className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-weeet-primary resize-none"
              />
            </div>

            {/* Reason / note */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-white">เหตุผล / หมายเหตุถึงลูกค้า</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="เช่น ซ่อมไม่คุ้มเนื่องจาก... แนะนำให้ขายเป็นซาก"
                className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-weeet-primary resize-none"
              />
            </div>

            {/* Escrow / POINT-LOCK info */}
            <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-4 space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-blue-400 text-sm mt-0.5">ⓘ</span>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-white">ระบบพักเงินกลาง (Escrow)</p>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    เมื่อลูกค้ายอมรับข้อเสนอ พอยต์ทอง (Gold Point) จาก WeeeR
                    จะถูก <span className="text-white">พักไว้ในระบบพักเงินกลาง (Escrow)</span>{" "}
                    ก่อนโอนให้ลูกค้า (WeeeU) เพื่อความปลอดภัยของทั้งสองฝ่าย
                  </p>
                </div>
              </div>
            </div>

            {/* Submit (mock) */}
            <button
              onClick={handleSubmit}
              disabled={!amount}
              className="w-full bg-weeet-primary hover:bg-weeet-dark disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              🪙 ส่งข้อเสนอซื้อซากให้ลูกค้า
            </button>
          </div>
        )}

        {/* ─── PENDING: gold-lock countdown panel (mock) ───────────── */}
        {submitted && state === "pending" && (
          <div className="bg-yellow-500/10 border border-yellow-500/40 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-yellow-300">🔒 พอยต์ทองถูกล็อก (รอลูกค้ายืนยัน)</p>
              <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full">
                รอลูกค้ายืนยัน
              </span>
            </div>

            {/* Static countdown (mock — no real timer) */}
            <div className="bg-gray-900 rounded-lg p-4 text-center">
              <p className="text-xs text-gray-400">เวลาที่เหลือก่อนหมดอายุข้อเสนอ</p>
              <p className="text-3xl font-bold text-yellow-300 tabular-nums tracking-wider mt-1">
                เหลือ 24:00 ชม.
              </p>
            </div>

            <div className="space-y-1.5 text-xs text-gray-400">
              <p>• ข้อเสนอ <span className="text-white">{amount || 0} พอยต์ทอง (Gold Point)</span> ถูกพักไว้ใน ระบบพักเงินกลาง (Escrow)</p>
              <p>• ระบบจะส่งการแจ้งเตือนให้ลูกค้า <span className="text-white">ทุก 6 ชม.</span></p>
              <p>• หากครบกำหนด ข้อเสนอจะถูกยกเลิกอัตโนมัติ</p>
            </div>

            <p className="text-[11px] text-gray-500 border-t border-gray-700 pt-2">
              ⚙️ การนับเวลาถอยหลังจริง / การยกเลิกอัตโนมัติ จะทำงานใน <span className="text-gray-400">เฟส BE (Backend)</span> — หน้านี้แสดงค่าตัวอย่างคงที่
            </p>
          </div>
        )}

        {/* ─── ACCEPTED: success summary ────────────────────────────── */}
        {submitted && state === "accepted" && (
          <div className="space-y-4">
            <div className="bg-semantic-success/10 border border-semantic-success/40 rounded-xl p-5 text-center space-y-2">
              <p className="text-5xl">✅</p>
              <h2 className="text-lg font-bold text-white">ลูกค้ายอมรับข้อเสนอแล้ว</h2>
              <p className="text-sm text-gray-300">
                ลูกค้ายอมรับการขายซากเครื่องในราคา{" "}
                <span className="text-yellow-300 font-semibold">{amount || 0} พอยต์ทอง (Gold Point)</span>
              </p>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 space-y-3 text-sm">
              <p className="text-white font-semibold">สรุปการรับซื้อซาก</p>
              <div className="flex justify-between text-gray-300">
                <span>ราคารับซื้อ</span>
                <span className="text-yellow-300 font-medium">{amount || 0} พอยต์ทอง</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>สถานะพอยต์ทอง</span>
                <span className="text-semantic-success">โอนผ่าน ระบบพักเงินกลาง (Escrow)</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>ทิศทางการชำระ</span>
                <span className="text-gray-200">WeeeR → ลูกค้า (WeeeU)</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>สภาพเครื่อง</span>
                <span className="text-gray-200 text-right max-w-[60%] truncate">{condition || "—"}</span>
              </div>
            </div>

            <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-3 flex items-start gap-2">
              <span className="text-blue-400 text-sm mt-0.5">ⓘ</span>
              <p className="text-xs text-gray-400">
                ขั้นถัดไป: นัดรับซากเครื่อง และระบบจะปลดล็อกพอยต์ทองจาก ระบบพักเงินกลาง (Escrow) ให้ลูกค้าเมื่อยืนยันการส่งมอบ
              </p>
            </div>

            <button
              onClick={() => router.push(`/jobs/${id}`)}
              className="w-full bg-weeet-primary hover:bg-weeet-dark text-white font-semibold py-3.5 rounded-xl transition-colors"
            >
              กลับไปหน้างาน
            </button>
          </div>
        )}

        {/* ─── REJECTED: dispute review path ────────────────────────── */}
        {submitted && state === "rejected" && (
          <div className="space-y-4">
            <div className="bg-semantic-warning/10 border border-semantic-warning/40 rounded-xl p-5 text-center space-y-2">
              <p className="text-5xl">⚠️</p>
              <h2 className="text-lg font-bold text-white">ลูกค้าปฏิเสธข้อเสนอ</h2>
              <p className="text-sm text-gray-300">
                ลูกค้าไม่ยอมรับราคา{" "}
                <span className="text-yellow-300 font-semibold">{amount || 0} พอยต์ทอง (Gold Point)</span>{" "}
                ระบบจะนำเรื่องเข้าสู่การตรวจสอบข้อตกลง
              </p>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 space-y-2 text-sm">
              <p className="text-white font-semibold">เข้าสู่ขั้นตอนตรวจสอบข้อตกลง</p>
              <ul className="text-xs text-gray-400 space-y-1.5 list-disc list-inside">
                <li>พอยต์ทองที่พักไว้ใน ระบบพักเงินกลาง (Escrow) จะถูกคืนสถานะ</li>
                <li>ทีมงานจะตรวจสอบข้อโต้แย้งระหว่างช่างกับลูกค้า</li>
                <li>ช่างจะได้รับแจ้งผลการตรวจสอบเมื่อเสร็จสิ้น</li>
              </ul>
            </div>

            <button
              onClick={() => router.push(`/jobs/${id}`)}
              className="w-full bg-semantic-warning hover:opacity-90 text-white font-semibold py-3.5 rounded-xl transition-colors"
            >
              เข้าสู่การตรวจสอบข้อตกลง
            </button>
            <button
              onClick={() => {
                setSubmitted(false);
                setState("pending");
              }}
              className="w-full text-gray-400 hover:text-gray-300 text-sm py-2"
            >
              แก้ไขข้อเสนอใหม่
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
