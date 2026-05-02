import type { Metadata } from "next";

export const metadata: Metadata = { title: "ตั้งค่าโปรไฟล์" };

// Onboarding wizard — 3 steps:
// Step 1: รูปโปรไฟล์ + ชื่อ
// Step 2: ที่อยู่
// Step 3: ความสนใจ (เครื่องใช้ไฟฟ้าที่มี)

export default function OnboardingPage() {
  return (
    <div className="space-y-6">
      {/* Progress */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">ตั้งค่าโปรไฟล์</span>
          <span className="text-sm text-gray-400">ขั้นตอน 1 / 3</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div className="bg-blue-600 h-2 rounded-full transition-all duration-500" style={{ width: "33%" }} />
        </div>
        {/* Step indicators */}
        <div className="flex justify-between mt-3">
          {["โปรไฟล์", "ที่อยู่", "เครื่องใช้ไฟฟ้า"].map((label, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  i === 0
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {i + 1}
              </div>
              <span className={`text-xs ${i === 0 ? "text-blue-600 font-medium" : "text-gray-400"}`}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Profile */}
      <div className="space-y-5">
        <h2 className="text-xl font-bold text-gray-900">รูปโปรไฟล์ของคุณ</h2>

        {/* Avatar upload */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-24 h-24 rounded-full bg-blue-50 border-2 border-dashed border-blue-200 flex items-center justify-center cursor-pointer hover:bg-blue-100 transition-colors">
            <div className="text-center">
              <span className="text-3xl">📷</span>
              <p className="text-xs text-blue-500 mt-1">อัปโหลด</p>
            </div>
          </div>
          <p className="text-xs text-gray-400">JPG, PNG ขนาดไม่เกิน 5MB</p>
        </div>

        {/* Nickname */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อเล่น / ชื่อที่แสดง</label>
          <input
            type="text"
            placeholder="เช่น สมชาย, นิ่ม, แพท"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        {/* Birth date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">วันเกิด (ไม่บังคับ)</label>
          <input
            type="date"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-500"
          />
        </div>

        {/* Gender */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">เพศ (ไม่บังคับ)</label>
          <div className="grid grid-cols-3 gap-2">
            {["ชาย", "หญิง", "ไม่ระบุ"].map((g) => (
              <button
                key={g}
                type="button"
                className="py-2 px-3 rounded-xl border border-gray-200 text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-all"
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          ข้ามไปก่อน
        </button>
        <button
          type="button"
          className="flex-[2] py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          ถัดไป →
        </button>
      </div>
    </div>
  );
}
