import type { Metadata } from "next";

export const metadata: Metadata = { title: "โปรไฟล์ — WeeeR" };

export default function ProfilePage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-xl font-bold text-gray-900">โปรไฟล์บริษัท</h1>

      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-gray-900">ข้อมูลบริษัท</h3>
          <button className="text-sm border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 text-gray-600">✏️ แก้ไข</button>
        </div>
        <div className="space-y-4">
          {[
            { label: "ชื่อบริษัท / ร้าน", value: "บริษัท ช่างเย็น จำกัด", icon: "🏢" },
            { label: "อีเมล",              value: "company@example.com",    icon: "📧" },
            { label: "เบอร์โทรศัพท์",     value: "081-234-5678",            icon: "📱" },
            { label: "สถานะบัญชี",        value: "✅ Active",               icon: "🔖" },
          ].map((r) => (
            <div key={r.label} className="flex items-start gap-3">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center shrink-0 text-sm">{r.icon}</div>
              <div>
                <div className="text-xs text-gray-400">{r.label}</div>
                <div className="text-sm text-gray-800">{r.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">เอกสารประกอบการสมัคร</h3>
        {[
          { label: "หนังสือรับรองบริษัท", status: "อนุมัติแล้ว" },
          { label: "สำเนาบัตรประชาชน",    status: "อนุมัติแล้ว" },
        ].map((d) => (
          <div key={d.label} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl mb-2">
            <span className="text-sm text-gray-700">📄 {d.label}</span>
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">{d.status}</span>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-3">ความปลอดภัย</h3>
        <button className="text-sm border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 text-gray-600">🔑 เปลี่ยนรหัสผ่าน</button>
      </div>
    </div>
  );
}
