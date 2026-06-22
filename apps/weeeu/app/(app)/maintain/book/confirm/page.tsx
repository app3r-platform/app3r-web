import Link from "next/link";

const MOCK_BOOKING = {
  service: "บำรุงรักษาแอร์",
  shop: "ร้านดีเจริญ",
  date: "วันจันทร์ที่ 2 มิ.ย. 2569 เวลา 10:00",
  price: 1200,
};

export default function MaintainBookConfirmPage() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-xl mx-auto px-4 py-6 space-y-4">
        {/* Back link */}
        <Link href="/maintain/book" className="text-gray-400 hover:text-gray-700 text-sm flex items-center gap-1">
          ← กลับหน้าจอง
        </Link>

        {/* Header */}
        <h1 className="text-xl font-bold text-weeeu-dark">ยืนยันการจอง</h1>

        {/* Booking summary card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
          <p className="text-sm font-semibold text-weeeu-dark mb-1">สรุปการจอง</p>
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs text-gray-400 flex-shrink-0">บริการ</p>
              <p className="text-sm font-medium text-weeeu-dark text-right">{MOCK_BOOKING.service}</p>
            </div>
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs text-gray-400 flex-shrink-0">ร้าน</p>
              <p className="text-sm text-gray-700 text-right">{MOCK_BOOKING.shop}</p>
            </div>
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs text-gray-400 flex-shrink-0">วันที่</p>
              <p className="text-sm text-gray-700 text-right">{MOCK_BOOKING.date}</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400">ราคาประมาณ</p>
              <p className="text-lg font-bold text-weeeu-primary">{MOCK_BOOKING.price.toLocaleString()} ฿</p>
            </div>
          </div>
        </div>

        {/* Note */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
          <p className="text-sm text-blue-700">
            หลังยืนยัน ร้านจะติดต่อเพื่อยืนยันนัดหมายอีกครั้ง
          </p>
        </div>

        {/* Action buttons */}
        <div className="space-y-3 pt-2">
          <Link href="/maintain/book/confirm/success">
            <button className="w-full bg-weeeu-primary hover:bg-weeeu-dark text-white font-semibold py-3 rounded-xl text-sm transition-colors">
              ✅ ยืนยันจอง
            </button>
          </Link>
          <Link href="/maintain/book">
            <button className="w-full border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold py-3 rounded-xl text-sm transition-colors">
              ยกเลิก — กลับหน้าจอง
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
