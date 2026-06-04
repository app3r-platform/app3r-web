"use client";
// ─── การแจ้งเตือน (/notifications) — T-13 · WeeeT (ช่าง) · DARK theme · mockup-only
// Pattern จาก apps/weeeu/app/(app)/notifications/page.tsx แต่ปรับเป็น dark + บริบทช่าง

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type NotifCategory = "repair" | "schedule" | "point" | "system";

type Notif = {
  id: string;
  icon: string;
  title: string;
  body: string;
  time: string;
  isNew: boolean;
  category: NotifCategory;
  link: string;
};

// Mock data (Mockup — ไม่ fetch API จริง) · link ใช้ route ที่มีจริงเท่านั้น
const NOTIFICATIONS: Notif[] = [
  {
    id: "1", icon: "🔧", title: "งานซ่อมใหม่เข้าระบบ",
    body: "งานซ่อมแอร์ Daikin ย่านลาดพร้าว รอคุณรับงาน",
    time: "5 นาทีที่แล้ว", isNew: true, category: "repair", link: "/jobs",
  },
  {
    id: "2", icon: "📅", title: "นัดหมายวันนี้ 14:00 น.",
    body: "งานล้างแอร์ที่คอนโดเดอะเบส กรุณามาตรงเวลา",
    time: "30 นาทีที่แล้ว", isNew: true, category: "schedule", link: "/today",
  },
  {
    id: "3", icon: "🥇", title: "พอยต์ทองเข้าบัญชี",
    body: "คุณได้รับ 250 พอยต์ทอง จากงานซ่อมที่เสร็จสมบูรณ์",
    time: "2 ชม.ที่แล้ว", isNew: true, category: "point", link: "/wallet",
  },
  {
    id: "4", icon: "📦", title: "อะไหล่ที่สั่งจัดส่งแล้ว",
    body: "คอมเพรสเซอร์ที่สั่งไว้กำลังจัดส่ง คาดว่าถึงพรุ่งนี้",
    time: "เมื่อวาน", isNew: false, category: "repair", link: "/parts",
  },
  {
    id: "5", icon: "💎", title: "ได้รับพอยต์เงินโบนัส",
    body: "รับ 80 พอยต์เงิน จากการทำงานครบ 10 งานในเดือนนี้",
    time: "2 วันที่แล้ว", isNew: false, category: "point", link: "/wallet",
  },
  {
    id: "6", icon: "📅", title: "เลื่อนนัดงานซ่อมตู้เย็น",
    body: "ลูกค้าขอเลื่อนนัดเป็นวันพรุ่งนี้ 10:00 น.",
    time: "3 วันที่แล้ว", isNew: false, category: "schedule", link: "/jobs",
  },
  {
    id: "7", icon: "✅", title: "ยินดีต้อนรับสู่ WeeeT",
    body: "บัญชีช่างของคุณพร้อมรับงานแล้ว เริ่มต้นที่หน้าแดชบอร์ด",
    time: "1 สัปดาห์ที่แล้ว", isNew: false, category: "system", link: "/dashboard",
  },
];

// สีไอคอนตามหมวด (dark theme — ใช้โทน weeet-primary + semantic เท่านั้น · ไม่มี purple-family)
const CATEGORY_ICON_BG: Record<NotifCategory, string> = {
  repair:   "bg-weeet-primary/15",
  schedule: "bg-blue-500/15",
  point:    "bg-amber-500/15",
  system:   "bg-gray-700",
};

const FILTER_TABS: { value: "all" | NotifCategory; label: string }[] = [
  { value: "all",      label: "ทั้งหมด" },
  { value: "repair",   label: "งานซ่อม" },
  { value: "point",    label: "พอยต์" },
  { value: "system",   label: "ระบบ" },
];

export default function NotificationsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"all" | NotifCategory>("all");
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const markAllRead = () => setReadIds(new Set(NOTIFICATIONS.map((n) => n.id)));

  // หมวด "schedule" รวมอยู่ในแท็บ "งานซ่อม" (repair) เพื่อให้แท็บกระชับ
  const filtered = NOTIFICATIONS.filter((n) => {
    if (activeTab === "all") return true;
    if (activeTab === "repair") return n.category === "repair" || n.category === "schedule";
    return n.category === activeTab;
  });

  const newCount = NOTIFICATIONS.filter((n) => n.isNew && !readIds.has(n.id)).length;

  return (
    <div className="pb-6">
      {/* Header + back nav */}
      <div className="sticky top-0 bg-gray-950/90 backdrop-blur-sm border-b border-gray-800 px-4 py-3 flex items-center gap-3 z-10">
        <button
          onClick={() => router.back()}
          className="text-gray-400 hover:text-white text-lg"
          aria-label="ย้อนกลับ"
        >
          ←
        </button>
        <div className="flex-1">
          <h1 className="font-bold text-white">การแจ้งเตือน</h1>
          {newCount > 0 && (
            <p className="text-xs text-weeet-primary">{newCount} รายการใหม่</p>
          )}
        </div>
        <button
          onClick={markAllRead}
          className="text-xs text-gray-400 hover:text-white font-medium"
        >
          อ่านทั้งหมด
        </button>
      </div>

      <div className="px-4 pt-4 space-y-5">
        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`flex-shrink-0 text-xs px-4 py-2 rounded-full font-medium transition-colors ${
                activeTab === tab.value
                  ? "bg-weeet-primary text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Notification list */}
        <div className="space-y-2">
          {filtered.map((notif) => {
            const isNew = notif.isNew && !readIds.has(notif.id);
            return (
              <Link
                key={notif.id}
                href={notif.link}
                onClick={() => setReadIds((prev) => new Set([...prev, notif.id]))}
                className={`relative flex items-start gap-4 p-4 rounded-2xl border transition-colors block ${
                  isNew
                    ? "bg-gray-800 border-weeet-primary/40 hover:border-weeet-primary"
                    : "bg-gray-900 border-gray-800 hover:border-gray-600"
                }`}
              >
                {isNew && (
                  <span className="absolute top-4 right-4 w-2 h-2 bg-weeet-primary rounded-full" />
                )}
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 ${CATEGORY_ICON_BG[notif.category]}`}
                >
                  {notif.icon}
                </div>
                <div className="flex-1 min-w-0 pr-4">
                  <p className={`text-sm font-semibold ${isNew ? "text-white" : "text-gray-300"}`}>
                    {notif.title}
                  </p>
                  <p className="text-sm text-gray-400 mt-0.5 line-clamp-2">{notif.body}</p>
                  <p className="text-xs text-gray-500 mt-1">{notif.time}</p>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🔔</p>
            <p className="text-gray-400 font-medium">ไม่มีการแจ้งเตือนในหมวดนี้</p>
          </div>
        )}
      </div>
    </div>
  );
}
