import Link from "next/link";

export default async function KycReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const documents = [
    { name: "สำเนาบัตรประชาชน", status: "ready" },
    { name: "สำเนาใบทะเบียนการค้า", status: "ready" },
    { name: "ใบรับรองจดทะเบียน", status: "ready" },
    { name: "รูปถ่ายร้าน", status: "pending" },
  ];

  return (
    <div className="max-w-3xl mx-auto py-8 px-6">
      {/* Back link */}
      <Link href="/kyc" className="text-gray-400 hover:text-gray-600 text-sm">
        &larr; กลับรายการ KYC
      </Link>

      {/* Header */}
      <div className="flex items-center gap-4 mt-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          KYC Review — {id}
        </h1>
        <span className="inline-flex items-center gap-1.5 bg-yellow-50 text-yellow-700 border border-yellow-200 text-xs font-semibold px-3 py-1.5 rounded-full">
          🔍 รอตรวจสอบ
        </span>
      </div>

      {/* Info card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          ข้อมูลผู้สมัคร
        </p>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-xs text-gray-400">ชื่อร้าน / บริษัท</span>
            <span className="text-sm font-medium text-gray-800">ร้านซ่อมดีเจริญ</span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-gray-400">เลขทะเบียน</span>
            <span className="text-sm font-medium text-gray-800">0105569012345</span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-gray-400">ประเภท</span>
            <span className="text-sm font-medium text-gray-800">ร้านซ่อมทั่วไป</span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-gray-400">วันที่สมัคร</span>
            <span className="text-sm font-medium text-gray-800">24 พ.ค. 2569</span>
          </div>
        </div>
      </div>

      {/* Documents */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          เอกสาร
        </p>
        <div className="space-y-3">
          {documents.map((doc, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <span className="text-sm text-gray-700">{doc.name}</span>
              {doc.status === "ready" ? (
                <span className="text-xs font-semibold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">✓ พร้อม</span>
              ) : (
                <span className="text-xs font-semibold text-orange-500 bg-orange-50 px-2.5 py-1 rounded-full">○ รอเอกสาร</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          การดำเนินการ
        </p>
        <textarea
          placeholder="หมายเหตุ / เหตุผลประกอบ..."
          rows={3}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-admin-primary resize-none mb-4"
        />
        <div className="flex gap-3">
          <button className="bg-admin-primary hover:bg-admin-dark text-white font-semibold py-2.5 px-5 rounded-xl text-sm">
            ✅ อนุมัติ KYC
          </button>
          <button className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 px-5 rounded-xl text-sm">
            ❌ ปฏิเสธ
          </button>
        </div>
      </div>
    </div>
  );
}
