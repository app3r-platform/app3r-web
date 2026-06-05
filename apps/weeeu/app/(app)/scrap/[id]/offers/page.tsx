import Link from "next/link";
import { GoldLockCountdown } from "@/components/shared/GoldLockCountdown";

// ── mock-anno §5/§6/§8 (ลบก่อน production) ──────────────────────────────────
const AnnoOriginOffers = () => (
  <div className="mock-anno mock-anno-origin text-[10px] bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-1 text-yellow-700 font-mono">
    ◀ มาจาก: U-33 · /scrap/[id] (กด "ดูและเลือกข้อเสนอ")
  </div>
);
const AnnoXAppOffers = () => (
  <details className="mock-anno mock-anno-xapp">
    <summary className="cursor-pointer text-xs bg-purple-50 border border-purple-200 text-purple-700 rounded-lg px-3 py-1.5 inline-flex items-center gap-1.5 font-medium">
      👁 แอพฯอื่น ณ จังหวะนี้
    </summary>
    <div className="mt-1 bg-purple-50 border border-purple-200 rounded-xl p-3 text-xs text-purple-800 space-y-1">
      <p>• <strong>WeeeR :3001</strong> [R-25] ร้านที่ยื่นข้อเสนอเห็นสถานะรอพิจารณา
        <a href="http://localhost:3001/scrap/announcements/SC001/offer" className="underline ml-1">/scrap/announcements/[id]/offer</a>
      </p>
    </div>
  </details>
);

const MOCK_SCRAP_ITEM = {
  name: "เครื่องซักผ้าเก่า Samsung",
};

const MOCK_OFFERS = [
  { id: "so-001", shop: "ร้านรับซากดีเจริญ", type: "buy", price: 850, note: "รับทุกสภาพ ราคาดี", date: "25 พ.ค. 2569", transport: "ร้านรับไปเอง" },
  { id: "so-002", shop: "ร้านช่างเย็น จำกัด", type: "free", price: 0, note: "รับทิ้งฟรี มีใบรับรอง E-Waste", date: "25 พ.ค. 2569", transport: "ร้านรับไปเอง" },
  { id: "so-003", shop: "ร้านอิเล็กทรอ", type: "buy", price: 650, note: "", date: "24 พ.ค. 2569", transport: "ส่งพัสดุ" },
];

export default async function ScrapOffersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // [gold-lock] S5: กรอบเวลารับข้อเสนอ 24 ชม. (mock UI · auto-close logic = BE)
  const deadline = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-xl mx-auto px-4 py-6 space-y-4">
        {/* §5 Origin + §8 Cross-app annotations */}
        <AnnoOriginOffers />
        <AnnoXAppOffers />

        {/* Back link */}
        <Link href={`/scrap/${id}`} className="text-gray-400 hover:text-gray-700 text-sm flex items-center gap-1">
          ← กลับรายละเอียดซาก
        </Link>

        {/* Scrap item summary */}
        <div className="bg-weeeu-surface rounded-2xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 mb-0.5">รายการซาก</p>
          <p className="text-sm font-semibold text-weeeu-dark">{MOCK_SCRAP_ITEM.name}</p>
        </div>

        {/* Header */}
        <h1 className="text-xl font-bold text-weeeu-dark">ข้อเสนอรับซาก ({MOCK_OFFERS.length})</h1>

        {/* [gold-lock] S5: countdown 24 ชม. + เตือนทุก 6 ชม. (ผู้ขายซากไม่ได้ล็อกพอยต์ทอง → note เฉพาะกรอบเวลารับข้อเสนอ) */}
        <GoldLockCountdown
          deadline={deadline}
          title="ข้อเสนอรับซาก — เหลือเวลา"
          note="ข้อเสนอรับซากมีกรอบเวลา 24 ชม. — ระบบจะแจ้งเตือนทุก 6 ชม. หากไม่เลือกข้อเสนอใดภายในกำหนด ประกาศจะปิดอัตโนมัติและต้องแจ้งซากใหม่"
        />

        {/* Offers list */}
        <div className="space-y-3">
          {MOCK_OFFERS.map((offer) => (
            <div key={offer.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-weeeu-dark">{offer.shop}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{offer.date} · {offer.transport}</p>
                </div>
                <div className="text-right">
                  {offer.type === "free" ? (
                    <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full">
                      รับทิ้งฟรี 🆓
                    </span>
                  ) : (
                    <p className="text-lg font-bold text-weeeu-primary">{offer.price.toLocaleString()} ฿</p>
                  )}
                </div>
              </div>

              {offer.note && (
                <p className="text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2">{offer.note}</p>
              )}

              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span>🚗 {offer.transport}</span>
              </div>

              <Link href={`/scrap/${id}/confirm`}>
                <button className="w-full bg-weeeu-primary hover:bg-weeeu-dark text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
                  เลือกข้อเสนอนี้
                </button>
                {/* §6 Nav annotation */}
                <p className="mock-anno mock-anno-nav text-[10px] text-blue-500 font-mono mt-0.5 text-center">→ U-31 /scrap/[id]/confirm</p>
              </Link>
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-400 text-center pb-4">
          ข้อเสนอหมดอายุใน 24 ชั่วโมง หลังจากนั้นต้องแจ้งซากใหม่
        </p>
      </div>
    </div>
  );
}
