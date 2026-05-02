import Link from "next/link";

const footerLinks = {
  ประกาศ: [
    { href: "/listings/resell", label: "ขายเครื่องใช้ไฟฟ้ามือสอง" },
    { href: "/listings/repair", label: "ซ่อมเครื่องใช้ไฟฟ้า" },
    { href: "/listings/maintain", label: "บำรุงรักษา" },
  ],
  "เกี่ยวกับ App3R": [
    { href: "/articles", label: "บทความ" },
    { href: "/products", label: "สินค้า" },
    { href: "/contact", label: "ติดต่อเรา" },
    { href: "/download", label: "ดาวน์โหลดแอป" },
  ],
  สมาชิก: [
    { href: "http://localhost:3002/register", label: "สมัคร WeeeU (ผู้ใช้ทั่วไป)" },
    { href: "/register/weeer", label: "สมัคร WeeeR (ร้านค้า/บริษัท)" },
    { href: "http://localhost:3002/login", label: "เข้าสู่ระบบ" },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">⚡</span>
              <span className="font-extrabold text-xl text-white">App3R</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              แพลตฟอร์มตัวกลางด้านเครื่องใช้ไฟฟ้าครบวงจร — ซื้อขาย ซ่อม บำรุงรักษา ในที่เดียว
            </p>
            <div className="flex gap-3">
              <a
                href="/download"
                className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-lg text-xs transition"
              >
                <span>📱</span> WeeeU App
              </a>
              <a
                href="/download"
                className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-lg text-xs transition"
              >
                <span>🔧</span> WeeeT App
              </a>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <h3 className="text-white font-semibold text-sm mb-4">{section}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-gray-400 hover:text-white text-sm transition"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>© 2026 App3R Platform. สงวนลิขสิทธิ์.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-gray-300 transition">นโยบายความเป็นส่วนตัว</Link>
            <Link href="/terms" className="hover:text-gray-300 transition">ข้อกำหนดการใช้งาน</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
