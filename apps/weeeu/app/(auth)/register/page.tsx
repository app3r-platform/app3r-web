import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "สมัครสมาชิก" };

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">สมัครสมาชิก</h2>
        <p className="text-gray-500 text-sm mt-1">สร้างบัญชี WeeeU ของคุณ</p>
      </div>

      <form className="space-y-4">
        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ-นามสกุล</label>
          <input
            type="text"
            placeholder="กรอกชื่อ-นามสกุล"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">เบอร์โทรศัพท์</label>
          <input
            type="tel"
            placeholder="0812345678"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">อีเมล (ไม่บังคับ)</label>
          <input
            type="email"
            placeholder="email@example.com"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่าน</label>
          <input
            type="password"
            placeholder="อย่างน้อย 8 ตัวอักษร"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ยืนยันรหัสผ่าน</label>
          <input
            type="password"
            placeholder="ยืนยันรหัสผ่านอีกครั้ง"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        {/* Terms */}
        <div className="flex items-start gap-3">
          <input type="checkbox" id="terms" className="mt-0.5 accent-blue-600" />
          <label htmlFor="terms" className="text-sm text-gray-600">
            ฉันยอมรับ{" "}
            <span className="text-blue-600 cursor-pointer hover:underline">เงื่อนไขการใช้งาน</span>
            {" "}และ{" "}
            <span className="text-blue-600 cursor-pointer hover:underline">นโยบายความเป็นส่วนตัว</span>
          </label>
        </div>

        {/* Submit → goes to OTP */}
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors duration-200"
        >
          สมัครสมาชิก
        </button>
      </form>

      <p className="text-center text-sm text-gray-500">
        มีบัญชีอยู่แล้ว?{" "}
        <Link href="/login" className="text-blue-600 hover:text-blue-800 font-semibold">
          เข้าสู่ระบบ
        </Link>
      </p>
    </div>
  );
}
