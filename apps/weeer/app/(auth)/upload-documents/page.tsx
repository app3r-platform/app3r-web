import type { Metadata } from "next";

export const metadata: Metadata = { title: "อัปโหลดเอกสาร — WeeeR" };

const DOC_TYPES = [
  { label: "หนังสือรับรองบริษัท / ทะเบียนพาณิชย์", required: true },
  { label: "สำเนาบัตรประชาชนเจ้าของกิจการ", required: true },
  { label: "ใบอนุญาตประกอบกิจการ (ถ้ามี)", required: false },
];

export default function UploadDocumentsPage() {
  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">📄</div>
          <h1 className="text-xl font-bold text-gray-900">อัปโหลดเอกสาร</h1>
          <p className="text-sm text-gray-500 mt-1">Admin จะตรวจสอบภายใน 1–3 วันทำการ</p>
        </div>
        <form className="space-y-4">
          {DOC_TYPES.map((doc) => (
            <div key={doc.label}>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {doc.label}
                {doc.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <div className="flex items-center justify-center w-full p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-green-400 hover:bg-green-50 transition-colors cursor-pointer text-sm text-gray-400">
                📎 คลิกเพื่อเลือกไฟล์ (PDF, JPG, PNG — สูงสุด 10MB)
              </div>
            </div>
          ))}
          <button type="submit"
            className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-3 rounded-xl transition-colors mt-2">
            ส่งเอกสาร
          </button>
        </form>
      </div>
    </div>
  );
}
