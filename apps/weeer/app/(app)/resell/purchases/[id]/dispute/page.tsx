import Link from "next/link";

export default async function ResellPurchaseDisputePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="space-y-5 max-w-xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/resell/purchases/${id}`} className="text-gray-400 hover:text-gray-600">←</Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900">⚠️ ข้อพิพาท (Dispute) R-08 — ไม่ตรงปก</h1>
          </div>
        </div>
        <span className="shrink-0 text-xs font-medium px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-700">
          🔍 Admin กำลังพิจารณา
        </span>
      </div>

      {/* Summary */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">สรุปคำสั่งซื้อ</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-400">งานหมายเลข</p>
            <p className="text-sm font-medium text-gray-800">#{id}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">สินค้า</p>
            <p className="text-sm font-medium text-gray-800">แอร์ Daikin 12000 BTU</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">ราคา</p>
            <p className="text-sm font-semibold text-gray-800">4,200 ฿</p>
          </div>
        </div>
      </div>

      {/* Dispute reason */}
      <div className="bg-red-50 border border-red-100 rounded-xl p-4 space-y-3">
        <p className="text-xs font-semibold text-red-400 uppercase tracking-wider">เหตุผลการเปิดข้อพิพาท (Dispute)</p>
        <div>
          <p className="text-xs text-gray-400">รายละเอียด</p>
          <p className="text-sm font-medium text-gray-800">
            สภาพไม่ตรงตามประกาศ — มีรอยสนิมที่ไม่ได้แจ้ง
          </p>
        </div>
      </div>

      {/* Evidence photos */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">หลักฐานจากผู้ซื้อ</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-100 rounded-xl h-28 flex items-center justify-center">
            <p className="text-xs text-gray-400">รูปหลักฐานจากผู้ซื้อ</p>
          </div>
          <div className="bg-gray-100 rounded-xl h-28 flex items-center justify-center">
            <p className="text-xs text-gray-400">รูปหลักฐานจากผู้ซื้อ</p>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">ลำดับเวลา</p>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 w-2 h-2 rounded-full bg-red-500 shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-800">ยื่นข้อพิพาท (Dispute) แล้ว</p>
              <p className="text-xs text-gray-400">25 พ.ค. 2569</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="mt-0.5 w-2 h-2 rounded-full bg-gray-200 shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-400">รอ Admin พิจารณา</p>
            </div>
          </div>
        </div>
      </div>

      {/* Admin note */}
      <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 flex items-start gap-2">
        <span className="text-lg">ℹ️</span>
        <p className="text-sm text-yellow-800">
          Admin จะติดต่อกลับภายใน 24 ชั่วโมง
        </p>
      </div>
    </div>
  );
}
