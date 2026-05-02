import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "ยืนยัน OTP" };

export default function OTPPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-2xl mb-4">
          <span className="text-3xl">📱</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">ยืนยัน OTP</h2>
        <p className="text-gray-500 text-sm mt-2">
          กรอกรหัส 6 หลักที่ส่งไปยัง
          <br />
          <span className="font-semibold text-gray-700">081-234-5678</span>
        </p>
      </div>

      <form className="space-y-6">
        {/* OTP Inputs */}
        <div className="flex justify-center gap-3">
          {[...Array(6)].map((_, i) => (
            <input
              key={i}
              type="text"
              maxLength={1}
              className="w-12 h-14 text-center text-xl font-bold border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              placeholder="·"
            />
          ))}
        </div>

        {/* Timer */}
        <div className="text-center">
          <p className="text-sm text-gray-500">
            หมดอายุใน{" "}
            <span className="font-semibold text-blue-600">01:58</span>
          </p>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors duration-200"
        >
          ยืนยัน OTP
        </button>
      </form>

      {/* Resend */}
      <div className="text-center space-y-2">
        <p className="text-sm text-gray-500">ไม่ได้รับ OTP?</p>
        <button
          type="button"
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          ส่ง OTP อีกครั้ง
        </button>
      </div>

      <div className="text-center">
        <Link href="/login" className="text-sm text-gray-400 hover:text-gray-600">
          ← เปลี่ยนเบอร์โทร/อีเมล
        </Link>
      </div>
    </div>
  );
}
