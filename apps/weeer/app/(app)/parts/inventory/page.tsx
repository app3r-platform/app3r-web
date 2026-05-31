"use client";

// ── Parts Inventory Management — B5-WeeeR (Phase 2-G Mockup) ──────────────────
// STEP 1: List (Grid/List toggle · search · filter · low-stock alert)
// STEP 2: CRUD (Add / Edit / Soft-delete)
// STEP 3: Stock Adjust (+/- · note) + History timeline
// STEP 4: Link to Parts Marketplace

import { useState } from "react";
import Link from "next/link";

// ── Types ──────────────────────────────────────────────────────────────────────
type SourceType = "NEW" | "USED" | "DISASSEMBLED";
type MovementType = "IN" | "OUT" | "RESERVE" | "RELEASE" | "ADJUST";

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  sourceType: SourceType;
  pricePerUnit: number;
  stockTotal: number;
  stockReserved: number;
  imageUrl?: string;
  lowStockThreshold: number;
  scrapJobId?: string; // เฉพาะ DISASSEMBLED
  isDeleted?: boolean;
  createdAt: string;
}

interface StockMovement {
  id: string;
  itemId: string;
  type: MovementType;
  qty: number; // บวก = เข้า, ลบ = ออก
  note: string;
  performedAt: string;
}

// ── Config maps ────────────────────────────────────────────────────────────────
const SOURCE_LABEL: Record<SourceType, string> = {
  NEW:          "🆕 ใหม่",
  USED:         "🔧 มือสอง",
  DISASSEMBLED: "♻️ ถอดซาก",
};
const SOURCE_COLOR: Record<SourceType, string> = {
  NEW:          "bg-blue-100 text-blue-700",
  USED:         "bg-amber-100 text-amber-700",
  DISASSEMBLED: "bg-emerald-100 text-emerald-700",
};
const MOVEMENT_ICON: Record<MovementType, string> = {
  IN: "⬇️", OUT: "⬆️", RESERVE: "🔒", RELEASE: "🔓", ADJUST: "⚙️",
};
const MOVEMENT_LABEL: Record<MovementType, string> = {
  IN: "รับเข้า", OUT: "จ่ายออก", RESERVE: "จอง", RELEASE: "คืนจอง", ADJUST: "ปรับสต็อก",
};
const MOVEMENT_COLOR: Record<MovementType, string> = {
  IN: "text-green-600", OUT: "text-red-500",
  RESERVE: "text-orange-500", RELEASE: "text-blue-500", ADJUST: "text-[#F04E20]",
};

