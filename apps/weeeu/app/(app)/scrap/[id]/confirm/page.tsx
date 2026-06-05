import Link from "next/link";
import { SuccessTrackingBanner } from "@/components/shared/SuccessTrackingBanner";

// ── mock-anno §5/§6/§8 (ลบก่อน production) ──────────────────────────────────
const AnnoOriginConfirm = () => (
  <div className="mock-anno mock-anno-origin text-[10px] bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-1 text-yellow-700 font-mono">
    ◀ มาจาก: U-30 · /scrap/[id]/offers (กด "เลือกข้อเสนอนี้") หรือ U-33 · /scrap/[id] (รับ offer โดยตรง)
  </div>
);
const AnnoXAppConfirm = () => (
  <details className="mock-anno mock-anno-xapp">
    <summary className="cursor-pointer text-xs bg-purple-50 border border-purple-200 text-purple-700 rounded-lg px-3 py-1.5 inline-flex items-center gap-1.5 font-medium">
      👁 แอพฯอื่น ณ จังหวะนี้ (S1: ยืนยัน)
    </summary>
    <div className="mt-1 bg-purple-50 border border-purple-200 rounded-xl p-3 text-xs text-purple-800 space-y-1">
      <p>• <strong>WeeeR :3001</strong> [R-28] ร้านรับแจ้งเตือน offer ถูกเลือก → งาน pending_pickup
        <a href="http://localhost:3001/scrap/jobs/SJ001" className="underline ml-1">/scrap/jobs/SJ001</a>
      </p>
      <p>• <strong>WeeeT :3003</strong> [T-04] ช่างได้รับ task รับซาก → กำหนดวันรับ
        <a href="http://localhost:3003/jobs/J001/pickup" className="underline ml-1">/jobs/[id]/pickup</a>
      </p>
    </div>
  </details>
);

const MOCK_OFFER = {
  shop: "ร้านรับซากดีเจริญ",
  price: 850,
  transport: "รับไปเอง",
};

export default async function ScrapConfirmPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-xl mx-auto px-4 py-6 space-y-4">
        {/* §5 Origin + §8 Cross-app annotations */}
        <AnnoOriginConfirm />
        <AnnoXAppConfirm />

        {/* Back link */}
        <Link href={`/scrap/${id}/offers`} className="text-gray-400 hover:text-gray-700 text-sm flex items-center gap-1">
          ← กลับดูข้อเสนอ
        </Link>

        {/* Tracking ref banner */}
        <SuccessTrackingBanner title="ยืนยันสำเร็จ" variant="weeeu" />

        {/* Header */}
        <h1 className="text-xl font-bold text-weeeu-dark">ยืนยันการเลือกข้อเสนอ</h1>

        {/* Offer summary card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400">ร้านรับซาก</p>
              <p className="text-sm font-semibold text-weeeu-dark">{MOCK_OFFER.shop}</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400">ราคารับซาก</p>
              <p className="text-lg font-bold text-weeeu-primary">{MOCK_OFFER.price.toLocaleString()} ฿</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400">การขนส่ง</p>
              <p className="text-sm text-gray-700">{MOCK_OFFER.transport}</p>
            </div>
          </div>
        </div>

        {/* Note */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
          <p className="text-sm text-amber-700">
            หลังยืนยัน ร้านจะนัดหมายเพื่อรับซากจากคุณ
          </p>
        </div>

        {/* Action buttons */}
        <div className="space-y-3 pt-2">
          <div>
            <button className="w-full bg-weeeu-primary hover:bg-weeeu-dark text-white font-semibold py-3 rounded-xl text-sm transition-colors">
              ✅ ยืนยัน
            </button>
            {/* §6 Nav annotation */}
            <p className="mock-anno mock-anno-nav text-[10px] text-blue-500 font-mono mt-0.5 text-center">→ U-55 /scrap (listing status → accepted)</p>
          </div>
          <Link href={`/scrap/${id}/offers`}>
            <button className="w-full border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold py-3 rounded-xl text-sm transition-colors">
              ยกเลิก — กลับไปดูข้อเสนออื่น
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
