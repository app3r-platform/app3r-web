import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "เครื่องใช้ไฟฟ้า" };

const appliances = [
  {
    id: "1", icon: "❄️", name: "แอร์ห้องนอน", brand: "Mitsubishi Electric",
    model: "MSY-GN13VF", capacity: "13,000 BTU", installDate: "ม.ค. 65",
    status: "ปกติ", statusColor: "text-green-600 bg-green-50",
  },
  {
    id: "2", icon: "❄️", name: "แอร์ห้องแขก", brand: "Daikin",
    model: "FTKQ25SV2S", capacity: "9,000 BTU", installDate: "มี.ค. 66",
    status: "แจ้งซ่อมแล้ว", statusColor: "text-orange-600 bg-orange-50",
  },
  {
    id: "3", icon: "🫧", name: "เครื่องซักผ้า", brand: "LG",
    model: "T2108VSAM", capacity: "8 KG", installDate: "ก.พ. 64",
    status: "ปกติ", statusColor: "text-green-600 bg-green-50",
  },
  {
    id: "4", icon: "🧊", name: "ตู้เย็น Sharp", brand: "Sharp",
    model: "SJ-X420TP-SL", capacity: "420 ลิตร", installDate: "ธ.ค. 63",
    status: "ประกาศขาย", statusColor: "text-blue-600 bg-blue-50",
  },
];

export default function AppliancesPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">เครื่องใช้ไฟฟ้า</h1>
        <Link
          href="/appliances/add"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
        >
          + เพิ่มเครื่อง
        </Link>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "ทั้งหมด", count: 4, icon: "🔌", color: "bg-blue-50 text-blue-700" },
          { label: "ปกติ", count: 2, icon: "✅", color: "bg-green-50 text-green-700" },
          { label: "มีปัญหา/ประกาศ", count: 2, icon: "⚠️", color: "bg-orange-50 text-orange-700" },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl p-4 ${s.color} text-center`}>
            <p className="text-2xl mb-1">{s.icon}</p>
            <p className="text-2xl font-bold">{s.count}</p>
            <p className="text-xs font-medium mt-0.5 opacity-80">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="flex gap-3">
        <input
          type="search"
          placeholder="ค้นหาเครื่องใช้ไฟฟ้า..."
          className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option>ทุกประเภท</option>
          <option>แอร์</option>
          <option>ตู้เย็น</option>
          <option>เครื่องซักผ้า</option>
          <option>อื่นๆ</option>
        </select>
      </div>

      {/* Appliance list */}
      <div className="space-y-3">
        {appliances.map((app) => (
          <div
            key={app.id}
            className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-start gap-4 hover:border-blue-200 transition-colors"
          >
            {/* Icon */}
            <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0">
              {app.icon}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-900">{app.name}</p>
                  <p className="text-sm text-gray-500">{app.brand} · {app.model}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-400">📦 {app.capacity}</span>
                    <span className="text-xs text-gray-400">📅 ติดตั้ง {app.installDate}</span>
                  </div>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${app.statusColor}`}>
                  {app.status}
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-3">
                <button className="text-xs px-3 py-1.5 border border-blue-200 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  🔧 แจ้งซ่อม
                </button>
                <button className="text-xs px-3 py-1.5 border border-green-200 text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                  💰 ลงขาย
                </button>
                <button className="text-xs px-3 py-1.5 border border-gray-200 text-gray-500 hover:bg-gray-50 rounded-lg transition-colors">
                  ✏️ แก้ไข
                </button>
                <button className="text-xs px-3 py-1.5 border border-red-200 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                  🗑️ ลบ
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add appliance CTA */}
      <Link
        href="/appliances/add"
        className="w-full flex flex-col items-center justify-center gap-2 py-8 border-2 border-dashed border-blue-200 rounded-2xl text-blue-400 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
      >
        <span className="text-3xl">➕</span>
        <span className="text-sm font-medium">เพิ่มเครื่องใช้ไฟฟ้าใหม่</span>
        <span className="text-xs opacity-70">ลงทะเบียนเครื่องเพื่อใช้บริการครบวงจร</span>
      </Link>
    </div>
  );
}
