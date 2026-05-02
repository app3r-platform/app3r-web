import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "ดาวน์โหลดแอป App3R",
  description: "ดาวน์โหลดแอป WeeeU สำหรับผู้ใช้ทั่วไป และแอป WeeeT สำหรับช่างจาก App3R",
};

const apps = [
  {
    id: "weeeu",
    name: "WeeeU",
    tagline: "สำหรับผู้ใช้ทั่วไป",
    desc: "ลงประกาศขายเครื่องใช้ไฟฟ้ามือสอง จ้างซ่อม จองบำรุงรักษา และติดตามงานได้จากมือถือ",
    emoji: "👤",
    color: "from-blue-600 to-blue-700",
    features: [
      "ลงประกาศขาย/ซ่อม/บำรุงรักษา",
      "รับ offer จากร้านที่ผ่านการรับรอง",
      "ติดตามสถานะงานแบบ Real-time",
      "ระบบ Wallet Silver & Gold",
      "Notification แจ้งเตือนครบ",
    ],
    status: "coming-soon",
    platforms: ["iOS", "Android"],
  },
  {
    id: "weeet",
    name: "WeeeT",
    tagline: "สำหรับช่างมืออาชีพ",
    desc: "รับมอบหมายงาน นำทางไปหาลูกค้า บันทึกผลงาน และถ่ายรูปหลักฐานก่อน-หลัง",
    emoji: "🔧",
    color: "from-orange-500 to-orange-600",
    features: [
      "รับมอบหมายงานจากร้าน WeeeR",
      "แผนที่นำทางไปบ้านลูกค้า",
      "ถ่ายรูป/วิดีโอ ก่อน-หลัง",
      "รายงานผลและสถานะงาน",
      "รองรับโหมด WeeeR Impersonation",
    ],
    status: "coming-soon",
    platforms: ["iOS", "Android"],
  },
];

const webApps = [
  {
    name: "WeeeU Web",
    desc: "เวอร์ชัน Web สำหรับผู้ใช้ทั่วไป",
    href: "http://localhost:3002",
    emoji: "🌐",
    color: "border-blue-300 bg-blue-50",
    badge: "พร้อมใช้งาน",
    badgeColor: "bg-green-100 text-green-700",
  },
  {
    name: "WeeeR Web",
    desc: "เวอร์ชัน Web สำหรับร้านค้า/บริษัท",
    href: "http://localhost:3001",
    emoji: "🏪",
    color: "border-green-300 bg-green-50",
    badge: "พร้อมใช้งาน",
    badgeColor: "bg-green-100 text-green-700",
  },
];

export default function DownloadPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-purple-700">หน้าหลัก</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">ดาวน์โหลดแอป</span>
      </nav>

      <h1 className="text-3xl font-bold text-gray-900 mb-2">ดาวน์โหลดแอป App3R</h1>
      <p className="text-gray-500 mb-10">ใช้งานผ่านมือถือได้ทุกที่ทุกเวลา</p>

      {/* Mobile apps — Coming soon */}
      <div className="space-y-6 mb-12">
        {apps.map((app) => (
          <div
            key={app.id}
            className={`bg-gradient-to-r ${app.color} rounded-2xl p-6 text-white`}
          >
            <div className="flex flex-col sm:flex-row gap-5">
              <div className="flex-shrink-0 w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center text-5xl">
                {app.emoji}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-2xl font-extrabold">{app.name}</h2>
                  <span className="bg-yellow-400 text-gray-900 text-xs font-bold px-2 py-0.5 rounded-full">
                    เร็วๆ นี้
                  </span>
                </div>
                <p className="text-white/70 text-sm mb-1">{app.tagline}</p>
                <p className="text-white/90 text-sm mb-4">{app.desc}</p>
                <ul className="space-y-1 mb-5">
                  {app.features.map((f) => (
                    <li key={f} className="text-sm flex items-center gap-2 text-white/90">
                      <span className="text-white">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <div className="flex gap-3 flex-wrap">
                  {app.platforms.map((p) => (
                    <div
                      key={p}
                      className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2.5 rounded-xl cursor-not-allowed transition"
                    >
                      <span className="text-lg">{p === "iOS" ? "🍎" : "🤖"}</span>
                      <div>
                        <div className="text-xs text-white/70">เร็วๆ นี้ใน</div>
                        <div className="text-sm font-semibold">{p === "iOS" ? "App Store" : "Google Play"}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Web apps — Available now */}
      <div className="mb-10">
        <h2 className="text-xl font-bold text-gray-900 mb-2">ใช้งานผ่าน Web ได้ทันที</h2>
        <p className="text-gray-500 text-sm mb-5">ระหว่างรอแอปมือถือ ใช้เวอร์ชัน Web ได้เลย (responsive รองรับมือถือ)</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {webApps.map((w) => (
            <a
              key={w.name}
              href={w.href}
              className={`border-2 rounded-2xl p-5 hover:shadow-md transition ${w.color}`}
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">{w.emoji}</span>
                <div>
                  <div className="font-bold text-gray-900">{w.name}</div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${w.badgeColor}`}>
                    {w.badge}
                  </span>
                </div>
              </div>
              <p className="text-gray-600 text-sm">{w.desc}</p>
              <div className="mt-3 text-purple-700 text-sm font-semibold">เปิดในเบราว์เซอร์ →</div>
            </a>
          ))}
        </div>
      </div>

      {/* Notify me */}
      <div className="bg-purple-50 border border-purple-200 rounded-2xl p-6 text-center space-y-4">
        <h3 className="font-bold text-gray-900 text-lg">รับแจ้งเตือนเมื่อแอปพร้อม</h3>
        <p className="text-gray-600 text-sm">
          ใส่อีเมลของคุณ เราจะแจ้งเตือนทันทีเมื่อแอปมือถือพร้อมดาวน์โหลด
        </p>
        <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <input
            type="email"
            placeholder="your@email.com"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button className="bg-purple-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-purple-800 transition">
            แจ้งเตือนฉัน
          </button>
        </div>
      </div>
    </div>
  );
}
