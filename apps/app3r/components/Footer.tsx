import Link from "next/link";
import { footerContent } from "@/lib/content/footer";
import { getSocialLinks } from "@/lib/content-api";
import { crossAppUrls } from "@/lib/config/urls";

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

function SocialIcon({ platform }: { platform: string }) {
  if (platform === "facebook") return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
  if (platform === "instagram") return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
    </svg>
  );
  if (platform === "line") return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true">
      <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.627-.285-.627-.629V8.108c0-.27.173-.51.43-.595.064-.022.134-.032.2-.032.211 0 .391.09.51.25l2.444 3.317V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.629 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
    </svg>
  );
  return <span aria-hidden="true" className="text-xs font-bold">{platform[0].toUpperCase()}</span>;
}

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
