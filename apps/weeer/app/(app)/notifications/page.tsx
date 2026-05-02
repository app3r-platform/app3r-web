import type { Metadata } from "next";

export const metadata: Metadata = { title: "แจ้งเตือน — WeeeR" };

const NOTIFS = [
  { icon: "📥", title: "งานใหม่เข้า", body: "มีคำขอซ่อมแอร์ใหม่ใน queue — กรุณามอบหมายช่าง", time: "09:00", unread: true },
  { icon: "👷", title: "WeeeT ได้รับการอนุมัติ", body: "Admin อนุมัติ WeeeT \"นายวิทยา ซ่อมเก่ง\" แล้ว", time: "08:30", unread: true },
  { icon: "💰", title: "ได้รับ Silver", body: "รับ 500 Silver จากงาน JOB-0421 เสร็จสมบูรณ์", time: "เมื่อวาน", unread: false },
  { icon: "🔄", title: "งานอัปเดต", body: "JOB-0420 — นายสมชาย เริ่มดำเนินการแล้ว", time: "เมื่อวาน", unread: false },
];

export default function NotificationsPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">แจ้งเตือน <span className="text-red-500 text-base">(2)</span></h1>
        <button className="text-sm text-green-700 hover:underline">อ่านทั้งหมด</button>
      </div>

      <div className="space-y-2">
        {NOTIFS.map((n, i) => (
          <div key={i} className={`p-4 rounded-2xl border transition-colors ${n.unread ? "bg-green-50 border-green-100" : "bg-white border-gray-100"}`}>
            <div className="flex items-start gap-3">
              <span className="text-xl shrink-0">{n.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-semibold ${n.unread ? "text-gray-900" : "text-gray-700"}`}>{n.title}</span>
                  {n.unread && <span className="w-2 h-2 bg-green-600 rounded-full shrink-0" />}
                </div>
                <p className="text-sm text-gray-600 mt-0.5">{n.body}</p>
                <p className="text-xs text-gray-400 mt-1">{n.time}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
