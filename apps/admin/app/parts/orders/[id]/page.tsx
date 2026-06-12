import Link from "next/link";

export default async function PartsOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const hasDispute = false;

  return (
    <div className="max-w-3xl mx-auto py-8 px-6">
      {/* Back link */}
      <Link href="/parts/orders" className="text-gray-400 hover:text-gray-600 text-sm">
        &larr; กลับรายการ Parts Orders
      </Link>

      {/* Header */}
      <div className="flex items-center gap-4 mt-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">คำสั่งซื้ออะไหล่ #{id}</h1>
        <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-600 border border-blue-200 text-xs font-semibold px-3 py-1.5 rounded-full">
          ⏳ รอยืนยัน
        </span>
      </div>

      {/* Info card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          รายละเอียดออเดอร์
        </p>
        <div className="grid grid-cols-2 gap-x-8 gap-y-2">
          <div className="flex justify-between">
            <span className="text-xs text-gray-400">ผู้ซื้อ</span>
            <span className="text-sm font-medium text-gray-800">ร้านดีเจริญ</span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-gray-400">ผู้ขาย</span>
            <span className="text-sm font-medium text-gray-800">ร้านอะไหล่ไทยแลนด์</span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-gray-400">สินค้า</span>
            <span className="text-sm font-medium text-gray-800">คอมเพรสเซอร์ Daikin FTXS35 (×1)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-gray-400">ราคา</span>
            <span className="text-sm font-medium text-gray-800">3,500 ฿</span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-gray-400">วันที่</span>
            <span className="text-sm font-medium text-gray-800">25 พ.ค. 2569</span>
          </div>
        </div>
      </div>

      {/* Cross-app link */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          ลิงก์เชื่อมโยง
        </p>
        <a
          href={`${process.env.NEXT_PUBLIC_WEEER_URL ?? 'http://localhost:3001'}/parts/orders/p001`}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-admin-primary hover:underline font-medium"
        >
          ดูสถานะบน WeeeR &rarr;
        </a>
      </div>

      {/* Dispute */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          ข้อพิพาท
        </p>
        {hasDispute ? (
          <Link href={`/disputes/p001`} className="text-sm text-red-500 hover:underline font-medium">
            ดู Dispute &rarr;
          </Link>
        ) : (
          <p className="text-sm text-gray-400 italic">ยังไม่มี dispute</p>
        )}
      </div>
    </div>
  );
}
