import Link from "next/link";

const MOCK_CERT = {
  number: "EW-2026-001234",
  date: "25 พ.ค. 2569",
  item: "เครื่องซักผ้า Samsung",
  shop: "ร้านรับซากดีเจริญ",
};

export default async function ScrapCertificatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-xl mx-auto px-4 py-6 space-y-4">
        {/* Back link */}
        <Link href={`/scrap/${id}`} className="text-gray-400 hover:text-gray-700 text-sm flex items-center gap-1">
          ← กลับรายละเอียดซาก
        </Link>

        {/* Header */}
        <h1 className="text-xl font-bold text-weeeu-dark">ใบรับรอง E-Waste ♻️</h1>

        {/* Certificate card */}
        <div className="bg-white rounded-2xl border-2 border-green-400 shadow-sm p-6 space-y-4">
          {/* Certificate badge */}
          <div className="flex flex-col items-center text-center space-y-2 pb-4 border-b border-green-100">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-3xl">♻️</span>
            </div>
            <p className="text-base font-bold text-green-700">ใบรับรองการทิ้งซากอิเล็กทรอนิกส์</p>
            <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
              ผ่านมาตรฐาน E-Waste Thailand
            </span>
          </div>

          {/* Certificate details */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400">เลขที่ใบรับรอง</p>
              <p className="text-sm font-mono font-bold text-weeeu-dark">{MOCK_CERT.number}</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400">วันที่</p>
              <p className="text-sm text-gray-700">{MOCK_CERT.date}</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400">รายการซาก</p>
              <p className="text-sm text-gray-700">{MOCK_CERT.item}</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400">ร้านรับซาก</p>
              <p className="text-sm font-medium text-weeeu-dark">{MOCK_CERT.shop}</p>
            </div>
          </div>

          {/* QR placeholder */}
          <div className="flex justify-center pt-2">
            <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center">
              <p className="text-xs text-gray-400 text-center leading-tight">QR<br/>(ตัวอย่าง)</p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-3 pt-2">
          <button className="w-full bg-weeeu-primary hover:bg-weeeu-dark text-white font-semibold py-3 rounded-xl text-sm transition-colors">
            ⬇️ ดาวน์โหลด PDF (Mockup)
          </button>
          <button className="w-full border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold py-3 rounded-xl text-sm transition-colors">
            แชร์ใบรับรอง
          </button>
        </div>
      </div>
    </div>
  );
}
