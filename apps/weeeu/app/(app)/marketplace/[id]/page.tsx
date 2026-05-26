import Link from "next/link";

const MOCK_ITEM = {
  id: "r001",
  name: "แอร์ Daikin 12000 BTU มือสอง",
  price: 4500,
  condition: "ดี",
  category: "เครื่องปรับอากาศ",
  description: "แอร์ Daikin ขนาด 12000 BTU สภาพดี ใช้งานได้ปกติ ทำความเย็นได้ดี ไม่มีน้ำรั่ว น้ำแข็งไม่เกาะ เปลี่ยนฟิลเตอร์ใหม่แล้ว พร้อมใช้งาน รวมรีโมทและคู่มือ",
  shop: "ร้านดีเจริญ",
  shopRating: 4.8,
  shopReviews: 234,
  image: "https://picsum.photos/seed/r001/600/400",
};

export default function MarketplaceDetailPage({ params }: { params: { id: string } }) {
  const item = MOCK_ITEM;

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-xl mx-auto px-4 py-6 space-y-4">
        {/* Back link */}
        <Link href="/marketplace" className="text-gray-400 hover:text-gray-700 text-sm flex items-center gap-1">
          ← กลับตลาดสินค้า
        </Link>

        {/* Product image */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-52 object-cover"
          />
        </div>

        {/* Product info card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-base font-bold text-weeeu-dark leading-snug flex-1">{item.name}</h1>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium whitespace-nowrap">{item.condition}</span>
          </div>
          <p className="text-2xl font-bold text-weeeu-primary">{item.price.toLocaleString()} ฿</p>
          <p className="text-xs text-gray-400">{item.category}</p>
          <hr className="border-gray-100" />
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-1">รายละเอียดสินค้า</p>
            <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
          </div>
        </div>

        {/* Shop info card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">ขายโดย</p>
              <p className="text-sm font-semibold text-weeeu-dark">{item.shop}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-amber-500">⭐ {item.shopRating.toFixed(1)}</p>
              <p className="text-[10px] text-gray-400">{item.shopReviews} รีวิว</p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-3 pt-2">
          <Link href={`/marketplace/${params.id}/offer`}>
            <button className="w-full bg-weeeu-primary hover:bg-weeeu-dark text-white font-semibold py-3 rounded-xl text-sm transition-colors">
              ยื่นข้อเสนอซื้อ
            </button>
          </Link>
          <button className="w-full border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold py-3 rounded-xl text-sm transition-colors">
            แชทกับร้าน
          </button>
        </div>
      </div>
    </div>
  );
}
