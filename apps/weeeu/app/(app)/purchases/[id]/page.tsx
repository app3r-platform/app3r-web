import Link from "next/link";

const MOCK_ORDER = {
  name: "แอร์ Daikin 12000 BTU มือสอง",
  price: 4200,
  seller: "ร้านดีเจริญ",
  date: "25 พ.ค. 2569",
  status: "📦 รอจัดส่ง",
};

export default async function PurchaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-xl mx-auto px-4 py-6 space-y-4">
        {/* Back link */}
        <Link href="/purchases" className="text-gray-400 hover:text-gray-700 text-sm flex items-center gap-1">
          ← กลับรายการซื้อ
        </Link>

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-weeeu-dark">รายละเอียดการซื้อ #{id}</h1>
          <span className="text-sm bg-blue-50 text-blue-700 font-medium px-3 py-1 rounded-full">
            {MOCK_ORDER.status}
          </span>
        </div>

        {/* Order info card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400">ชื่อสินค้า</p>
              <p className="text-sm font-medium text-weeeu-dark text-right max-w-[60%]">{MOCK_ORDER.name}</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400">ราคา</p>
              <p className="text-sm font-bold text-weeeu-primary">{MOCK_ORDER.price.toLocaleString()} ฿</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400">ผู้ขาย</p>
              <p className="text-sm text-gray-700">{MOCK_ORDER.seller}</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400">วันที่สั่ง</p>
              <p className="text-sm text-gray-700">{MOCK_ORDER.date}</p>
            </div>
          </div>
        </div>

        {/* Tracking section */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-2">
          <p className="text-sm font-semibold text-weeeu-dark">ติดตามการจัดส่ง</p>
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-400">รอข้อมูลจัดส่ง</p>
            <p className="text-[10px] text-gray-300 mt-1">ร้านจะอัปเดตเลขพัสดุภายใน 24 ชม.</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-3 pt-2">
          <Link href={`/purchases/${id}/inspect`}>
            <button className="w-full bg-weeeu-primary hover:bg-weeeu-dark text-white font-semibold py-3 rounded-xl text-sm transition-colors">
              รับของแล้ว → ตรวจสภาพ
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
