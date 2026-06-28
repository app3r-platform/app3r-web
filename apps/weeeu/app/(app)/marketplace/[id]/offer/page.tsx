"use client";

/**
 * ยื่นข้อเสนอซื้อมือสอง C2C (Pair 3) — U-22 · /marketplace/[id]/offer
 *
 * Rule-bundle [ยื่นข้อเสนอ] (Disposition Matrix):
 *   OTP(123456·WIRE) + หน้ายืนยัน + offer terms (เงื่อนไขยกเลิก/คืนพอยต์ · DECISION จุด1)
 *   + Gold-lock acknowledge (Escrow) → หน้า success (U-42)
 *
 * mockup — provider OTP จริง / ตัดพอยต์ / persist = BE จังหวะ2
 */

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import OtpInput from "@/components/shared/OtpInput";
import { EscrowInfoIcon } from "@/components/shared/EscrowInfo";
import { MockAnnoBar } from "@/components/shared/MockAnnoBar";
import { offersApi } from "@/lib/api/offers";

const MOCK_OTP = "123456";
const MAX_OTP_ATTEMPTS = 3;

// Mock listing (fallback — marketplace detail ใช้ MOCK เดียวกัน)
const MOCK_LISTING = {
  name: "แอร์ Daikin 12000 BTU มือสอง",
  askingPrice: 4500,
  shop: "ร้านดีเจริญ",
};

// เงื่อนไขยกเลิก/คืนพอยต์ (offer terms · DECISION จุด1) — ผู้ซื้อเลือกก่อนยื่น
const CANCEL_TERMS_OPTIONS = [
  { value: "before_ship", label: "ยกเลิกได้ก่อนผู้ขายจัดส่ง — คืนพอยต์ทองที่ล็อกเต็มจำนวน" },
  { value: "inspect_first", label: "ขอตรวจสภาพก่อนยืนยันรับ — คืนเต็มถ้าไม่ตรงปก (ภายใน 7 วัน)" },
  { value: "no_cancel", label: "ยืนราคา ไม่ยกเลิก — เพิ่มโอกาสผู้ขายเลือกข้อเสนอ" },
];

