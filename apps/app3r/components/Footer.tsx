import Link from "next/link";
import { footerContent } from "@/lib/content/footer";
import { getSocialLinks } from "@/lib/content-api";
import { crossAppUrls } from "@/lib/config/urls";
import { SocialIcon } from "@/components/common";

const footerLinks = {
  ประกาศ: [
    { href: "/listings/resell", label: "ขายเครื่องใช้ไฟฟ้ามือสอง" },
    { href: "/listings/repair", label: "ซ่อมเครื่องใช้ไฟฟ้า" },
    { href: "/listings/maintain", label: "บำรุงรักษา" },
  ],
  "เกี่ยวกับ App3R": [
    { href: "/about", label: "เกี่ยวกับเรา" },
    { href: "/faq", label: "คำถามที่พบบ่อย" },
    { href: "/articles", label: "บทความ" },
    { href: "/contact", label: "ติดต่อเรา" },
  ],
  // Round 2: cross-app links ผ่าน crossAppUrls (เลิก hardcode localhost)
  // WeeeU สมัคร → /signup/email (canonical · เดิมชี้ /register = 404)
  สมาชิก: [
    { href: crossAppUrls.weeeu.signup, label: "สมัคร WeeeU (ผู้ใช้ทั่วไป)", external: true },
    { href: "/register/weeer", label: "สมัคร WeeeR (ร้านค้า/บริษัท)", external: false },
    { href: crossAppUrls.weeeu.login, label: "เข้าสู่ระบบ WeeeU", external: true },
    { href: crossAppUrls.weeer.login, label: "เข้าสู่ระบบ WeeeR", external: true },
    { href: crossAppUrls.weeet.login, label: "เข้าสู่ระบบ WeeeT", external: true },
  ],
};


export default async function Footer() {
  const year = new Date().getFullYear();
  const copyright = footerContent.copyrightTemplate.replace('{year}', String(year));

  // W-3-C Sub-C.4: Social links จาก CMS — fallback to static (ใน getSocialLinks)
  // ซ่อน link ที่ url ว่างเปล่า (อยู่ใน getSocialLinks ด้วย)
  const socialLinks = await getSocialLinks();

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
              {footerContent.tagline}
            </p>
            <p className="text-xs text-gray-500">
              แพลตฟอร์มตัวกลางด้านเครื่องใช้ไฟฟ้าครบวงจร — ซื้อขาย ซ่อม บำรุงรักษา ในที่เดียว
            </p>
            {/* Social links — W-3-C CMS-driven (ซ่อนถ้า url ว่าง) */}
            {socialLinks.length > 0 && (
              <div className="flex gap-2">
                {socialLinks.map((s) => (
                  <a
                    key={s.platform}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="bg-gray-800 hover:bg-gray-700 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition"
                  >
                    <SocialIcon platform={s.platform} />
                  </a>
                ))}
              </div>
            )}
            <div className="flex gap-3">
              <Link
                href="/download"
                className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-lg text-xs transition"
              >
                <span>📱</span> WeeeU App
              </Link>
              <Link
                href="/download"
                className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-lg text-xs transition"
              >
                <span>🔧</span> WeeeT App
              </Link>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <h3 className="text-white font-semibold text-sm mb-4">{section}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    {"external" in link && link.external ? (
                      <a
                        href={link.href}
                        className="text-gray-400 hover:text-white text-sm transition"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-gray-400 hover:text-white text-sm transition"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>{copyright}</p>
          <div className="flex flex-wrap gap-4 justify-center">
            {footerContent.legalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="hover:text-gray-300 transition"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
