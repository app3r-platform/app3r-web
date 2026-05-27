import Link from "next/link";
import { SuccessTrackingBanner } from "@/components/shared/SuccessTrackingBanner";

export default async function PurchaseCompletePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-xl mx-auto px-4 py-6 space-y-4">
        {/* Tracking ref banner */}
        <SuccessTrackingBanner title="รับของเรียบร้อยแล้ว" />

        {/* Success screen */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex flex-col items-center text-center space-y-4">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <span className="text-4xl">✅</span>
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-weeeu-dark">ยืนยันรับสินค้าแล้ว</h1>
            <p className="text-sm text-gray-500">ระบบปล่อยเงินให้ร้านแล้ว</p>
            <p className="text-xs text-gray-400">การซื้อ #{id} เสร็จสมบูรณ์</p>
          </div>
        </div>

        {/* Navigation links */}
        <div className="space-y-3">
          <Link href="/purchases">
            <button className="w-full bg-weeeu-primary hover:bg-weeeu-dark text-white font-semibold py-3 rounded-xl text-sm transition-colors">
              กลับหน้าการซื้อ
            </button>
          </Link>
          <button className="w-full border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold py-3 rounded-xl text-sm transition-colors">
            ให้คะแนนร้าน ⭐
          </button>
        </div>

        <p className="text-xs text-gray-400 text-center">
          ขอบคุณที่ใช้บริการ App3R
        </p>
      </div>
    </div>
  );
}
