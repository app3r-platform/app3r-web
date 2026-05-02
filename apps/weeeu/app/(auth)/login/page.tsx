import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "เข้าสู่ระบบ" };

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">เข้าสู่ระบบ</h2>
        <p className="text-gray-500 text-sm mt-1">ยินดีต้อนรับกลับมา</p>
      </div>

      <form className="space-y-4">
        {/* Phone / Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            เบอร์โทรศัพท์ หรือ อีเมล
          </label>
          <input
            type="text"
            placeholder="0812345678 หรือ email@example.com"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่าน</label>
          <div className="relative">
            <input
              type="password"
              placeholder="รหัสผ่านของคุณ"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm pr-12"
            />
            <button
              type="button"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              👁
            </button>
          </div>
        </div>

        {/* Forgot password */}
        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            ลืมรหัสผ่าน?
          </Link>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors duration-200"
        >
          เข้าสู่ระบบ
        </button>
      </form>

      {/* Divider */}
      <div className="relative flex items-center">
        <div className="flex-grow border-t border-gray-200" />
        <span className="mx-4 text-sm text-gray-400">หรือ</span>
        <div className="flex-grow border-t border-gray-200" />
      </div>

      {/* Social Login (placeholder) */}
      <button
        type="button"
        className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-xl py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <span className="text-lg">🔷</span>
        เข้าสู่ระบบด้วย LINE
      </button>

      {/* Register link */}
      <p className="text-center text-sm text-gray-500">
        ยังไม่มีบัญชี?{" "}
        <Link href="/register" className="text-blue-600 hover:text-blue-800 font-semibold">
          สมัครสมาชิก
        </Link>
      </p>
    </div>
  );
}
