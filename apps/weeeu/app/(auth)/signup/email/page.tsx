"use client";

import { useState } from "react";
import Link from "next/link";
import PasswordInput from "@/components/shared/PasswordInput";

// ─── Password validation rules ────────────────────────────────────────────────
function validatePassword(pw: string): string | null {
  if (pw.length < 8) return "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร";
  if (!/[a-z]/.test(pw)) return "ต้องมีตัวอักษรพิมพ์เล็ก (a-z)";
  if (!/[A-Z]/.test(pw)) return "ต้องมีตัวอักษรพิมพ์ใหญ่ (A-Z)";
  if (!/[0-9]/.test(pw)) return "ต้องมีตัวเลข (0-9)";
  return null;
}

function validateEmail(email: string): string | null {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? null : "รูปแบบ Email ไม่ถูกต้อง";
}
// ─────────────────────────────────────────────────────────────────────────────

export default function SignupEmailPage() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    password_confirm: "",
    accept_terms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [duplicateEmail, setDuplicateEmail] = useState(false);

  const set = (key: string, val: string | boolean) =>
    setForm((f) => ({ ...f, [key]: val }));

  const validate = () => {
    const e: Record<string, string> = {};
    const emailErr = validateEmail(form.email);
    if (emailErr) e.email = emailErr;
    const pwErr = validatePassword(form.password);
    if (pwErr) e.password = pwErr;
    if (form.password !== form.password_confirm)
      e.password_confirm = "รหัสผ่านไม่ตรงกัน";
    if (!form.accept_terms) e.accept_terms = "กรุณายอมรับข้อตกลงก่อนดำเนินการ";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDuplicateEmail(false);
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      // Production: POST /api/v1/auth/signup
      // Mock: simulate duplicate check
      await new Promise((r) => setTimeout(r, 800));
      // Simulate email duplicate (demo only — remove in production)
      if (form.email === "test@duplicate.com") { setDuplicateEmail(true); setLoading(false); return; }
      window.location.href = "/signup/otp";
    } catch {
      setLoading(false);
    }
  };

  const inputCls = (field: string) =>
    `w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
      errors[field] ? "border-red-400 bg-red-50" : "border-gray-200"
    }`;

  // ─── Password strength indicator ──────────────────────────────────────────
  const pwChecks = [
    { label: "อย่างน้อย 8 ตัว", ok: form.password.length >= 8 },
    { label: "มีตัวพิมพ์เล็ก (a-z)", ok: /[a-z]/.test(form.password) },
    { label: "มีตัวพิมพ์ใหญ่ (A-Z)", ok: /[A-Z]/.test(form.password) },
    { label: "มีตัวเลข (0-9)", ok: /[0-9]/.test(form.password) },
  ];
  const pwScore = pwChecks.filter((c) => c.ok).length;

  return (
    <div className="space-y-5">
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5, 6, 7].map((s) => (
          <div key={s} className={`h-1.5 flex-1 rounded-full ${s <= 2 ? "bg-blue-600" : "bg-gray-200"}`} />
        ))}
      </div>
      <p className="text-xs text-gray-400 -mt-3">ขั้นตอนที่ 2 จาก 7</p>

      <div>
        <h2 className="text-2xl font-bold text-gray-900">สร้างบัญชี</h2>
        <p className="text-gray-500 text-sm mt-1">กรอก Email และตั้งรหัสผ่าน</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            placeholder="email@example.com"
            value={form.email}
            onChange={(e) => { set("email", e.target.value); setDuplicateEmail(false); }}
            className={inputCls("email")}
            autoComplete="email"
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          {duplicateEmail && (
            <p className="text-amber-600 text-xs mt-1">
              Email นี้มีผู้ใช้แล้ว —{" "}
              <Link href="/login" className="font-semibold underline">เข้าสู่ระบบแทน</Link>
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            รหัสผ่าน <span className="text-red-500">*</span>
          </label>
          <PasswordInput
            placeholder="ตั้งรหัสผ่าน"
            value={form.password}
            onChange={(e) => set("password", e.target.value)}
            autoComplete="new-password"
            className={errors.password ? "border-red-400 bg-red-50" : ""}
          />
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
          {/* Strength indicator */}
          {form.password.length > 0 && (
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

        {/* Confirm password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ยืนยันรหัสผ่าน <span className="text-red-500">*</span>
          </label>
          <PasswordInput
            placeholder="กรอกรหัสผ่านอีกครั้ง"
            value={form.password_confirm}
            onChange={(e) => set("password_confirm", e.target.value)}
            autoComplete="new-password"
            className={errors.password_confirm ? "border-red-400 bg-red-50" : ""}
          />
          {errors.password_confirm && (
            <p className="text-red-500 text-xs mt-1">{errors.password_confirm}</p>
          )}
          {!errors.password_confirm && form.password_confirm && form.password_confirm === form.password && (
            <p className="text-green-600 text-xs mt-1">✓ รหัสผ่านตรงกัน</p>
          )}
        </div>

        {/* Terms checkbox */}
        <div>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.accept_terms}
              onChange={(e) => set("accept_terms", e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-xs text-gray-600 leading-relaxed">
              ฉันยอมรับ{" "}
              <Link href="/terms" className="text-blue-600 hover:underline font-medium">ข้อตกลงการใช้งาน</Link>{" "}
              และ{" "}
              <Link href="/privacy" className="text-blue-600 hover:underline font-medium">นโยบายความเป็นส่วนตัว</Link>{" "}
              ของ WeeeU
            </span>
          </label>
          {errors.accept_terms && (
            <p className="text-red-500 text-xs mt-1 ml-7">{errors.accept_terms}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3.5 rounded-2xl transition-colors text-sm flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="animate-spin text-lg">⟳</span> กำลังดำเนินการ...
            </>
          ) : (
            "ถัดไป →"
          )}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500">
        มีบัญชีแล้ว?{" "}
        <Link href="/login" className="text-blue-600 font-semibold hover:text-blue-800">
          เข้าสู่ระบบ
        </Link>
      </p>
      <div className="flex justify-center">
        <Link href="/signup/method" className="text-sm text-gray-400 hover:text-gray-600">
          ‹ กลับ
        </Link>
      </div>
    </div>
  );
}
