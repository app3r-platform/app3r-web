"use client";
// ─── เครื่องใช้ไฟฟ้าของฉัน (/appliances) — FIX-3: ปุ่มมี action ─────────────
// 🔧→/repair/new?appliance={id} · 💰→/sell/new?appliance={id} · ✏️/🗑️→modal

import { useEffect, useState } from "react";
import Link from "next/link";

// U-34 — รูปจริง + category (filter) + offerCount (จำนวนผู้ยื่นข้อเสนอ)
const appliances = [
  {
    id: "1", icon: "❄️", image: "https://picsum.photos/seed/weeeu-air-bedroom/200/200", name: "แอร์ห้องนอน", brand: "Mitsubishi Electric",
    model: "MSY-GN13VF", capacity: "13,000 BTU", installDate: "ม.ค. 65",
    status: "ปกติ", statusColor: "text-green-600 bg-green-50",
    category: "แอร์", offerCount: 0,
  },
  {
    id: "2", icon: "❄️", image: "https://picsum.photos/seed/weeeu-air-guest/200/200", name: "แอร์ห้องแขก", brand: "Daikin",
    model: "FTKQ25SV2S", capacity: "9,000 BTU", installDate: "มี.ค. 66",
    status: "แจ้งซ่อมแล้ว", statusColor: "text-orange-600 bg-orange-50",
    category: "แอร์", offerCount: 0,
  },
  {
    id: "3", icon: "🫧", image: "https://picsum.photos/seed/weeeu-washer-lg/200/200", name: "เครื่องซักผ้า", brand: "LG",
    model: "T2108VSAM", capacity: "8 KG", installDate: "ก.พ. 64",
    status: "ปกติ", statusColor: "text-green-600 bg-green-50",
    category: "เครื่องซักผ้า", offerCount: 0,
  },
  {
    id: "4", icon: "🧊", image: "https://picsum.photos/seed/weeeu-fridge-sharp/200/200", name: "ตู้เย็น Sharp", brand: "Sharp",
    model: "SJ-X420TP-SL", capacity: "420 ลิตร", installDate: "ธ.ค. 63",
    status: "ประกาศขาย", statusColor: "text-weeeu-primary bg-weeeu-surface",
    category: "ตู้เย็น", offerCount: 2,
  },
];

type Appliance = typeof appliances[0];

