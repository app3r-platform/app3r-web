"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MockAnnoOrigin } from "@/components/MockAnno";
import { loginWithCredentials } from "@/lib/auth-shell";

export default function LoginPage() {
  const router = useRouter();
  // MOCKUP prefill — เอาออกตอนต่อ backend จริง
  const [form, setForm] = useState({ email: "company@example.com", password: "demo1234" });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [lockout, setLockout] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [remember, setRemember] = useState(true);

  // remember-me: อ่านค่าที่ persist ไว้ตอนเปิดหน้า (login ค้างไว้)
  useEffect(() => {
    const v = typeof window !== "undefined" ? localStorage.getItem("weeer_remember") : null;
    if (v !== null) setRemember(v === "1");
  }, []);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (lockout) return;
    if (!form.email || !form.password) { setError("กรุณากรอกอีเมลและรหัสผ่าน"); return; }
    setLoading(true);
    setError("");

    // POST /api/v1/auth/login via auth-shell (Wave1)
    const result = await loginWithCredentials(form.email, form.password);
    setLoading(false);

    if (result.ok) {
      // persist remember-me flag (mock — login ค้างไว้)
      if (typeof window !== "undefined") localStorage.setItem("weeer_remember", remember ? "1" : "0");
      router.push("/dashboard");
      return;
    }

    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    if (newAttempts >= 5) {
      setLockout(true);
      setError("ล็อคบัญชีชั่วคราว 30 นาที — ลองใหม่อีกครั้งในภายหลัง");
    } else {
      setError(result.error || `อีเมลหรือรหัสผ่านไม่ถูกต้อง (เหลือ ${5 - newAttempts} ครั้ง)`);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF1ED] to-[#FFF1ED] flex items-center justify-center px-4 py-10">
      <MockAnnoOrigin from="R-79" />
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <Image src="/logo/WeeeR.png" alt="WeeeR" width={72} height={72} priority />
          </div>
          <h1 className="text-2xl font-bold text-[#B8300E]">เข้าสู่ระบบ</h1>
          <p className="text-sm text-gray-500 mt-1">WeeeR — แพลตฟอร์มผู้ประกอบการ</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          {lockout && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600 flex items-start gap-2">
              <span className="text-lg shrink-0">🔒</span>
              <div>
                <strong>บัญชีถูกล็อคชั่วคราว</strong>
                <p className="mt-0.5">ลองผิดรหัสผ่านเกิน 5 ครั้ง — กรุณารอ 30 นาที หรือ{" "}
                  <Link href="/forgot-password" className="underline text-red-700">รีเซ็ตรหัสผ่าน</Link>
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">อีเมล</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="example@email.com"
                disabled={lockout}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF663A] disabled:bg-gray-50"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm font-medium text-gray-700">รหัสผ่าน</label>
                <Link href="/forgot-password" className="text-xs text-[#D63B12] hover:underline">ลืมรหัสผ่าน?</Link>
              </div>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  placeholder="รหัสผ่าน"
                  disabled={lockout}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 pr-16 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF663A] disabled:bg-gray-50"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-2.5 text-xs text-gray-400">
                  {showPw ? "ซ่อน" : "แสดง"}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                disabled={lockout}
                className="accent-[#FF663A] w-4 h-4"
              />
              จดจำการเข้าสู่ระบบ
            </label>

            {error && !lockout && <p className="text-sm text-red-500 text-center">{error}</p>}

            <button
              type="submit"
              disabled={loading || lockout}
              className="w-full bg-[#FF663A] hover:bg-[#F04E20] text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60"
            >
              {loading ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ"}
            </button>

            <div className="relative flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 shrink-0">หรือ</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
            {/* D12: social login disabled */}
            <button type="button" disabled className="w-full border border-gray-200 text-gray-300 text-sm py-2.5 rounded-xl cursor-not-allowed flex items-center justify-center gap-2">
              🔒 Google / Facebook (มาภายหลัง)
            </button>
          </form>

          <div className="pt-2 text-center text-sm text-gray-500">
            ยังไม่มีบัญชี?{" "}
            <Link href="/signup" className="text-[#D63B12] font-medium hover:underline">สมัครใช้งาน</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
