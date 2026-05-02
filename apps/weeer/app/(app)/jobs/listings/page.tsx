import type { Metadata } from "next";

export const metadata: Metadata = { title: "ประกาศ / Listings — WeeeR" };

const LISTINGS = [
  { id: "L-001", type: "ขายต่อ", title: "ขายแอร์มือสอง Daikin 12K BTU สภาพดี",          status: "ACTIVE",  fee: 50, expiry: "2026-06-01" },
  { id: "L-002", type: "ซ่อม",   title: "บริการซ่อมแอร์ทุกยี่ห้อ รับงานทั่ว กทม.",     status: "ACTIVE",  fee: 50, expiry: "2026-06-15" },
  { id: "L-003", type: "ซาก",    title: "รับซื้อซากแอร์ / ตู้เย็นเก่า ทุกสภาพ",        status: "PAUSED",  fee: 50, expiry: null },
];

const STATUS_STYLE: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700", PAUSED: "bg-yellow-100 text-yellow-700", EXPIRED: "bg-gray-100 text-gray-500",
};
const STATUS_LABEL: Record<string, string> = { ACTIVE: "เผยแพร่", PAUSED: "หยุดชั่วคราว", EXPIRED: "หมดอายุ" };

export default function ListingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">ประกาศ / Listings</h1>
        <button className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white text-sm font-medium px-4 py-2.5 rounded-xl">
          ➕ สร้างประกาศใหม่
        </button>
      </div>

      <div className="space-y-3">
        {LISTINGS.map((l) => (
          <div key={l.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-center gap-4">
            <span className="text-xs bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full font-medium shrink-0">{l.type}</span>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 truncate">{l.title}</div>
              <div className="text-xs text-gray-500 mt-0.5">
                ค่าลงประกาศ {l.fee} Silver{l.expiry && ` · หมดอายุ ${l.expiry}`}
              </div>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${STATUS_STYLE[l.status]}`}>
              {STATUS_LABEL[l.status]}
            </span>
            <button className="text-sm border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 text-gray-600">แก้ไข</button>
          </div>
        ))}
      </div>
    </div>
  );
}
