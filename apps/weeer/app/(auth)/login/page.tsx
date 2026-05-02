import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "เข้าสู่ระบบ — WeeeR" };

export default function LoginPage() {
  return (
    <>
      <h2 className="text-xl font-bold text-gray-900 mb-6">เข้าสู่ระบบ</h2>
      <form className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">อีเมล</label>
          <input type="email" placeholder="company@example.com"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่าน</label>
          <input type="password" placeholder="••••••••"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" />
        </div>
        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-xs text-green-700 hover:underline">ลืมรหัสผ่าน?</Link>
        </div>
        <button type="submit"
          className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-3 rounded-xl transition-colors">
          เข้าสู่ระบบ
        </button>
      </form>
      <p className="text-center text-sm text-gray-500 mt-6">
        ยังไม่มีบัญชี?{" "}
        <Link href="/register" className="text-green-700 font-semibold hover:underline">สมัครสมาชิก</Link>
      </p>
    </>
  );
}
