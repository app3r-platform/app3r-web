import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "สินค้าแนะนำ",
  description: "สินค้าเครื่องใช้ไฟฟ้าคุณภาพดีที่แนะนำโดย App3R และพันธมิตร",
};

const products = [
  {
    id: "prod001",
    name: "แอร์ Mitsubishi Electric MSY-GN13VF",
    brand: "Mitsubishi Electric",
    category: "แอร์",
    priceRange: "12,900 – 14,500 บาท",
    rating: 4.8,
    reviewCount: 234,
    emoji: "❄️",
    badge: "ขายดี",
    badgeColor: "bg-red-100 text-red-700",
    desc: "แอร์อินเวอร์เตอร์ 12,000 BTU ประหยัดไฟ 5 ดาว เงียบเป็นพิเศษ",
  },
  {
    id: "prod002",
    name: "เครื่องซักผ้า Samsung WW90T534DAW",
    brand: "Samsung",
    category: "เครื่องซักผ้า",
    priceRange: "13,500 – 15,800 บาท",
    rating: 4.7,
    reviewCount: 189,
    emoji: "🫧",
    badge: "แนะนำ",
    badgeColor: "bg-purple-100 text-purple-700",
    desc: "เครื่องซักผ้าฝาหน้า 9 กก. AI Control + Hygiene Steam",
  },
  {
    id: "prod003",
    name: "ตู้เย็น LG GN-B392PLGK",
    brand: "LG",
    category: "ตู้เย็น",
    priceRange: "9,800 – 11,200 บาท",
    rating: 4.6,
    reviewCount: 145,
    emoji: "🧊",
    badge: "ราคาดี",
    badgeColor: "bg-green-100 text-green-700",
    desc: "ตู้เย็น 2 ประตู 14 คิว Inverter Linear Compressor",
  },
  {
    id: "prod004",
    name: "ทีวี Sony KD-55X80L 4K",
    brand: "Sony",
    category: "ทีวี",
    priceRange: "19,990 – 22,000 บาท",
    rating: 4.9,
    reviewCount: 312,
    emoji: "📺",
    badge: "ยอดนิยม",
    badgeColor: "bg-blue-100 text-blue-700",
    desc: "Google TV 55 นิ้ว 4K HDR X1 Processor รองรับ Dolby Atmos",
  },
  {
    id: "prod005",
    name: "เครื่องดูดฝุ่น Dyson V12 Detect Slim",
    brand: "Dyson",
    category: "เครื่องดูดฝุ่น",
    priceRange: "19,900 – 21,500 บาท",
    rating: 4.8,
    reviewCount: 98,
    emoji: "🌀",
    badge: "Premium",
    badgeColor: "bg-yellow-100 text-yellow-700",
    desc: "Cordless Vacuum with Laser Dust Detection พร้อมอุปกรณ์ครบชุด",
  },
  {
    id: "prod006",
    name: "ไมโครเวฟ Sharp R-28DR",
    brand: "Sharp",
    category: "ไมโครเวฟ",
    priceRange: "2,990 – 3,500 บาท",
    rating: 4.5,
    reviewCount: 76,
    emoji: "📟",
    badge: "ราคาดี",
    badgeColor: "bg-green-100 text-green-700",
    desc: "ไมโครเวฟ 25 ลิตร 900W ใช้งานง่าย ทำความสะอาดง่าย",
  },
];

const categories = ["ทั้งหมด", "แอร์", "เครื่องซักผ้า", "ตู้เย็น", "ทีวี", "เครื่องดูดฝุ่น", "ไมโครเวฟ"];

export default function ProductsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-purple-700">หน้าหลัก</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">สินค้า</span>
      </nav>

      <h1 className="text-3xl font-bold text-gray-900 mb-2">สินค้าแนะนำ</h1>
      <p className="text-gray-500 mb-8">เครื่องใช้ไฟฟ้าคุณภาพดีที่ผ่านการคัดเลือกโดย App3R</p>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap mb-8">
        {categories.map((cat) => (
          <button
            key={cat}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition ${
              cat === "ทั้งหมด"
                ? "bg-purple-700 text-white border-purple-700"
                : "bg-white text-gray-700 border-gray-300 hover:border-purple-500"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/products/${product.id}`}
            className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition group"
          >
            {/* Product image */}
            <div className="h-44 bg-gray-50 flex items-center justify-center text-6xl relative">
              {product.emoji}
              {product.badge && (
                <span className={`absolute top-3 left-3 text-xs font-bold px-2 py-0.5 rounded-full ${product.badgeColor}`}>
                  {product.badge}
                </span>
              )}
            </div>

            <div className="p-4 space-y-2">
              <div className="text-xs text-gray-400 font-medium">{product.brand}</div>
              <h2 className="font-semibold text-gray-900 text-sm group-hover:text-purple-700 transition line-clamp-2">
                {product.name}
              </h2>
              <p className="text-gray-500 text-xs line-clamp-2">{product.desc}</p>

              {/* Rating */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-yellow-400">★</span>
                <span className="font-semibold text-gray-700">{product.rating}</span>
                <span className="text-gray-400">({product.reviewCount} รีวิว)</span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <span className="font-bold text-purple-700 text-sm">{product.priceRange}</span>
                <span className="text-xs text-purple-700 hover:underline font-medium">ดูรายละเอียด →</span>
              </div>

              {/* Find on App3R CTA */}
              <div className="bg-purple-50 rounded-lg px-3 py-2 text-center text-xs text-purple-700 font-medium">
                ค้นหาร้านซ่อม/ขายมือสองบน App3R →
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
