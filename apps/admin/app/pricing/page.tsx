"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { Sidebar } from "@/components/sidebar";

// ═══════════════════════════════════════════════════════════════
// CMD B6-B — Admin UI จัดการราคารับซื้อ (5 แท็บ)
// Decision: 36b813ec-7277-8121-920e-c5fdc5d4a860
// Tables: used_pricing_categories / _models / _dimensions /
//         _dimension_values / _price_points / _deductions /
//         _reject_rules (applies_when + triggers_when JSONB)
// Mockup only — ไม่ fetch API จริง (wire จริง = เฟส 4)
// ═══════════════════════════════════════════════════════════════

// ─── Local Types ─────────────────────────────────────────────

interface UPCategory {
  id: string; code: string; label_th: string; label_en: string;
  appliance_category_id: string | null; sort_order: number; is_active: boolean;
}
interface UPDimension {
  id: string; category_id: string; code: string; label_th: string;
  label_en: string; kind: "ENUM" | "NUMERIC" | "BOOLEAN" | "TEXT";
  is_price_axis: boolean; sort_order: number;
}
interface UPDimValue {
  id: string; dimension_id: string; code: string; label_th: string;
  label_en: string; numeric_value: number | null; sort_order: number;
}
interface UPModel {
  id: string; category_id: string; code: string; label_th: string;
  label_en: string; brand: string; spec_attributes: Record<string, string>;
  base_market_price: number | null; is_active: boolean;
}
interface UPPricePoint {
  id: string; model_id: string; dimensions: Record<string, string>;
  is_multi_issue: boolean; price: number;
}
type DeductionKind = "CONDITION" | "MISSING_ACCESSORY" | "PROBLEM" | "AGE" | "OTHER";
type DeductionType = "FIXED" | "PERCENT" | "RANGE";
type ConditionJson = null | { dimension: string; value: string }
  | { and: { dimension: string; value: string }[] }
  | { or:  { dimension: string; value: string }[] };
interface UPDeduction {
  id: string; category_id: string; model_id: string | null;
  kind: DeductionKind; deduction_type: DeductionType;
  label_th: string; label_en: string;
  fixed_amount: number | null; percent_amount: number | null;
  range_min: number | null; range_max: number | null;
  sort_order: number; is_active: boolean;
  applies_when: ConditionJson;
}
interface UPRejectRule {
  id: string; category_id: string; label_th: string; label_en: string;
  triggers_when: ConditionJson; is_active: boolean;
}

// ─── Condition Builder State ──────────────────────────────────

type CondMode = "always" | "single" | "and" | "or";
interface CondRow { dim_code: string; val_code: string; }
interface CondBuilderState { mode: CondMode; rows: CondRow[]; }

function initCondBuilder(cond: ConditionJson): CondBuilderState {
  if (!cond) return { mode: "always", rows: [{ dim_code: "", val_code: "" }] };
  if ("and" in cond) return { mode: "and", rows: cond.and.map(c => ({ dim_code: c.dimension, val_code: c.value })) };
  if ("or" in cond) return { mode: "or", rows: cond.or.map(c => ({ dim_code: c.dimension, val_code: c.value })) };
  return { mode: "single", rows: [{ dim_code: cond.dimension, val_code: cond.value }] };
}
function serializeCond(s: CondBuilderState): ConditionJson {
  if (s.mode === "always") return null;
  const valid = s.rows.filter(r => r.dim_code && r.val_code).map(r => ({ dimension: r.dim_code, value: r.val_code }));
  if (valid.length === 0) return null;
  if (s.mode === "single") return valid[0];
  return { [s.mode]: valid } as { and: typeof valid } | { or: typeof valid };
}
function displayCond(cond: ConditionJson): string {
  if (!cond) return "หักเสมอ";
  if ("and" in cond) return `AND (${cond.and.map(c => `${c.dimension}=${c.value}`).join(" & ")})`;
  if ("or" in cond) return `OR (${cond.or.map(c => `${c.dimension}=${c.value}`).join(" | ")})`;
  return `${cond.dimension} = ${cond.value}`;
}

// ─── Mock Seed Data ───────────────────────────────────────────

const INIT_CATS: UPCategory[] = [
  { id: "c1", code: "mobile",    label_th: "มือถือ / แท็บเล็ต", label_en: "Mobile / Tablet",  appliance_category_id: "ac6", sort_order: 1, is_active: true },
  { id: "c2", code: "notebook",  label_th: "โน้ตบุ๊ก",           label_en: "Notebook / Laptop", appliance_category_id: "ac7", sort_order: 2, is_active: true },
  { id: "c3", code: "monitor",   label_th: "จอคอมพิวเตอร์",      label_en: "Monitor",           appliance_category_id: null,  sort_order: 3, is_active: true },
  { id: "c4", code: "printer",   label_th: "ปริ้นเตอร์",          label_en: "Printer",           appliance_category_id: null,  sort_order: 4, is_active: false },
];

const INIT_DIMS: UPDimension[] = [
  // มือถือ
  { id: "d1", category_id: "c1", code: "condition",      label_th: "สภาพโดยรวม",  label_en: "Condition",      kind: "ENUM",    is_price_axis: true,  sort_order: 1 },
  { id: "d2", category_id: "c1", code: "battery_health", label_th: "สุขภาพแบต",   label_en: "Battery Health", kind: "NUMERIC", is_price_axis: true,  sort_order: 2 },
  { id: "d3", category_id: "c1", code: "accessory",      label_th: "อุปกรณ์เสริม",label_en: "Accessory",      kind: "ENUM",    is_price_axis: false, sort_order: 3 },
  // โน้ตบุ๊ก
  { id: "d4", category_id: "c2", code: "condition",      label_th: "สภาพโดยรวม",  label_en: "Condition",      kind: "ENUM",    is_price_axis: true,  sort_order: 1 },
  { id: "d5", category_id: "c2", code: "storage",        label_th: "ความจุ SSD",   label_en: "Storage",        kind: "ENUM",    is_price_axis: true,  sort_order: 2 },
  { id: "d6", category_id: "c2", code: "ram",            label_th: "RAM",          label_en: "RAM",            kind: "ENUM",    is_price_axis: true,  sort_order: 3 },
  // จอ
  { id: "d7", category_id: "c3", code: "condition",      label_th: "สภาพโดยรวม",  label_en: "Condition",      kind: "ENUM",    is_price_axis: true,  sort_order: 1 },
  { id: "d8", category_id: "c3", code: "panel_defect",   label_th: "ความเสียหายจอ",label_en: "Panel Defect",   kind: "BOOLEAN", is_price_axis: true,  sort_order: 2 },
];