// ── Mock data (≥5 items · 3 source_type · 1 low-stock) ────────────────────────
const INITIAL_ITEMS: InventoryItem[] = [
  {
    id: "I001", name: "คอมเพรสเซอร์แอร์ Rotary 1HP", sku: "COMP-ROT-001",
    category: "คอมเพรสเซอร์", sourceType: "NEW",
    pricePerUnit: 4500, stockTotal: 8, stockReserved: 2, lowStockThreshold: 3,
    imageUrl: "https://picsum.photos/200/200?seed=I001",
    createdAt: "2026-05-01T08:00:00Z",
  },
  {
    id: "I002", name: "แผงวงจรควบคุม Daikin FTXS", sku: "PCB-DAI-FTXS",
    category: "อิเล็กทรอนิกส์", sourceType: "USED",
    pricePerUnit: 1800, stockTotal: 4, stockReserved: 1, lowStockThreshold: 2,
    imageUrl: "https://picsum.photos/200/200?seed=I002",
    createdAt: "2026-05-02T09:00:00Z",
  },
  {
    id: "I003", name: "มอเตอร์พัดลม Indoor 25W", sku: "MTR-FAN-025W",
    category: "มอเตอร์", sourceType: "DISASSEMBLED",
    pricePerUnit: 350, stockTotal: 6, stockReserved: 0, lowStockThreshold: 3,
    scrapJobId: "SJ-2026-042",
    imageUrl: "https://picsum.photos/200/200?seed=I003",
    createdAt: "2026-05-10T11:00:00Z",
  },
  {
    // ⚠️ LOW STOCK: stockTotal (2) ≤ lowStockThreshold (5)
    id: "I004", name: "ฟิลเตอร์อากาศ HEPA 30×50cm", sku: "FLTR-HEPA-001",
    category: "สิ้นเปลือง", sourceType: "NEW",
    pricePerUnit: 120, stockTotal: 2, stockReserved: 0, lowStockThreshold: 5,
    imageUrl: "https://picsum.photos/200/200?seed=I004",
    createdAt: "2026-05-03T10:00:00Z",
  },
  {
    id: "I005", name: "เซ็นเซอร์อุณหภูมิ NTC 10K", sku: "SENS-NTC-10K",
    category: "อิเล็กทรอนิกส์", sourceType: "USED",
    pricePerUnit: 180, stockTotal: 15, stockReserved: 3, lowStockThreshold: 5,
    imageUrl: "https://picsum.photos/200/200?seed=I005",
    createdAt: "2026-05-04T14:00:00Z",
  },
  {
    id: "I006", name: "วาล์ว 4 ทาง (4-Way Valve)", sku: "VLV-4WAY-001",
    category: "กลไก", sourceType: "DISASSEMBLED",
    pricePerUnit: 900, stockTotal: 3, stockReserved: 1, lowStockThreshold: 2,
    scrapJobId: "SJ-2026-039",
    imageUrl: "https://picsum.photos/200/200?seed=I006",
    createdAt: "2026-05-08T13:00:00Z",
  },
];

const INITIAL_MOVEMENTS: StockMovement[] = [
  { id: "M001", itemId: "I001", type: "IN",      qty:  8, note: "รับของจากซัพพลายเออร์ batch แรก", performedAt: "2026-05-01T08:00:00Z" },
  { id: "M002", itemId: "I001", type: "RESERVE", qty:  2, note: "จองสำหรับงานซ่อม #R042",           performedAt: "2026-05-15T10:00:00Z" },
  { id: "M003", itemId: "I001", type: "ADJUST",  qty:  0, note: "นับสต็อกจริง — ยืนยันตัวเลข",     performedAt: "2026-05-22T14:00:00Z" },
  { id: "M004", itemId: "I002", type: "IN",      qty:  5, note: "รับของมือสอง batch แรก",           performedAt: "2026-05-02T09:00:00Z" },
  { id: "M005", itemId: "I002", type: "OUT",     qty: -1, note: "ใช้งานซ่อม job R038",             performedAt: "2026-05-18T11:00:00Z" },
  { id: "M006", itemId: "I002", type: "RESERVE", qty:  1, note: "จองสำหรับ order #B2B-007",         performedAt: "2026-05-20T09:00:00Z" },
  { id: "M007", itemId: "I003", type: "IN",      qty:  6, note: "ถอดจากงานซาก SJ-2026-042",        performedAt: "2026-05-10T11:00:00Z" },
  { id: "M008", itemId: "I004", type: "IN",      qty: 10, note: "รับของ batch แรก",                performedAt: "2026-05-03T10:00:00Z" },
  { id: "M009", itemId: "I004", type: "OUT",     qty: -8, note: "ใช้ในงานบำรุง 8 รายการ",          performedAt: "2026-05-20T09:00:00Z" },
  { id: "M010", itemId: "I005", type: "IN",      qty: 20, note: "ซื้อจากตลาด B2B Parts",           performedAt: "2026-05-04T14:00:00Z" },
  { id: "M011", itemId: "I005", type: "OUT",     qty: -5, note: "ใช้ในงานซ่อม 5 ชิ้น",            performedAt: "2026-05-18T11:00:00Z" },
  { id: "M012", itemId: "I005", type: "RESERVE", qty:  3, note: "จองสำหรับ order #B2B-012",         performedAt: "2026-05-22T09:00:00Z" },
  { id: "M013", itemId: "I006", type: "IN",      qty:  4, note: "ถอดจากงานซาก SJ-2026-039",        performedAt: "2026-05-08T13:00:00Z" },
  { id: "M014", itemId: "I006", type: "RESERVE", qty:  1, note: "จองสำหรับงานซ่อม #R051",          performedAt: "2026-05-22T09:00:00Z" },
];

