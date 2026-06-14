"use client";

/**
 * /forgot-password — Reset password flow (3 phases)
 *
 * Phase A: กรอก email/phone → POST /api/v1/auth/forgot-password → ส่ง OTP
 * Phase B: กรอก OTP (6 หลัก, 5 นาที, max 5 ครั้ง/ชม) → POST /api/v1/auth/verify-otp
 * Phase C: ตั้งรหัสผ่านใหม่ → POST /api/v1/auth/reset-password → success
 *
 * กฎรหัสผ่าน: ≥8 ตัว · มี a-z · มี A-Z · มี 0-9 · ไม่ซ้ำ 3 รอบล่าสุด
 */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import PasswordInput from "@/components/shared/PasswordInput";
import OtpInput from "@/components/shared/OtpInput";

// ── Constants ─────────────────────────────────────────────────────────────────
const OTP_DURATION    = 5 * 60; // 5 minutes
const RESEND_COOLDOWN = 60;     // seconds
const MAX_RESEND      = 5;      // max sends/hr

// ── Helpers ───────────────────────────────────────────────────────────────────
function validateIdentifier(val: string): string | null {
  const trimmed = val.trim();
  if (!trimmed) return "กรุณากรอกเบอร์โทรหรืออีเมล";
  const isPhone = /^\d{9,10}$/.test(trimmed.replace(/\D/g, ""));
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
  if (!isPhone && !isEmail) return "รูปแบบเบอร์โทร (10 หลัก) หรืออีเมลไม่ถูกต้อง";
  return null;
}

function validateNewPassword(pw: string): string | null {
  if (pw.length < 8) return "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร";
  if (!/[a-z]/.test(pw)) return "ต้องมีตัวอักษรพิมพ์เล็ก (a-z)";
  if (!/[A-Z]/.test(pw)) return "ต้องมีตัวอักษรพิมพ์ใหญ่ (A-Z)";
  if (!/[0-9]/.test(pw)) return "ต้องมีตัวเลข (0-9)";
  return null;
}

