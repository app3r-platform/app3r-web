"use client";

import Link from "next/link";

const MOCK_ITEMS = [
  { id: "r001", name: "แอร์ Daikin 12000 BTU มือสอง", price: 4500, condition: "ดี", category: "เครื่องปรับอากาศ", shop: "ร้านดีเจริญ", image: "https://picsum.photos/seed/r001/300/200" },
  { id: "r002", name: "ตู้เย็น Samsung 2 ประตู 14 คิว", price: 3200, condition: "ดีมาก", category: "ตู้เย็น", shop: "ร้านอิเล็กทรอ", image: "https://picsum.photos/seed/r002/300/200" },
  { id: "r003", name: "เครื่องซักผ้า LG 8 kg", price: 2800, condition: "พอใช้", category: "เครื่องซักผ้า", shop: "ร้านช่างเย็น จำกัด", image: "https://picsum.photos/seed/r003/300/200" },
  { id: "r004", name: "ทีวี Sony 43\" Smart TV", price: 5500, condition: "ดีมาก", category: "โทรทัศน์", shop: "ร้านดีเจริญ", image: "https://picsum.photos/seed/r004/300/200" },
  { id: "r005", name: "ไมโครเวฟ Sharp 25L", price: 900, condition: "ดี", category: "ไมโครเวฟ", shop: "ร้านอิเล็กทรอ", image: "https://picsum.photos/seed/r005/300/200" },
  { id: "r006", name: "เครื่องทำน้ำอุ่น Panasonic", price: 650, condition: "พอใช้", category: "เครื่องทำน้ำอุ่น", shop: "ร้านช่างเย็น จำกัด", image: "https://picsum.photos/seed/r006/300/200" },
];

const CONDITION_COLORS: Record<string, string> = {
  "ดีมาก": "bg-green-100 text-green-700",
  "ดี": "bg-blue-100 text-blue-700",
  "พอใช้": "bg-yellow-100 text-yellow-700",
};

export default function MarketplacePage() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-xl mx-auto px-4 py-6 space-y-4">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-weeeu-dark">🛒 ตลาดสินค้ามือสอง</h1>
          <p className="text-sm text-gray-400 mt-0.5">สินค้าจากร้านที่ผ่านการรับรอง</p>
        </div>

        {/* Search bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="ค้นหาสินค้า..."
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-weeeu-primary/30"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 text-lg">🔍</span>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 gap-3">
          {MOCK_ITEMS.map((item) => (
            <Link key={item.id} href={`/marketplace/${item.id}`}>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-32 object-cover"
                />
                <div className="p-3 space-y-1.5">
                  <p className="text-xs font-semibold text-weeeu-dark leading-snug line-clamp-2">{item.name}</p>
                  <p className="text-sm font-bold text-weeeu-primary">{item.price.toLocaleString()} ฿</p>
                  <div className="flex items-center justify-between gap-1 flex-wrap">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${CONDITION_COLORS[item.condition] ?? "bg-gray-100 text-gray-500"}`}>
                      {item.condition}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 truncate">{item.shop}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
