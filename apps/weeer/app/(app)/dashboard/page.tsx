import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Dashboard — WeeeR" };

const STATS = [
  { label: "Silver",        value: "4,250",  suffix: "pts", icon: "🪙", bg: "bg-gray-50" },
  { label: "Gold",          value: "1,800",  suffix: "pts", icon: "⭐", bg: "bg-yellow-50" },
  { label: "งานเดือนนี้",   value: "37",     suffix: "งาน", icon: "📋", bg: "bg-blue-50" },
  { label: "WeeeT Active",  value: "3",      suffix: "คน",  icon: "👷", bg: "bg-green-50" },
];

const PENDING_JOBS = [
  { id: "JOB-0501", type: "ซ่อม", title: "ซ่อมแอร์บ้าน Mitsubishi 12K BTU", customer: "สมชาย ใจดี" },
  { id: "JOB-0500", type: "บำรุง", title: "บำรุงรักษาแอร์ประจำปี 3 ตัว", customer: "ร้าน ABC" },
  { id: "JOB-0499", type: "ซาก", title: "รับซื้อซากแอร์เก่า 5 ตัว", customer: "วิชัย มั่นใจ" },
];

const WEET_LIST = [
  { name: "นายสมชาย ช่างดี",  mode: "Mode 1 (ฟรี)", status: "active" },
  { name: "นายวิทยา ซ่อมเก่ง", mode: "Mode 2 (เช่า)", status: "active" },
  { name: "นายประยุทธ์ แก้ไว",  mode: "Mode 2 (เช่า)", status: "awaiting" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">สวัสดี, บริษัท ช่างเย็น จำกัด 👋</h1>
        <p className="text-sm text-gray-500 mt-0.5">ภาพรวมธุรกิจของคุณวันนี้</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((s) => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-4 border border-gray-100`}>
            <div className="text-xl mb-2">{s.icon}</div>
            <div className="text-2xl font-bold text-gray-900">{s.value}<span className="text-sm font-normal text-gray-500 ml-1">{s.suffix}</span></div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Alert: WeeeT awaiting */}
      <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-sm">
        <span>⚠️</span>
        <span className="text-yellow-800">มี WeeeT <strong>1 คน</strong> รอ Admin อนุมัติ</span>
        <Link href="/staff" className="ml-auto text-yellow-700 underline text-xs">ดู</Link>
      </div>

      {/* 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Job Queue */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">คิวงานรอจัดสรร</h3>
            <Link href="/jobs/queue" className="text-xs text-green-700 hover:underline">ทั้งหมด →</Link>
          </div>
          <div className="space-y-2">
            {PENDING_JOBS.map((j) => (
              <div key={j.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50">
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">{j.type}</span>
                <span className="flex-1 text-sm text-gray-800 truncate">{j.title}</span>
                <span className="text-xs text-gray-400 shrink-0">{j.customer}</span>
              </div>
            ))}
          </div>
        </div>

        {/* WeeeT */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">ทีมช่าง (WeeeT)</h3>
            <Link href="/staff" className="text-xs text-green-700 hover:underline">จัดการ →</Link>
          </div>
          <div className="space-y-2">
            {WEET_LIST.map((w) => (
              <div key={w.name} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-xs font-bold text-green-700 shrink-0">{w.name.charAt(0)}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800 truncate">{w.name}</div>
                  <div className="text-xs text-gray-400">{w.mode}</div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${w.status === "active" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                  {w.status === "active" ? "Active" : "รออนุมัติ"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
