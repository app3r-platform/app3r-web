import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "ยินดีต้อนรับสู่ WeeeU" };

export default function WelcomePage() {
  return (
    <div className="space-y-8 text-center">
      {/* Hero icon */}
      <div className="flex flex-col items-center gap-3">
        <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center text-4xl shadow-inner">
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
          <div key={f.label} className="bg-blue-50 rounded-2xl p-3 flex items-start gap-2">
            <span className="text-xl">{f.icon}</span>
            <div>
              <p className="text-xs font-semibold text-gray-800">{f.label}</p>
              <p className="text-xs text-gray-500">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* CTA buttons */}
      <div className="space-y-3 pt-2">
        <Link
          href="/signup/method"
          className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-2xl text-center transition-colors text-sm"
        >
          สมัครสมาชิกฟรี
        </Link>
        <Link
          href="/login"
          className="block w-full border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold py-3.5 rounded-2xl text-center transition-colors text-sm"
        >
          เข้าสู่ระบบ
        </Link>
      </div>

      {/* Terms note */}
      <p className="text-xs text-gray-400 pb-1">
        การสมัครถือว่ายอมรับ{" "}
        <Link href="/terms" className="text-blue-500 hover:underline">
          ข้อตกลงการใช้งาน
        </Link>{" "}
        และ{" "}
        <Link href="/privacy" className="text-blue-500 hover:underline">
          นโยบายความเป็นส่วนตัว
        </Link>
      </p>
    </div>
  );
}
