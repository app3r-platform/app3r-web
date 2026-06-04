"use client";
// ─── U-65: บัญชีถูกระงับ (OTP ผิดเกินกำหนด) — WP-0 ──────────────────────────────
// แสดงเมื่อกรอก OTP ผิดครบ 3 ครั้ง (ถอนพอยต์ / จัดการข้อมูลผู้ใช้)
// → ระงับ + แจ้ง admin + ลิงก์ส่งข้อความถึง admin เพื่อปลดล็อก (mock UI · logic BE)

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const REASON_LABEL: Record<string, string> = {
  otp: "กรอกรหัส OTP ไม่ถูกต้องเกินจำนวนครั้งที่กำหนด (3 ครั้ง)",
  default: "ตรวจพบกิจกรรมที่ผิดปกติเพื่อความปลอดภัยของบัญชี",
};

export default function SuspendedPage() {
  const params = useSearchParams();
  const reason = params.get("reason") ?? "default";
  const from = params.get("from") ?? "";
  const [sent, setSent] = useState(false);

  return (
    <div className="space-y-5">
      <div className="bg-red-50 border border-red-100 rounded-2xl p-8 text-center space-y-3">
        <p className="text-5xl">🔒</p>
        <h1 className="text-xl font-bold text-red-800">บัญชีถูกระงับชั่วคราว</h1>
        <p className="text-sm text-red-600">{REASON_LABEL[reason] ?? REASON_LABEL.default}</p>
        {from && <p className="text-xs text-red-400">(จากขั้นตอน: {from})</p>}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-800">เกิดอะไรขึ้น?</h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          เพื่อความปลอดภัยของบัญชีและทรัพย์สิน (พอยต์) ของคุณ ระบบได้ระงับการทำรายการชั่วคราว
          และได้แจ้งผู้ดูแลระบบ (admin) ให้ทราบแล้ว คุณสามารถส่งข้อความถึงผู้ดูแลระบบเพื่อขอปลดล็อกบัญชีได้
        </p>
      </div>

      {/* ลิงก์ส่งข้อความถึง admin เพื่อปลดล็อก */}
      {sent ? (
        <div className="bg-green-50 border border-green-100 rounded-2xl p-5 text-center space-y-1">
          <p className="text-2xl">✅</p>
          <p className="text-sm font-semibold text-green-800">ส่งคำขอปลดล็อกแล้ว</p>
          <p className="text-xs text-green-600">ผู้ดูแลระบบจะตรวจสอบและติดต่อกลับโดยเร็วที่สุด</p>
        </div>
      ) : (
        <button
          onClick={() => setSent(true)}
          className="w-full bg-weeeu-primary hover:bg-weeeu-dark text-white font-semibold py-3.5 rounded-2xl text-sm transition-colors"
        >
          ✉️ ส่งข้อความถึงผู้ดูแลระบบเพื่อปลดล็อก
        </button>
      )}

      <Link
        href="/dashboard"
        className="block text-center text-sm text-gray-500 hover:text-gray-700 py-2"
      >
        กลับหน้าหลัก
      </Link>

      <p className="text-xs text-center text-gray-400">* Mockup — การปลดล็อกจริงจัดการโดยผู้ดูแลระบบ (BE)</p>
    </div>
  );
}
