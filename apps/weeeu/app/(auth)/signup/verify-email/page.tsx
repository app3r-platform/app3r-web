"use client";

import { useState } from "react";
import Link from "next/link";

export default function VerifyEmailPage() {
  // In production: email comes from session/query param
  const email = "your@email.com";
  const [resent, setResent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleResend = async () => {
    if (cooldown > 0 || loading) return;
    setLoading(true);
    // Production: POST /api/v1/auth/verify-email (resend)
    await new Promise((r) => setTimeout(r, 700));
    setLoading(false);
    setResent(true);
    setCooldown(60);
    const t = setInterval(() => setCooldown((c) => {
      if (c <= 1) { clearInterval(t); return 0; }
      return c - 1;
    }), 1000);
  };

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5, 6, 7].map((s) => (
          <div key={s} className={`h-1.5 flex-1 rounded-full ${s <= 4 ? "bg-blue-600" : "bg-gray-200"}`} />
        ))}
      </div>
      <p className="text-xs text-gray-400 -mt-4">ขั้นตอนที่ 4 จาก 7</p>

      {/* Icon + heading */}
      <div className="text-center space-y-4">
        <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center text-4xl mx-auto shadow-inner">
          ✉️
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">ตรวจสอบ Email ของคุณ</h2>
          <p className="text-gray-500 text-sm mt-2">
            เราส่งลิงก์ยืนยันไปที่
          </p>
          <p className="font-semibold text-blue-700 text-sm mt-1 break-all">{email}</p>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 rounded-2xl p-4 space-y-2">
        <p className="text-sm font-semibold text-blue-800">วิธียืนยัน Email:</p>
        <ol className="space-y-1 text-sm text-blue-700">
          <li className="flex items-start gap-2"><span className="font-bold">1.</span> เปิด inbox Email ของคุณ</li>
          <li className="flex items-start gap-2"><span className="font-bold">2.</span> หาอีเมลจาก WeeeU</li>
          <li className="flex items-start gap-2"><span className="font-bold">3.</span> คลิกลิงก์ "ยืนยัน Email" ในอีเมล</li>
          <li className="flex items-start gap-2"><span className="font-bold">4.</span> กลับมายืนยันที่นี่</li>
        </ol>
      </div>

      {/* Success state after resend */}
      {resent && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-3 text-center">
          <p className="text-sm text-green-700">✅ ส่งลิงก์ใหม่แล้ว — กรุณาตรวจสอบ inbox</p>
        </div>
      )}

      {/* Resend button */}
      <div className="space-y-3">
        <button
          onClick={handleResend}
          disabled={cooldown > 0 || loading}
          className="w-full border-2 border-blue-600 text-blue-600 hover:bg-blue-50 disabled:border-gray-300 disabled:text-gray-400 font-semibold py-3.5 rounded-2xl transition-colors text-sm flex items-center justify-center gap-2"
        >
          {loading ? (
            <><span className="animate-spin">⟳</span> กำลังส่ง...</>
          ) : cooldown > 0 ? (
            `ส่งลิงก์ใหม่ได้ใน ${cooldown} วิ`
          ) : (
            "📤 ส่งลิงก์ยืนยันอีกครั้ง"
          )}
        </button>

        {/* Simulate email verified (demo only) */}
        <Link
          href="/signup/personal"
          className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-2xl text-center transition-colors text-sm"
        >
          ยืนยัน Email แล้ว → ถัดไป
        </Link>
      </div>

      <div className="text-center space-y-2">
        <p className="text-xs text-gray-400">
          ไม่พบ Email? ตรวจสอบโฟลเดอร์ Spam/Junk
        </p>
        <div className="flex justify-center">
          <Link href="/signup/otp" className="text-sm text-gray-400 hover:text-gray-600">
            ‹ กลับ
          </Link>
        </div>
      </div>
    </div>
  );
}