const INIT_DIM_VALS: UPDimValue[] = [
  // condition (mobile)
  { id: "v1", dimension_id: "d1", code: "mint",      label_th: "ใหม่มาก",  label_en: "Mint",      numeric_value: null, sort_order: 1 },
  { id: "v2", dimension_id: "d1", code: "good",      label_th: "ดี",       label_en: "Good",      numeric_value: null, sort_order: 2 },
  { id: "v3", dimension_id: "d1", code: "fair",      label_th: "พอใช้",    label_en: "Fair",      numeric_value: null, sort_order: 3 },
  { id: "v4", dimension_id: "d1", code: "poor",      label_th: "ทรุดโทรม", label_en: "Poor",      numeric_value: null, sort_order: 4 },
  // accessory (mobile)
  { id: "v5", dimension_id: "d3", code: "full",      label_th: "ครบ",           label_en: "Full set",     numeric_value: null, sort_order: 1 },
  { id: "v6", dimension_id: "d3", code: "charger",   label_th: "มีเฉพาะชาร์จ", label_en: "Charger only", numeric_value: null, sort_order: 2 },
  { id: "v7", dimension_id: "d3", code: "none",      label_th: "ไม่มีอุปกรณ์",  label_en: "No accessory", numeric_value: null, sort_order: 3 },
  // condition (notebook)
  { id: "v8",  dimension_id: "d4", code: "mint",     label_th: "ใหม่มาก",  label_en: "Mint",  numeric_value: null, sort_order: 1 },
  { id: "v9",  dimension_id: "d4", code: "good",     label_th: "ดี",       label_en: "Good",  numeric_value: null, sort_order: 2 },
  { id: "v10", dimension_id: "d4", code: "fair",     label_th: "พอใช้",    label_en: "Fair",  numeric_value: null, sort_order: 3 },
  // storage (notebook)
  { id: "v11", dimension_id: "d5", code: "256",      label_th: "256 GB",   label_en: "256 GB",  numeric_value: 256,  sort_order: 1 },
  { id: "v12", dimension_id: "d5", code: "512",      label_th: "512 GB",   label_en: "512 GB",  numeric_value: 512,  sort_order: 2 },
  { id: "v13", dimension_id: "d5", code: "1tb",      label_th: "1 TB",     label_en: "1 TB",    numeric_value: 1000, sort_order: 3 },
  // ram (notebook)
  { id: "v14", dimension_id: "d6", code: "8",        label_th: "8 GB",     label_en: "8 GB",    numeric_value: 8,    sort_order: 1 },
  { id: "v15", dimension_id: "d6", code: "16",       label_th: "16 GB",    label_en: "16 GB",   numeric_value: 16,   sort_order: 2 },
];

const INIT_MODELS: UPModel[] = [
  { id: "m1", category_id: "c1", code: "iphone-14",    label_th: "iPhone 14",    label_en: "iPhone 14",    brand: "Apple",   spec_attributes: { storage: "128GB", color: "Black" },   base_market_price: 22000, is_active: true },
  { id: "m2", category_id: "c1", code: "iphone-14-pro",label_th: "iPhone 14 Pro",label_en: "iPhone 14 Pro",brand: "Apple",   spec_attributes: { storage: "256GB", color: "Silver" },  base_market_price: 32000, is_active: true },
  { id: "m3", category_id: "c1", code: "s24-ultra",    label_th: "Samsung S24 Ultra",label_en: "S24 Ultra",brand: "Samsung", spec_attributes: { storage: "256GB", color: "Titanium" },base_market_price: 35000, is_active: true },
  { id: "m4", category_id: "c2", code: "macbook-air-m2",label_th: "MacBook Air M2",label_en: "MacBook Air M2",brand: "Apple", spec_attributes: { display: "13 inch", year: "2022" },  base_market_price: 38000, is_active: true },
  { id: "m5", category_id: "c2", code: "thinkpad-x1",  label_th: "ThinkPad X1 Carbon",label_en: "ThinkPad X1",brand: "Lenovo",spec_attributes: { display: "14 inch", year: "2023" },  base_market_price: 35000, is_active: true },
];

const INIT_PRICE_POINTS: UPPricePoint[] = [
  { id: "pp1", model_id: "m1", dimensions: { condition: "mint", battery_health: "90+" },    is_multi_issue: false, price: 18000 },
  { id: "pp2", model_id: "m1", dimensions: { condition: "good", battery_health: "80-89" },  is_multi_issue: false, price: 14000 },
  { id: "pp3", model_id: "m1", dimensions: { condition: "fair", battery_health: "70-79" },  is_multi_issue: false, price: 10000 },
  { id: "pp4", model_id: "m1", dimensions: { condition: "fair", battery_health: "70-79" },  is_multi_issue: true,  price: 7500  },
  { id: "pp5", model_id: "m4", dimensions: { condition: "mint", storage: "512", ram: "16" },is_multi_issue: false, price: 35000 },
  { id: "pp6", model_id: "m4", dimensions: { condition: "good", storage: "256", ram: "8" }, is_multi_issue: false, price: 28000 },
];

const INIT_DEDUCTIONS: UPDeduction[] = [
  { id: "ded1", category_id: "c1", model_id: null, kind: "CONDITION", deduction_type: "PERCENT", label_th: "หน้าจอแตก", label_en: "Cracked screen", fixed_amount: null, percent_amount: 30, range_min: null, range_max: null, sort_order: 1, is_active: true, applies_when: null },
  { id: "ded2", category_id: "c1", model_id: null, kind: "MISSING_ACCESSORY", deduction_type: "FIXED", label_th: "ไม่มีสายชาร์จ", label_en: "Missing charger", fixed_amount: 500, percent_amount: null, range_min: null, range_max: null, sort_order: 2, is_active: true, applies_when: { dimension: "accessory", value: "none" } },
  { id: "ded3", category_id: "c1", model_id: null, kind: "PROBLEM", deduction_type: "RANGE", label_th: "แบตเสื่อมมาก", label_en: "Poor battery", fixed_amount: null, percent_amount: null, range_min: 800, range_max: 2000, sort_order: 3, is_active: true, applies_when: { dimension: "battery_health", value: "under-70" } },
  { id: "ded4", category_id: "c1", model_id: null, kind: "AGE", deduction_type: "PERCENT", label_th: "อายุใช้งาน > 3 ปี", label_en: "Age > 3 years", fixed_amount: null, percent_amount: 10, range_min: null, range_max: null, sort_order: 4, is_active: true, applies_when: null },
  { id: "ded5", category_id: "c2", model_id: null, kind: "CONDITION", deduction_type: "PERCENT", label_th: "แป้นพิมพ์เสีย", label_en: "Defective keyboard", fixed_amount: null, percent_amount: 20, range_min: null, range_max: null, sort_order: 1, is_active: true, applies_when: null },
  { id: "ded6", category_id: "c2", model_id: null, kind: "MISSING_ACCESSORY", deduction_type: "FIXED", label_th: "ไม่มีอะแดปเตอร์", label_en: "Missing adapter", fixed_amount: 800, percent_amount: null, range_min: null, range_max: null, sort_order: 2, is_active: true, applies_when: null },
];

const INIT_REJECT_RULES: UPRejectRule[] = [
  { id: "rr1", category_id: "c1", label_th: "เปิดเครื่องไม่ติด",   label_en: "Cannot power on",   triggers_when: { dimension: "condition", value: "dead" },     is_active: true },
  { id: "rr2", category_id: "c1", label_th: "ล็อค iCloud ถาวร",   label_en: "iCloud activation lock", triggers_when: { dimension: "condition", value: "locked" }, is_active: true },
  { id: "rr3", category_id: "c2", label_th: "เมนบอร์ดเสีย",        label_en: "Motherboard damage",triggers_when: { dimension: "condition", value: "dead" },     is_active: true },
];

// ─── Helpers ──────────────────────────────────────────────────