const CATEGORIES = ["ทั้งหมด", "คอมเพรสเซอร์", "อิเล็กทรอนิกส์", "มอเตอร์", "กลไก", "สิ้นเปลือง"];
const SOURCE_OPTIONS: Array<{ label: string; value: SourceType | "all" }> = [
  { label: "ทุกแหล่ง",   value: "all" },
  { label: "🆕 ใหม่",    value: "NEW" },
  { label: "🔧 มือสอง",  value: "USED" },
  { label: "♻️ ถอดซาก", value: "DISASSEMBLED" },
];
const EMPTY_FORM = {
  name: "", sku: "", category: "คอมเพรสเซอร์",
  sourceType: "NEW" as SourceType,
  pricePerUnit: 0, stockTotal: 0, lowStockThreshold: 3,
  imageUrl: "", scrapJobId: "",
};

// ── Page ───────────────────────────────────────────────────────────────────────
export default function InventoryPage() {
  // Data
  const [items,     setItems]     = useState<InventoryItem[]>(INITIAL_ITEMS);
  const [movements, setMovements] = useState<StockMovement[]>(INITIAL_MOVEMENTS);

  // View / filter
  const [search,       setSearch]       = useState("");
  const [catFilter,    setCatFilter]    = useState("ทั้งหมด");
  const [srcFilter,    setSrcFilter]    = useState<SourceType | "all">("all");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [viewMode,     setViewMode]     = useState<"grid" | "list">("grid");

  // Modals
  const [showAddEdit,  setShowAddEdit]  = useState(false);
  const [editTarget,   setEditTarget]   = useState<InventoryItem | null>(null);
  const [form,         setForm]         = useState(EMPTY_FORM);
  const [adjustTarget, setAdjustTarget] = useState<InventoryItem | null>(null);
  const [adjustDelta,  setAdjustDelta]  = useState(0);
  const [adjustNote,   setAdjustNote]   = useState("");
  const [historyTarget,setHistoryTarget]= useState<InventoryItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<InventoryItem | null>(null);
  const [marketTarget, setMarketTarget] = useState<InventoryItem | null>(null);

  // ── Derived ──────────────────────────────────────────────────────────────────
  const active = items.filter((i) => !i.isDeleted);
  const filtered = active.filter((item) => {
    const q = search.toLowerCase();
    if (q && !item.name.toLowerCase().includes(q) && !item.sku.toLowerCase().includes(q)) return false;
    if (catFilter !== "ทั้งหมด" && item.category !== catFilter) return false;
    if (srcFilter !== "all" && item.sourceType !== srcFilter) return false;
    if (lowStockOnly && item.stockTotal > item.lowStockThreshold) return false;
    return true;
  });
  const lowStockCount = active.filter((i) => i.stockTotal <= i.lowStockThreshold).length;
  const isLow  = (i: InventoryItem) => i.stockTotal <= i.lowStockThreshold;
  const avail  = (i: InventoryItem) => Math.max(0, i.stockTotal - i.stockReserved);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const openAdd = () => { setEditTarget(null); setForm(EMPTY_FORM); setShowAddEdit(true); };
  const openEdit = (item: InventoryItem) => {
    setEditTarget(item);
    setForm({
      name: item.name, sku: item.sku, category: item.category,
      sourceType: item.sourceType, pricePerUnit: item.pricePerUnit,
      stockTotal: item.stockTotal, lowStockThreshold: item.lowStockThreshold,
      imageUrl: item.imageUrl ?? "", scrapJobId: item.scrapJobId ?? "",
    });
    setShowAddEdit(true);
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.sku.trim()) return;
    if (editTarget) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === editTarget.id
            ? { ...i, ...form,
                imageUrl:   form.imageUrl || undefined,
                scrapJobId: form.sourceType === "DISASSEMBLED" ? form.scrapJobId || undefined : undefined,
              }
            : i
        )
      );
    } else {
      const newItem: InventoryItem = {
        id: `I${Date.now()}`, ...form,
        stockReserved: 0,
        imageUrl:   form.imageUrl   || undefined,
        scrapJobId: form.sourceType === "DISASSEMBLED" ? form.scrapJobId || undefined : undefined,
        createdAt: new Date().toISOString(),
      };
      setItems((prev) => [...prev, newItem]);
      if (form.stockTotal > 0) {
        pushMovement(newItem.id, "IN", form.stockTotal, "เพิ่มสินค้าใหม่ — สต็อกเริ่มต้น");
      }
    }
    setShowAddEdit(false);
  };

  const pushMovement = (itemId: string, type: MovementType, qty: number, note: string) =>
    setMovements((prev) => [
      ...prev,
      { id: `M${Date.now()}`, itemId, type, qty, note, performedAt: new Date().toISOString() },
    ]);

  const handleAdjust = () => {
    if (!adjustTarget || adjustDelta === 0 || !adjustNote.trim()) return;
    setItems((prev) =>
      prev.map((i) =>
        i.id === adjustTarget.id
          ? { ...i, stockTotal: Math.max(0, i.stockTotal + adjustDelta) }
          : i
      )
    );
    pushMovement(adjustTarget.id, "ADJUST", adjustDelta, adjustNote);
    setAdjustTarget(null);
    setAdjustDelta(0);
    setAdjustNote("");
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setItems((prev) => prev.map((i) => i.id === deleteTarget.id ? { ...i, isDeleted: true } : i));
    setDeleteTarget(null);
  };

  const openAdjust = (item: InventoryItem) => {
    setAdjustTarget(item); setAdjustDelta(0); setAdjustNote("");
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">📦 คลังสินค้า</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {active.length} รายการ
            {lowStockCount > 0 && (
              <span className="ml-2 text-red-500 font-semibold">· ⚠️ Low stock {lowStockCount} รายการ</span>
            )}
          </p>
        </div>
        <button
          onClick={openAdd}
          className="shrink-0 bg-[#FF663A] hover:bg-[#F04E20] text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
        >
          + เพิ่มสินค้า
        </button>
      </div>

      {/* ── Search + View toggle ── */}
      <div className="flex gap-2">
        <input
          type="text" placeholder="ค้นหาชื่อสินค้า / SKU…"
          value={search} onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF663A]"
        />
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {(["grid", "list"] as const).map((m) => (
            <button key={m} onClick={() => setViewMode(m)} title={m}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${viewMode === m ? "bg-white shadow-sm text-[#D63B12]" : "text-gray-400 hover:text-gray-600"}`}>
              {m === "grid" ? "⊞" : "☰"}
            </button>
          ))}
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="space-y-2">
        <div className="flex gap-1.5 flex-wrap">
          {CATEGORIES.map((c) => (
            <button key={c} onClick={() => setCatFilter(c)}
              className={`text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${catFilter === c ? "bg-[#FF663A] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {c}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {SOURCE_OPTIONS.map((s) => (
            <button key={s.value} onClick={() => setSrcFilter(s.value)}
              className={`text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${srcFilter === s.value ? "bg-amber-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {s.label}
            </button>
          ))}
          <button onClick={() => setLowStockOnly(!lowStockOnly)}
            className={`text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${lowStockOnly ? "bg-red-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            ⚠️ Low Stock
          </button>
        </div>
      </div>

      {/* ── Empty state ── */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center h-48 text-gray-400 space-y-2">
          <span className="text-4xl">📦</span>
          <p className="text-sm">ไม่พบสินค้าที่ตรงกัน</p>
          {active.length === 0 && (
            <button onClick={openAdd} className="text-xs text-[#D63B12] hover:underline">
              เพิ่มสินค้าแรกของคลัง
            </button>
          )}
        </div>
      )}

      {/* ── Grid view ── */}
      {viewMode === "grid" && filtered.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {filtered.map((item) => (
            <div key={item.id}
              className={`bg-white border rounded-xl overflow-hidden hover:shadow-md transition-shadow ${isLow(item) ? "border-red-200" : "border-gray-100"}`}>
              {item.imageUrl && (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.imageUrl} alt={item.name} className="w-full h-28 object-cover" />
                  {isLow(item) && (
                    <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      ⚠️ Low
                    </span>
                  )}
                </div>
              )}
              <div className="p-3 space-y-2">
                <div>
                  <p className="text-sm font-semibold text-gray-800 leading-snug line-clamp-2">{item.name}</p>
                  <p className="text-xs font-mono text-gray-400 mt-0.5">{item.sku}</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${SOURCE_COLOR[item.sourceType]}`}>
                    {SOURCE_LABEL[item.sourceType]}
                  </span>
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">{item.category}</span>
                </div>
                {/* Stock stats */}
                <div className="grid grid-cols-3 gap-1 text-center text-xs">
                  <div className={`rounded-lg py-1.5 ${isLow(item) ? "bg-red-50" : "bg-gray-50"}`}>
                    <p className="text-gray-400 text-[10px]">คงเหลือ</p>
                    <p className={`font-bold ${isLow(item) ? "text-red-600" : "text-gray-800"}`}>{item.stockTotal}</p>
                  </div>
                  <div className="bg-orange-50 rounded-lg py-1.5">
                    <p className="text-gray-400 text-[10px]">จอง</p>
                    <p className="font-bold text-orange-500">{item.stockReserved}</p>
                  </div>
                  <div className="bg-[#FFF1ED] rounded-lg py-1.5">
                    <p className="text-gray-400 text-[10px]">ใช้ได้</p>
                    <p className="font-bold text-[#D63B12]">{avail(item)}</p>
                  </div>
                </div>
                <p className="text-xs font-semibold text-[#D63B12]">{item.pricePerUnit.toLocaleString()} pts/ชิ้น</p>
                {item.scrapJobId && (
                  <p className="text-xs text-emerald-600 bg-emerald-50 rounded-lg px-2 py-0.5 truncate">
                    ♻️ จากซาก: {item.scrapJobId}
                  </p>
                )}
                <div className="flex gap-1">
                  <button onClick={() => openAdjust(item)}
                    className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium py-1.5 rounded-lg transition-colors">
                    📊 ปรับสต็อก
                  </button>
                  <button onClick={() => setHistoryTarget(item)}
                    className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-600 text-xs font-medium py-1.5 rounded-lg transition-colors">
                    🕐 ประวัติ
                  </button>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(item)}
                    className="flex-1 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-medium py-1.5 rounded-lg transition-colors">
                    ✏️ แก้ไข
                  </button>
                  <button onClick={() => setMarketTarget(item)}
                    className="flex-1 bg-[#FFF1ED] hover:bg-[#FFE0D6] text-[#D63B12] text-xs font-medium py-1.5 rounded-lg transition-colors">
                    🛒 ลงขาย
                  </button>
                  <button onClick={() => setDeleteTarget(item)} title="ลบ"
                    className="px-2.5 bg-red-50 hover:bg-red-100 text-red-500 text-xs font-medium py-1.5 rounded-lg transition-colors">
                    🗑
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── List view ── */}
      {viewMode === "list" && filtered.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="text-left px-4 py-3">สินค้า</th>
                  <th className="text-left px-4 py-3">หมวด / แหล่ง</th>
                  <th className="text-right px-4 py-3">คงเหลือ</th>
                  <th className="text-right px-4 py-3">จอง</th>
                  <th className="text-right px-4 py-3">ใช้ได้</th>
                  <th className="text-right px-4 py-3">ราคา</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((item) => (
                  <tr key={item.id} className={`hover:bg-gray-50 transition-colors ${isLow(item) ? "bg-red-50/40" : ""}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {item.imageUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-gray-800 truncate">{item.name}</p>
                          <p className="text-xs text-gray-400 font-mono">{item.sku}</p>
                          {isLow(item) && <span className="text-xs text-red-500 font-semibold">⚠️ Low stock</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-gray-500">{item.category}</p>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${SOURCE_COLOR[item.sourceType]}`}>
                        {SOURCE_LABEL[item.sourceType]}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-right font-bold ${isLow(item) ? "text-red-600" : "text-gray-800"}`}>
                      {item.stockTotal}
                    </td>
                    <td className="px-4 py-3 text-right text-orange-500 font-medium">{item.stockReserved}</td>
                    <td className="px-4 py-3 text-right text-[#D63B12] font-semibold">{avail(item)}</td>
                    <td className="px-4 py-3 text-right text-[#D63B12] font-semibold text-xs">
                      {item.pricePerUnit.toLocaleString()} pts
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 justify-center">
                        <button onClick={() => openAdjust(item)} title="ปรับสต็อก"
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 text-sm">📊</button>
                        <button onClick={() => setHistoryTarget(item)} title="ประวัติ"
                          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 text-sm">🕐</button>
                        <button onClick={() => openEdit(item)} title="แก้ไข"
                          className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 text-sm">✏️</button>
                        <button onClick={() => setMarketTarget(item)} title="ลงขาย"
                          className="p-1.5 rounded-lg text-[#F04E20] hover:bg-[#FFF1ED] text-sm">🛒</button>
                        <button onClick={() => setDeleteTarget(item)} title="ลบ"
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 text-sm">🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════ MODALS ══════════════════════════ */}

      {/* ── STEP 2: Add / Edit Modal ── */}
      {showAddEdit && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="font-bold text-gray-900">
              {editTarget ? "✏️ แก้ไขสินค้า" : "➕ เพิ่มสินค้าใหม่"}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-600 block mb-1">ชื่อสินค้า <span className="text-red-500">*</span></label>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="ชื่อสินค้า…"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF663A]" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">SKU <span className="text-red-500">*</span></label>
                <input value={form.sku} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                  placeholder="SKU-001"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#FF663A]" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">หมวด</label>
                <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF663A]">
                  {CATEGORIES.filter((c) => c !== "ทั้งหมด").map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-600 block mb-1.5">แหล่งที่มา (source_type)</label>
                <div className="flex gap-2">
                  {(["NEW", "USED", "DISASSEMBLED"] as SourceType[]).map((st) => (
                    <button key={st} onClick={() => setForm((f) => ({ ...f, sourceType: st }))}
                      className={`flex-1 text-xs py-2 rounded-xl border-2 font-medium transition-all ${form.sourceType === st ? `${SOURCE_COLOR[st]} border-current` : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
                      {SOURCE_LABEL[st]}
                    </button>
                  ))}
                </div>
              </div>
              {form.sourceType === "DISASSEMBLED" && (
                <div className="col-span-2">
                  <label className="text-xs font-medium text-emerald-700 block mb-1">♻️ มาจากงานซาก (Scrap Job ID)</label>
                  <input value={form.scrapJobId} onChange={(e) => setForm((f) => ({ ...f, scrapJobId: e.target.value }))}
                    placeholder="SJ-2026-XXX"
                    className="w-full border border-emerald-200 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                </div>
              )}
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">ราคา/หน่วย (pts)</label>
                <input type="number" min={0} value={form.pricePerUnit}
                  onChange={(e) => setForm((f) => ({ ...f, pricePerUnit: Number(e.target.value) }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF663A]" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Low-stock threshold</label>
                <input type="number" min={1} value={form.lowStockThreshold}
                  onChange={(e) => setForm((f) => ({ ...f, lowStockThreshold: Number(e.target.value) }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF663A]" />
              </div>
              {!editTarget && (
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">จำนวนเริ่มต้น</label>
                  <input type="number" min={0} value={form.stockTotal}
                    onChange={(e) => setForm((f) => ({ ...f, stockTotal: Number(e.target.value) }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF663A]" />
                </div>
              )}
              <div className={!editTarget ? "" : "col-span-2"}>
                <label className="text-xs font-medium text-gray-600 block mb-1">รูปภาพ (URL)</label>
                <input value={form.imageUrl} onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                  placeholder="https://…"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF663A]" />
              </div>
            </div>
            {(!form.name.trim() || !form.sku.trim()) && (
              <p className="text-xs text-red-500">⚠️ กรุณากรอกชื่อสินค้าและ SKU</p>
            )}
            <div className="flex gap-2">
              <button onClick={handleSave} disabled={!form.name.trim() || !form.sku.trim()}
                className="flex-1 bg-[#FF663A] hover:bg-[#F04E20] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
                {editTarget ? "✅ บันทึกการแก้ไข" : "➕ เพิ่มสินค้า"}
              </button>
              <button onClick={() => setShowAddEdit(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl text-sm transition-colors">
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 3a: Stock Adjust Modal ── */}
      {adjustTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-5 space-y-4">
            <h2 className="font-bold text-gray-900">📊 ปรับสต็อก</h2>
            <div>
              <p className="text-sm font-semibold text-gray-800">{adjustTarget.name}</p>
              <p className="text-xs text-gray-400 font-mono">{adjustTarget.sku}</p>
              <p className="text-xs text-gray-500 mt-1">
                สต็อกปัจจุบัน: <span className="font-bold text-gray-800">{adjustTarget.stockTotal}</span> ชิ้น
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-2">
                จำนวนที่ปรับ <span className="text-gray-400">(+ เพิ่ม / − ลด)</span>
              </label>
              <div className="flex items-center gap-4">
                <button onClick={() => setAdjustDelta((d) => d - 1)}
                  className="w-11 h-11 rounded-xl bg-red-100 hover:bg-red-200 text-red-600 font-bold text-xl transition-colors">−</button>
                <div className="flex-1 text-center">
                  <span className={`text-3xl font-bold tabular-nums ${adjustDelta > 0 ? "text-green-600" : adjustDelta < 0 ? "text-red-600" : "text-gray-300"}`}>
                    {adjustDelta > 0 ? "+" : ""}{adjustDelta}
                  </span>
                  <p className="text-xs text-gray-400 mt-0.5">
                    ผลลัพธ์: <span className="font-semibold text-gray-700">{Math.max(0, adjustTarget.stockTotal + adjustDelta)}</span> ชิ้น
                  </p>
                </div>
                <button onClick={() => setAdjustDelta((d) => d + 1)}
                  className="w-11 h-11 rounded-xl bg-green-100 hover:bg-green-200 text-green-600 font-bold text-xl transition-colors">+</button>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">หมายเหตุ <span className="text-red-500">*</span></label>
              <textarea value={adjustNote} onChange={(e) => setAdjustNote(e.target.value)}
                rows={2} placeholder="เหตุผลการปรับสต็อก…"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none" />
            </div>
            <div className="flex gap-2">
              <button onClick={handleAdjust} disabled={adjustDelta === 0 || !adjustNote.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
                ✅ ยืนยันปรับสต็อก
              </button>
              <button onClick={() => setAdjustTarget(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl text-sm transition-colors">
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 3b: History Modal ── */}
      {historyTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-5 space-y-4 max-h-[85vh] flex flex-col">
            <div>
              <h2 className="font-bold text-gray-900">🕐 ประวัติการเคลื่อนไหว</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {historyTarget.name} · <span className="font-mono">{historyTarget.sku}</span>
              </p>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {movements
                .filter((m) => m.itemId === historyTarget.id)
                .sort((a, b) => b.performedAt.localeCompare(a.performedAt))
                .map((m) => (
                  <div key={m.id} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-base shrink-0">
                      {MOVEMENT_ICON[m.type]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-xs font-semibold ${MOVEMENT_COLOR[m.type]}`}>
                          {MOVEMENT_LABEL[m.type]}
                        </span>
                        <span className={`text-xs font-bold tabular-nums ${m.qty > 0 ? "text-green-600" : m.qty < 0 ? "text-red-500" : "text-gray-400"}`}>
                          {m.qty > 0 ? "+" : ""}{m.qty}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 truncate mt-0.5">{m.note}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(m.performedAt).toLocaleDateString("th-TH", {
                          day: "2-digit", month: "short", year: "2-digit",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              {movements.filter((m) => m.itemId === historyTarget.id).length === 0 && (
                <p className="text-sm text-gray-400 text-center py-8">ยังไม่มีประวัติ</p>
              )}
            </div>
            <button onClick={() => setHistoryTarget(null)}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl text-sm transition-colors">
              ปิด
            </button>
          </div>
        </div>
      )}

      {/* ── Delete confirm ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-5 space-y-4">
            <h2 className="font-bold text-gray-900">🗑️ ลบสินค้า</h2>
            <p className="text-sm text-gray-600">
              ต้องการลบ <span className="font-semibold">{deleteTarget.name}</span> ออกจากคลัง?
            </p>
            <p className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
              💡 Soft delete — ข้อมูลยังเก็บในระบบ ไม่กระทบประวัติ
            </p>
            <div className="flex gap-2">
              <button onClick={handleDelete}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
                🗑️ ยืนยันลบ
              </button>
              <button onClick={() => setDeleteTarget(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl text-sm transition-colors">
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 4: Link to Parts Marketplace ── */}
      {marketTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-5 space-y-4">
            <h2 className="font-bold text-gray-900">🛒 ลงขายใน Parts Marketplace</h2>
            <p className="text-sm text-gray-600">
              ต้องการลงขาย <span className="font-semibold">{marketTarget.name}</span> ใน Parts B2B Marketplace?
            </p>
            <div className="bg-[#FFF1ED] border border-[#FFE0D6] rounded-xl p-3 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">สต็อกพร้อมขาย</span>
                <span className="font-bold text-[#D63B12]">{avail(marketTarget)} ชิ้น</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">ราคาแนะนำ</span>
                <span className="font-bold text-[#D63B12]">{marketTarget.pricePerUnit.toLocaleString()} pts/ชิ้น</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">แหล่งที่มา</span>
                <span className={`px-1.5 py-0.5 rounded-full font-medium ${SOURCE_COLOR[marketTarget.sourceType]}`}>
                  {SOURCE_LABEL[marketTarget.sourceType]}
                </span>
              </div>
            </div>
            <p className="text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-2">
              ℹ️ จะนำข้อมูลนี้เป็นค่าเริ่มต้นในหน้าลงขาย (Parts Listing)
            </p>
            <div className="flex gap-2">
              <Link href="/parts/my-listings" onClick={() => setMarketTarget(null)}
                className="flex-1 text-center bg-[#FF663A] hover:bg-[#F04E20] text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
                🛒 ไปหน้าลงขาย →
              </Link>
              <button onClick={() => setMarketTarget(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl text-sm transition-colors">
                ยังไม่ตอนนี้
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
