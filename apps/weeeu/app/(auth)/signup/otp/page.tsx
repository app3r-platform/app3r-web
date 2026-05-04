"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import OtpInput from "@/components/shared/OtpInput";

// OTP: 6 หลัก, 5 นาที, max 5 ครั้ง/ชม, resend cooldown 60 วิ
const OTP_DURATION = 5 * 60; // seconds
const RESEND_COOLDOWN = 60;   // seconds

export default function SignupOtpPage() {
  const [phone, setPhone] = useState("");
  const [phoneSubmitted, setPhoneSubmitted] = useState(false);
  const [phoneError, setPhoneError] = useState("");

  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [loading, setLoading] = useState(false);

  const [secondsLeft, setSecondsLeft] = useState(OTP_DURATION);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [sendCount, setSendCount] = useState(0); // max 5/hr

  // ─── Countdown timer ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!phoneSubmitted) return;
    if (secondsLeft <= 0) return;
    const t = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [phoneSubmitted, secondsLeft]);

  // ─── Resend cooldown ────────────────────────────────────────────────────────
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  // ─── Submit phone ───────────────────────────────────────────────────────────
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length !== 10) { setPhoneError("กรุณากรอกเบอร์โทร 10 หลัก"); return; }
    setPhoneError("");
    setLoading(true);
    // Production: POST /api/v1/auth/verify-otp (send step)
    await new Promise((r) => setTimeout(r, 600));
    setLoading(false);
    setPhoneSubmitted(true);
    setSecondsLeft(OTP_DURATION);
    setResendCooldown(RESEND_COOLDOWN);
    setSendCount((c) => c + 1);
  };

  // ─── Resend OTP ─────────────────────────────────────────────────────────────
  const handleResend = useCallback(async () => {
    if (resendCooldown > 0 || sendCount >= 5) return;
    setOtp("");
    setOtpError("");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    setLoading(false);
    setSecondsLeft(OTP_DURATION);
    setResendCooldown(RESEND_COOLDOWN);
    setSendCount((c) => c + 1);
  }, [resendCooldown, sendCount]);

  // ─── Verify OTP ─────────────────────────────────────────────────────────────
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.replace(/\s/g, "").length < 6) { setOtpError("กรุณากรอก OTP ให้ครบ 6 หลัก"); return; }
    if (secondsLeft <= 0) { setOtpError("OTP หมดอายุแล้ว — กรุณาขอ OTP ใหม่"); return; }
    setLoading(true);
    setOtpError("");
    // Production: POST /api/v1/auth/verify-otp
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    window.location.href = "/signup/verify-email";
  };

  const inputCls = (err: string) =>
    `w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
      err ? "border-red-400 bg-red-50" : "border-gray-200"
    }`;

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5, 6, 7].map((s) => (
          <div key={s} className={`h-1.5 flex-1 rounded-full ${s <= 3 ? "bg-blue-600" : "bg-gray-200"}`} />
        ))}
      </div>
      <p className="text-xs text-gray-400 -mt-4">ขั้นตอนที่ 3 จาก 7</p>

      <div>
        <h2 className="text-xl font-bold text-gray-900">ยืนยันเบอร์โทรศัพท์</h2>
        <p className="text-gray-500 text-sm mt-1">
          {phoneSubmitted
            ? `ส่ง OTP ไปที่ ${phone.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3")} แล้ว`
            : "กรอกเบอร์โทรเพื่อรับ OTP"}
        </p>
      </div>

      {!phoneSubmitted ? (
        /* ── Phase A: Enter phone ── */
        <form onSubmit={handlePhoneSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              เบอร์โทรศัพท์ <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              inputMode="numeric"
              placeholder="0812345678"
              value={phone}
              maxLength={10}
              onChange={(e) => { setPhone(e.target.value.replace(/\D/g, "")); setPhoneError(""); }}
              className={inputCls(phoneError)}
            />
            <p className="text-xs text-gray-400 mt-1">ไม่มีค่าใช้จ่าย · เบอร์ต้องไม่ซ้ำในระบบ</p>
            {phoneError && <p className="text-red-500 text-xs mt-1">{phoneError}</p>}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3.5 rounded-2xl transition-colors text-sm flex items-center justify-center gap-2"
          >
            {loading ? <><span className="animate-spin">⟳</span> กำลังส่ง OTP...</> : "ส่ง OTP"}
          </button>
        </form>
      ) : (
        /* ── Phase B: Enter OTP ── */
        <form onSubmit={handleVerify} className="space-y-6">
          {/* OTP Input */}
          <OtpInput value={otp} onChange={setOtp} disabled={secondsLeft <= 0 || loading} />

          {/* Timer */}
          <div className="text-center">
            {secondsLeft > 0 ? (
              <p className={`text-sm font-medium ${secondsLeft < 60 ? "text-red-500" : "text-gray-600"}`}>
                OTP หมดอายุใน {fmt(secondsLeft)}
              </p>
            ) : (
              <p className="text-red-500 text-sm font-medium">⚠️ OTP หมดอายุแล้ว</p>
            )}
          </div>

          {otpError && (
            <p className="text-red-500 text-sm text-center">{otpError}</p>
          )}

          <button
            type="submit"
            disabled={loading || otp.replace(/\s/g, "").length < 6 || secondsLeft <= 0}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3.5 rounded-2xl transition-colors text-sm flex items-center justify-center gap-2"
          >
            {loading ? <><span className="animate-spin">⟳</span> กำลังตรวจสอบ...</> : "ยืนยัน OTP →"}
          </button>

          {/* Resend + change phone */}
          <div className="flex flex-col items-center gap-2">
            {sendCount < 5 ? (
              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0 || loading}
                className="text-sm text-blue-600 disabled:text-gray-400 hover:text-blue-800 font-medium"
              >
                {resendCooldown > 0 ? `ขอ OTP ใหม่ได้ใน ${resendCooldown} วิ` : "ขอ OTP ใหม่"}
              </button>
            ) : (
              <p className="text-xs text-gray-400">ส่ง OTP ครบ 5 ครั้งแล้ว — กรุณารอ 1 ชม.</p>
            )}
            <button
              type="button"
              onClick={() => { setPhoneSubmitted(false); setOtp(""); setOtpError(""); }}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              เปลี่ยนเบอร์โทร
            </button>
          </div>
        </form>
      )}

      <div className="flex justify-center">
        <Link href="/signup/email" className="text-sm text-gray-400 hover:text-gray-600">
          ‹ กลับ
        </Link>
      </div>
    </div>
  );
}
