import Link from "next/link";

const STEPS = [
  { label: "สั่งซื้อ", done: true },
  { label: "รอผู้ขายยืนยัน", done: true },
  { label: "จัดส่ง", active: true },
  { label: "ตรวจรับ", done: false },
  { label: "เสร็จสิ้น", done: false },
];

export default function ResellPurchaseDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;

  return (
    <div className="space-y-5 max-w-xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/resell/purchases" className="text-gray-400 hover:text-gray-600">←</Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900">การซื้อ #{id}</h1>
            <span className="shrink-0 text-xs font-medium px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-700">
              📦 รอจัดส่ง
            </span>
          </div>
        </div>
      </div>

      {/* Info card */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">ข้อมูลคำสั่งซื้อ</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-400">สินค้า</p>
            <p className="text-sm font-medium text-gray-800">แอร์ Daikin 12000 BTU</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">ราคา</p>
            <p className="text-sm font-semibold text-gray-800">4,200 ฿</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">ผู้ขาย</p>
            <p className="text-sm font-medium text-gray-800">บริษัท ตัวอย่าง จำกัด (U)</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">วันที่สั่ง</p>
            <p className="text-sm font-medium text-gray-800">25 พ.ค. 2569</p>
          </div>
        </div>
      </div>

      {/* Timeline tracker */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">ลำดับขั้นตอน</p>
        <div className="flex items-center gap-0">
          {STEPS.map((step, i) => (
            <div key={i} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold
                    ${step.done ? "bg-green-600 text-white" : step.active ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-400"}`}
                >
                  {step.done ? "✓" : step.active ? "●" : i + 1}
                </div>
                <p className={`text-xs mt-1 text-center leading-tight
                  ${step.done ? "text-green-700" : step.active ? "text-blue-700 font-semibold" : "text-gray-400"}`}
                  style={{ maxWidth: "52px" }}
                >
                  {step.label}
                </p>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-0.5 mb-5 ${step.done ? "bg-green-400" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Action */}
      <Link
        href={`/resell/purchases/${id}/inspect`}
        className="w-full block text-center bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 px-5 rounded-xl text-sm transition-colors"
      >
        รับของแล้ว → ตรวจสภาพ
      </Link>
    </div>
  );
}
