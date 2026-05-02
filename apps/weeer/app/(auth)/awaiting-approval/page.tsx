import type { Metadata } from "next";

export const metadata: Metadata = { title: "รอการอนุมัติ — WeeeR" };

export default function AwaitingApprovalPage() {
  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="text-5xl mb-4">⏳</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">รอการอนุมัติจาก Admin</h1>
        <p className="text-gray-500 text-sm mb-6">
          บัญชีของคุณกำลังรอ Admin ตรวจสอบเอกสาร<br />โดยปกติใช้เวลา 1–3 วันทำการ
        </p>

        {/* Steps */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left space-y-3">
          <div className="flex items-center gap-3">
            <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-xs font-bold shrink-0">✓</span>
            <div>
              <div className="text-sm font-medium text-gray-800">สมัครสมาชิกสำเร็จ</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-xs shrink-0">📄</span>
            <div>
              <div className="text-sm font-medium text-gray-800">อัปโหลดเอกสารแล้ว</div>
              <div className="text-xs text-gray-500">Admin กำลังตรวจสอบ</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600 text-xs shrink-0">⏳</span>
            <div>
              <div className="text-sm font-medium text-gray-800">รอการอนุมัติ</div>
              <div className="text-xs text-gray-500">ระบบจะแจ้งผลทางอีเมล</div>
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-400">
          ติดต่อ support@app3r.co.th หากไม่ได้รับการอนุมัติภายใน 3 วัน
        </p>
      </div>
    </div>
  );
}
