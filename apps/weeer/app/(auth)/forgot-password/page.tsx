import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "ลืมรหัสผ่าน — WeeeR" };

export default function ForgotPasswordPage() {
  return (
    <>
      <Link href="/login" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
        ← กลับ
      </Link>
      <h2 className="text-xl font-bold text-gray-900 mb-2">ลืมรหัสผ่าน?</h2>
      <p className="text-sm text-gray-500 mb-6">กรอกอีเมลที่ลงทะเบียนไว้ เราจะส่งลิงก์รีเซ็ตให้</p>
      <form className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">อีเมล</label>
          <input type="email" placeholder="company@example.com" required
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" />
        </div>
        <button type="submit"
          className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-3 rounded-xl transition-colors">
          ส่งลิงก์รีเซ็ตรหัสผ่าน
        </button>
      </form>
    </>
  );
}
