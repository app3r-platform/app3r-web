"use client";
// ── Notifications — WeeeR (D-2 Push Subscribe) ────────────────────────────────
// เพิ่ม Push Notification subscribe UI + แสดงการแจ้งเตือนจริง

import PushSubscribeButton from "../../../components/push/PushSubscribeButton";

const NOTIFS = [
  { icon: "🔓", title: "รับ Silver จากงานซ่อม", body: "รับ 500 Silver จาก WeeeU escrow release — JOB-0421 เสร็จสมบูรณ์", time: "09:00", unread: true, tag: "payment" },
  { icon: "📦", title: "B2B Parts — ยืนยันรับของ", body: "ผู้ซื้อ S002 ยืนยันรับสินค้า ORDER-0089 แล้ว — escrow release กำลังดำเนินการ", time: "08:45", unread: true, tag: "parts" },
  { icon: "📥", title: "งานใหม่เข้า", body: "มีคำขอซ่อมแอร์ใหม่ใน queue — กรุณามอบหมายช่าง", time: "08:30", unread: true, tag: "job" },
  { icon: "👷", title: "WeeeT ได้รับการอนุมัติ", body: "Admin อนุมัติ WeeeT \"นายวิทยา ซ่อมเก่ง\" แล้ว", time: "เมื่อวาน", unread: false, tag: "staff" },
  { icon: "🔄", title: "งานอัปเดต", body: "JOB-0420 — นายสมชาย เริ่มดำเนินการแล้ว", time: "เมื่อวาน", unread: false, tag: "job" },
];

const unreadCount = NOTIFS.filter((n) => n.unread).length;

export default function NotificationsPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">
          แจ้งเตือน{" "}
          {unreadCount > 0 && (
            <span className="text-red-500 text-base">({unreadCount})</span>
          )}
        </h1>
        <button className="text-sm text-green-700 hover:underline">อ่านทั้งหมด</button>
      </div>

      {/* Push Notification Subscribe Card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
        <div className="text-sm font-medium text-gray-700 mb-3">
          รับการแจ้งเตือนแบบ Real-time
        </div>
        <PushSubscribeButton />
      </div>

      {/* รายการแจ้งเตือน */}
      <div className="space-y-2">
        {NOTIFS.map((n, i) => (
          <div
            key={i}
            className={`p-4 rounded-2xl border transition-colors ${
              n.unread ? "bg-green-50 border-green-100" : "bg-white border-gray-100"
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-xl shrink-0">{n.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-semibold ${n.unread ? "text-gray-900" : "text-gray-700"}`}>
                    {n.title}
                  </span>
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
