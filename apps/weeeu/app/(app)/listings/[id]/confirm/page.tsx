import Link from "next/link";
import { EscrowInfoIcon } from "@/components/shared/EscrowInfo";

const MOCK_OFFER = {
  buyer: "ร้านอิเล็กทรอ",
  price: 4200,
};

export default async function ListingConfirmPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ offerId?: string; buyer?: string; price?: string }>;
}) {
  const { id } = await params;
  // L5: ใช้ข้อเสนอที่เลือกจากหน้า offers (query param) — fallback MOCK_OFFER ถ้าไม่มี (Mockup)
  const sp = await searchParams;
  const offer = {
    buyer: sp.buyer ?? MOCK_OFFER.buyer,
    price: sp.price ? Number(sp.price) : MOCK_OFFER.price,
  };

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
              <p className="text-sm font-semibold text-weeeu-dark">{offer.buyer}</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400">ราคา</p>
              <p className="text-lg font-bold text-weeeu-primary">{offer.price.toLocaleString()} ฿</p>
            </div>
          </div>
        </div>

        {/* Note */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
          <p className="text-sm text-amber-700">
            หลังยืนยัน ระบบจะล็อกระบบพักเงินกลาง (Escrow) <EscrowInfoIcon /> และแจ้งผู้ซื้อเตรียมชำระเงิน
          </p>
        </div>

        {/* Action buttons */}
        <div className="space-y-3 pt-2">
          <Link href={`/listings/${id}`}>
            <button className="w-full bg-weeeu-primary hover:bg-weeeu-dark text-white font-semibold py-3 rounded-xl text-sm transition-colors">
              ✅ ยืนยันขาย
            </button>
          </Link>
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
