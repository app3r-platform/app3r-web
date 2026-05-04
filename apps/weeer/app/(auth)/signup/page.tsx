"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Step indicator shared across signup flow
export function SignupSteps({ current }: { current: number }) {
  const steps = ["สมัคร", "ยืนยัน", "ประเภท", "ข้อมูล", "ที่อยู่", "ธนาคาร", "เอกสาร"];
  return (
    <div className="flex items-center justify-center gap-1 mb-6 px-2">
      {steps.map((s, i) => {
        const idx = i + 1;
        const done = idx < current;
        const active = idx === current;
        return (
          <div key={s} className="flex items-center">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
              ${done ? "bg-green-600 text-white" : active ? "bg-green-700 text-white ring-2 ring-green-200" : "bg-gray-200 text-gray-500"}`}>
              {done ? "✓" : idx}
            </div>
            {i < steps.length - 1 && (
              <div className={`w-4 h-0.5 ${done ? "bg-green-500" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "อย่างน้อย 8 ตัวอักษร", ok: password.length >= 8 },
    { label: "ตัวพิมพ์เล็ก a-z", ok: /[a-z]/.test(password) },
    { label: "ตัวพิมพ์ใหญ่ A-Z", ok: /[A-Z]/.test(password) },
    { label: "ตัวเลข 0-9", ok: /[0-9]/.test(password) },
  ];
  const score = checks.filter((c) => c.ok).length;
  const colors = ["bg-gray-200", "bg-red-400", "bg-yellow-400", "bg-blue-400", "bg-green-500"];
  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className={`h-1 flex-1 rounded-full transition-colors ${n <= score ? colors[score] : "bg-gray-200"}`} />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5">
        {checks.map((c) => (
          <span key={c.label} className={`text-xs ${c.ok ? "text-green-600" : "text-gray-400"}`}>
            {c.ok ? "✓" : "○"} {c.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", phone_number: "", password: "", confirm_password: "" });
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  function validate() {
    const e: Record<string, string> = {};
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = "รูปแบบอีเมลไม่ถูกต้อง";
    if (!form.phone_number.match(/^0[0-9]{9}$/)) e.phone_number = "เบอร์โทร 10 หลัก (เริ่มด้วย 0)";
    if (form.password.length < 8 || !/[a-z]/.test(form.password) || !/[A-Z]/.test(form.password) || !/[0-9]/.test(form.password))
      e.password = "รหัสผ่านไม่ผ่านเกณฑ์";
    if (form.password !== form.confirm_password) e.confirm_password = "รหัสผ่านไม่ตรงกัน";
    return e;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    // POST /api/v1/auth/signup
    setTimeout(() => { router.push("/signup/verify"); }, 800);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">♻️</div>
          <h1 className="text-2xl font-bold text-green-800">สมัครใช้งาน WeeeR</h1>
          <p className="text-sm text-gray-500 mt-1">สำหรับผู้ประกอบการซ่อม/รับซาก/ขายต่อ</p>
        </div>

        <SignupSteps current={1} />

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">อีเมล <span className="text-red-500">*</span></label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="example@email.com"
                className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 ${errors.email ? "border-red-400" : "border-gray-200"}`}
              />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">เบอร์โทรศัพท์ <span className="text-red-500">*</span></label>
              <input
                type="tel"
                value={form.phone_number}
                onChange={(e) => set("phone_number", e.target.value)}
                placeholder="0812345678"
                maxLength={10}
                className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 ${errors.phone_number ? "border-red-400" : "border-gray-200"}`}
              />
              {errors.phone_number && <p className="text-xs text-red-500 mt-1">{errors.phone_number}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่าน <span className="text-red-500">*</span></label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  placeholder="รหัสผ่าน"
                  className={`w-full border rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 ${errors.password ? "border-red-400" : "border-gray-200"}`}
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-2.5 text-gray-400 text-sm">
                  {showPw ? "ซ่อน" : "แสดง"}
                </button>
              </div>
              {form.password && <PasswordStrength password={form.password} />}
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ยืนยันรหัสผ่าน <span className="text-red-500">*</span></label>
              <input
                type="password"
                value={form.confirm_password}
                onChange={(e) => set("confirm_password", e.target.value)}
                placeholder="รหัสผ่านอีกครั้ง"
                className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 ${errors.confirm_password ? "border-red-400" : "border-gray-200"}`}
              />
              {errors.confirm_password && <p className="text-xs text-red-500 mt-1">{errors.confirm_password}</p>}
            </div>

            {/* Social login (D12 — disabled) */}
            <div className="pt-2 border-t border-gray-100">
              <button type="button" disabled className="w-full border border-gray-200 text-gray-300 text-sm py-2.5 rounded-xl cursor-not-allowed flex items-center justify-center gap-2">
                <span>🔒</span> เข้าสู่ระบบด้วย Google / Facebook (มาภายหลัง)
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60"
            >
              {loading ? "กำลังสมัคร…" : "สมัครใช้งาน"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500">
            มีบัญชีแล้ว?{" "}
            <Link href="/login" className="text-green-700 font-medium hover:underline">
              เข้าสู่ระบบ
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