export default function AppliancesPage() {
  const [editTarget, setEditTarget] = useState<Appliance | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Appliance | null>(null);
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [toastMsg, setToastMsg] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 2500);
  };

  const handleDelete = (app: Appliance) => {
    setDeletedIds(prev => new Set([...prev, app.id]));
    setDeleteTarget(null);
    showToast(`ลบ "${app.name}" แล้ว (Mockup)`);
  };

  const visible = appliances.filter(a =>
    !deletedIds.has(a.id) &&
    (!categoryFilter || categoryFilter === "ทุกประเภท" || a.category === categoryFilter)
  );

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-gray-800 text-white text-xs px-4 py-2 rounded-full shadow-lg">
          {toastMsg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">เครื่องใช้ไฟฟ้า</h1>
        <Link
          href="/appliances/add"
          className="flex items-center gap-2 bg-weeeu-primary hover:bg-weeeu-dark text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
        >
          + เพิ่มเครื่อง
        </Link>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "ทั้งหมด", count: visible.length, icon: "🔌", color: "bg-weeeu-surface text-weeeu-primary" },
          { label: "ปกติ", count: visible.filter(a => a.status === "ปกติ").length, icon: "✅", color: "bg-green-50 text-green-700" },
          { label: "มีปัญหา/ประกาศ", count: visible.filter(a => a.status !== "ปกติ").length, icon: "⚠️", color: "bg-orange-50 text-orange-700" },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl p-4 ${s.color} text-center`}>
            <p className="text-2xl mb-1">{s.icon}</p>
            <p className="text-2xl font-bold">{s.count}</p>
            <p className="text-xs font-medium mt-0.5 opacity-80">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="flex gap-3">
        <input
          type="search"
          placeholder="ค้นหาเครื่องใช้ไฟฟ้า..."
          className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-weeeu-primary/30"
        />
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-weeeu-primary/30"
        >
          <option value="">ทุกประเภท</option>
          <option value="แอร์">แอร์</option>
          <option value="ตู้เย็น">ตู้เย็น</option>
          <option value="เครื่องซักผ้า">เครื่องซักผ้า</option>
          <option value="อื่นๆ">อื่นๆ</option>
        </select>
      </div>

      {/* Appliance list */}
      <div className="space-y-3">
        {visible.map((app) => (
          <div
            key={app.id}
            className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-start gap-4 hover:border-weeeu-primary/20 transition-colors"
          >
            {/* D1 media fallback: onError → แสดง emoji icon แทน */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={app.image}
              alt={app.name}
              className="w-14 h-14 bg-gray-50 rounded-2xl object-cover flex-shrink-0"
              onError={(e) => {
                const t = e.target as HTMLImageElement;
                t.onerror = null;
                t.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56'%3E%3Crect fill='%23f3f4f6' width='56' height='56' rx='8'/%3E%3Ctext font-size='28' x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle'%3E🔌%3C/text%3E%3C/svg%3E";
              }}
            />

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-900">{app.name}</p>
                  <p className="text-sm text-gray-500">{app.brand} · {app.model}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-400">📦 {app.capacity}</span>
                    <span className="text-xs text-gray-400">📅 ติดตั้ง {app.installDate}</span>
                  </div>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${app.statusColor}`}>
                  {app.status}
                </span>
              </div>

              {/* Actions — FIX-3: มี href + onClick */}
              <div className="flex gap-2 mt-3 flex-wrap items-center">
                <Link
                  href={`/repair/new?appliance=${app.id}`}
                  className="text-xs px-3 py-1.5 border border-weeeu-primary/30 text-weeeu-primary hover:bg-weeeu-surface rounded-lg transition-colors"
                >
                  🔧 แจ้งซ่อม
                </Link>
                <Link
                  href={`/sell/new?appliance=${app.id}`}
                  className="text-xs px-3 py-1.5 border border-green-200 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                >
                  💰 ลงขาย
                </Link>
                <button
                  onClick={() => setEditTarget(app)}
                  className="text-xs px-3 py-1.5 border border-gray-200 text-gray-500 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  ✏️ แก้ไข
                </button>
                <button
                  onClick={() => setDeleteTarget(app)}
                  className="text-xs px-3 py-1.5 border border-red-200 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  🗑️ ลบ
                </button>
                {app.offerCount > 0 && (
                  <span className="text-xs text-weeeu-primary font-medium ml-1">
                    👥 {app.offerCount} ข้อเสนอ
                  </span>
                )}
              </div>
              <p className="text-[10px] text-gray-300 mt-2">
                แก้ไขได้จนกว่าจะมีผู้ยื่นข้อเสนอ · ลบได้เมื่อไม่มีงานค้าง
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Add CTA */}
      <Link
        href="/appliances/add"
        className="w-full flex flex-col items-center justify-center gap-2 py-8 border-2 border-dashed border-weeeu-primary/30 rounded-2xl text-weeeu-primary hover:border-weeeu-primary hover:bg-weeeu-surface transition-all"
      >
        <span className="text-3xl">➕</span>
        <span className="text-sm font-medium">เพิ่มเครื่องใช้ไฟฟ้าใหม่</span>
        <span className="text-xs opacity-70">ลงทะเบียนเครื่องเพื่อใช้บริการครบวงจร</span>
      </Link>

      {/* Edit modal (Mockup) */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => setEditTarget(null)}>
          <div className="bg-white rounded-t-3xl w-full max-w-lg p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900">แก้ไข: {editTarget.name}</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">ชื่อเครื่อง</label>
                <input defaultValue={editTarget.name} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-weeeu-primary/30" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">ยี่ห้อ</label>
                <input defaultValue={editTarget.brand} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-weeeu-primary/30" />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { setEditTarget(null); showToast("บันทึกแล้ว (Mockup)"); }}
                className="flex-1 bg-weeeu-primary hover:bg-weeeu-dark text-white font-semibold py-3 rounded-xl text-sm transition-colors"
              >
                บันทึก (Mockup)
              </button>
              <button onClick={() => setEditTarget(null)} className="flex-1 bg-gray-100 text-gray-600 font-semibold py-3 rounded-xl text-sm">
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setDeleteTarget(null)}>
          <div className="bg-white rounded-3xl w-80 p-6 space-y-4 mx-4" onClick={e => e.stopPropagation()}>
            <div className="text-center">
              <p className="text-4xl mb-3">🗑️</p>
              <h2 className="text-base font-bold text-gray-900">ลบเครื่องใช้ไฟฟ้า?</h2>
              <p className="text-sm text-gray-500 mt-1">{deleteTarget.name}</p>
              <p className="text-xs text-red-500 mt-2">การดำเนินการนี้ไม่สามารถย้อนกลับได้</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleDelete(deleteTarget)}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
              >
                ลบ (Mockup)
              </button>
              <button onClick={() => setDeleteTarget(null)} className="flex-1 bg-gray-100 text-gray-600 font-semibold py-2.5 rounded-xl text-sm">
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
