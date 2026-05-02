import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "เพิ่มเครื่องใช้ไฟฟ้า" };

const categories = [
  { id: "ac", icon: "❄️", label: "แอร์" },
  { id: "fridge", icon: "🧊", label: "ตู้เย็น" },
  { id: "washer", icon: "🫧", label: "เครื่องซักผ้า" },
  { id: "tv", icon: "📺", label: "โทรทัศน์" },
  { id: "micro", icon: "📡", label: "ไมโครเวฟ" },
  { id: "water", icon: "💧", label: "เครื่องทำน้ำร้อน" },
  { id: "other", icon: "🔌", label: "อื่นๆ" },
];

export default function AddAppliancePage() {
  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/appliances" className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
          ←
        </Link>
        <h1 className="text-xl font-bold text-gray-900">เพิ่มเครื่องใช้ไฟฟ้า</h1>
      </div>

      <form className="space-y-5">
        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">ประเภทเครื่องใช้ไฟฟ้า</label>
          <div className="grid grid-cols-4 gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className="flex flex-col items-center gap-1 p-3 border-2 border-gray-100 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all"
              >
                <span className="text-2xl">{cat.icon}</span>
                <span className="text-xs font-medium text-gray-600">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อเครื่อง (ตั้งเอง)</label>
          <input
            type="text"
            placeholder="เช่น แอร์ห้องนอน, ตู้เย็นครัว"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        {/* Brand */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ยี่ห้อ</label>
            <input
              type="text"
              placeholder="เช่น Mitsubishi, LG"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">รุ่น</label>
            <input
              type="text"
              placeholder="เช่น MSY-GN13VF"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>

        {/* Install date */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">วันที่ติดตั้ง</label>
            <input
              type="date"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ราคาที่ซื้อ (บาท)</label>
            <input
              type="number"
              placeholder="0"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>

        {/* Serial / warranty */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
            <input
              type="text"
              placeholder="ไม่บังคับ"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">วันหมดประกัน</label>
            <input
              type="date"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-500"
            />
          </div>
        </div>

        {/* Photo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">รูปภาพเครื่อง</label>
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-blue-300 cursor-pointer transition-colors">
            <span className="text-3xl">📷</span>
            <p className="text-sm text-gray-500 mt-2">คลิกเพื่ออัปโหลดรูป</p>
            <p className="text-xs text-gray-400 mt-1">JPG, PNG สูงสุด 5MB</p>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุ (ไม่บังคับ)</label>
          <textarea
            placeholder="รายละเอียดเพิ่มเติม..."
            rows={3}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
          />
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <Link
            href="/appliances"
            className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 text-center"
          >
            ยกเลิก
          </Link>
          <button
            type="submit"
            className="flex-[2] py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            บันทึกเครื่องใช้ไฟฟ้า
          </button>
        </div>
      </form>
    </div>
  );
}
