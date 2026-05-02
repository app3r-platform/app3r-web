import type { Metadata } from "next";

export const metadata: Metadata = { title: "การแจ้งเตือน" };

const notifications = [
  {
    id: "1", icon: "🔧", title: "ช่างรับงานซ่อมแอร์แล้ว", body: "ช่าง วีระ จะมาถึงในเวลา 14:00 น. วันนี้",
    time: "10 นาทีที่แล้ว", isNew: true, category: "repair",
  },
  {
    id: "2", icon: "💰", title: "มีผู้สนใจซื้อตู้เย็น Sharp", body: "ร้าน WeeeR ยื่น offer ฿3,500 สำหรับตู้เย็นของคุณ",
    time: "1 ชม.ที่แล้ว", isNew: true, category: "resell",
  },
  {
    id: "3", icon: "💎", title: "รับ Silver Point แล้ว", body: "คุณได้รับ 50 Silver Point จากการซ่อมเสร็จ",
    time: "3 ชม.ที่แล้ว", isNew: true, category: "wallet",
  },
  {
    id: "4", icon: "📋", title: "ประวัติการซ่อมแอร์ห้องแขก", body: "การซ่อมเสร็จสิ้นแล้ว กรุณาให้คะแนนช่าง",
    time: "เมื่อวาน", isNew: false, category: "repair",
  },
  {
    id: "5", icon: "🔔", title: "แจ้งเตือนล้างแอร์", body: "ถึงเวลาล้างแอร์ห้องนอนแล้ว (ครบ 6 เดือน)",
    time: "2 วันที่แล้ว", isNew: false, category: "maintain",
  },
  {
    id: "6", icon: "✅", title: "สมัครสมาชิกสำเร็จ", body: "ยินดีต้อนรับสู่ WeeeU แพลตฟอร์มจัดการเครื่องใช้ไฟฟ้า",
    time: "1 สัปดาห์ที่แล้ว", isNew: false, category: "system",
  },
];

const categoryColors: Record<string, string> = {
  repair: "bg-orange-50",
  resell: "bg-green-50",
  wallet: "bg-yellow-50",
  maintain: "bg-purple-50",
  system: "bg-blue-50",
};

export default function NotificationsPage() {
  const newCount = notifications.filter((n) => n.isNew).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">การแจ้งเตือน</h1>
          {newCount > 0 && (
            <p className="text-sm text-blue-600 mt-0.5">{newCount} รายการใหม่</p>
          )}
        </div>
        <button className="text-sm text-gray-400 hover:text-gray-600 font-medium">
          อ่านทั้งหมด
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {["ทั้งหมด", "ซ่อม", "ซื้อ/ขาย", "Wallet", "ระบบ"].map((tab) => (
          <button
            key={tab}
            className={`flex-shrink-0 text-xs px-4 py-2 rounded-full font-medium transition-colors ${
              tab === "ทั้งหมด"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Notification list */}
      <div className="space-y-2">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            className={`relative flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer hover:shadow-sm ${
              notif.isNew
                ? "bg-blue-50 border-blue-100"
                : "bg-white border-gray-100"
            }`}
          >
            {/* New dot */}
            {notif.isNew && (
              <span className="absolute top-4 right-4 w-2 h-2 bg-blue-500 rounded-full" />
            )}

            {/* Icon */}
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 ${
              categoryColors[notif.category] || "bg-gray-50"
            }`}>
              {notif.icon}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pr-4">
              <p className={`text-sm font-semibold ${notif.isNew ? "text-blue-900" : "text-gray-800"}`}>
                {notif.title}
              </p>
              <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{notif.body}</p>
              <p className="text-xs text-gray-400 mt-1">{notif.time}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Empty state (hidden) */}
      {notifications.length === 0 && (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🔔</p>
          <p className="text-gray-500 font-medium">ยังไม่มีการแจ้งเตือน</p>
          <p className="text-sm text-gray-400 mt-1">การแจ้งเตือนจะแสดงที่นี่</p>
        </div>
      )}
    </div>
  );
}
