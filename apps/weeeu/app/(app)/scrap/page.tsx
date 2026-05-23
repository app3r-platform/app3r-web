"use client";

import { useState } from "react";
import Link from "next/link";

// Local types — Mockup only
type ScrapType = "for_sale" | "free";
type ScrapGrade = "A" | "B" | "C";
type ScrapStatus =
  | "announced"
  | "receiving_offers"
  | "offer_selected"
  | "in_progress"
  | "awaiting_renegotiation"
  | "completed"
  | "cancelled"
  | "disputed"
  | "expired"; // S5

type ScrapItem = {
  id: string;
  scrapType: ScrapType;
  applianceType: string;
  grade: ScrapGrade;
  description: string;
  askingPrice?: number;
  status: ScrapStatus;
  createdAt: string;
  fromRepairJobId?: string; // S12
};

const STATUS_LABEL: Record<ScrapStatus, string> = {
  announced: "ประกาศแล้ว",
  receiving_offers: "รับข้อเสนอ",
  offer_selected: "เลือกร้านแล้ว",
  in_progress: "ช่างกำลังมา",
  awaiting_renegotiation: "รอยืนยันราคาใหม่",
  completed: "เสร็จสิ้น",
  cancelled: "ยกเลิก",
  disputed: "มีข้อพิพาท",
  expired: "หมดอายุ (S5)",
};

const STATUS_COLOR: Record<ScrapStatus, string> = {
  announced: "bg-weeeu-surface text-weeeu-primary",
  receiving_offers: "bg-weeeu-surface text-weeeu-primary",
  offer_selected: "bg-purple-100 text-purple-700",
  in_progress: "bg-yellow-100 text-yellow-700",
  awaiting_renegotiation: "bg-orange-100 text-orange-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-gray-100 text-gray-500",
  disputed: "bg-red-100 text-red-700",
  expired: "bg-gray-100 text-gray-400",
};

const MOCK_SCRAPS: ScrapItem[] = [
  {
    id: "scrap-001",
    scrapType: "for_sale",
    applianceType: "ตู้เย็น Samsung",
    grade: "B",
    description: "ตู้เย็น 2 ประตู มอเตอร์พัง ตัวถังดี",
    askingPrice: 500,
    status: "receiving_offers",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "scrap-002",
    scrapType: "free",
    applianceType: "เครื่องซักผ้า LG",
    grade: "C",
    description: "เสียหายมาก ต้องการทิ้งอย่างถูกต้อง",
    status: "offer_selected",
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: "scrap-003",
    scrapType: "for_sale",
    applianceType: "แอร์ Daikin",
    grade: "A",
    description: "ยังทำงานได้บางส่วน คอมเพรสเซอร์ดี",
    askingPrice: 1200,
    status: "expired", // S5 demo
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
  {
    id: "scrap-004",
    scrapType: "for_sale",
    applianceType: "ทีวี Sony",
    grade: "B",
    description: "หน้าจอมีรอยแตก ตัวเครื่องอุปกรณ์ดี",
    askingPrice: 300,
    status: "completed",
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
    fromRepairJobId: "repair-999", // S12 badge
  },
  {
    id: "scrap-005",
    scrapType: "for_sale",
    applianceType: "เครื่องปรับอากาศ Mitsubishi",
    grade: "B",
    description: "รั่วซึม แต่ชิ้นส่วนยังดี",
    askingPrice: 800,
    status: "in_progress",
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
];

type TabValue = ScrapStatus | "";

const STATUS_TABS: { value: TabValue; label: string }[] = [
  { value: "", label: "ทั้งหมด" },
  { value: "receiving_offers", label: "รับข้อเสนอ" },
  { value: "in_progress", label: "กำลังดำเนินการ" },
  { value: "completed", label: "เสร็จสิ้น" },
  { value: "expired", label: "หมดอายุ (S5)" },
  { value: "cancelled", label: "ยกเลิก" },
];

export default function ScrapPage() {
  const [statusTab, setStatusTab] = useState<TabValue>("");

  const filtered = statusTab
    ? MOCK_SCRAPS.filter(s => s.status === statusTab)
    : MOCK_SCRAPS;

  return (
    <div className="max-w-xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">ซากของฉัน</h1>
        <Link
          href="/scrap/new"
          className="bg-weeeu-primary hover:bg-weeeu-dark text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
        >
          + ประกาศซากใหม่
        </Link>
      </div>

      {/* No fee notice */}
      <div className="bg-weeeu-surface border border-weeeu-primary/20 rounded-xl p-3 flex items-center gap-2">
        <span className="text-lg">♻️</span>
        <p className="text-xs text-weeeu-text">
          <span className="font-semibold">ฟรี!</span> ไม่มีค่าธรรมเนียมประกาศซาก ·{" "}
          WeeeR ยื่นข้อเสนอมาหาคุณ · <span className="font-semibold">escrow: WeeeR จ่าย Gold → คุณ</span>
        </p>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {STATUS_TABS.map(t => (
          <button
            key={t.value}
            onClick={() => setStatusTab(t.value)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusTab === t.value
                ? "bg-weeeu-primary text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <p className="text-4xl">♻️</p>
          <p className="text-gray-500 font-medium">ยังไม่มีซาก</p>
          <Link
            href="/scrap/new"
            className="inline-block mt-2 bg-weeeu-primary hover:bg-weeeu-dark text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            + ประกาศซากใหม่
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(scrap => (
            <Link key={scrap.id} href={`/scrap/${scrap.id}`} className="block">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-800 truncate">♻️ {scrap.applianceType}</p>
                      {scrap.fromRepairJobId && (
                        <span className="shrink-0 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                          🔧 จากงานซ่อม
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${
                        scrap.grade === "A" ? "bg-green-100 text-green-700" :
                        scrap.grade === "B" ? "bg-yellow-100 text-yellow-700" :
                        "bg-red-100 text-red-600"
                      }`}>
                        เกรด {scrap.grade}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${
                        scrap.scrapType === "for_sale"
                          ? "bg-weeeu-surface text-weeeu-primary"
                          : "bg-gray-100 text-gray-500"
                      }`}>
                        {scrap.scrapType === "for_sale" ? "💰 ขาย" : "🎁 ทิ้งฟรี"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">{new Date(scrap.createdAt).toLocaleDateString("th-TH")}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[scrap.status]}`}>
                      {STATUS_LABEL[scrap.status]}
                    </span>
                    {scrap.scrapType === "for_sale" && scrap.askingPrice ? (
                      <p className="text-sm font-bold text-weeeu-primary">{scrap.askingPrice.toLocaleString()} Gold</p>
                    ) : (
                      <p className="text-xs text-gray-400">ฟรี</p>
                    )}
                  </div>
                </div>

                {/* S5: expired notice */}
                {scrap.status === "expired" && (
                  <div className="bg-gray-50 rounded-xl p-2.5 text-xs text-gray-500">
                    ⏰ หมดอายุ — ไม่มีร้านยื่นข้อเสนอ · ปิดอัตโนมัติ (S5)
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
