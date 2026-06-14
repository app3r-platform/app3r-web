"use client";

import { useState } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/sidebar";

/* ─── local types (Mockup — Lesson #33) ─── */
type Module = "repair" | "maintain" | "resell" | "scrap" | "parts";

interface LifecycleConfig {
  module:          Module;
  label:           string;
  icon:            string;
  listing_days:    number;  // อายุประกาศ (วัน)
  offer_window_hrs: number; // ช่วงเวลารับ offer (ชม.)
  inspection_hrs:  number;  // ช่วง inspection (ชม.)
  escrow_lock_hrs: number;  // Escrow lock timeout (ชม.)
  suspended:       boolean; // R2/R3 — SUSPENDED
  suspended_reason?: string;
}

/* ─── Mock config — D14 per-module ─── */
const MOCK_LIFECYCLE: LifecycleConfig[] = [
  {
    module: "repair", label: "ซ่อม", icon: "🔧",
    listing_days: 30, offer_window_hrs: 48, inspection_hrs: 0, escrow_lock_hrs: 24,
    suspended: false,
  },
  {
    module: "maintain", label: "บำรุง", icon: "🛁",
    listing_days: 60, offer_window_hrs: 72, inspection_hrs: 0, escrow_lock_hrs: 24,
    suspended: false,
  },
  {
    module: "resell", label: "ขายต่อ", icon: "🔄",
    listing_days: 45, offer_window_hrs: 24, inspection_hrs: 48, escrow_lock_hrs: 24,
    suspended: false,
  },
  {
    module: "scrap", label: "รับซาก", icon: "♻️",
    listing_days: 14, offer_window_hrs: 24, inspection_hrs: 0, escrow_lock_hrs: 12,
    suspended: true, suspended_reason: "R2 — โมดูล Scrap อยู่ระหว่างพัฒนา", // PHASE-4: Phase E
  },
  {
    module: "parts", label: "อะไหล่", icon: "⚙️",
    listing_days: 30, offer_window_hrs: 48, inspection_hrs: 24, escrow_lock_hrs: 24,
    suspended: true, suspended_reason: "R3 — โมดูล Parts/D81 อยู่ระหว่างพัฒนา", // PHASE-4: Phase E
  },
];

const MODULE_COLOR: Record<Module, string> = {
  repair:  "bg-blue-50 border-blue-200",
  maintain:"bg-admin-surface border-admin-primary/30",
  resell:  "bg-green-50 border-green-200",
  scrap:   "bg-gray-50 border-gray-200",
  parts:   "bg-gray-50 border-gray-200",
};

const MODULE_HEADER: Record<Module, string> = {
  repair:  "text-blue-700",
  maintain:"text-admin-primary",
  resell:  "text-green-700",
  scrap:   "text-gray-500",
  parts:   "text-gray-500",
};

