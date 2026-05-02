import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "ลืมรหัสผ่าน" };

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/login" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4">
          ← กลับ
        </Link>
        <h2 className="text-2xl font-bold text-gray-900">ลืมรหัสผ่าน</h2>
        <p className="text-gray-500 text-sm mt-1">
          กรอกเบอร์โทรศัพท์หรืออีเมล เราจะส่ง OTP ให้คุณ
        </p>
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
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        {/* Submit → OTP */}
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors duration-200"
        >
          ส่ง OTP
        </button>
      </form>

      {/* Info */}
      <div className="bg-blue-50 rounded-xl p-4">
        <p className="text-sm text-blue-700">
          💡 หากเบอร์โทร/อีเมลที่กรอกตรงกับบัญชีในระบบ คุณจะได้รับ OTP ภายใน 2 นาที
        </p>
      </div>
    </div>
  );
}
