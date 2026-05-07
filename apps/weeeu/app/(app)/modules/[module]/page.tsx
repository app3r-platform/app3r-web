import type { Metadata } from "next";
import Link from "next/link";

// ─── Module Routing Placeholder ────────────────────────────────────────────
// Phase 2b: UI Module chats จะ inject content เข้ามาแทนที่ placeholder นี้
// โครงสร้าง route นี้รองรับ: /modules/repair, /modules/resell, /modules/scrap, /modules/maintain
// ─────────────────────────────────────────────────────────────────────────────

const moduleConfig: Record<string, {
  icon: string; title: string; description: string; color: string; comingSoon: boolean;
}> = {
  repair: {
    icon: "🔧", title: "แจ้งซ่อม", comingSoon: false,
    description: "แจ้งซ่อมเครื่องใช้ไฟฟ้าในบ้าน เลือกร้าน รับ offer ราคา ติดตามช่าง",
    color: "from-orange-500 to-amber-400",
  },
  resell: {
    icon: "💰", title: "ซื้อ/ขาย มือสอง", comingSoon: false,
    description: "ลงประกาศขาย รับ offer จากร้าน หรือค้นหาซื้อเครื่องใช้ไฟฟ้ามือสอง",
    color: "from-green-500 to-emerald-400",
  },
  scrap: {
    icon: "♻️", title: "ขายซาก / ทิ้งซาก", comingSoon: false,
    description: "ขายซากเครื่องใช้ไฟฟ้าที่เสียแล้ว หรือให้ทิ้งฟรีตามมาตรฐาน WEEE",
    color: "from-teal-500 to-cyan-400",
  },
  maintain: {
    icon: "🛠️", title: "บำรุงรักษา", comingSoon: false,
    description: "จองล้างแอร์ ล้างเครื่องซักผ้า บำรุงรักษาเครื่องใช้ไฟฟ้าประจำปี",
    color: "from-purple-500 to-violet-400",
  },
  parts: {
    icon: "🔩", title: "อะไหล่", comingSoon: false,
    description: "ค้นหาและสั่งซื้ออะไหล่เครื่องใช้ไฟฟ้า ตรวจสอบราคา เปรียบเทียบร้านค้า",
    color: "from-slate-500 to-gray-400",
  },
};

type Props = { params: Promise<{ module: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { module } = await params;
  const config = moduleConfig[module];
  return { title: config?.title ?? "บริการ" };
}

export default async function ModulePage({ params }: Props) {
  const { module } = await params;
  const config = moduleConfig[module];

  // Unknown module
  if (!config) {
    return (
      <div className="text-center py-20">
        <p className="text-4xl mb-3">🔍</p>
        <p className="text-xl font-semibold text-gray-700">ไม่พบบริการนี้</p>
        <Link href="/dashboard" className="mt-4 inline-block text-blue-600 hover:text-blue-800 text-sm font-medium">
          ← กลับหน้าหลัก
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Module header */}
      <div className={`bg-gradient-to-r ${config.color} rounded-3xl p-8 text-white`}>
        <p className="text-5xl mb-3">{config.icon}</p>
        <h1 className="text-2xl font-bold">{config.title}</h1>
        <p className="text-white text-opacity-90 text-sm mt-2 max-w-md">{config.description}</p>
      </div>

      {/* Phase 2b placeholder */}
      <div className="bg-white rounded-2xl border-2 border-dashed border-blue-200 p-10 text-center">
        <div className="text-5xl mb-4">🚧</div>
        <h2 className="text-lg font-semibold text-gray-700">กำลังพัฒนา</h2>
        <p className="text-sm text-gray-400 mt-2 max-w-sm mx-auto">
          ฟีเจอร์ <strong>{config.title}</strong> อยู่ในขั้นตอนพัฒนา (Wave 4 Phase 2b)
          <br />จะพร้อมใช้งานเร็วๆ นี้
        </p>
        <div className="mt-4 inline-flex items-center gap-2 bg-blue-50 text-blue-600 text-xs font-medium px-4 py-2 rounded-full">
          <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
          Phase 2b — Coming Soon
        </div>
      </div>

      {/* What to expect */}
      <div className="bg-gray-50 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">สิ่งที่จะทำได้</h3>
        <ul className="space-y-2 text-sm text-gray-600">
          {module === "repair" && [
            "📍 เลือกเครื่องใช้ไฟฟ้าที่ต้องการซ่อม",
            "📋 อธิบายอาการ + แนบรูปภาพ",
            "🏪 เลือกร้านซ่อมใกล้บ้าน",
            "💬 รับ offer ราคาจากร้าน",
            "📍 ติดตามช่าง Real-time",
            "⭐ รีวิวหลังซ่อมเสร็จ",
          ].map((item, i) => <li key={i} className="flex items-start gap-2"><span>•</span>{item}</li>)}

          {module === "resell" && [
            "📸 ถ่ายรูป + ลงประกาศขาย",
            "💰 รับ offer จากร้าน WeeeR",
            "🤝 ยืนยัน offer + นัดรับสินค้า",
            "💎 รับ Silver Point หลังขายสำเร็จ",
          ].map((item, i) => <li key={i} className="flex items-start gap-2"><span>•</span>{item}</li>)}

          {module === "scrap" && [
            "♻️ ลงประกาศซากเครื่องใช้ไฟฟ้า",
            "💵 รับ offer ราคาซาก (ถ้ามีมูลค่า)",
            "🆓 ขอทิ้งฟรีตามมาตรฐาน WEEE",
            "🚚 ติดตามรถมารับซาก Real-time",
          ].map((item, i) => <li key={i} className="flex items-start gap-2"><span>•</span>{item}</li>)}

          {module === "maintain" && [
            "📅 จองล้างแอร์ / ล้างเครื่องซักผ้า",
            "🏪 เลือกร้านบำรุงรักษาใกล้บ้าน",
            "⏰ เลือกวันเวลาที่สะดวก",
            "🔔 รับแจ้งเตือนเมื่อถึงเวลาบำรุงรักษา",
          ].map((item, i) => <li key={i} className="flex items-start gap-2"><span>•</span>{item}</li>)}

          {module === "parts" && [
            "🔍 ค้นหาอะไหล่ตามรุ่น/ยี่ห้อเครื่องใช้ไฟฟ้า",
            "💰 เปรียบเทียบราคาจากหลายร้านค้า",
            "🛒 สั่งซื้ออะไหล่โดยตรง",
            "🚚 ติดตามการจัดส่ง",
          ].map((item, i) => <li key={i} className="flex items-start gap-2"><span>•</span>{item}</li>)}
        </ul>
      </div>

      <Link href="/dashboard" className="block text-center text-sm text-gray-400 hover:text-gray-600 transition-colors">
        ← กลับหน้าหลัก
      </Link>
    </div>
  );
}