function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-400"}`}>
      {active ? "ใช้งาน" : "ปิด"}
    </span>
  );
}
function KindBadge({ kind }: { kind: DeductionKind }) {
  const m: Record<DeductionKind, string> = {
    CONDITION: "bg-purple-50 text-purple-700", MISSING_ACCESSORY: "bg-yellow-50 text-yellow-700",
    PROBLEM: "bg-red-50 text-red-700", AGE: "bg-blue-50 text-blue-700", OTHER: "bg-gray-100 text-gray-600",
  };
  const l: Record<DeductionKind, string> = { CONDITION: "สภาพ", MISSING_ACCESSORY: "ขาดอุปกรณ์", PROBLEM: "ปัญหา", AGE: "อายุ", OTHER: "อื่นๆ" };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${m[kind]}`}>{l[kind]}</span>;
}
function DimKindBadge({ kind }: { kind: UPDimension["kind"] }) {
  const m = { ENUM: "bg-blue-50 text-blue-700", NUMERIC: "bg-orange-50 text-orange-700", BOOLEAN: "bg-green-50 text-green-700", TEXT: "bg-gray-100 text-gray-600" };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${m[kind]}`}>{kind}</span>;
}
function DeductionAmountDisplay({ d }: { d: UPDeduction }) {
  if (d.deduction_type === "FIXED")   return <span className="font-mono text-sm">-{d.fixed_amount?.toLocaleString()} ฿</span>;
  if (d.deduction_type === "PERCENT") return <span className="font-mono text-sm">-{d.percent_amount}%</span>;
  return <span className="font-mono text-sm">{d.range_min?.toLocaleString()}–{d.range_max?.toLocaleString()} ฿</span>;
}

// ─── Condition Builder Component ─────────────────────────────

