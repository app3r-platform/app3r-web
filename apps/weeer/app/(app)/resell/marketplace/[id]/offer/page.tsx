"use client";

// ── WeeeR Resell Marketplace — ยื่นข้อเสนอซื้อมือสอง (R-18 RESELL-PAIR3-OFFER) ──
// ร้าน WeeeR ยื่นข้อเสนอ "ซื้อ" สินค้ามือสองที่ลูกค้า WeeeU ประกาศขายใน C2C marketplace
// Mockup เท่านั้น: ข้อมูล hard-code + state ผ่าน useState · ไม่มี backend/fetch · ไม่มี real countdown
// Brand: ส้ม #FF663A (hover #F04E20) · semantic green = success/status (HYBRID)

import { use, useState } from "react";
import Link from "next/link";

// ── Mock listing (อ้างอิง shape จากหน้า detail) ─────────────────────────────
const MOCK_LISTING = {
  id: "MKT001",
  sellerType: "WeeeU" as const,
  applianceName: 'Sony Bravia XR 55" A80K',
  applianceBrand: "Sony",
  applianceModel: "XR55A80K",
  price: 16500,
  deliveryMethods: ["ส่ง Kerry", "รับเอง"],
  description: "สภาพ 90% ขึ้นตู้ดีมาก มีรีโมท มีกล่อง ขาตั้งครบ ไม่มีรอยขีดข่วน",
  imageUrl: "", // ว่าง = ไม่ render รูป (มี onError fallback เผื่อ url เสีย)
};

// preset ตัวเลือกเงื่อนไขการยกเลิก / คืนพอยต์ (offer terms) ที่ "ร้าน" กรอกให้ผู้ขายเห็น
const TERMS_PRESETS = [
  "ยกเลิกฟรีก่อนล็อกพอยต์ — หลังล็อกพอยต์แล้วคืนเต็มจำนวนหากของไม่ตรงปก",
  "คืนพอยต์เต็มจำนวนภายใน 24 ชม. หากตรวจสภาพแล้วไม่ตรงรายละเอียด",
  "ไม่รับคืนหากแกะกล่อง/ใช้งานแล้ว ยกเว้นชำรุดจากการขนส่ง",
  "กำหนดเอง…",
];

// MOCK countdown — ค่าคงที่ (logic จริง = backend) ห้ามทำ timer จริง
const DEADLINE_HOURS = 24;
const remainingHours = 18; // static mock
const REMINDER_HISTORY = [
  { at: "วันนี้ 09:00", text: "แจ้งเตือน: เหลือ 24 ชม. ก่อนหมดเวลายืนยัน" },
  { at: "วันนี้ 15:00", text: "แจ้งเตือน: เหลือ 18 ชม. — รอผู้ขายเลือกข้อเสนอ" },
];

export default function ResellMarketplaceOfferPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const listing = MOCK_LISTING;

  // ── offer form state ──────────────────────────────────────────────────────
  const [offerPrice, setOfferPrice] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState(listing.deliveryMethods[0] ?? "รับเอง");
  const [message, setMessage] = useState("");
  const [termsChoice, setTermsChoice] = useState(TERMS_PRESETS[0]);
  const [customTerms, setCustomTerms] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [showImg, setShowImg] = useState(true);

  // step: "form" → "confirm" → "success"
  const [step, setStep] = useState<"form" | "confirm" | "success">("form");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isCustomTerms = termsChoice === "กำหนดเอง…";
  const effectiveTerms = isCustomTerms ? customTerms.trim() : termsChoice;

  function validate() {
    const e: Record<string, string> = {};
    if (!offerPrice || isNaN(Number(offerPrice)) || Number(offerPrice) <= 0) e.offerPrice = "กรุณาระบุราคาที่เสนอ";
    if (!effectiveTerms) e.terms = "กรุณาระบุเงื่อนไขการยกเลิก / คืนพอยต์";
    return e;
  }

  function goConfirm(ev: React.FormEvent) {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setStep("confirm");
  }

  function submit() {
    // Mockup: ไม่มี backend — แค่เปลี่ยนไป success
    if (!agreed) return;
    setStep("success");
  }

  // ── SUCCESS STATE (A1/A8: ทุก action → success page) ────────────────────────
  if (step === "success") {
    return (
      <div className="space-y-5 max-w-xl">
        <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
          <span className="text-5xl">✅</span>
          <h1 className="text-lg font-bold text-green-800 mt-3">ส่งข้อเสนอสำเร็จ</h1>
          <p className="text-sm text-green-700 mt-1">
            ส่งข้อเสนอซื้อ {Number(offerPrice).toLocaleString()} พอยต์ทอง (Gold Point) ให้ผู้ขายแล้ว
          </p>
          <p className="text-xs text-gray-500 mt-2">รอผู้ขายเลือกข้อเสนอ — ระบบจะล็อกพอยต์ (point-lock) เมื่อทั้งสองฝ่ายตกลง</p>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-2 text-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">สรุปข้อเสนอที่ส่ง</p>
          <div className="flex justify-between"><span className="text-gray-500">สินค้า</span><span className="font-medium text-gray-800">{listing.applianceName}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">ราคาที่เสนอ</span><span className="font-semibold text-[#FF663A]">{Number(offerPrice).toLocaleString()} พอยต์ทอง (Gold Point)</span></div>
          <div className="flex justify-between"><span className="text-gray-500">วิธีจัดส่ง</span><span className="font-medium text-gray-800">{deliveryMethod}</span></div>
          <div className="pt-1">
            <p className="text-gray-500">เงื่อนไขการยกเลิก / คืนพอยต์</p>
            <p className="font-medium text-gray-800">{effectiveTerms}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Link href="/resell/marketplace"
            className="flex-1 text-center bg-[#FF663A] hover:bg-[#F04E20] text-white font-semibold py-3 rounded-xl text-sm transition-colors">
            ← กลับสู่ Marketplace
          </Link>
          <Link href={`/resell/marketplace/${id}`}
            className="flex-1 text-center bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl text-sm transition-colors">
            ดูประกาศนี้
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/resell/marketplace/${id}`} className="text-gray-400 hover:text-gray-600">←</Link>
        <h1 className="text-xl font-bold text-gray-900">ยื่นข้อเสนอซื้อมือสอง</h1>
      </div>

      {/* Item summary */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-3">
        {listing.imageUrl && showImg && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={listing.imageUrl}
            alt={listing.applianceName}
            onError={() => setShowImg(false)}
            className="w-full max-h-48 object-cover rounded-xl border border-gray-100"
          />
        )}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900">{listing.applianceName}</p>
            <p className="text-xs text-gray-400">{listing.applianceBrand} · {listing.applianceModel}</p>
            <p className="text-xs text-gray-500 mt-1">ผู้ขาย: 👤 บุคคล (WeeeU)</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-gray-400">ราคาตั้ง</p>
            <p className="text-lg font-bold text-[#FF663A]">{listing.price.toLocaleString()}</p>
            <p className="text-[10px] text-gray-400">พอยต์ทอง (Gold Point)</p>
          </div>
        </div>
        {listing.description && <p className="text-xs text-gray-500 border-t border-gray-50 pt-2">{listing.description}</p>}
      </div>

      {/* ── Gold-lock countdown card (MOCK only) ─────────────────────────────── */}
      <div className="bg-[#FCEAE3] border border-[#FFD5C4] rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-[#4A1B0C]">⏳ เหลือ {remainingHours} ชม.</p>
            <p className="text-xs text-[#8A4326] mt-0.5">
              {step === "confirm"
                ? "เลือกข้อเสนอแล้ว — ยืนยันภายใน 24 ชม."
                : "รอผู้ขายเลือกข้อเสนอ"}
            </p>
          </div>
          <span className="text-xs text-[#8A4326] bg-white/60 rounded-full px-3 py-1">เดดไลน์ {DEADLINE_HOURS} ชม.</span>
        </div>
        <p className="text-[11px] text-[#8A4326]">🔔 แจ้งเตือนทุก 6 ชม.</p>
        <div className="border-t border-[#FFD5C4] pt-2">
          <p className="text-[11px] font-semibold text-[#8A4326] mb-1">ประวัติแจ้งเตือน</p>
          <ul className="space-y-1">
            {REMINDER_HISTORY.map((r, i) => (
              <li key={i} className="text-[11px] text-[#8A4326] flex gap-2">
                <span className="text-gray-400 shrink-0">{r.at}</span>
                <span>{r.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── STEP: FORM ───────────────────────────────────────────────────────── */}
      {step === "form" && (
        <form onSubmit={goConfirm} className="space-y-4 bg-white border border-gray-100 rounded-2xl p-5">
          {/* offer price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ราคาที่เสนอ — พอยต์ทอง (Gold Point) <span className="text-red-500">*</span>
            </label>
            <input
              type="number" min="1" value={offerPrice}
              onChange={(e) => setOfferPrice(e.target.value)}
              placeholder="เช่น 15000"
              className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF663A] ${errors.offerPrice ? "border-red-400" : "border-gray-200"}`}
            />
            {errors.offerPrice && <p className="text-xs text-red-500 mt-1">{errors.offerPrice}</p>}
          </div>

          {/* delivery */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">วิธีจัดส่ง</label>
            <select value={deliveryMethod} onChange={(e) => setDeliveryMethod(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF663A]">
              {listing.deliveryMethods.map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>

          {/* message (optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ข้อความถึงผู้ขาย (ถ้ามี)</label>
            <input type="text" value={message} onChange={(e) => setMessage(e.target.value)}
              placeholder="เช่น สนใจรับเองที่ร้าน นัดดูสภาพก่อนได้"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF663A]" />
          </div>

          {/* REQUIRED — offer terms (เงื่อนไขการยกเลิก / คืนพอยต์) */}
          <div className="border-t border-gray-100 pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              เงื่อนไขการยกเลิก / คืนพอยต์ <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-400 mb-2">เงื่อนไขที่ร้านกำหนด — ผู้ซื้อ (ผู้ขาย) จะเห็นและกดยอมรับก่อนตกลง</p>
            <div className="space-y-1.5">
              {TERMS_PRESETS.map((t) => (
                <label key={t} className="flex items-start gap-2 cursor-pointer">
                  <input type="radio" name="terms" value={t}
                    checked={termsChoice === t}
                    onChange={() => setTermsChoice(t)}
                    className="mt-0.5 accent-[#FF663A]" />
                  <span className="text-xs text-gray-700">{t}</span>
                </label>
              ))}
            </div>
            {isCustomTerms && (
              <textarea value={customTerms} onChange={(e) => setCustomTerms(e.target.value)}
                placeholder="ระบุเงื่อนไขการยกเลิก / คืนพอยต์ของร้าน…"
                rows={3}
                className={`mt-2 w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF663A] resize-none ${errors.terms ? "border-red-400" : "border-gray-200"}`} />
            )}
            {errors.terms && <p className="text-xs text-red-500 mt-1">{errors.terms}</p>}
          </div>

          {/* point-lock explainer */}
          <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-xs text-green-800 space-y-1">
            <p className="font-semibold flex items-center gap-1">
              🔒 ระบบล็อกพอยต์ (point-lock)
              <span className="relative group cursor-help text-green-600">
                ⓘ
                <span className="pointer-events-none absolute left-0 bottom-full mb-1 hidden group-hover:block w-56 bg-gray-800 text-white text-[11px] rounded-lg px-2 py-1.5 z-10">
                  พักเงินกลาง (Escrow) — คุ้มครองผ่านระบบกลาง พอยต์ของทั้งสองฝ่ายถูกล็อกจนกว่าธุรกรรมจะเสร็จ
                </span>
              </span>
            </p>
            <p>เมื่อทั้งสองฝ่ายตกลง ระบบจะล็อกพอยต์ทองไว้ที่ส่วนกลางจนกว่าจะส่งมอบ/ตรวจรับเสร็จ</p>
          </div>

          <button type="submit"
            className="w-full bg-[#FF663A] hover:bg-[#F04E20] text-white font-semibold py-3 rounded-xl transition-colors">
            ตรวจทานข้อเสนอ →
          </button>
        </form>
      )}

      {/* ── STEP: CONFIRM ────────────────────────────────────────────────────── */}
      {step === "confirm" && (
        <div className="space-y-4 bg-white border border-gray-100 rounded-2xl p-5">
          <p className="text-sm font-semibold text-gray-900">ตรวจทานข้อตกลงก่อนส่ง</p>

          <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">สินค้า</span><span className="font-medium text-gray-800">{listing.applianceName}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">ราคาที่เสนอ</span><span className="font-semibold text-[#FF663A]">{Number(offerPrice).toLocaleString()} พอยต์ทอง (Gold Point)</span></div>
            <div className="flex justify-between"><span className="text-gray-500">วิธีจัดส่ง</span><span className="font-medium text-gray-800">{deliveryMethod}</span></div>
            {message.trim() && <div className="flex justify-between gap-3"><span className="text-gray-500 shrink-0">ข้อความ</span><span className="font-medium text-gray-800 text-right">{message}</span></div>}
            <div className="border-t border-gray-200 pt-2">
              <p className="text-gray-500">เงื่อนไขการยกเลิก / คืนพอยต์</p>
              <p className="font-medium text-gray-800">{effectiveTerms}</p>
            </div>
            <div className="border-t border-gray-200 pt-2 text-xs text-gray-600">
              🔒 เมื่อผู้ขายเลือกข้อเสนอ ระบบจะ <span className="font-semibold">ล็อกพอยต์ (point-lock)</span> และต้องยืนยันภายใน {DEADLINE_HOURS} ชม.
            </div>
          </div>

          {/* agreement checkbox */}
          <label className="flex items-start gap-2 cursor-pointer bg-green-50 border border-green-100 rounded-xl p-3">
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-[#FF663A]" />
            <span className="text-xs text-gray-700">
              ยอมรับข้อตกลง — ราคา เงื่อนไขการยกเลิก/คืนพอยต์ และการล็อกพอยต์ (point-lock) ตามที่แสดงข้างต้น
            </span>
          </label>

          <div className="flex gap-2">
            <button type="button" onClick={submit} disabled={!agreed}
              className="flex-1 bg-[#FF663A] hover:bg-[#F04E20] text-white font-semibold py-3 rounded-xl text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              ✅ ส่งข้อเสนอ
            </button>
            <button type="button" onClick={() => setStep("form")}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl text-sm transition-colors">
              ← แก้ไข
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
