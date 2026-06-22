"use client";

import { useState } from "react";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSent(true);
  }

  if (sent) {
    return (
      <div className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700">
          ✅ ส่งลิงก์รีเซ็ตแล้ว
          <p className="text-xs text-green-600 mt-1">
            กรุณาตรวจสอบอีเมล {email || "ที่ลงทะเบียนไว้"} เพื่อรีเซ็ตรหัสผ่าน
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">อีเมล</label>
        <input type="email" placeholder="company@example.com" required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF663A] text-sm" />
      </div>
      <button type="submit"
        className="w-full bg-[#FF663A] hover:bg-[#F04E20] text-white font-semibold py-3 rounded-xl transition-colors">
        ส่งลิงก์รีเซ็ตรหัสผ่าน
      </button>
    </form>
  );
}
