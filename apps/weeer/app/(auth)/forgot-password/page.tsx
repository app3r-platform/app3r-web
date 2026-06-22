import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

export const metadata: Metadata = { title: "ลืมรหัสผ่าน — WeeeR" };

export default function ForgotPasswordPage() {
  return (
    <>
      <Link href="/login" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
        ← กลับ
      </Link>
      <h2 className="text-xl font-bold text-gray-900 mb-2">ลืมรหัสผ่าน?</h2>
      <p className="text-sm text-gray-500 mb-6">กรอกอีเมลที่ลงทะเบียนไว้ เราจะส่งลิงก์รีเซ็ตให้</p>
      <ForgotPasswordForm />
    </>
  );
}
