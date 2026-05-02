import type { Metadata } from "next";

export const metadata: Metadata = { title: "Module — WeeeR" };

const MODULE_INFO: Record<string, { label: string; icon: string; desc: string }> = {
  resell:   { label: "ขายต่อ (Type A)",    icon: "💸", desc: "จัดการรายการขายสินค้ามือสอง" },
  scrap:    { label: "รับซาก (Type B)",    icon: "♻️", desc: "ประกาศรับซื้อซาก / ของเสีย" },
  repair:   { label: "ซ่อม (Type C)",      icon: "🔧", desc: "บริการซ่อมอุปกรณ์ไฟฟ้า" },
  maintain: { label: "บำรุง (Type D)",     icon: "🛠️", desc: "บริการบำรุงรักษาตามรอบ" },
  parts:    { label: "อะไหล่ B2B (Type E)", icon: "🔩", desc: "ซื้อ-ขายอะไหล่ระหว่างธุรกิจ" },
};

export default function ModulePage({ params }: { params: { module: string } }) {
  const info = MODULE_INFO[params.module] ?? { label: params.module, icon: "🔧", desc: "" };
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <div className="text-5xl mb-4">{info.icon}</div>
      <h2 className="text-xl font-bold text-gray-800">{info.label}</h2>
      <p className="text-sm text-gray-500 mt-1">{info.desc}</p>
      <div className="mt-4 px-4 py-2 bg-gray-100 rounded-xl text-sm text-gray-400">
        Phase 2b — UI Module chat จะ implement ส่วนนี้
      </div>
    </div>
  );
}
