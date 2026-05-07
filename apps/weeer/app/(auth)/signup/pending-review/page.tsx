import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "รอการอนุมัติ — WeeeR" };

type KycStatus = "pending" | "reviewing" | "approved" | "rejected" | "additional_required";

// Mock status — จะดึงจาก GET /api/v1/weeer/approval-status
const MOCK_STATUS = "reviewing" as KycStatus;
const MOCK_REJECTION_REASON = "เอกสารไม่ชัดเจน — กรุณาอัปโหลดใหม่";

const STATUS_CONFIG: Record<KycStatus, { icon: string; title: string; desc: string; color: string }> = {
  pending: {
    icon: "⏳", title: "รอ Admin ตรวจสอบ", color: "text-amber-600",
    desc: "ระบบได้รับเอกสารของคุณแล้ว — Admin จะตรวจสอบภายใน 3-5 วันทำการ",
  },
  reviewing: {
    icon: "🔍", title: "Admin กำลังตรวจสอบ", color: "text-blue-600",
    desc: "Admin กำลังพิจารณาเอกสารของคุณ — คุณจะได้รับแจ้งทางอีเมลเมื่อมีผล",
  },
  approved: {
    icon: "✅", title: "อนุมัติแล้ว!", color: "text-green-600",
    desc: "บัญชีของคุณได้รับการอนุมัติแล้ว — ระบบสร้างบัญชี WeeeT เริ่มต้นให้อัตโนมัติ",
  },
  rejected: {
    icon: "❌", title: "ไม่ผ่านการอนุมัติ", color: "text-red-600",
    desc: "เอกสารไม่ผ่านการตรวจสอบ — กรุณาแก้ไขและส่งใหม่",
  },
  additional_required: {
    icon: "📋", title: "ต้องการเอกสารเพิ่มเติม", color: "text-orange-600",
    desc: "Admin ขอเอกสารเพิ่มเติม — กรุณาอัปโหลดตามที่ระบุ",
  },
};

const STEPS = [
  { label: "ลงทะเบียน", done: true },
  { label: "ยืนยัน OTP/Email", done: true },
  { label: "ข้อมูลธุรกิจ", done: true },
  { label: "ตรวจสอบเอกสาร", done: MOCK_STATUS === "approved" },
  { label: "เปิดร้าน", done: MOCK_STATUS === "approved" },
];

export default function PendingReviewPage() {
  const cfg = STATUS_CONFIG[MOCK_STATUS];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Main status card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center space-y-4">
          <div className="text-5xl">{cfg.icon}</div>
          <h1 className={`text-xl font-bold ${cfg.color}`}>{cfg.title}</h1>
          <p className="text-sm text-gray-600">{cfg.desc}</p>

          {MOCK_STATUS === "rejected" && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 text-left">
              <strong>เหตุผล:</strong> {MOCK_REJECTION_REASON}
            </div>
          )}

          {MOCK_STATUS === "approved" && (
            <Link
              href="/login"
              className="block w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-3 rounded-xl transition-colors mt-4"
            >
              เข้าสู่ระบบ →
            </Link>
          )}
          {(MOCK_STATUS === "rejected" || MOCK_STATUS === "additional_required") && (
            <Link
              href="/signup/kyc-upload"
              className="block w-full border-2 border-green-700 text-green-700 hover:bg-green-50 font-semibold py-3 rounded-xl transition-colors mt-4"
            >
              อัปโหลดเอกสารใหม่
            </Link>
          )}
        </div>

        {/* Progress steps */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <p className="text-sm font-semibold text-gray-700 mb-4">ความคืบหน้า</p>
          <div className="space-y-3">
            {STEPS.map((s, i) => (
              <div key={s.label} className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                  ${s.done ? "bg-green-600 text-white" : i === STEPS.findIndex((x) => !x.done) ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-400"}`}>
                  {s.done ? "✓" : i + 1}
                </div>
                <span className={`text-sm ${s.done ? "text-gray-700 font-medium" : "text-gray-400"}`}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-2 text-sm text-gray-500">
          <p>📧 แจ้งผลทาง: อีเมลที่ลงทะเบียน</p>
          <p>⏰ ระยะเวลา: 3-5 วันทำการ</p>
          <p>❓ สอบถาม: <a href="mailto:support@app3r.com" className="text-green-700 hover:underline">support@app3r.com</a></p>
        </div>
      </div>
    </div>
  );
}
