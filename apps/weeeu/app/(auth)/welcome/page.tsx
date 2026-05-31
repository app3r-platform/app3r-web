import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "ยินดีต้อนรับสู่ WeeeU" };

// Cross-app URLs — env-driven (dev fallback: WeeeR :3001 · WeeeT :3003)
// TODO Phase D: ตั้งค่า NEXT_PUBLIC_WEEER_URL / NEXT_PUBLIC_WEEET_URL สำหรับ production
const WEEER_URL = process.env.NEXT_PUBLIC_WEEER_URL ?? "http://localhost:3001";
const WEEET_URL = process.env.NEXT_PUBLIC_WEEET_URL ?? "http://localhost:3003";
// terms/privacy = canonical ที่ App3R-Website (cross-origin) → ใช้ <a> ไม่ใช่ next/Link
const WEBSITE_URL = process.env.NEXT_PUBLIC_WEBSITE_URL ?? "http://localhost:3004";

export default function WelcomePage() {
  return (
    <div className="space-y-8 text-center">
      {/* Hero icon */}
      <div className="flex flex-col items-center gap-3">
        <div className="w-20 h-20 bg-weeeu-surface rounded-3xl flex items-center justify-center text-4xl shadow-inner">
          🏠
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">จัดการเครื่องใช้ไฟฟ้า</h2>
          <p className="text-gray-500 text-sm mt-1 max-w-xs mx-auto">
            ซ่อม · ซื้อขาย · รีไซเคิล · บำรุงรักษา<br />
            ครบในที่เดียว ง่ายกว่าที่เคย
          </p>
        </div>
      </div>

      {/* Feature bullets */}
      <div className="grid grid-cols-2 gap-3 text-left">
        {[
          { icon: "🔧", label: "แจ้งซ่อมออนไลน์", desc: "รับ offer ราคาทันที" },
          { icon: "💰", label: "ซื้อ/ขายมือสอง", desc: "ได้ Silver Point" },
          { icon: "♻️", label: "ทิ้งซากถูกวิธี", desc: "ตามมาตรฐาน WEEE" },
          { icon: "🛠️", label: "ล้างแอร์/ซักผ้า", desc: "จองออนไลน์ได้เลย" },
        ].map((f) => (
          <div key={f.label} className="bg-weeeu-surface rounded-2xl p-3 flex items-start gap-2">
            <span className="text-xl">{f.icon}</span>
            <div>
              <p className="text-xs font-semibold text-gray-800">{f.label}</p>
              <p className="text-xs text-gray-500">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Role-clarity banner */}
      <div className="bg-weeeu-surface border border-weeeu-primary/20 rounded-2xl p-4 text-left space-y-1.5">
        <p className="text-xs font-semibold text-weeeu-text flex items-center gap-1.5">
          <span>🏠</span> แอปนี้สำหรับผู้ใช้ทั่วไป (WeeeU)
        </p>
        <p className="text-xs text-gray-600 leading-relaxed">
          ซื้อ-ขายมือสอง แจ้งซ่อม ทิ้งซาก และบำรุงรักษาเครื่องใช้ไฟฟ้า
          — ร้านซ่อม/ช่าง (WeeeR) ก็ซื้อขายสินค้าผ่านระบบได้เช่นกัน
        </p>
      </div>

      {/* CTA buttons */}
      <div className="space-y-3 pt-2">
        <Link
          href="/signup/method"
          className="block w-full bg-weeeu-primary hover:bg-weeeu-primary text-white font-semibold py-3.5 rounded-2xl text-center transition-colors text-sm"
        >
          สมัครสมาชิกฟรี
        </Link>
        <Link
          href="/login"
          className="block w-full border-2 border-weeeu-primary text-weeeu-primary hover:bg-weeeu-surface font-semibold py-3.5 rounded-2xl text-center transition-colors text-sm"
        >
          เข้าสู่ระบบ
        </Link>
      </div>

      {/* Cross-app links — สำหรับผู้ให้บริการ (WeeeR / WeeeT) */}
      <div className="border-t border-gray-100 pt-4 space-y-2 text-left">
        <p className="text-xs font-medium text-gray-500 text-center">เป็นผู้ให้บริการ? สมัครแอปสำหรับธุรกิจ</p>
        <div className="grid grid-cols-2 gap-2">
          <a
            href={WEEER_URL}
            className="flex flex-col items-center gap-0.5 p-3 rounded-xl border border-gray-200 hover:border-weeeu-primary/40 transition-colors"
          >
            <span className="text-xl">🔧</span>
            <span className="text-xs font-semibold text-gray-700">WeeeR — ร้านซ่อม</span>
            <span className="text-[10px] text-gray-400">ซ่อม · รับซื้อซาก</span>
          </a>
          <a
            href={WEEET_URL}
            className="flex flex-col items-center gap-0.5 p-3 rounded-xl border border-gray-200 hover:border-weeeu-primary/40 transition-colors"
          >
            <span className="text-xl">🚚</span>
            <span className="text-xs font-semibold text-gray-700">WeeeT — ขนส่ง</span>
            <span className="text-[10px] text-gray-400">รับงานขนส่ง</span>
          </a>
        </div>
      </div>

      {/* Terms note */}
      <p className="text-xs text-gray-400 pb-1">
        การสมัครถือว่ายอมรับ{" "}
        <a href={`${WEBSITE_URL}/terms`} className="text-weeeu-primary hover:underline">
          ข้อตกลงการใช้งาน
        </a>{" "}
        และ{" "}
        <a href={`${WEBSITE_URL}/privacy`} className="text-weeeu-primary hover:underline">
          นโยบายความเป็นส่วนตัว
        </a>
      </p>
    </div>
  );
}