export default function ResellLifecyclePage() {
  const [configs, setConfigs] = useState<LifecycleConfig[]>(MOCK_LIFECYCLE);
  const [editing, setEditing] = useState<Module | null>(null);
  const [saved, setSaved]     = useState<Module | null>(null);

  /* local state for edit form */
  const [editVal, setEditVal] = useState<Partial<LifecycleConfig>>({});

  function startEdit(cfg: LifecycleConfig) {
    setEditing(cfg.module);
    setEditVal({ ...cfg });
  }

  function cancelEdit() {
    setEditing(null);
    setEditVal({});
  }

  function saveEdit(module: Module) {
    /* Mockup — update local state only */
    setConfigs(prev => prev.map(c => c.module === module ? { ...c, ...editVal } : c));
    setEditing(null);
    setSaved(module);
    setTimeout(() => setSaved(null), 2000);
  }

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar />
      <main className="flex-1 p-8 space-y-6 max-w-5xl">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">⏳ วงจรประกาศขาย</h1>
            <p className="text-gray-500 text-sm mt-1">
              ตั้งค่าอายุประกาศแยกตามโมดูล — Repair / Maintain / Resell / Scrap / Parts
            </p>
            <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-full">
              🔶 Mockup — ไม่บันทึก API จริง
            </span>
          </div>
          <Link href="/resell/jobs"
            className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg transition-colors">
            🔄 Jobs →
          </Link>
        </div>

        {/* Info box */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
          <p className="font-semibold mb-1">📋 นโยบายวงจรประกาศขาย</p>
          <ul className="text-xs space-y-1 text-blue-600 list-disc list-inside">
            <li>อายุประกาศ (Listing Days): เมื่อหมดอายุ ประกาศ expired อัตโนมัติ</li>
            <li>ช่วงรับข้อเสนอ: เวลารับ offer ก่อนประกาศหมดอายุ</li>
            <li>ช่วงตรวจสอบ: ผู้ซื้อมีเวลาตรวจสอบสินค้าก่อนปลดพักเงินกลาง</li>
            <li>พักเงินกลาง (Escrow) Lock: timeout ก่อนระบบ auto-release กรณีไม่มีการตอบสนอง</li>
            <li>🔴 SUSPENDED: โมดูลที่ยังไม่เปิดใช้ (R2=Scrap / R3=Parts)</li>
          </ul>
        </div>

        {/* Module cards */}
        <div className="grid grid-cols-1 gap-4">
          {configs.map(cfg => (
            <div key={cfg.module}
              className={`rounded-xl border p-5 ${cfg.suspended ? "opacity-60" : ""} ${MODULE_COLOR[cfg.module]}`}>

              {/* Card header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{cfg.icon}</span>
                  <h2 className={`text-base font-bold ${MODULE_HEADER[cfg.module]}`}>{cfg.label}</h2>
                  {cfg.suspended && (
                    <span className="text-xs px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded-full">
                      🔴 SUSPENDED
                    </span>
                  )}
                  {saved === cfg.module && (
                    <span className="text-xs px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded-full">
                      ✅ บันทึกแล้ว (Mock)
                    </span>
                  )}
                </div>
                {!cfg.suspended && editing !== cfg.module && (
                  <button onClick={() => startEdit(cfg)}
                    className="px-3 py-1.5 text-xs bg-white hover:bg-gray-50 border border-gray-300 rounded-lg transition-colors">
                    ✏️ แก้ไข
                  </button>
                )}
              </div>

              {/* Suspended reason */}
              {cfg.suspended && cfg.suspended_reason && (
                <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
                  {cfg.suspended_reason}
                </div>
              )}

              {/* View mode */}
              {editing !== cfg.module && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: "อายุประกาศ",       value: `${cfg.listing_days} วัน`,    icon: "📅" },
                    { label: "ช่วงรับข้อเสนอ",   value: `${cfg.offer_window_hrs} ชม.`, icon: "📨" },
                    { label: "ช่วงตรวจสอบ",      value: cfg.inspection_hrs > 0 ? `${cfg.inspection_hrs} ชม.` : "—", icon: "🔍" },
                    { label: "พักเงินกลาง Lock",  value: `${cfg.escrow_lock_hrs} ชม.`, icon: "🔒" },
                  ].map(item => (
                    <div key={item.label} className="bg-white rounded-lg border border-gray-200 p-3 text-center">
                      <p className="text-lg">{item.icon}</p>
                      <p className="text-xs text-gray-500 mt-1">{item.label}</p>
                      <p className={`text-base font-bold mt-1 ${MODULE_HEADER[cfg.module]}`}>{item.value}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Edit mode */}
              {editing === cfg.module && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">📅 อายุประกาศ (วัน)</label>
                      <input type="number" min={1} max={365}
                        value={editVal.listing_days ?? cfg.listing_days}
                        onChange={e => setEditVal(v => ({ ...v, listing_days: Number(e.target.value) }))}
                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:border-admin-primary"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">📨 ช่วงรับข้อเสนอ (ชม.)</label>
                      <input type="number" min={1} max={168}
                        value={editVal.offer_window_hrs ?? cfg.offer_window_hrs}
                        onChange={e => setEditVal(v => ({ ...v, offer_window_hrs: Number(e.target.value) }))}
                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:border-admin-primary"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">🔍 Inspection (ชม.)</label>
                      <input type="number" min={0} max={168}
                        value={editVal.inspection_hrs ?? cfg.inspection_hrs}
                        onChange={e => setEditVal(v => ({ ...v, inspection_hrs: Number(e.target.value) }))}
                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:border-admin-primary"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">🔒 พักเงินกลาง Lock (ชม.)</label>
                      <input type="number" min={1} max={72}
                        value={editVal.escrow_lock_hrs ?? cfg.escrow_lock_hrs}
                        onChange={e => setEditVal(v => ({ ...v, escrow_lock_hrs: Number(e.target.value) }))}
                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:border-admin-primary"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => saveEdit(cfg.module)}
                      className="px-4 py-1.5 bg-admin-primary hover:bg-admin-dark text-white text-sm rounded-lg transition-colors">
                      บันทึก (Mock)
                    </button>
                    <button onClick={cancelEdit}
                      className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg transition-colors">
                      ยกเลิก
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Note */}
        <div className="bg-gray-100 border border-gray-200 rounded-xl p-4 text-xs text-gray-500">
          <p className="font-semibold text-gray-700 mb-1">📌 หมายเหตุ</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>การแก้ไข Lifecycle Config จะมีผลกับ listing ที่สร้างใหม่เท่านั้น — ไม่ retroactive</li>
            <li>Resell Inspection 48 ชม. — ผู้ซื้อต้องยืนยันหรือเปิด Dispute ภายในเวลาที่กำหนด</li>
            <li>ระบบพักเงินกลาง (Escrow) auto-release เมื่อ inspection_period หมดอายุโดยไม่มีการตอบสนอง</li>
          </ul>
        </div>

      </main>
    </div>
  );
}