function ConditionBuilder({
  state, onChange, dims, dimVals,
}: {
  state: CondBuilderState;
  onChange: (s: CondBuilderState) => void;
  dims: UPDimension[];
  dimVals: UPDimValue[];
}) {
  function setMode(mode: CondMode) {
    const rows = state.rows.length > 0 ? state.rows : [{ dim_code: "", val_code: "" }];
    onChange({ mode, rows: mode === "single" ? [rows[0]] : rows });
  }
  function setRow(i: number, patch: Partial<CondRow>) {
    const rows = state.rows.map((r, idx) => idx === i ? { ...r, ...patch } : r);
    onChange({ ...state, rows });
  }
  function addRow() { onChange({ ...state, rows: [...state.rows, { dim_code: "", val_code: "" }] }); }
  function removeRow(i: number) { onChange({ ...state, rows: state.rows.filter((_, idx) => idx !== i) }); }

  const enumDims = dims.filter(d => d.kind === "ENUM" || d.kind === "BOOLEAN");

  return (
    <div className="space-y-3">
      <div className="flex gap-3 flex-wrap">
        {(["always", "single", "and", "or"] as CondMode[]).map(m => (
          <label key={m} className="flex items-center gap-1.5 cursor-pointer">
            <input type="radio" name="cond-mode" checked={state.mode === m} onChange={() => setMode(m)} className="accent-admin-primary" />
            <span className="text-sm">{m === "always" ? "หักเสมอ (ไม่มีเงื่อนไข)" : m === "single" ? "เงื่อนไขเดียว" : m === "and" ? "AND (ทุกเงื่อนไข)" : "OR (เงื่อนไขใดก็ได้)"}</span>
          </label>
        ))}
      </div>
      {state.mode !== "always" && (
        <div className="space-y-2 pl-2 border-l-2 border-admin-primary/30">
          {state.rows.map((row, i) => (
            <div key={i} className="flex gap-2 items-center">
              <select value={row.dim_code} onChange={e => setRow(i, { dim_code: e.target.value, val_code: "" })}
                className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 bg-white min-w-[140px]">
                <option value="">เลือกมิติ...</option>
                {enumDims.map(d => <option key={d.id} value={d.code}>{d.label_th}</option>)}
              </select>
              <select value={row.val_code} onChange={e => setRow(i, { val_code: e.target.value })}
                className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 bg-white min-w-[130px]"
                disabled={!row.dim_code}>
                <option value="">เลือกค่า...</option>
                {dimVals.filter(v => {
                  const dim = enumDims.find(d => d.code === row.dim_code);
                  return dim && v.dimension_id === dim.id;
                }).map(v => <option key={v.id} value={v.code}>{v.label_th}</option>)}
              </select>
              {state.mode !== "single" && (
                <button onClick={() => removeRow(i)} className="text-xs text-red-400 hover:text-red-600 px-1">✕</button>
              )}
            </div>
          ))}
          {state.mode !== "single" && (
            <button onClick={addRow} className="text-xs text-admin-primary hover:underline">+ เพิ่มเงื่อนไข</button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Tab 1 — ประเภท (Categories) ─────────────────────────────

function Tab1Categories({ cats, setCats }: { cats: UPCategory[]; setCats: (c: UPCategory[]) => void }) {
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<UPCategory | null>(null);
  const [form, setForm] = useState({ code: "", label_th: "", label_en: "", sort_order: 0 });

  function openAdd() { setEditing(null); setForm({ code: "", label_th: "", label_en: "", sort_order: cats.length + 1 }); setShowModal(true); }
  function openEdit(c: UPCategory) { setEditing(c); setForm({ code: c.code, label_th: c.label_th, label_en: c.label_en, sort_order: c.sort_order }); setShowModal(true); }
  function save() {
    if (editing) {
      setCats(cats.map(c => c.id === editing.id ? { ...c, ...form } : c));
    } else {
      setCats([...cats, { id: `c${Date.now()}`, ...form, appliance_category_id: null, is_active: true }]);
    }
    setShowModal(false);
  }
  function toggle(id: string) { setCats(cats.map(c => c.id === id ? { ...c, is_active: !c.is_active } : c)); }
  function del(id: string) {
    if (confirm("ลบประเภทนี้?")) setCats(cats.filter(c => c.id !== id));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-700">ประเภทเครื่อง ({cats.length})</h2>
        <button onClick={openAdd} className="text-sm bg-admin-primary text-white px-3 py-1.5 rounded-lg hover:bg-admin-dark transition-colors">+ เพิ่มประเภท</button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr className="text-xs text-gray-500 text-left">
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">ชื่อ (ไทย)</th>
              <th className="px-4 py-3">ชื่อ (EN)</th>
              <th className="px-4 py-3">ผูก appliance_category</th>
              <th className="px-4 py-3">ลำดับ</th>
              <th className="px-4 py-3">สถานะ</th>
              <th className="px-4 py-3">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {cats.map(c => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{c.code}</td>
                <td className="px-4 py-3 font-medium">{c.label_th}</td>
                <td className="px-4 py-3 text-gray-500">{c.label_en}</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-400">{c.appliance_category_id ?? "—"}</td>
                <td className="px-4 py-3 text-center">{c.sort_order}</td>
                <td className="px-4 py-3"><ActiveBadge active={c.is_active} /></td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(c)} className="text-xs text-admin-primary hover:underline">แก้ไข</button>
                    <button onClick={() => toggle(c.id)} className="text-xs text-gray-400 hover:text-gray-600">{c.is_active ? "ปิด" : "เปิด"}</button>
                    <button onClick={() => del(c.id)} className="text-xs text-red-400 hover:text-red-600">ลบ</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-base font-semibold text-gray-800 mb-4">{editing ? "แก้ไขประเภท" : "เพิ่มประเภทใหม่"}</h3>
            <div className="space-y-3">
              {[{ key: "code", label: "Code (ภาษาอังกฤษ, ไม่มีช่องว่าง)" }, { key: "label_th", label: "ชื่อภาษาไทย" }, { key: "label_en", label: "ชื่อภาษาอังกฤษ" }].map(f => (
                <div key={f.key}>
                  <label className="text-xs font-medium text-gray-600">{f.label}</label>
                  <input value={(form as Record<string, string | number>)[f.key] as string}
                    onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900" />
                </div>
              ))}
              <div>
                <label className="text-xs font-medium text-gray-600">ลำดับการแสดง</label>
                <input type="number" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: Number(e.target.value) })}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={save} className="flex-1 bg-admin-primary text-white py-2 rounded-lg text-sm font-medium hover:bg-admin-dark">บันทึก</button>
              <button onClick={() => setShowModal(false)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm">ยกเลิก</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab 2 — มิติ / ค่า (Dimensions + Values) ────────────────

function Tab2Dimensions({ cats, dims, setDims, dimVals, setDimVals }: {
  cats: UPCategory[]; dims: UPDimension[]; setDims: (d: UPDimension[]) => void;
  dimVals: UPDimValue[]; setDimVals: (v: UPDimValue[]) => void;
}) {
  const [selCat, setSelCat] = useState(cats[0]?.id ?? "");
  const [selDim, setSelDim] = useState<string | null>(null);
  const [showDimModal, setShowDimModal] = useState(false);
  const [showValModal, setShowValModal] = useState(false);
  const [editDim, setEditDim] = useState<UPDimension | null>(null);
  const [editVal, setEditVal] = useState<UPDimValue | null>(null);
  const [dimForm, setDimForm] = useState({ code: "", label_th: "", label_en: "", kind: "ENUM" as UPDimension["kind"], is_price_axis: false, sort_order: 1 });
  const [valForm, setValForm] = useState({ code: "", label_th: "", label_en: "", numeric_value: "" });

  const catDims = dims.filter(d => d.category_id === selCat);
  const selDimObj = dims.find(d => d.id === selDim);
  const selDimVals = dimVals.filter(v => v.dimension_id === selDim);

  function openAddDim() { setEditDim(null); setDimForm({ code: "", label_th: "", label_en: "", kind: "ENUM", is_price_axis: false, sort_order: catDims.length + 1 }); setShowDimModal(true); }
  function openEditDim(d: UPDimension) { setEditDim(d); setDimForm({ code: d.code, label_th: d.label_th, label_en: d.label_en, kind: d.kind, is_price_axis: d.is_price_axis, sort_order: d.sort_order }); setShowDimModal(true); }
  function saveDim() {
    if (editDim) { setDims(dims.map(d => d.id === editDim.id ? { ...d, ...dimForm } : d)); }
    else { setDims([...dims, { id: `dim${Date.now()}`, category_id: selCat, ...dimForm }]); }
    setShowDimModal(false);
  }

  function openAddVal() { setEditVal(null); setValForm({ code: "", label_th: "", label_en: "", numeric_value: "" }); setShowValModal(true); }
  function openEditVal(v: UPDimValue) { setEditVal(v); setValForm({ code: v.code, label_th: v.label_th, label_en: v.label_en, numeric_value: v.numeric_value?.toString() ?? "" }); setShowValModal(true); }
  function saveVal() {
    if (!selDim) return;
    const base = { code: valForm.code, label_th: valForm.label_th, label_en: valForm.label_en, numeric_value: valForm.numeric_value ? Number(valForm.numeric_value) : null, sort_order: selDimVals.length + 1 };
    if (editVal) { setDimVals(dimVals.map(v => v.id === editVal.id ? { ...v, ...base } : v)); }
    else { setDimVals([...dimVals, { id: `val${Date.now()}`, dimension_id: selDim, ...base }]); }
    setShowValModal(false);
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <label className="text-sm font-medium text-gray-600">ประเภท:</label>
        <select value={selCat} onChange={e => { setSelCat(e.target.value); setSelDim(null); }}
          className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white">
          {cats.filter(c => c.is_active).map(c => <option key={c.id} value={c.id}>{c.label_th}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Dimensions */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">มิติ (Dimensions)</span>
            <button onClick={openAddDim} className="text-xs text-admin-primary hover:underline">+ เพิ่ม</button>
          </div>
          <div className="divide-y divide-gray-100">
            {catDims.length === 0 && <p className="px-4 py-6 text-sm text-gray-400 text-center">ยังไม่มีมิติ</p>}
            {catDims.map(d => (
              <div key={d.id}
                onClick={() => setSelDim(selDim === d.id ? null : d.id)}
                className={`px-4 py-3 cursor-pointer hover:bg-admin-surface/40 transition-colors ${selDim === d.id ? "bg-admin-surface" : ""}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium">{d.label_th}</span>
                    <span className="ml-2 font-mono text-xs text-gray-400">{d.code}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DimKindBadge kind={d.kind} />
                    {d.is_price_axis && <span className="text-xs bg-admin-surface text-admin-primary px-1.5 py-0.5 rounded">💰 ราคา</span>}
                    <button onClick={e => { e.stopPropagation(); openEditDim(d); }} className="text-xs text-gray-400 hover:text-admin-primary">แก้</button>
                    <button onClick={e => { e.stopPropagation(); setDims(dims.filter(x => x.id !== d.id)); }} className="text-xs text-red-300 hover:text-red-500">ลบ</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Values */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              {selDimObj ? `ค่า — ${selDimObj.label_th}` : "ค่า (เลือกมิติก่อน)"}
            </span>
            {selDim && <button onClick={openAddVal} className="text-xs text-admin-primary hover:underline">+ เพิ่ม</button>}
          </div>
          <div className="divide-y divide-gray-100">
            {!selDim && <p className="px-4 py-6 text-sm text-gray-400 text-center">← คลิกมิติเพื่อดูค่า</p>}
            {selDim && selDimVals.length === 0 && <p className="px-4 py-6 text-sm text-gray-400 text-center">ยังไม่มีค่า</p>}
            {selDimVals.map(v => (
              <div key={v.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <span className="text-sm">{v.label_th}</span>
                  <span className="ml-2 font-mono text-xs text-gray-400">{v.code}</span>
                  {v.numeric_value !== null && <span className="ml-2 text-xs text-orange-600">= {v.numeric_value}</span>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEditVal(v)} className="text-xs text-gray-400 hover:text-admin-primary">แก้</button>
                  <button onClick={() => setDimVals(dimVals.filter(x => x.id !== v.id))} className="text-xs text-red-300 hover:text-red-500">ลบ</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dimension Modal */}
      {showDimModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-base font-semibold text-gray-800 mb-4">{editDim ? "แก้ไขมิติ" : "เพิ่มมิติ"}</h3>
            <div className="space-y-3">
              {[{ key: "code", label: "Code" }, { key: "label_th", label: "ชื่อ (ไทย)" }, { key: "label_en", label: "ชื่อ (EN)" }].map(f => (
                <div key={f.key}>
                  <label className="text-xs font-medium text-gray-600">{f.label}</label>
                  <input value={(dimForm as Record<string, unknown>)[f.key] as string}
                    onChange={e => setDimForm({ ...dimForm, [f.key]: e.target.value })}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900" />
                </div>
              ))}
              <div>
                <label className="text-xs font-medium text-gray-600">ประเภท (Kind)</label>
                <select value={dimForm.kind} onChange={e => setDimForm({ ...dimForm, kind: e.target.value as UPDimension["kind"] })}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900">
                  {(["ENUM", "NUMERIC", "BOOLEAN", "TEXT"] as const).map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={dimForm.is_price_axis} onChange={e => setDimForm({ ...dimForm, is_price_axis: e.target.checked })} className="accent-admin-primary" />
                <span className="text-sm">มิตินี้มีผลต่อราคา (is_price_axis)</span>
              </label>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={saveDim} className="flex-1 bg-admin-primary text-white py-2 rounded-lg text-sm font-medium hover:bg-admin-dark">บันทึก</button>
              <button onClick={() => setShowDimModal(false)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm">ยกเลิก</button>
            </div>
          </div>
        </div>
      )}

      {/* Value Modal */}
      {showValModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-base font-semibold text-gray-800 mb-4">{editVal ? "แก้ไขค่า" : "เพิ่มค่า"}</h3>
            <div className="space-y-3">
              {[{ key: "code", label: "Code" }, { key: "label_th", label: "ชื่อ (ไทย)" }, { key: "label_en", label: "ชื่อ (EN)" }].map(f => (
                <div key={f.key}>
                  <label className="text-xs font-medium text-gray-600">{f.label}</label>
                  <input value={(valForm as Record<string, string>)[f.key]}
                    onChange={e => setValForm({ ...valForm, [f.key]: e.target.value })}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900" />
                </div>
              ))}
              {selDimObj?.kind === "NUMERIC" && (
                <div>
                  <label className="text-xs font-medium text-gray-600">ค่าตัวเลข (numeric_value)</label>
                  <input type="number" value={valForm.numeric_value} onChange={e => setValForm({ ...valForm, numeric_value: e.target.value })}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900" />
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={saveVal} className="flex-1 bg-admin-primary text-white py-2 rounded-lg text-sm font-medium hover:bg-admin-dark">บันทึก</button>
              <button onClick={() => setShowValModal(false)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm">ยกเลิก</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab 3 — รุ่น + ราคา (Models + Price Points) ────────────

function Tab3Models({ cats, dims, dimVals, models, setModels, pricePoints, setPricePoints }: {
  cats: UPCategory[]; dims: UPDimension[]; dimVals: UPDimValue[];
  models: UPModel[]; setModels: (m: UPModel[]) => void;
  pricePoints: UPPricePoint[]; setPricePoints: (p: UPPricePoint[]) => void;
}) {
  const [selCat, setSelCat] = useState(cats[0]?.id ?? "");
  const [selModel, setSelModel] = useState<string | null>(null);
  const [showModelModal, setShowModelModal] = useState(false);
  const [showPPModal, setShowPPModal] = useState(false);
  const [editModel, setEditModel] = useState<UPModel | null>(null);
  const [editPP, setEditPP] = useState<UPPricePoint | null>(null);
  const [mForm, setMForm] = useState({ code: "", label_th: "", label_en: "", brand: "", base_market_price: "" });
  const [ppForm, setPPForm] = useState<{ dims: Record<string, string>; is_multi_issue: boolean; price: string }>({ dims: {}, is_multi_issue: false, price: "" });

  const catModels = models.filter(m => m.category_id === selCat);
  const selModelObj = models.find(m => m.id === selModel);
  const modelPPs = pricePoints.filter(p => p.model_id === selModel);
  const catDims = dims.filter(d => d.category_id === selCat && d.is_price_axis);

  function openAddModel() { setEditModel(null); setMForm({ code: "", label_th: "", label_en: "", brand: "", base_market_price: "" }); setShowModelModal(true); }
  function openEditModel(m: UPModel) { setEditModel(m); setMForm({ code: m.code, label_th: m.label_th, label_en: m.label_en, brand: m.brand, base_market_price: m.base_market_price?.toString() ?? "" }); setShowModelModal(true); }
  function saveModel() {
    const base = { code: mForm.code, label_th: mForm.label_th, label_en: mForm.label_en, brand: mForm.brand, base_market_price: mForm.base_market_price ? Number(mForm.base_market_price) : null };
    if (editModel) { setModels(models.map(m => m.id === editModel.id ? { ...m, ...base } : m)); }
    else { setModels([...models, { id: `mdl${Date.now()}`, category_id: selCat, spec_attributes: {}, is_active: true, ...base }]); }
    setShowModelModal(false);
  }

  function openAddPP() { setPPForm({ dims: {}, is_multi_issue: false, price: "" }); setEditPP(null); setShowPPModal(true); }
  function openEditPP(p: UPPricePoint) { setEditPP(p); setPPForm({ dims: { ...p.dimensions }, is_multi_issue: p.is_multi_issue, price: p.price.toString() }); setShowPPModal(true); }
  function savePP() {
    if (!selModel) return;
    const base = { dimensions: ppForm.dims, is_multi_issue: ppForm.is_multi_issue, price: Number(ppForm.price) };
    if (editPP) { setPricePoints(pricePoints.map(p => p.id === editPP.id ? { ...p, ...base } : p)); }
    else { setPricePoints([...pricePoints, { id: `pp${Date.now()}`, model_id: selModel, ...base }]); }
    setShowPPModal(false);
  }

  const dimValOptions = useCallback((dimCode: string) => {
    const dim = catDims.find(d => d.code === dimCode);
    if (!dim) return [];
    return dimVals.filter(v => v.dimension_id === dim.id);
  }, [catDims, dimVals]);

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <label className="text-sm font-medium text-gray-600">ประเภท:</label>
        <select value={selCat} onChange={e => { setSelCat(e.target.value); setSelModel(null); }}
          className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white">
          {cats.filter(c => c.is_active).map(c => <option key={c.id} value={c.id}>{c.label_th}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Models list */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">รุ่น ({catModels.length})</span>
            <button onClick={openAddModel} className="text-xs text-admin-primary hover:underline">+ เพิ่ม</button>
          </div>
          <div className="divide-y divide-gray-100">
            {catModels.length === 0 && <p className="px-4 py-6 text-sm text-gray-400 text-center">ยังไม่มีรุ่น</p>}
            {catModels.map(m => (
              <div key={m.id}
                onClick={() => setSelModel(selModel === m.id ? null : m.id)}
                className={`px-4 py-3 cursor-pointer hover:bg-admin-surface/40 ${selModel === m.id ? "bg-admin-surface" : ""}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{m.label_th}</p>
                    <p className="text-xs text-gray-400">{m.brand} · {m.code}</p>
                    {m.base_market_price && <p className="text-xs text-green-600 font-mono">ราคาตลาด {m.base_market_price.toLocaleString()} ฿</p>}
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    <ActiveBadge active={m.is_active} />
                    <div className="flex gap-1.5">
                      <button onClick={e => { e.stopPropagation(); openEditModel(m); }} className="text-xs text-gray-400 hover:text-admin-primary">แก้</button>
                      <button onClick={e => { e.stopPropagation(); setModels(models.map(x => x.id === m.id ? { ...x, is_active: !x.is_active } : x)); }} className="text-xs text-gray-400 hover:text-gray-600">{m.is_active ? "ปิด" : "เปิด"}</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Price Points */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              {selModelObj ? `ราคา — ${selModelObj.label_th}` : "ตารางราคา (เลือกรุ่นก่อน)"}
            </span>
            {selModel && <button onClick={openAddPP} className="text-xs text-admin-primary hover:underline">+ เพิ่มราคา</button>}
          </div>
          {!selModel ? (
            <p className="px-4 py-6 text-sm text-gray-400 text-center">← คลิกรุ่นเพื่อดูตารางราคา</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr className="text-xs text-gray-500 text-left">
                    <th className="px-3 py-2">มิติที่ใช้</th>
                    <th className="px-3 py-2">Multi-issue</th>
                    <th className="px-3 py-2">ราคา</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {modelPPs.length === 0 && (
                    <tr><td colSpan={4} className="px-4 py-6 text-sm text-gray-400 text-center">ยังไม่มีราคา</td></tr>
                  )}
                  {modelPPs.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(p.dimensions).map(([k, v]) => (
                            <span key={k} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-mono">{k}:{v}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        {p.is_multi_issue ? <span className="text-xs bg-red-50 text-red-700 px-1.5 py-0.5 rounded">ปัญหาหลายจุด</span> : <span className="text-xs text-gray-400">—</span>}
                      </td>
                      <td className="px-3 py-2 font-mono font-semibold text-green-700">{p.price.toLocaleString()} ฿</td>
                      <td className="px-3 py-2">
                        <div className="flex gap-2">
                          <button onClick={() => openEditPP(p)} className="text-xs text-gray-400 hover:text-admin-primary">แก้</button>
                          <button onClick={() => setPricePoints(pricePoints.filter(x => x.id !== p.id))} className="text-xs text-red-300 hover:text-red-500">ลบ</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Model Modal */}
      {showModelModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-base font-semibold text-gray-800 mb-4">{editModel ? "แก้ไขรุ่น" : "เพิ่มรุ่นใหม่"}</h3>
            <div className="space-y-3">
              {[{ key: "code", label: "Code" }, { key: "label_th", label: "ชื่อ (ไทย)" }, { key: "label_en", label: "ชื่อ (EN)" }, { key: "brand", label: "แบรนด์" }].map(f => (
                <div key={f.key}>
                  <label className="text-xs font-medium text-gray-600">{f.label}</label>
                  <input value={(mForm as Record<string, string>)[f.key]}
                    onChange={e => setMForm({ ...mForm, [f.key]: e.target.value })}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900" />
                </div>
              ))}
              <div>
                <label className="text-xs font-medium text-gray-600">ราคาตลาดอ้างอิง (฿)</label>
                <input type="number" value={mForm.base_market_price} onChange={e => setMForm({ ...mForm, base_market_price: e.target.value })}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={saveModel} className="flex-1 bg-admin-primary text-white py-2 rounded-lg text-sm font-medium hover:bg-admin-dark">บันทึก</button>
              <button onClick={() => setShowModelModal(false)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm">ยกเลิก</button>
            </div>
          </div>
        </div>
      )}

      {/* Price Point Modal */}
      {showPPModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-base font-semibold text-gray-800 mb-4">{editPP ? "แก้ไขราคา" : "เพิ่มราคา"}</h3>
            <p className="text-xs text-gray-500 mb-3">กำหนดค่าสำหรับมิติที่มีผลต่อราคา (is_price_axis)</p>
            <div className="space-y-3">
              {catDims.map(d => (
                <div key={d.id}>
                  <label className="text-xs font-medium text-gray-600">{d.label_th} <span className="text-gray-400">({d.kind})</span></label>
                  {d.kind === "ENUM" ? (
                    <select value={ppForm.dims[d.code] ?? ""}
                      onChange={e => setPPForm({ ...ppForm, dims: { ...ppForm.dims, [d.code]: e.target.value } })}
                      className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900">
                      <option value="">เลือก...</option>
                      {dimValOptions(d.code).map(v => <option key={v.id} value={v.code}>{v.label_th}</option>)}
                    </select>
                  ) : (
                    <input value={ppForm.dims[d.code] ?? ""}
                      onChange={e => setPPForm({ ...ppForm, dims: { ...ppForm.dims, [d.code]: e.target.value } })}
                      placeholder={d.kind === "NUMERIC" ? "ตัวเลข..." : "ค่า..."}
                      className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900" />
                  )}
                </div>
              ))}
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={ppForm.is_multi_issue} onChange={e => setPPForm({ ...ppForm, is_multi_issue: e.target.checked })} className="accent-admin-primary" />
                <span className="text-sm">มีปัญหาหลายจุด (is_multi_issue)</span>
              </label>
              <div>
                <label className="text-xs font-medium text-gray-600">ราคารับซื้อ (฿)</label>
                <input type="number" value={ppForm.price} onChange={e => setPPForm({ ...ppForm, price: e.target.value })}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={savePP} className="flex-1 bg-admin-primary text-white py-2 rounded-lg text-sm font-medium hover:bg-admin-dark">บันทึก</button>
              <button onClick={() => setShowPPModal(false)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm">ยกเลิก</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab 4 — ส่วนหักราคา (Deductions) ⭐ ────────────────────

function Tab4Deductions({ cats, dims, dimVals, deductions, setDeductions, models }: {
  cats: UPCategory[]; dims: UPDimension[]; dimVals: UPDimValue[];
  deductions: UPDeduction[]; setDeductions: (d: UPDeduction[]) => void;
  models: UPModel[];
}) {
  const [selCat, setSelCat] = useState(cats[0]?.id ?? "");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<UPDeduction | null>(null);
  const [form, setForm] = useState({
    model_id: "" as string | null,
    kind: "CONDITION" as DeductionKind,
    deduction_type: "FIXED" as DeductionType,
    label_th: "", label_en: "",
    fixed_amount: "", percent_amount: "", range_min: "", range_max: "",
    sort_order: 1,
  });
  const [condState, setCondState] = useState<CondBuilderState>({ mode: "always", rows: [{ dim_code: "", val_code: "" }] });

  const catDeds = deductions.filter(d => d.category_id === selCat);
  const catDims = dims.filter(d => d.category_id === selCat);
  const catModels = models.filter(m => m.category_id === selCat);

  function openAdd() {
    setEditing(null);
    setForm({ model_id: null, kind: "CONDITION", deduction_type: "FIXED", label_th: "", label_en: "", fixed_amount: "", percent_amount: "", range_min: "", range_max: "", sort_order: catDeds.length + 1 });
    setCondState({ mode: "always", rows: [{ dim_code: "", val_code: "" }] });
    setShowModal(true);
  }
  function openEdit(d: UPDeduction) {
    setEditing(d);
    setForm({
      model_id: d.model_id, kind: d.kind, deduction_type: d.deduction_type,
      label_th: d.label_th, label_en: d.label_en,
      fixed_amount: d.fixed_amount?.toString() ?? "", percent_amount: d.percent_amount?.toString() ?? "",
      range_min: d.range_min?.toString() ?? "", range_max: d.range_max?.toString() ?? "",
      sort_order: d.sort_order,
    });
    setCondState(initCondBuilder(d.applies_when));
    setShowModal(true);
  }
  function save() {
    const base: UPDeduction = {
      id: editing?.id ?? `ded${Date.now()}`,
      category_id: selCat, model_id: form.model_id || null,
      kind: form.kind, deduction_type: form.deduction_type,
      label_th: form.label_th, label_en: form.label_en,
      fixed_amount: form.fixed_amount ? Number(form.fixed_amount) : null,
      percent_amount: form.percent_amount ? Number(form.percent_amount) : null,
      range_min: form.range_min ? Number(form.range_min) : null,
      range_max: form.range_max ? Number(form.range_max) : null,
      sort_order: form.sort_order, is_active: editing?.is_active ?? true,
      applies_when: serializeCond(condState),
    };
    if (editing) setDeductions(deductions.map(d => d.id === editing.id ? base : d));
    else setDeductions([...deductions, base]);
    setShowModal(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-600">ประเภท:</label>
          <select value={selCat} onChange={e => setSelCat(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white">
            {cats.filter(c => c.is_active).map(c => <option key={c.id} value={c.id}>{c.label_th}</option>)}
          </select>
        </div>
        <button onClick={openAdd} className="text-sm bg-admin-primary text-white px-3 py-1.5 rounded-lg hover:bg-admin-dark">+ เพิ่มส่วนหัก</button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr className="text-xs text-gray-500 text-left">
              <th className="px-4 py-3">ชื่อส่วนหัก</th>
              <th className="px-4 py-3">ประเภท</th>
              <th className="px-4 py-3">วิธีหัก</th>
              <th className="px-4 py-3">จำนวน</th>
              <th className="px-4 py-3">ใช้เฉพาะรุ่น</th>
              <th className="px-4 py-3">⭐ applies_when</th>
              <th className="px-4 py-3">สถานะ</th>
              <th className="px-4 py-3">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {catDeds.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-400">ยังไม่มีส่วนหัก</td></tr>
            )}
            {catDeds.map(d => {
              const m = models.find(x => x.id === d.model_id);
              return (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{d.label_th}</td>
                  <td className="px-4 py-3"><KindBadge kind={d.kind} /></td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${d.deduction_type === "FIXED" ? "bg-blue-50 text-blue-700" : d.deduction_type === "PERCENT" ? "bg-orange-50 text-orange-700" : "bg-purple-50 text-purple-700"}`}>
                      {d.deduction_type}
                    </span>
                  </td>
                  <td className="px-4 py-3"><DeductionAmountDisplay d={d} /></td>
                  <td className="px-4 py-3 text-xs text-gray-500">{m ? m.label_th : "ทุกรุ่น"}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${d.applies_when ? "bg-amber-50 text-amber-700" : "bg-gray-100 text-gray-500"}`}>
                      {displayCond(d.applies_when)}
                    </span>
                  </td>
                  <td className="px-4 py-3"><ActiveBadge active={d.is_active} /></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(d)} className="text-xs text-admin-primary hover:underline">แก้ไข</button>
                      <button onClick={() => setDeductions(deductions.map(x => x.id === d.id ? { ...x, is_active: !x.is_active } : x))} className="text-xs text-gray-400 hover:text-gray-600">{d.is_active ? "ปิด" : "เปิด"}</button>
                      <button onClick={() => { if (confirm("ลบ?")) setDeductions(deductions.filter(x => x.id !== d.id)); }} className="text-xs text-red-400 hover:text-red-600">ลบ</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-semibold text-gray-800 mb-4">{editing ? "แก้ไขส่วนหัก" : "เพิ่มส่วนหักใหม่"}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-600">ชื่อ (ไทย)</label>
                <input value={form.label_th} onChange={e => setForm({ ...form, label_th: e.target.value })}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">ชื่อ (EN)</label>
                <input value={form.label_en} onChange={e => setForm({ ...form, label_en: e.target.value })}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">ประเภทส่วนหัก (Kind)</label>
                <select value={form.kind} onChange={e => setForm({ ...form, kind: e.target.value as DeductionKind })}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900">
                  {(["CONDITION", "MISSING_ACCESSORY", "PROBLEM", "AGE", "OTHER"] as const).map(k => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">วิธีคิดส่วนหัก (Deduction Type)</label>
                <select value={form.deduction_type} onChange={e => setForm({ ...form, deduction_type: e.target.value as DeductionType })}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900">
                  <option value="FIXED">FIXED — หักจำนวนคงที่ (฿)</option>
                  <option value="PERCENT">PERCENT — หักเป็น %</option>
                  <option value="RANGE">RANGE — หักในช่วง min–max (฿)</option>
                </select>
              </div>
              {form.deduction_type === "FIXED" && (
                <div>
                  <label className="text-xs font-medium text-gray-600">จำนวนที่หัก (฿)</label>
                  <input type="number" value={form.fixed_amount} onChange={e => setForm({ ...form, fixed_amount: e.target.value })}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900" />
                </div>
              )}
              {form.deduction_type === "PERCENT" && (
                <div>
                  <label className="text-xs font-medium text-gray-600">เปอร์เซ็นต์ที่หัก (%)</label>
                  <input type="number" value={form.percent_amount} onChange={e => setForm({ ...form, percent_amount: e.target.value })}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900" />
                </div>
              )}
              {form.deduction_type === "RANGE" && (
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-xs font-medium text-gray-600">Min (฿)</label>
                    <input type="number" value={form.range_min} onChange={e => setForm({ ...form, range_min: e.target.value })}
                      className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900" />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-medium text-gray-600">Max (฿)</label>
                    <input type="number" value={form.range_max} onChange={e => setForm({ ...form, range_max: e.target.value })}
                      className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900" />
                  </div>
                </div>
              )}
              <div>
                <label className="text-xs font-medium text-gray-600">ใช้เฉพาะรุ่น (ว่าง = ทุกรุ่น)</label>
                <select value={form.model_id ?? ""} onChange={e => setForm({ ...form, model_id: e.target.value || null })}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900">
                  <option value="">ทุกรุ่นในประเภทนี้</option>
                  {catModels.map(m => <option key={m.id} value={m.id}>{m.label_th}</option>)}
                </select>
              </div>
            </div>

            {/* ⭐ applies_when builder */}
            <div className="mt-5 border-t border-gray-200 pt-4">
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-3">⭐ applies_when — เงื่อนไขการหัก</p>
              <ConditionBuilder state={condState} onChange={setCondState} dims={catDims} dimVals={dimVals} />
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={save} className="flex-1 bg-admin-primary text-white py-2 rounded-lg text-sm font-medium hover:bg-admin-dark">บันทึก</button>
              <button onClick={() => setShowModal(false)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm">ยกเลิก</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab 5 — เกณฑ์ไม่รับซื้อ (Reject Rules) ─────────────────

function Tab5RejectRules({ cats, dims, dimVals, rules, setRules }: {
  cats: UPCategory[]; dims: UPDimension[]; dimVals: UPDimValue[];
  rules: UPRejectRule[]; setRules: (r: UPRejectRule[]) => void;
}) {
  const [selCat, setSelCat] = useState(cats[0]?.id ?? "");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<UPRejectRule | null>(null);
  const [form, setForm] = useState({ label_th: "", label_en: "" });
  const [condState, setCondState] = useState<CondBuilderState>({ mode: "single", rows: [{ dim_code: "", val_code: "" }] });

  const catRules = rules.filter(r => r.category_id === selCat);
  const catDims = dims.filter(d => d.category_id === selCat);

  function openAdd() { setEditing(null); setForm({ label_th: "", label_en: "" }); setCondState({ mode: "single", rows: [{ dim_code: "", val_code: "" }] }); setShowModal(true); }
  function openEdit(r: UPRejectRule) { setEditing(r); setForm({ label_th: r.label_th, label_en: r.label_en }); setCondState(initCondBuilder(r.triggers_when)); setShowModal(true); }
  function save() {
    const triggers = serializeCond(condState);
    if (!triggers) { alert("กรุณากำหนดเงื่อนไข triggers_when"); return; }
    const base: UPRejectRule = { id: editing?.id ?? `rr${Date.now()}`, category_id: selCat, label_th: form.label_th, label_en: form.label_en, triggers_when: triggers, is_active: editing?.is_active ?? true };
    if (editing) setRules(rules.map(r => r.id === editing.id ? base : r));
    else setRules([...rules, base]);
    setShowModal(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-600">ประเภท:</label>
          <select value={selCat} onChange={e => setSelCat(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white">
            {cats.filter(c => c.is_active).map(c => <option key={c.id} value={c.id}>{c.label_th}</option>)}
          </select>
        </div>
        <button onClick={openAdd} className="text-sm bg-red-500 text-white px-3 py-1.5 rounded-lg hover:bg-red-600">+ เพิ่มเกณฑ์ไม่รับ</button>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-xs text-amber-700">
        ⚠️ เกณฑ์เหล่านี้จะทำให้ราคารับซื้อ = 0 ฿ ทันที — ตรวจสอบ triggers_when ก่อนบันทึกเสมอ
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr className="text-xs text-gray-500 text-left">
              <th className="px-4 py-3">เหตุผลไม่รับซื้อ</th>
              <th className="px-4 py-3">triggers_when (เงื่อนไข)</th>
              <th className="px-4 py-3">สถานะ</th>
              <th className="px-4 py-3">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {catRules.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-400">ยังไม่มีเกณฑ์</td></tr>
            )}
            {catRules.map(r => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium">{r.label_th}</p>
                  {r.label_en && <p className="text-xs text-gray-400">{r.label_en}</p>}
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded-full font-mono">
                    {displayCond(r.triggers_when)}
                  </span>
                </td>
                <td className="px-4 py-3"><ActiveBadge active={r.is_active} /></td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(r)} className="text-xs text-admin-primary hover:underline">แก้ไข</button>
                    <button onClick={() => setRules(rules.map(x => x.id === r.id ? { ...x, is_active: !x.is_active } : x))} className="text-xs text-gray-400 hover:text-gray-600">{r.is_active ? "ปิด" : "เปิด"}</button>
                    <button onClick={() => { if (confirm("ลบเกณฑ์นี้?")) setRules(rules.filter(x => x.id !== r.id)); }} className="text-xs text-red-400 hover:text-red-600">ลบ</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-xl shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-semibold text-gray-800 mb-4">{editing ? "แก้ไขเกณฑ์" : "เพิ่มเกณฑ์ไม่รับ"}</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600">เหตุผล (ไทย)</label>
                <input value={form.label_th} onChange={e => setForm({ ...form, label_th: e.target.value })}
                  placeholder="เช่น: เปิดเครื่องไม่ติด"
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">เหตุผล (EN)</label>
                <input value={form.label_en} onChange={e => setForm({ ...form, label_en: e.target.value })}
                  placeholder="e.g. Cannot power on"
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900" />
              </div>
            </div>
            <div className="mt-4 border-t border-gray-200 pt-4">
              <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-3">triggers_when — เงื่อนไขที่ทำให้ไม่รับซื้อ</p>
              <ConditionBuilder state={condState} onChange={setCondState} dims={catDims} dimVals={dimVals} />
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={save} className="flex-1 bg-red-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-600">บันทึก</button>
              <button onClick={() => setShowModal(false)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm">ยกเลิก</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────

type TabKey = "categories" | "dimensions" | "models" | "deductions" | "rejects";

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: "categories", label: "ประเภทเครื่อง",      icon: "📱" },
  { key: "dimensions", label: "มิติ / ค่า",          icon: "📐" },
  { key: "models",     label: "รุ่น + ราคา",         icon: "💰" },
  { key: "deductions", label: "ส่วนหักราคา ⭐",       icon: "➖" },
  { key: "rejects",    label: "เกณฑ์ไม่รับซื้อ",     icon: "🚫" },
];

export default function PricingAdminPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("categories");

  // Shared mock state
  const [cats, setCats] = useState<UPCategory[]>(INIT_CATS);
  const [dims, setDims] = useState<UPDimension[]>(INIT_DIMS);
  const [dimVals, setDimVals] = useState<UPDimValue[]>(INIT_DIM_VALS);
  const [models, setModels] = useState<UPModel[]>(INIT_MODELS);
  const [pricePoints, setPricePoints] = useState<UPPricePoint[]>(INIT_PRICE_POINTS);
  const [deductions, setDeductions] = useState<UPDeduction[]>(INIT_DEDUCTIONS);
  const [rejectRules, setRejectRules] = useState<UPRejectRule[]>(INIT_REJECT_RULES);

  useEffect(() => {
    if (!isAuthenticated()) { router.replace("/login"); return; }
    setReady(true);
  }, [router]);

  if (!ready) return null;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-6 overflow-y-auto">
        {/* Page header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
            <span>ระบบ</span><span>/</span><span>ราคารับซื้อ</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">จัดการราคารับซื้อ</h1>
              <p className="text-sm text-gray-500 mt-0.5">B6 Used Pricing Reference Data — ประเภท · มิติ · รุ่น · ส่วนหัก · เกณฑ์ไม่รับ</p>
            </div>
            <div className="flex items-center gap-2 text-xs bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-lg">
              <span>🔶</span> Mockup — ข้อมูลเฟส 4 จะ wire API จริง
            </div>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex gap-1 mb-6 bg-white rounded-xl border border-gray-200 p-1 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === t.key
                  ? "bg-admin-surface text-admin-primary shadow-sm"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}>
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          {activeTab === "categories" && <Tab1Categories cats={cats} setCats={setCats} />}
          {activeTab === "dimensions" && <Tab2Dimensions cats={cats} dims={dims} setDims={setDims} dimVals={dimVals} setDimVals={setDimVals} />}
          {activeTab === "models"     && <Tab3Models cats={cats} dims={dims} dimVals={dimVals} models={models} setModels={setModels} pricePoints={pricePoints} setPricePoints={setPricePoints} />}
          {activeTab === "deductions" && <Tab4Deductions cats={cats} dims={dims} dimVals={dimVals} deductions={deductions} setDeductions={setDeductions} models={models} />}
          {activeTab === "rejects"    && <Tab5RejectRules cats={cats} dims={dims} dimVals={dimVals} rules={rejectRules} setRules={setRejectRules} />}
        </div>
      </main>
    </div>
  );
}