export default function MarketplaceOfferPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const listing = MOCK_LISTING;

  const [offerPrice, setOfferPrice] = useState("");
  const [message, setMessage] = useState("");
  const [cancelTerms, setCancelTerms] = useState("before_ship");
  const [goldAck, setGoldAck] = useState(false);
  const [error, setError] = useState("");

  // OTP gate
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpAttempts, setOtpAttempts] = useState(0);
  const [otpError, setOtpError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [offerApiError, setOfferApiError] = useState("");

  const priceNum = Number(offerPrice);

  const handleSubmit = () => {
    if (!offerPrice || isNaN(priceNum) || priceNum <= 0) {
      setError("กรุณาระบุราคาที่ต้องการเสนอ"); return;
    }
    if (!goldAck) {
      setError("กรุณารับทราบการล็อกพอยต์ทองในระบบพักเงินกลาง (Escrow) ก่อนยื่นข้อเสนอ"); return;
    }
    setError("");
    setOtp(""); setOtpError(""); setOtpAttempts(0);
    setShowOtp(true);
  };

  const handleVerifyOtp = async () => {
    setOtpError("");
    setOfferApiError("");
    if (otp !== MOCK_OTP) {
      const n = otpAttempts + 1;
      setOtpAttempts(n);
      setOtp("");
      if (n >= MAX_OTP_ATTEMPTS) {
        router.push("/suspended?reason=otp&from=ยื่นข้อเสนอซื้อ");
      } else {
        setOtpError(`รหัส OTP ไม่ถูกต้อง — เหลือโอกาสอีก ${MAX_OTP_ATTEMPTS - n} ครั้ง`);
      }
      return;
    }
    // OTP ผ่าน → POST /offers full offerDto
    setSubmitting(true);
    try {
      const res = await offersApi.create({
        listingId: id ?? "",
        offerPrice: priceNum,
        deliveryMethod: "parcel",
        message: message.trim() || undefined,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const msg = body?.error?.message ?? "ยื่นข้อเสนอไม่สำเร็จ";
        if (res.status === 409) {
          setOfferApiError("คุณมีข้อเสนอที่รอการตอบรับสำหรับสินค้านี้อยู่แล้ว");
        } else if (res.status === 403) {
          setOfferApiError("ไม่มีสิทธิ์ยื่นข้อเสนอ — ตรวจสอบสถานะบัญชี");
        } else {
          setOfferApiError(msg);
        }
        setSubmitting(false);
        return;
      }
      router.push(`/marketplace/${id}/offer/success`);
    } catch {
      setOfferApiError("เกิดข้อผิดพลาด กรุณาลองใหม่");
      setSubmitting(false);
    }
  };

  // ─── OTP gate screen ─────────────────────────────────────────────────────
  if (showOtp) {
    return (
      <div className="max-w-xl mx-auto px-4 py-6 space-y-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setShowOtp(false); setOtp(""); setOtpError(""); }}
            className="text-gray-500 hover:text-gray-800 text-xl"
          >‹</button>
          <h1 className="text-xl font-bold text-gray-900">ยืนยันข้อเสนอด้วย OTP</h1>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4 text-center">
          <p className="text-3xl">🔐</p>
          <p className="text-sm text-gray-600">เพื่อความปลอดภัย กรุณากรอกรหัส OTP 6 หลักที่ส่งไปยังเบอร์โทรศัพท์ที่ลงทะเบียนไว้</p>
          <p className="text-xs text-gray-400">(Mockup — ใช้รหัส <span className="font-bold text-weeeu-primary">123456</span> · ผู้ให้บริการ OTP จริง = BE)</p>
          <OtpInput value={otp} onChange={setOtp} />
          {otpError && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">{otpError}</p>}
          {offerApiError && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">{offerApiError}</p>}
          <p className="text-xs text-gray-400">กรอกได้ {MAX_OTP_ATTEMPTS} ครั้ง — หากผิดครบจะถูกระงับและต้องติดต่อผู้ดูแลระบบ</p>
          <button
            onClick={handleVerifyOtp}
            disabled={otp.length < 6 || submitting}
            className="w-full bg-weeeu-primary hover:bg-weeeu-dark disabled:opacity-50 text-white font-semibold py-3.5 rounded-2xl text-sm transition-colors"
          >
            {submitting ? "⟳ กำลังส่งข้อเสนอ..." : "ยืนยัน OTP และส่งข้อเสนอ"}
          </button>
        </div>
      </div>
    );
  }

  // ─── Offer form ──────────────────────────────────────────────────────────
  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-5">
      <MockAnnoBar />

      <div className="flex items-center gap-3">
        <Link href={`/marketplace/${id}`} className="text-gray-500 hover:text-gray-800 text-xl">‹</Link>
        <h1 className="text-xl font-bold text-gray-900">ยื่นข้อเสนอซื้อ</h1>
      </div>

      {/* Listing summary */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-1">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">สินค้าที่จะเสนอซื้อ</p>
        <p className="font-semibold text-gray-900">{listing.name}</p>
        <p className="text-sm text-gray-600">ผู้ขาย: {listing.shop}</p>
        <p className="text-sm text-gray-500">ราคาตั้งขาย: <span className="font-bold text-weeeu-primary">{listing.askingPrice.toLocaleString()} ฿</span></p>
      </div>

      {/* Offer price */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          ราคาที่ต้องการเสนอ (พอยต์ทอง) <span className="text-red-500">*</span>
        </p>
        <input
          type="number"
          min="1"
          value={offerPrice}
          onChange={e => setOfferPrice(e.target.value)}
          placeholder={`เช่น ${listing.askingPrice.toLocaleString()}`}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-weeeu-primary/40"
        />
        <div className="flex gap-1.5">
          {[1, 0.95, 0.9].map(f => {
            const v = Math.round(listing.askingPrice * f);
            return (
              <button
                key={f}
                type="button"
                onClick={() => setOfferPrice(String(v))}
                className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 text-gray-500 hover:border-weeeu-primary/40 hover:text-weeeu-primary transition-colors"
              >
                {f === 1 ? "เต็มราคา" : `-${Math.round((1 - f) * 100)}%`} ({v.toLocaleString()})
              </button>
            );
          })}
        </div>
      </div>

      {/* เงื่อนไขยกเลิก/คืนพอยต์ (offer terms · DECISION จุด1) */}
      <div className="bg-white rounded-2xl border border-weeeu-primary/20 shadow-sm p-5 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-base">📋</span>
          <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider">เงื่อนไขยกเลิก / คืนพอยต์</p>
        </div>
        {/* PHASE-4: Offer = source of truth */}
        <p className="text-xs text-gray-500">เงื่อนไขนี้ยึดเป็นหลักกรณีพิพาท — ผู้ขายเห็นก่อนเลือกข้อเสนอ</p>
        <div className="space-y-1.5">
          {CANCEL_TERMS_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setCancelTerms(opt.value)}
              className={`w-full text-left px-3 py-2.5 rounded-xl border text-sm transition-colors ${
                cancelTerms === opt.value
                  ? "bg-weeeu-surface border-weeeu-primary text-weeeu-text font-medium"
                  : "border-gray-200 text-gray-600 hover:border-weeeu-primary/40"
              }`}
            >
              {cancelTerms === opt.value && <span className="mr-2">✅</span>}
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Message to seller */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">ข้อความถึงผู้ขาย (ไม่บังคับ)</p>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="เช่น สนใจสินค้า ขอนัดดูของก่อนได้ไหม"
          rows={3}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-weeeu-primary/40 resize-none"
        />
      </div>

      {/* Gold-lock acknowledge (Escrow) */}
      <div className={`border rounded-2xl p-4 space-y-2 transition-colors ${goldAck ? "bg-weeeu-surface border-weeeu-primary/40" : "bg-amber-50 border-amber-300"}`}>
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-weeeu-dark">🔒 พอยต์ทอง (Gold Point) ที่จะถูกล็อก</p>
          <p className="text-sm font-bold text-weeeu-primary">
            {priceNum > 0 ? priceNum.toLocaleString() : "—"} พอยต์ทอง
          </p>
        </div>
        <p className="text-[11px] text-gray-500 leading-relaxed">
          ระบบพักเงินกลาง (Escrow) <EscrowInfoIcon className="inline-flex" /> จะล็อกพอยต์ทองเมื่อผู้ขายเลือกข้อเสนอของคุณ — ปลดล็อกตามเงื่อนไขยกเลิกที่เลือก
        </p>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={goldAck}
            onChange={e => setGoldAck(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-weeeu-primary focus:ring-weeeu-primary/40"
          />
          <span className="text-xs text-gray-700 font-medium">รับทราบว่าพอยต์ทองจะถูกล็อกเมื่อผู้ขายเลือกข้อเสนอ</span>
        </label>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <button
        onClick={handleSubmit}
        className="w-full bg-weeeu-primary hover:bg-weeeu-dark text-white font-semibold py-3.5 rounded-2xl text-sm transition-colors"
      >
        ยืนยันข้อเสนอด้วย OTP →
      </button>
    </div>
  );
}
