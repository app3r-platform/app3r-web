"use client";
// ─── การแจ้งเตือน (/notifications) — FIX-3: use client + filter tabs + card links

import { useState } from "react";
import Link from "next/link";

// U-36 — ครอบทุกเคสแจ้งเตือน (repair/maintain/resell/scrap/wallet/system · ทุก state)
// link targets: sweep-verified resolve ตาม route จริง (manifest sweep Fix-Wave C รอบแก้ · 2026-06-05)
const notifications = [
  // ── Repair ──
  {
    id: "1", icon: "🔧", title: "ช่างรับงานซ่อมแอร์แล้ว",
    body: "ช่าง วีระ จะมาถึงในเวลา 14:00 น. วันนี้",
    time: "10 นาทีที่แล้ว", isNew: true, category: "repair", link: "/jobs/job-001",
  },
  {
    id: "2", icon: "🔧", title: "ช่างเสนอราคาซ่อมเครื่องซักผ้า",
    body: "มี 3 ข้อเสนอจากร้านซ่อม — เลือกร้านที่ต้องการ",
    time: "40 นาทีที่แล้ว", isNew: true, category: "repair", link: "/repair/job-001/offers",
  },
  {
    id: "3", icon: "📋", title: "ซ่อมแอร์ห้องแขกเสร็จแล้ว — รอรีวิว",
    body: "การซ่อมเสร็จสิ้นแล้ว กรุณาให้คะแนนช่าง",
    time: "เมื่อวาน", isNew: false, category: "repair", link: "/jobs/job-002",
  },
  // ── Maintain ──
  {
    id: "4", icon: "🛠️", title: "มีข้อเสนองานล้างแอร์",
    body: "WeeeR เสนอราคาล้างแอร์ ฿850 — รับทราบเงื่อนไขก่อนยืนยัน",
    time: "1 ชม.ที่แล้ว", isNew: true, category: "maintain", link: "/maintain/jobs/mj-001/offers",
  },
  {
    id: "5", icon: "🔔", title: "ถึงเวลาล้างแอร์ประจำรอบ",
    body: "ถึงเวลาล้างแอร์ห้องนอนแล้ว (ครบ 6 เดือน)",
    time: "2 วันที่แล้ว", isNew: false, category: "maintain", link: "/maintain/jobs",
  },
  // ── Resell ──
  {
    id: "6", icon: "💰", title: "มีผู้สนใจซื้อตู้เย็น Sharp",
    body: "ร้าน WeeeR ยื่นข้อเสนอ ฿3,500 สำหรับตู้เย็นของคุณ",
    time: "1 ชม.ที่แล้ว", isNew: true, category: "resell", link: "/sell/listing-001",
  },
  {
    id: "7", icon: "⏳", title: "ข้อเสนอถูกเลือก — รอชำระพอยต์ทอง (24 ชม.)",
    body: "เติมพอยต์ทองให้พอแล้วชำระภายในกำหนด ก่อนข้อเสนอถูกยกเลิก",
    time: "2 ชม.ที่แล้ว", isNew: true, category: "resell", link: "/resell/awaiting-payment/tx-001",
  },
  {
    id: "8", icon: "📦", title: "ผู้ขายจัดส่งสินค้าแล้ว — ยืนยันรับของ",
    body: "ตรวจสภาพแล้วกดยืนยันรับสินค้าเพื่อปล่อยพอยต์ทองจาก Escrow",
    time: "5 ชม.ที่แล้ว", isNew: false, category: "resell", link: "/purchases/p-001",
  },
  {
    id: "9", icon: "⚖️", title: "อัปเดตข้อพิพาทคำสั่งซื้อ",
    body: "Admin กำลังตรวจสอบข้อพิพาท — ดูรายละเอียดและหลักฐาน",
    time: "เมื่อวาน", isNew: false, category: "resell", link: "/purchases/p-002/dispute",
  },
  // ── Scrap ──
  {
    id: "10", icon: "♻️", title: "มีร้านเสนอรับซาก",
    body: "ร้านรับซากเสนอราคา ฿850 — เลือกข้อเสนอก่อนหมดเวลา 24 ชม.",
    time: "3 ชม.ที่แล้ว", isNew: true, category: "scrap", link: "/scrap/sc-001/offers",
  },
  {
    id: "11", icon: "📜", title: "ใบรับรองการทำลายซาก (E-Waste) พร้อมแล้ว",
    body: "ดาวน์โหลดใบรับรองการกำจัดซากตามมาตรฐาน WEEE",
    time: "เมื่อวาน", isNew: false, category: "scrap", link: "/scrap/sc-001/certificate",
  },
  // ── Wallet ──
  {
    id: "12", icon: "💎", title: "รับพอยต์เงิน (Silver Point) แล้ว",
    body: "คุณได้รับ 50 พอยต์เงิน จากการทำธุรกรรมสำเร็จ",
    time: "3 ชม.ที่แล้ว", isNew: true, category: "wallet", link: "/wallet",
  },
  {
    id: "13", icon: "🥇", title: "Admin อนุมัติเติมพอยต์ทองแล้ว",
    body: "เติมพอยต์ทอง 3,000 สำเร็จ — ดูประวัติการทำรายการ",
    time: "6 ชม.ที่แล้ว", isNew: false, category: "wallet", link: "/wallet/history",
  },
  {
    id: "14", icon: "💳", title: "คำขอถอนพอยต์ทองได้รับการอนุมัติ",
    body: "โอนเข้าบัญชีธนาคารของคุณแล้ว — ตรวจสอบสถานะการถอน",
    time: "เมื่อวาน", isNew: false, category: "wallet", link: "/wallet/withdraw",
  },
  // ── System ──
  {
    id: "15", icon: "⚠️", title: "การยืนยันตัวตน (OTP) ผิดหลายครั้ง",
    body: "บัญชีถูกระงับชั่วคราวเพื่อความปลอดภัย — ดูวิธีปลดล็อก",
    time: "2 วันที่แล้ว", isNew: false, category: "system", link: "/suspended",
  },
  {
    id: "16", icon: "✅", title: "สมัครสมาชิกสำเร็จ",
    body: "ยินดีต้อนรับสู่ WeeeU แพลตฟอร์มจัดการเครื่องใช้ไฟฟ้า",
    time: "1 สัปดาห์ที่แล้ว", isNew: false, category: "system", link: "/dashboard",
  },
];

