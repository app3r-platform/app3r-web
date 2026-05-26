import Link from "next/link";

export default async function ScrapAnnouncementDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="space-y-5 max-w-xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/scrap/announcements" className="text-gray-400 hover:text-gray-600">←</Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900">ประกาศขายซาก</h1>
            <span className="shrink-0 text-xs font-medium px-2.5 py-1 rounded-full bg-green-100 text-green-700">
              🆕 เปิดรับข้อเสนอ
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">#{id}</p>
        </div>
      </div>

      {/* Item info */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">ข้อมูลสินค้า</p>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">♻️</span>
          <p className="text-base font-semibold text-gray-800">เครื่องซักผ้าเก่า</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-400">ยี่ห้อ</p>
            <p className="text-sm font-medium text-gray-800">Samsung</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">ขนาด</p>
            <p className="text-sm font-medium text-gray-800">8 kg</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">สภาพ</p>
            <p className="text-sm font-medium text-gray-800">ชำรุด ใช้ไม่ได้</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">น้ำหนักโดยประมาณ</p>
            <p className="text-sm font-medium text-gray-800">50 กก.</p>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-gray-400">อาการ / รายละเอียด</p>
            <p className="text-sm font-medium text-gray-800">
              เปิดแล้วไม่ทำงาน มอเตอร์น่าจะพัง
            </p>
          </div>
        </div>
      </div>

      {/* Location */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">สถานที่รับของ</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-400">พื้นที่</p>
            <p className="text-sm font-medium text-gray-800">ลาดพร้าว กรุงเทพฯ</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">ระยะห่างโดยประมาณ</p>
            <p className="text-sm font-medium text-gray-800">~8 กม.</p>
          </div>
        </div>
      </div>

      {/* Photos */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">รูปภาพสินค้า</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-100 rounded-xl h-28 flex items-center justify-center">
            <p className="text-xs text-gray-400">รูปจากลูกค้า</p>
          </div>
          <div className="bg-gray-100 rounded-xl h-28 flex items-center justify-center">
            <p className="text-xs text-gray-400">รูปจากลูกค้า</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Link
          href={`/scrap/announcements/${id}/offer`}
          className="flex-1 block text-center bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 px-5 rounded-xl text-sm transition-colors"
        >
          💰 ยื่นราคารับซื้อ
        </Link>
        <Link
          href={`/scrap/announcements/${id}/offer`}
          className="flex-1 block text-center border border-gray-200 text-gray-600 hover:bg-gray-50 py-2.5 px-4 rounded-xl text-sm"
        >
          🆓 เสนอรับทิ้งฟรี
        </Link>
      </div>
    </div>
  );
}