function fmt(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

type Phase = "identifier" | "otp" | "newpass" | "done";

// ── Step indicator (3 visible steps) ─────────────────────────────────────────
function StepBar({ phase }: { phase: Phase }) {
  const step = phase === "identifier" ? 1 : phase === "otp" ? 2 : phase === "newpass" ? 3 : 3;
  return (
    <div className="space-y-1">
      <div className="flex gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${s <= step ? "bg-weeeu-primary" : "bg-gray-200"}`} />
        ))}
      </div>
      <p className="text-xs text-gray-400">
        {phase === "identifier" && "ขั้นตอนที่ 1 — ยืนยันตัวตน"}
        {phase === "otp"        && "ขั้นตอนที่ 2 — ใส่ OTP"}
        {phase === "newpass"    && "ขั้นตอนที่ 3 — ตั้งรหัสผ่านใหม่"}
        {phase === "done"       && "เสร็จสิ้น"}
      </p>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ForgotPasswordPage() {
  const [phase, setPhase] = useState<Phase>("identifier");

  // Phase A
  const [identifier, setIdentifier] = useState("");
  const [idError, setIdError]       = useState<string | null>(null);
  const [sending, setSending]       = useState(false);

  // Phase B — OTP
  const [otp, setOtp]               = useState("");
  const [otpError, setOtpError]     = useState<string | null>(null);
  const [verifying, setVerifying]   = useState(false);
  const [resetToken, setResetToken] = useState(""); // token from OTP verify response
  const [secondsLeft, setSecondsLeft]   = useState(OTP_DURATION);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [sendCount, setSendCount]   = useState(0);

  // Phase C — New password
  const [newPw, setNewPw]           = useState("");
  const [newPwConfirm, setNewPwConfirm] = useState("");
  const [pwErrors, setPwErrors]     = useState<Record<string, string>>({});
  const [resetting, setResetting]   = useState(false);

  // ── OTP countdown ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "otp" || secondsLeft <= 0) return;
    const t = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [phase, secondsLeft]);

  // ── Resend cooldown ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  // ── Password strength ─────────────────────────────────────────────────────────
  const pwChecks = [
    { label: "อย่างน้อย 8 ตัว",      ok: newPw.length >= 8 },
    { label: "มีตัวพิมพ์เล็ก (a-z)", ok: /[a-z]/.test(newPw) },
    { label: "มีตัวพิมพ์ใหญ่ (A-Z)", ok: /[A-Z]/.test(newPw) },
    { label: "มีตัวเลข (0-9)",        ok: /[0-9]/.test(newPw) },
  ];
  const pwScore = pwChecks.filter((c) => c.ok).length;

  // ── Phase A: ส่ง OTP ─────────────────────────────────────────────────────────
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateIdentifier(identifier);
    if (err) { setIdError(err); return; }
    setIdError(null);
    setSending(true);
    try {
      // Production: POST /api/v1/auth/forgot-password { identifier }
      await new Promise((r) => setTimeout(r, 700));
      setSecondsLeft(OTP_DURATION);
      setResendCooldown(RESEND_COOLDOWN);
      setSendCount(1);
      setOtp("");
      setOtpError(null);
      setPhase("otp");
    } finally {
      setSending(false);
    }
  };

  // ── Phase B: resend OTP ───────────────────────────────────────────────────────
  const handleResend = useCallback(async () => {
    if (resendCooldown > 0 || sendCount >= MAX_RESEND) return;
    // Production: POST /api/v1/auth/forgot-password { identifier } again
    await new Promise((r) => setTimeout(r, 500));
    setSecondsLeft(OTP_DURATION);
    setResendCooldown(RESEND_COOLDOWN);
    setSendCount((c) => c + 1);
    setOtp("");
    setOtpError(null);
  }, [resendCooldown, sendCount]);

  // ── Phase B: verify OTP ───────────────────────────────────────────────────────
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.replace(/\s/g, "").length < 6) { setOtpError("กรุณากรอก OTP ให้ครบ 6 หลัก"); return; }
    if (secondsLeft <= 0) { setOtpError("OTP หมดอายุแล้ว — กรุณาขอ OTP ใหม่"); return; }
    setVerifying(true);
    setOtpError(null);
    try {
      // Production: POST /api/v1/auth/verify-otp { identifier, otp } → { reset_token }
      await new Promise((r) => setTimeout(r, 700));
      setResetToken("demo-reset-token-xxx"); // replace with actual response
      setNewPw("");
      setNewPwConfirm("");
      setPwErrors({});
      setPhase("newpass");
    } catch {
      setOtpError("OTP ไม่ถูกต้อง กรุณาลองใหม่");
    } finally {
      setVerifying(false);
    }
  };

  // ── Phase C: reset password ───────────────────────────────────────────────────
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    const pwErr = validateNewPassword(newPw);
    if (pwErr) errs.newPw = pwErr;
    if (newPw !== newPwConfirm) errs.newPwConfirm = "รหัสผ่านไม่ตรงกัน";
    if (Object.keys(errs).length) { setPwErrors(errs); return; }
    setPwErrors({});
    setResetting(true);
    try {
      // Production: POST /api/v1/auth/reset-password { reset_token, new_password }
      void resetToken; // used in production API call
      await new Promise((r) => setTimeout(r, 800));
      setPhase("done");
    } catch {
      setPwErrors({ general: "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง" });
    } finally {
      setResetting(false);
    }
  };

  const inputCls = (err?: string | null) =>
    `w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-weeeu-primary focus:border-transparent ${
      err ? "border-red-400 bg-red-50" : "border-gray-200"
    }`;

  // ── DONE ──────────────────────────────────────────────────────────────────────
  if (phase === "done") return (
    <div className="space-y-6 text-center">
      <div className="w-20 h-20 bg-green-50 rounded-3xl flex items-center justify-center text-4xl mx-auto">✅</div>
      <div>
        <h2 className="text-xl font-bold text-gray-900">เปลี่ยนรหัสผ่านสำเร็จ</h2>
        <p className="text-gray-500 text-sm mt-2">กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่</p>
      </div>
      <Link
        href="/login"
        className="block w-full bg-weeeu-primary hover:bg-weeeu-dark text-white font-semibold py-3.5 rounded-2xl text-sm text-center transition-colors"
      >
        เข้าสู่ระบบ →
      </Link>
    </div>
  );

  return (
    <div className="space-y-6">
      <StepBar phase={phase} />

      {/* ── Phase A: Identifier ────────────────────────────────────────────── */}
      {phase === "identifier" && (
        <>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">ลืมรหัสผ่าน</h2>
            <p className="text-gray-500 text-sm mt-1">กรอกเบอร์โทรหรืออีเมลที่ใช้สมัคร — เราจะส่ง OTP ให้</p>
          </div>

          <form onSubmit={handleSendOtp} className="space-y-4" noValidate>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                เบอร์โทรศัพท์ หรืออีเมล <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="0812345678 หรือ email@example.com"
                value={identifier}
                onChange={(e) => { setIdentifier(e.target.value); setIdError(null); }}
                className={inputCls(idError)}
                autoComplete="username"
              />
              {idError && <p className="text-red-500 text-xs mt-1">{idError}</p>}
            </div>

            <button
              type="submit"
              disabled={sending}
              className="w-full bg-weeeu-primary hover:bg-weeeu-dark disabled:bg-weeeu-dark text-white font-semibold py-3.5 rounded-2xl transition-colors text-sm flex items-center justify-center gap-2"
            >
              {sending ? <><span className="animate-spin">⟳</span> กำลังส่ง OTP...</> : "ส่ง OTP →"}
            </button>
          </form>

          <div className="bg-weeeu-surface rounded-xl p-4">
            <p className="text-sm text-weeeu-primary">
              💡 ถ้าเบอร์/อีเมลตรงกับบัญชีในระบบ คุณจะได้รับ OTP ภายใน 2 นาที
            </p>
          </div>

          <div className="flex justify-center">
            <Link href="/login" className="text-sm text-gray-400 hover:text-gray-600">← กลับเข้าสู่ระบบ</Link>
          </div>
        </>
      )}

      {/* ── Phase B: OTP ───────────────────────────────────────────────────── */}
      {phase === "otp" && (
        <>
          <div>
            <h2 className="text-xl font-bold text-gray-900">ยืนยัน OTP</h2>
            <p className="text-gray-500 text-sm mt-1">ส่ง OTP ไปที่ <strong>{identifier}</strong> แล้ว</p>
          </div>

          <form onSubmit={handleVerifyOtp} className="space-y-5" noValidate>
            <OtpInput value={otp} onChange={setOtp} disabled={secondsLeft <= 0 || verifying} />

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

            {otpError && <p className="text-red-500 text-sm text-center">{otpError}</p>}

            <button
              type="submit"
              disabled={verifying || otp.replace(/\s/g, "").length < 6 || secondsLeft <= 0}
              className="w-full bg-weeeu-primary hover:bg-weeeu-dark disabled:bg-weeeu-dark text-white font-semibold py-3.5 rounded-2xl transition-colors text-sm flex items-center justify-center gap-2"
            >
              {verifying ? <><span className="animate-spin">⟳</span> กำลังตรวจสอบ...</> : "ยืนยัน OTP →"}
            </button>
          </form>

          {/* Resend */}
          <div className="flex flex-col items-center gap-2">
            {sendCount < MAX_RESEND ? (
              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0}
                className="text-sm text-weeeu-primary disabled:text-gray-400 hover:text-weeeu-dark font-medium"
              >
                {resendCooldown > 0 ? `ขอ OTP ใหม่ได้ใน ${resendCooldown} วิ` : "ขอ OTP ใหม่"}
              </button>
            ) : (
              <p className="text-xs text-gray-400">ส่ง OTP ครบ {MAX_RESEND} ครั้งแล้ว — กรุณารอ 1 ชม.</p>
            )}
            <button
              type="button"
              onClick={() => { setPhase("identifier"); setOtp(""); setOtpError(null); }}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              เปลี่ยนเบอร์/อีเมล
            </button>
          </div>
        </>
      )}

      {/* ── Phase C: New password ───────────────────────────────────────────── */}
      {phase === "newpass" && (
        <>
          <div>
            <h2 className="text-xl font-bold text-gray-900">ตั้งรหัสผ่านใหม่</h2>
            <p className="text-gray-500 text-sm mt-1">ต้องไม่ซ้ำกับรหัสผ่าน 3 รอบล่าสุด</p>
          </div>

          {pwErrors.general && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-sm text-red-700">{pwErrors.general}</p>
            </div>
          )}

          <form onSubmit={handleResetPassword} className="space-y-4" noValidate>
            {/* New password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                รหัสผ่านใหม่ <span className="text-red-500">*</span>
              </label>
              <PasswordInput
                placeholder="ตั้งรหัสผ่านใหม่"
                value={newPw}
                onChange={(e) => { setNewPw(e.target.value); if (pwErrors.newPw) setPwErrors((p) => { const c = { ...p }; delete c.newPw; return c; }); }}
                autoComplete="new-password"
                className={pwErrors.newPw ? "border-red-400 bg-red-50" : ""}
              />
              {pwErrors.newPw && <p className="text-red-500 text-xs mt-1">{pwErrors.newPw}</p>}
              {/* Strength */}
              {newPw.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < pwScore ? (pwScore <= 1 ? "bg-red-400" : pwScore <= 2 ? "bg-amber-400" : pwScore <= 3 ? "bg-yellow-400" : "bg-green-500") : "bg-gray-200"}`} />
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-x-4">
                    {pwChecks.map((c) => (
                      <p key={c.label} className={`text-xs ${c.ok ? "text-green-600" : "text-gray-400"}`}>
                        {c.ok ? "✓" : "○"} {c.label}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ยืนยันรหัสผ่านใหม่ <span className="text-red-500">*</span>
              </label>
              <PasswordInput
                placeholder="กรอกรหัสผ่านอีกครั้ง"
                value={newPwConfirm}
                onChange={(e) => { setNewPwConfirm(e.target.value); if (pwErrors.newPwConfirm) setPwErrors((p) => { const c = { ...p }; delete c.newPwConfirm; return c; }); }}
                autoComplete="new-password"
                className={pwErrors.newPwConfirm ? "border-red-400 bg-red-50" : ""}
              />
              {pwErrors.newPwConfirm && <p className="text-red-500 text-xs mt-1">{pwErrors.newPwConfirm}</p>}
              {!pwErrors.newPwConfirm && newPwConfirm && newPwConfirm === newPw && (
                <p className="text-green-600 text-xs mt-1">✓ รหัสผ่านตรงกัน</p>
              )}
            </div>

            <button
              type="submit"
              disabled={resetting}
              className="w-full bg-weeeu-primary hover:bg-weeeu-dark disabled:bg-weeeu-dark text-white font-semibold py-3.5 rounded-2xl transition-colors text-sm flex items-center justify-center gap-2"
            >
              {resetting ? <><span className="animate-spin">⟳</span> กำลังบันทึก...</> : "บันทึกรหัสผ่านใหม่ ✓"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