const categoryColors: Record<string, string> = {
  repair:   "bg-orange-50",
  resell:   "bg-green-50",
  scrap:    "bg-weeeu-surface",
  wallet:   "bg-yellow-50",
  maintain: "bg-weeeu-surface",
  system:   "bg-weeeu-surface",
};

const FILTER_TABS = [
  { value: "all",      label: "ทั้งหมด" },
  { value: "repair",   label: "ซ่อม" },
  { value: "maintain", label: "บำรุง" },
  { value: "resell",   label: "ซื้อ/ขาย" },
  { value: "scrap",    label: "ซาก" },
  { value: "wallet",   label: "Wallet" },
  { value: "system",   label: "ระบบ" },
];

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const markAllRead = () => setReadIds(new Set(notifications.map(n => n.id)));

  const filtered = activeTab === "all"
    ? notifications
    : notifications.filter(n => n.category === activeTab);

  const newCount = notifications.filter(n => n.isNew && !readIds.has(n.id)).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">การแจ้งเตือน</h1>
          {newCount > 0 && (
            <p className="text-sm text-weeeu-primary mt-0.5">{newCount} รายการใหม่</p>
          )}
        </div>
        <button onClick={markAllRead} className="text-sm text-gray-400 hover:text-gray-600 font-medium">
          อ่านทั้งหมด
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`flex-shrink-0 text-xs px-4 py-2 rounded-full font-medium transition-colors ${
              activeTab === tab.value
                ? "bg-weeeu-primary text-white"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
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
              onClick={() => setReadIds(prev => new Set([...prev, notif.id]))}
              className={`relative flex items-start gap-4 p-4 rounded-2xl border transition-all hover:shadow-sm block ${
                isNew ? "bg-weeeu-surface border-weeeu-primary/10" : "bg-white border-gray-100"
              }`}
            >
              {isNew && (
                <span className="absolute top-4 right-4 w-2 h-2 bg-weeeu-primary rounded-full" />
              )}
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 ${
                categoryColors[notif.category] || "bg-gray-50"
              }`}>
                {notif.icon}
              </div>
              <div className="flex-1 min-w-0 pr-4">
                <p className={`text-sm font-semibold ${isNew ? "text-weeeu-text" : "text-gray-800"}`}>
                  {notif.title}
                </p>
                <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{notif.body}</p>
                <p className="text-xs text-gray-400 mt-1">{notif.time}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🔔</p>
          <p className="text-gray-500 font-medium">ไม่มีการแจ้งเตือนในหมวดนี้</p>
        </div>
      )}
    </div>
  );
}
