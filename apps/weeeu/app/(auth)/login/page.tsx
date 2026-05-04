"use client";

import { useState } from "react";
import Link from "next/link";
import PasswordInput from "@/components/shared/PasswordInput";

const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 30;

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<Date | null>(null);

  const isLocked = lockedUntil ? new Date() < lockedUntil : false;
  const lockMinsLeft = lockedUntil
    ? Math.ceil((lockedUntil.getTime() - Date.now()) / 60000)
    : 0;

  const set = (key: string, val: string) => {
    setForm((f) => ({ ...f, [key]: val }));
    if (errors[key]) setErrors((e) => { const c = { ...e }; delete c[key]; return c; });
    if (errors.general) setErrors((e) => { const c = { ...e }; delete c.general; return c; });
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.email) e.email = "กรุณากรอก Email";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "รูปแบบ Email ไม่ถูกต้อง";
    if (!form.password) e.password = "กรุณากรอกรหัสผ่าน";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      // Production: POST /api/v1/auth/login
      await new Promise((r) => setTimeout(r, 800));
      // Simulate failed login (demo)
      if (form.password !== "Correct1") {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        if (newAttempts >= MAX_ATTEMPTS) {
          const until = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
          setLockedUntil(until);
          setErrors({ general: `เข้าสู่ระบบผิดพลาดเกิน ${MAX_ATTEMPTS} ครั้ง — บัญชีถูกล็อคชั่วคราว ${LOCKOUT_MINUTES} นาที` });
        } else {
          setErrors({
            general: `อีเมลหรือรหัสผ่านไม่ถูกต้อง (ครั้งที่ ${newAttempts}/${MAX_ATTEMPTS})`,
          });
        }
        return;
      }
      // Success → redirect
      window.location.href = "/dashboard";
    } finally {
      setLoading(false);
    }
  };

  const inputCls = (field: string) =>
    `w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
      errors[field] ? "border-red-400 bg-red-50" : "border-gray-200"
    }`;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">เข้าสู่ระบบ</h2>
        <p className="text-gray-500 text-sm mt-1">ยินดีต้อนรับกลับมา</p>
      </div>

      {/* Lockout banner */}
      {isLocked && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
          <p className="text-sm font-semibold text-red-700">🔒 บัญชีถูกล็อคชั่วคราว</p>
          <p className="text-xs text-red-600 mt-1">
            กรุณารอ {lockMinsLeft} นาทีก่อนลองอีกครั้ง
          </p>
        </div>
      )}

      {/* General error */}
      {errors.general && !isLocked && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-3">
          <p className="text-sm text-red-700">{errors.general}</p>
          {attempts > 0 && attempts < MAX_ATTEMPTS && (
            <p className="text-xs text-red-500 mt-1">
              เหลืออีก {MAX_ATTEMPTS - attempts} ครั้งก่อนล็อคบัญชี
            </p>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            placeholder="email@example.com"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            className={inputCls("email")}
            autoComplete="email"
            disabled={isLocked || loading}
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700">รหัสผ่าน</label>
            <Link
              href="/forgot-password"
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              ลืมรหัสผ่าน?
            </Link>
          </div>
          <PasswordInput
            placeholder="รหัสผ่านของคุณ"
            value={form.password}
            onChange={(e) => set("password", e.target.value)}
            className={errors.password ? "border-red-400 bg-red-50" : ""}
            autoComplete="current-password"
          />
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
        </div>

        <button
          type="submit"
          disabled={loading || isLocked}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3.5 rounded-2xl transition-colors text-sm flex items-center justify-center gap-2"
        >
          {loading ? <><span className="animate-spin">⟳</span> กำลังเข้าสู่ระบบ...</> : "เข้าสู่ระบบ"}
        </button>
      </form>

      {/* Divider */}
      <div className="relative flex items-center">
        <div className="flex-grow border-t border-gray-200" />
        <span className="mx-4 text-xs text-gray-400">หรือ</span>
        <div className="flex-grow border-t border-gray-200" />
      </div>

      {/* Social login — D12 disabled */}
      <div className="space-y-2">
        {[
          { icon: "🔴", label: "เข้าสู่ระบบด้วย Google" },
          { icon: "🔵", label: "เข้าสู่ระบบด้วย Facebook" },
        ].map((s) => (
          <div
            key={s.label}
            title="เร็วๆ นี้จะมา (post-Phase 2b)"
            className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-2xl py-3 text-sm font-medium text-gray-300 cursor-not-allowed select-none bg-gray-50"
          >
            <span className="text-lg opacity-40">{s.icon}</span>
            <span>{s.label}</span>
            <span className="ml-auto mr-4 text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">เร็วๆ นี้</span>
          </div>
        ))}
      </div>

      <p className="text-center text-sm text-gray-500">
        ยังไม่มีบัญชี?{" "}
        <Link href="/signup/method" className="text-blue-600 font-semibold hover:text-blue-800">
          สมัครสมาชิกฟรี
        </Link>
      </p>
    </div>
  );
}
