import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "ยินดีต้อนรับ — WeeeR" };

export default function WelcomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 px-6 py-12">
      <div className="max-w-sm w-full text-center space-y-8">
        {/* Logo */}
        <div className="space-y-2">
          <div className="text-6xl">♻️</div>
          <h1 className="text-3xl font-bold text-green-800">WeeeR</h1>
          <p className="text-green-600 font-medium">แพลตฟอร์มสำหรับผู้ประกอบการ</p>
        </div>

        {/* Value Props */}
        <div className="space-y-4 text-left">
          {[
            { icon: "🔧", title: "จัดการงานซ่อม", desc: "รับงาน มอบหมายช่าง ติดตามสถานะ" },
            { icon: "👷", title: "จัดการทีมช่าง", desc: "สร้างบัญชี WeeeT บริหารทีมได้ง่าย" },
            { icon: "💰", title: "ระบบจ่ายเงินครบ", desc: "Silver & Gold — รับเงิน โอนเงิน" },
            { icon: "📢", title: "ลงประกาศได้ทันที", desc: "ขายต่อ รับซาก ซ่อม บำรุง อะไหล่" },
          ].map((v) => (
            <div key={v.title} className="flex items-start gap-3 bg-white rounded-xl p-3 shadow-sm">
              <span className="text-2xl shrink-0">{v.icon}</span>
              <div>
                <div className="font-semibold text-gray-800 text-sm">{v.title}</div>
                <div className="text-xs text-gray-500">{v.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="space-y-3 pt-2">
          <Link
            href="/signup"
            className="block w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-3.5 rounded-xl text-center transition-colors"
          >
            สมัครใช้งาน (ฟรี)
          </Link>
          <Link
            href="/login"
            className="block w-full border-2 border-green-700 text-green-700 hover:bg-green-50 font-semibold py-3.5 rounded-xl text-center transition-colors"
          >
            เข้าสู่ระบบ
          </Link>
        </div>

        <p className="text-xs text-gray-400">
          สมัครแล้วต้องผ่านการยืนยันตัวตน (KYC) ก่อนเปิดร้าน
        </p>
      </div>
    </div>
  );
}
