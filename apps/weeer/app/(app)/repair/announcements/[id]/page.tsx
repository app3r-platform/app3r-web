import Link from "next/link";

export default async function RepairAnnouncementDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="space-y-5 max-w-xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/repair/announcements" className="text-gray-400 hover:text-gray-600">←</Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900">ประกาศรับงานซ่อม</h1>
            <span className="shrink-0 text-xs font-medium px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">
              🆕 รับข้อเสนอ
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">#{id}</p>
        </div>
      </div>

      {/* Customer info */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">ข้อมูลลูกค้า</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-400">ลูกค้า (นามแฝง)</p>
            <p className="text-sm font-medium text-gray-800">ลูกค้า #U-4821</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">พื้นที่</p>
            <p className="text-sm font-medium text-gray-800">บางรัก กรุงเทพฯ</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">ระยะห่างโดยประมาณ</p>
            <p className="text-sm font-medium text-gray-800">~3.2 กม.</p>
          </div>
        </div>
      </div>

      {/* Appliance info */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">ข้อมูลเครื่องใช้ไฟฟ้า</p>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">🌀</span>
          <p className="text-base font-semibold text-gray-800">เครื่องปรับอากาศ</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-400">ยี่ห้อ</p>
            <p className="text-sm font-medium text-gray-800">Daikin</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">รุ่น</p>
            <p className="text-sm font-medium text-gray-800">FTKQ18TV2S</p>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-gray-400">อาการ / รายละเอียด</p>
            <p className="text-sm font-medium text-gray-800">
              เปิดแล้วไม่เย็น มีเสียงดังผิดปกติ ใช้มา 5 ปี
            </p>
          </div>
        </div>
      </div>

      {/* Service details */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">รายละเอียดบริการ</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-400">ประเภทบริการ</p>
            <p className="text-sm font-medium text-gray-800">🏠 ช่างไปบ้าน (On-site)</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">งบประมาณสูงสุด</p>
            <p className="text-sm font-semibold text-green-700">ไม่เกิน 2,500 ฿</p>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-gray-400">วันนัดหมาย</p>
            <p className="text-sm font-medium text-gray-800">วันพุธที่ 28 พ.ค. 2569 ช่วงบ่าย</p>
          </div>
        </div>
      </div>

      {/* Photos */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">รูปภาพจากลูกค้า</p>
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
          href={`/repair/announcements/${id}/offer`}
          className="flex-1 block text-center bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 px-5 rounded-xl text-sm transition-colors"
        >
          ยื่นข้อเสนอ →
        </Link>
        <button className="border border-gray-200 text-gray-600 hover:bg-gray-50 py-2.5 px-4 rounded-xl text-sm">
          ไม่สนใจ
        </button>
      </div>
    </div>
  );
}
