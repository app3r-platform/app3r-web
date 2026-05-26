import Link from "next/link";

const MOCK_OFFER = {
  buyer: "ร้านอิเล็กทรอ",
  price: 4200,
};

export default function ListingConfirmPage({ params }: { params: { id: string } }) {
  const { id } = params;

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-xl mx-auto px-4 py-6 space-y-4">
        {/* Back link */}
        <Link href={`/listings/${id}/offers`} className="text-gray-400 hover:text-gray-700 text-sm flex items-center gap-1">
          ← กลับดูข้อเสนอ
        </Link>

        {/* Header */}
        <h1 className="text-xl font-bold text-weeeu-dark">ยืนยันข้อเสนอ</h1>

        {/* Offer summary card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400">ข้อเสนอจาก</p>
              <p className="text-sm font-semibold text-weeeu-dark">{MOCK_OFFER.buyer}</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400">ราคา</p>
              <p className="text-lg font-bold text-weeeu-primary">{MOCK_OFFER.price.toLocaleString()} ฿</p>
            </div>
          </div>
        </div>

        {/* Note */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
          <p className="text-sm text-amber-700">
            หลังยืนยัน ระบบจะล็อก escrow และแจ้งผู้ซื้อเตรียมชำระเงิน
          </p>
        </div>

        {/* Action buttons */}
        <div className="space-y-3 pt-2">
          <button className="w-full bg-weeeu-primary hover:bg-weeeu-dark text-white font-semibold py-3 rounded-xl text-sm transition-colors">
            ✅ ยืนยันขาย
          </button>
          <Link href={`/listings/${id}/offers`}>
            <button className="w-full border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold py-3 rounded-xl text-sm transition-colors">
              ยกเลิก — กลับไปดูข้อเสนออื่น
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
