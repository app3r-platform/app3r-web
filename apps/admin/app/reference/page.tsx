"use client";

import { useState } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { Sidebar } from "@/components/sidebar";

// ═══════════════════════════════════════════════════════════════
// CMD-C2 — D-5 Admin Reference Data Mockup
// D92: Master 3-layer | D89: asset_images | D90: Soft Delete
// Generic-First: รองรับสร้างประเภทจากศูนย์ + dynamic form
// ═══════════════════════════════════════════════════════════════

// ─── Mock Types ───────────────────────────────────────────────

interface ApplianceCategory {
  id: number; name_th: string; name_en: string; is_active: boolean;
  brand_count: number;
}
interface ApplianceBrand {
  id: number; category_id: number; name: string; is_active: boolean;
  model_count: number;
}
interface ApplianceModel {
  id: number; brand_id: number; name: string;
  spec_attributes: Record<string, string>; is_active: boolean;
}
interface RepairSymptom {
  id: number; category_id: number; name: string; frequency: number;
  is_active: boolean;
}
interface RepairPart {
  id: number; category_id: number; part_number: string; name: string;
  image_url: string | null; is_active: boolean;
}
interface ChecklistItem {
  id: number; category_id: number; step: number; description: string;
  criteria: string; is_active: boolean;
}
interface PricingDimension {
  id: number; category_id: number; key: string; label: string;
  dim_type: "select" | "number" | "text"; options: string[]; sort_order: number;
}
interface PricePoint {
  id: number; category_id: number; model_name: string;
  dimensions: Record<string, string>; base_price: number; is_active: boolean;
}
interface AssetImage {
  id: number; category: "parts" | "symptoms" | "checklist" | "pricing-samples" | "ui";
  appliance_category: string | null; local_path: string; alt_text: string;
  linked_entity_type: string | null; linked_entity_id: number | null;
  sort_order: number; is_active: boolean;
}

// ─── Mock Seed Data ───────────────────────────────────────────

const INIT_CATS: ApplianceCategory[] = [
  { id: 1, name_th: "แอร์", name_en: "Air Conditioner", is_active: true, brand_count: 3 },
  { id: 2, name_th: "ตู้เย็น", name_en: "Refrigerator", is_active: true, brand_count: 2 },
  { id: 3, name_th: "เครื่องซักผ้า", name_en: "Washing Machine", is_active: true, brand_count: 2 },
  { id: 4, name_th: "คอมพิวเตอร์/แล็ปท็อป", name_en: "Computer/Laptop", is_active: true, brand_count: 4 },
  { id: 5, name_th: "ทีวี", name_en: "Television", is_active: true, brand_count: 3 },
  { id: 6, name_th: "มือถือ/แท็บเล็ต", name_en: "Mobile/Tablet", is_active: true, brand_count: 3 },
  { id: 7, name_th: "โน้ตบุ๊ก", name_en: "Notebook", is_active: true, brand_count: 4 },
];

const INIT_BRANDS: ApplianceBrand[] = [
  { id: 1, category_id: 1, name: "Daikin", is_active: true, model_count: 5 },
  { id: 2, category_id: 1, name: "Mitsubishi Electric", is_active: true, model_count: 4 },
  { id: 3, category_id: 1, name: "Carrier", is_active: true, model_count: 3 },
  { id: 4, category_id: 6, name: "Apple", is_active: true, model_count: 12 },
  { id: 5, category_id: 6, name: "Samsung", is_active: true, model_count: 8 },
  { id: 6, category_id: 7, name: "Dell", is_active: true, model_count: 6 },
  { id: 7, category_id: 7, name: "HP", is_active: true, model_count: 7 },
  { id: 8, category_id: 7, name: "Lenovo", is_active: true, model_count: 5 },
  { id: 9, category_id: 4, name: "ASUS", is_active: true, model_count: 4 },
];

const INIT_MODELS: ApplianceModel[] = [
  { id: 1, brand_id: 4, name: "iPhone 13 128GB", spec_attributes: { storage: "128GB", color: "Black" }, is_active: true },
  { id: 2, brand_id: 4, name: "iPhone 14 256GB", spec_attributes: { storage: "256GB", color: "Blue" }, is_active: true },
  { id: 3, brand_id: 1, name: "FTKQ09UV2S", spec_attributes: { btu: "9000", inverter: "Yes" }, is_active: true },
  { id: 4, brand_id: 6, name: "Inspiron 15 3520", spec_attributes: { cpu: "i5-12th", ram: "8GB", storage: "512GB SSD" }, is_active: true },
];

const INIT_SYMPTOMS: RepairSymptom[] = [
  { id: 1, category_id: 1, name: "คอมเพรสเซอร์ไม่ทำงาน", frequency: 85, is_active: true },
  { id: 2, category_id: 1, name: "น้ำหยดในบ้าน", frequency: 70, is_active: true },
  { id: 3, category_id: 1, name: "แอร์ไม่เย็น", frequency: 90, is_active: true },
  { id: 4, category_id: 2, name: "ตู้เย็นไม่เย็น", frequency: 80, is_active: true },
  { id: 5, category_id: 3, name: "เครื่องซักผ้าไม่ปั่น", frequency: 65, is_active: true },
];

const INIT_PARTS: RepairPart[] = [
  { id: 1, category_id: 1, part_number: "01", name: "แผงวงจรอิเล็กทรอนิกส์", image_url: null, is_active: true },
  { id: 2, category_id: 1, part_number: "02", name: "คอยล์เย็น (Evaporator Coil)", image_url: "/assets/parts/ac-02-evaporator-coil.jpeg", is_active: true },
  { id: 3, category_id: 1, part_number: "11", name: "คาปาซิเตอร์ (Capacitor)", image_url: null, is_active: true },
  { id: 4, category_id: 1, part_number: "12", name: "คอมเพรสเซอร์", image_url: null, is_active: true },
  { id: 5, category_id: 2, part_number: "F01", name: "คอมเพรสเซอร์ตู้เย็น", image_url: null, is_active: true },
];

const INIT_CHECKLIST: ChecklistItem[] = [
  { id: 1, category_id: 1, step: 1, description: "ตรวจสอบแรงดันไฟฟ้า", criteria: "220-240V ±10%", is_active: true },
  { id: 2, category_id: 1, step: 2, description: "วัดอุณหภูมิลมเย็น", criteria: "< 15°C ที่ระดับ 16°C Set", is_active: true },
  { id: 3, category_id: 1, step: 3, description: "ตรวจสอบน้ำยาแอร์", criteria: "ความดัน 70-80 PSI (R32)", is_active: true },
  { id: 4, category_id: 2, step: 1, description: "ตรวจสอบอุณหภูมิช่องแช่", criteria: "0-5°C ช่องธรรมดา / -18°C ช่องแข็ง", is_active: true },
];

// D92: Pricing dimensions per-category (Generic-First)
const INIT_DIMS: PricingDimension[] = [
  { id: 1, category_id: 6, key: "boot_state", label: "เปิดติด/ไม่ติด", dim_type: "select", options: ["เปิดติด", "เปิดไม่ติด"], sort_order: 1 },
  { id: 2, category_id: 6, key: "accessory", label: "อุปกรณ์", dim_type: "select", options: ["ครบ", "ไม่ครบ", "ไม่มี"], sort_order: 2 },
  { id: 3, category_id: 6, key: "scratch_level", label: "สภาพรอย", dim_type: "select", options: ["ไม่มีรอย", "รอยน้อย", "รอยเห็นชัด"], sort_order: 3 },
  { id: 4, category_id: 7, key: "cpu_gen", label: "CPU Generation", dim_type: "select", options: ["Gen 8-9", "Gen 10-11", "Gen 12+"], sort_order: 1 },
  { id: 5, category_id: 7, key: "ram", label: "RAM", dim_type: "select", options: ["4GB", "8GB", "16GB", "32GB+"], sort_order: 2 },
  { id: 6, category_id: 7, key: "storage", label: "Storage", dim_type: "select", options: ["HDD", "SSD 256", "SSD 512", "SSD 1TB+"], sort_order: 3 },
  { id: 7, category_id: 1, key: "btu", label: "BTU", dim_type: "select", options: ["9000", "12000", "18000", "24000"], sort_order: 1 },
  { id: 8, category_id: 1, key: "inverter", label: "ระบบ Inverter", dim_type: "select", options: ["Inverter", "Non-inverter"], sort_order: 2 },
  { id: 9, category_id: 1, key: "age_years", label: "อายุใช้งาน (ปี)", dim_type: "number", options: [], sort_order: 3 },
];

const INIT_PRICE_POINTS: PricePoint[] = [
  { id: 1, category_id: 6, model_name: "iPhone 13 128GB", dimensions: { boot_state: "เปิดติด", accessory: "ครบ", scratch_level: "ไม่มีรอย" }, base_price: 18000, is_active: true },
  { id: 2, category_id: 6, model_name: "iPhone 13 128GB", dimensions: { boot_state: "เปิดติด", accessory: "ครบ", scratch_level: "รอยน้อย" }, base_price: 15500, is_active: true },
  { id: 3, category_id: 7, model_name: "Dell Inspiron i5-12th", dimensions: { cpu_gen: "Gen 12+", ram: "8GB", storage: "SSD 512" }, base_price: 8500, is_active: true },
];

const INIT_IMAGES: AssetImage[] = [
  { id: 1, category: "parts", appliance_category: "ac", local_path: "/assets/parts/ac-02-evaporator-coil.jpeg", alt_text: "Evaporator Coil แอร์", linked_entity_type: "repair_parts", linked_entity_id: 2, sort_order: 1, is_active: true },
  { id: 2, category: "parts", appliance_category: "ac", local_path: "/assets/parts/ac-11-capacitor.jpeg", alt_text: "Capacitor แอร์", linked_entity_type: "repair_parts", linked_entity_id: 3, sort_order: 2, is_active: true },
  { id: 3, category: "symptoms", appliance_category: "fridge", local_path: "/assets/symptoms/fridge-not-cold.jpeg", alt_text: "ตู้เย็นไม่เย็น", linked_entity_type: "repair_symptoms", linked_entity_id: 4, sort_order: 1, is_active: true },
  { id: 4, category: "checklist", appliance_category: "ac", local_path: "/assets/checklist/ac-pressure-check.jpeg", alt_text: "การวัดความดันน้ำยาแอร์", linked_entity_type: "checklist_items", linked_entity_id: 3, sort_order: 1, is_active: true },
  { id: 5, category: "pricing-samples", appliance_category: "mobile", local_path: "/assets/pricing-samples/iphone13-good.jpeg", alt_text: "iPhone 13 สภาพดี", linked_entity_type: null, linked_entity_id: null, sort_order: 1, is_active: true },
  { id: 6, category: "ui", appliance_category: null, local_path: "/assets/ui/default-appliance.png", alt_text: "ไอคอนเครื่องใช้ไฟฟ้า", linked_entity_type: null, linked_entity_id: null, sort_order: 1, is_active: true },
];

// ─── Helpers ──────────────────────────────────────────────────

function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-400"}`}>
      {active ? "ใช้งาน" : "ปิดใช้"}
    </span>
  );
}

function SoftDeleteBtn({ active, onToggle, hasChildren }: { active: boolean; onToggle: () => void; hasChildren: boolean }) {
  return (
    <button
      onClick={() => {
        if (hasChildren && active) {
          alert("⚠️ ไม่สามารถปิดใช้งานได้ — มีรายการย่อยที่ active อยู่ กรุณาปิดรายการย่อยก่อน (D90)");
          return;
        }
        onToggle();
      }}
      className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
        active
          ? "bg-white text-red-600 border-red-200 hover:bg-red-50"
          : "bg-white text-green-600 border-green-200 hover:bg-green-50"
      }`}
    >
      {active ? "ปิดใช้" : "เปิดใช้"}
    </button>
  );
}

// ─── Tab 1: ประเภท/ยี่ห้อ/รุ่น ────────────────────────────────

function Tab1Master() {
  const [cats, setCats] = useState<ApplianceCategory[]>(INIT_CATS);
  const [brands, setBrands] = useState<ApplianceBrand[]>(INIT_BRANDS);
  const [models, setModels] = useState<ApplianceModel[]>(INIT_MODELS);

  const [selCat, setSelCat] = useState<ApplianceCategory | null>(null);
  const [selBrand, setSelBrand] = useState<ApplianceBrand | null>(null);

  // Add modals
  const [showAddCat, setShowAddCat] = useState(false);
  const [showAddBrand, setShowAddBrand] = useState(false);
  const [showAddModel, setShowAddModel] = useState(false);

  const [formCat, setFormCat] = useState({ name_th: "", name_en: "" });
  const [formBrand, setFormBrand] = useState({ name: "" });
  const [formModel, setFormModel] = useState({ name: "", spec_key: "", spec_val: "" });

  const filteredBrands = brands.filter(b => b.category_id === selCat?.id);
  const filteredModels = models.filter(m => m.brand_id === selBrand?.id);

  let nextId = 100;

  function addCategory() {
    if (!formCat.name_th.trim()) return;
    const newCat: ApplianceCategory = { id: nextId++, name_th: formCat.name_th, name_en: formCat.name_en, is_active: true, brand_count: 0 };
    setCats(prev => [...prev, newCat]);
    setFormCat({ name_th: "", name_en: "" });
    setShowAddCat(false);
  }

  function addBrand() {
    if (!selCat || !formBrand.name.trim()) return;
    const newBrand: ApplianceBrand = { id: nextId++, category_id: selCat.id, name: formBrand.name, is_active: true, model_count: 0 };
    setBrands(prev => [...prev, newBrand]);
    setCats(prev => prev.map(c => c.id === selCat.id ? { ...c, brand_count: c.brand_count + 1 } : c));
    setFormBrand({ name: "" });
    setShowAddBrand(false);
  }

  function addModel() {
    if (!selBrand || !formModel.name.trim()) return;
    const spec: Record<string, string> = {};
    if (formModel.spec_key.trim() && formModel.spec_val.trim()) {
      spec[formModel.spec_key.trim()] = formModel.spec_val.trim();
    }
    const newModel: ApplianceModel = { id: nextId++, brand_id: selBrand.id, name: formModel.name, spec_attributes: spec, is_active: true };
    setModels(prev => [...prev, newModel]);
    setBrands(prev => prev.map(b => b.id === selBrand.id ? { ...b, model_count: b.model_count + 1 } : b));
    setFormModel({ name: "", spec_key: "", spec_val: "" });
    setShowAddModel(false);
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Column 1: Categories */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">ประเภทเครื่อง ({cats.length})</h3>
          <button onClick={() => setShowAddCat(true)} className="text-xs px-2.5 py-1 bg-admin-surface text-admin-primary rounded-lg hover:bg-blue-100 transition-colors">+ เพิ่ม</button>
        </div>
        <div className="divide-y divide-gray-100 max-h-[520px] overflow-y-auto">
          {cats.map(cat => (
            <div key={cat.id}
              onClick={() => { setSelCat(cat); setSelBrand(null); }}
              className={`px-4 py-3 cursor-pointer flex items-center justify-between hover:bg-gray-50 ${selCat?.id === cat.id ? "bg-admin-surface" : ""}`}>
              <div>
                <p className={`text-sm font-medium ${cat.is_active ? "text-gray-800" : "text-gray-400"}`}>{cat.name_th}</p>
                <p className="text-xs text-gray-500">{cat.name_en} · {cat.brand_count} ยี่ห้อ</p>
              </div>
              <div className="flex items-center gap-1.5">
                <ActiveBadge active={cat.is_active} />
                <SoftDeleteBtn active={cat.is_active}
                  hasChildren={cat.brand_count > 0 && brands.some(b => b.category_id === cat.id && b.is_active)}
                  onToggle={() => setCats(prev => prev.map(c => c.id === cat.id ? { ...c, is_active: !c.is_active } : c))} />
              </div>
            </div>
          ))}
        </div>
        {/* Add Category Modal */}
        {showAddCat && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 w-80 shadow-xl">
              <h4 className="font-semibold text-gray-800 mb-4">เพิ่มประเภทเครื่อง</h4>
              <label className="block text-xs text-gray-500 mb-1">ชื่อภาษาไทย *</label>
              <input value={formCat.name_th} onChange={e => setFormCat(f => ({ ...f, name_th: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:border-admin-primary" placeholder="เช่น ไมโครเวฟ" />
              <label className="block text-xs text-gray-500 mb-1">ชื่อภาษาอังกฤษ</label>
              <input value={formCat.name_en} onChange={e => setFormCat(f => ({ ...f, name_en: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:border-admin-primary" placeholder="Microwave Oven" />
              <div className="flex gap-2">
                <button onClick={() => setShowAddCat(false)} className="flex-1 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">ยกเลิก</button>
                <button onClick={addCategory} className="flex-1 py-2 text-sm bg-admin-primary text-white rounded-lg hover:bg-admin-dark">เพิ่ม</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Column 2: Brands */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">
            ยี่ห้อ {selCat ? `— ${selCat.name_th}` : "(เลือกประเภทก่อน)"}
          </h3>
          {selCat && <button onClick={() => setShowAddBrand(true)} className="text-xs px-2.5 py-1 bg-admin-surface text-admin-primary rounded-lg hover:bg-blue-100 transition-colors">+ เพิ่ม</button>}
        </div>
        <div className="divide-y divide-gray-100 max-h-[520px] overflow-y-auto">
          {!selCat ? (
            <p className="px-4 py-8 text-center text-sm text-gray-400">← เลือกประเภทเครื่องก่อน</p>
          ) : filteredBrands.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-gray-400">ยังไม่มียี่ห้อ</p>
          ) : filteredBrands.map(brand => (
            <div key={brand.id}
              onClick={() => setSelBrand(brand)}
              className={`px-4 py-3 cursor-pointer flex items-center justify-between hover:bg-gray-50 ${selBrand?.id === brand.id ? "bg-admin-surface" : ""}`}>
              <div>
                <p className={`text-sm font-medium ${brand.is_active ? "text-gray-800" : "text-gray-400"}`}>{brand.name}</p>
                <p className="text-xs text-gray-500">{brand.model_count} รุ่น</p>
              </div>
              <div className="flex gap-1.5">
                <ActiveBadge active={brand.is_active} />
                <SoftDeleteBtn active={brand.is_active}
                  hasChildren={brand.model_count > 0 && models.some(m => m.brand_id === brand.id && m.is_active)}
                  onToggle={() => setBrands(prev => prev.map(b => b.id === brand.id ? { ...b, is_active: !b.is_active } : b))} />
              </div>
            </div>
          ))}
        </div>
        {showAddBrand && selCat && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 w-72 shadow-xl">
              <h4 className="font-semibold text-gray-800 mb-1">เพิ่มยี่ห้อ</h4>
              <p className="text-xs text-gray-500 mb-4">ภายใต้: {selCat.name_th}</p>
              <label className="block text-xs text-gray-500 mb-1">ชื่อยี่ห้อ *</label>
              <input value={formBrand.name} onChange={e => setFormBrand({ name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:border-admin-primary" placeholder="เช่น Panasonic" />
              <div className="flex gap-2">
                <button onClick={() => setShowAddBrand(false)} className="flex-1 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">ยกเลิก</button>
                <button onClick={addBrand} className="flex-1 py-2 text-sm bg-admin-primary text-white rounded-lg hover:bg-admin-dark">เพิ่ม</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Column 3: Models */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">
            รุ่น {selBrand ? `— ${selBrand.name}` : "(เลือกยี่ห้อก่อน)"}
          </h3>
          {selBrand && <button onClick={() => setShowAddModel(true)} className="text-xs px-2.5 py-1 bg-admin-surface text-admin-primary rounded-lg hover:bg-blue-100 transition-colors">+ เพิ่ม</button>}
        </div>
        <div className="divide-y divide-gray-100 max-h-[520px] overflow-y-auto">
          {!selBrand ? (
            <p className="px-4 py-8 text-center text-sm text-gray-400">← เลือกยี่ห้อก่อน</p>
          ) : filteredModels.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-gray-400">ยังไม่มีรุ่น</p>
          ) : filteredModels.map(model => (
            <div key={model.id} className="px-4 py-3 flex items-start justify-between hover:bg-gray-50">
              <div>
                <p className={`text-sm font-medium ${model.is_active ? "text-gray-800" : "text-gray-400"}`}>{model.name}</p>
                {Object.keys(model.spec_attributes).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {Object.entries(model.spec_attributes).map(([k, v]) => (
                      <span key={k} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                        {k}: {v}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-1.5 shrink-0 ml-2">
                <ActiveBadge active={model.is_active} />
                <SoftDeleteBtn active={model.is_active} hasChildren={false}
                  onToggle={() => setModels(prev => prev.map(m => m.id === model.id ? { ...m, is_active: !m.is_active } : m))} />
              </div>
            </div>
          ))}
        </div>
        {showAddModel && selBrand && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 w-80 shadow-xl">
              <h4 className="font-semibold text-gray-800 mb-1">เพิ่มรุ่น</h4>
              <p className="text-xs text-gray-500 mb-4">ยี่ห้อ: {selBrand.name}</p>
              <label className="block text-xs text-gray-500 mb-1">ชื่อรุ่น *</label>
              <input value={formModel.name} onChange={e => setFormModel(f => ({ ...f, name: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:border-admin-primary" placeholder="เช่น Galaxy S24 256GB" />
              <p className="text-xs text-gray-500 mb-2">Spec (เพิ่มได้หลายรายการ — Optional)</p>
              <div className="flex gap-2 mb-4">
                <input value={formModel.spec_key} onChange={e => setFormModel(f => ({ ...f, spec_key: e.target.value }))}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-admin-primary" placeholder="key เช่น storage" />
                <input value={formModel.spec_val} onChange={e => setFormModel(f => ({ ...f, spec_val: e.target.value }))}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-admin-primary" placeholder="value เช่น 256GB" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowAddModel(false)} className="flex-1 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">ยกเลิก</button>
                <button onClick={addModel} className="flex-1 py-2 text-sm bg-admin-primary text-white rounded-lg hover:bg-admin-dark">เพิ่ม</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tab 2: อาการ/อะไหล่/checklist ──────────────────────────────

function Tab2Symptoms() {
  const [cats] = useState<ApplianceCategory[]>(INIT_CATS);
  const [selCatId, setSelCatId] = useState<number>(1);

  const [symptoms, setSymptoms] = useState<RepairSymptom[]>(INIT_SYMPTOMS);
  const [parts, setParts] = useState<RepairPart[]>(INIT_PARTS);
  const [checklist, setChecklist] = useState<ChecklistItem[]>(INIT_CHECKLIST);

  const [subTab, setSubTab] = useState<"symptoms" | "parts" | "checklist">("symptoms");

  // Add form state
  const [showAdd, setShowAdd] = useState(false);
  const [formSymptom, setFormSymptom] = useState({ name: "", frequency: "50" });
  const [formPart, setFormPart] = useState({ part_number: "", name: "" });
  const [formCheck, setFormCheck] = useState({ step: "", description: "", criteria: "" });

  let nextId = 200;

  const catSymptoms = symptoms.filter(s => s.category_id === selCatId);
  const catParts = parts.filter(p => p.category_id === selCatId);
  const catChecklist = checklist.filter(c => c.category_id === selCatId);

  function addItem() {
    if (subTab === "symptoms") {
      if (!formSymptom.name.trim()) return;
      setSymptoms(prev => [...prev, { id: nextId++, category_id: selCatId, name: formSymptom.name, frequency: parseInt(formSymptom.frequency) || 50, is_active: true }]);
      setFormSymptom({ name: "", frequency: "50" });
    } else if (subTab === "parts") {
      if (!formPart.name.trim()) return;
      setParts(prev => [...prev, { id: nextId++, category_id: selCatId, part_number: formPart.part_number, name: formPart.name, image_url: null, is_active: true }]);
      setFormPart({ part_number: "", name: "" });
    } else {
      if (!formCheck.description.trim()) return;
      setChecklist(prev => [...prev, { id: nextId++, category_id: selCatId, step: parseInt(formCheck.step) || catChecklist.length + 1, description: formCheck.description, criteria: formCheck.criteria, is_active: true }]);
      setFormCheck({ step: "", description: "", criteria: "" });
    }
    setShowAdd(false);
  }

  return (
    <div className="space-y-4">
      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        {cats.map(c => (
          <button key={c.id} onClick={() => setSelCatId(c.id)}
            className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
              selCatId === c.id ? "bg-admin-surface text-admin-primary border-admin-primary/30" : "bg-white text-gray-500 border-gray-300 hover:text-gray-700"
            }`}>{c.name_th}</button>
        ))}
      </div>

      {/* Sub-tab */}
      <div className="flex gap-1 bg-white rounded-xl p-1 border border-gray-200 w-fit">
        {(["symptoms", "parts", "checklist"] as const).map(t => (
          <button key={t} onClick={() => setSubTab(t)}
            className={`px-4 py-1.5 rounded-lg text-xs transition-colors ${subTab === t ? "bg-admin-surface text-admin-primary" : "text-gray-500 hover:text-gray-900"}`}>
            {t === "symptoms" ? "🤒 อาการ" : t === "parts" ? "🔩 อะไหล่" : "☑️ Checklist"}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {subTab === "symptoms" ? `อาการ ${catSymptoms.length} รายการ`
              : subTab === "parts" ? `อะไหล่ ${catParts.length} รายการ`
              : `Checklist ${catChecklist.length} ข้อ`}
          </span>
          <button onClick={() => setShowAdd(true)} className="text-xs px-3 py-1.5 bg-admin-surface text-admin-primary rounded-lg hover:bg-blue-100 transition-colors">
            + เพิ่ม{subTab === "symptoms" ? "อาการ" : subTab === "parts" ? "อะไหล่" : " Checklist"}
          </button>
        </div>

        {subTab === "symptoms" && (
          <table className="w-full text-sm">
            <thead><tr className="text-xs text-gray-500 border-b border-gray-100 text-left">
              <th className="px-5 py-2">ชื่ออาการ</th><th className="px-5 py-2">ความถี่ %</th><th className="px-5 py-2">สถานะ</th><th className="px-5 py-2"></th>
            </tr></thead>
            <tbody className="divide-y divide-gray-100">
              {catSymptoms.length === 0 ? <tr><td colSpan={4} className="px-5 py-8 text-center text-gray-400 text-sm">ยังไม่มีอาการ</td></tr>
                : catSymptoms.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className={`px-5 py-3 ${!s.is_active ? "text-gray-400" : "text-gray-800"}`}>{s.name}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-admin-primary rounded-full" style={{ width: `${s.frequency}%` }} />
                        </div>
                        <span className="text-xs text-gray-500">{s.frequency}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3"><ActiveBadge active={s.is_active} /></td>
                    <td className="px-5 py-3">
                      <SoftDeleteBtn active={s.is_active} hasChildren={false}
                        onToggle={() => setSymptoms(prev => prev.map(x => x.id === s.id ? { ...x, is_active: !x.is_active } : x))} />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}

        {subTab === "parts" && (
          <table className="w-full text-sm">
            <thead><tr className="text-xs text-gray-500 border-b border-gray-100 text-left">
              <th className="px-5 py-2">รหัส</th><th className="px-5 py-2">ชื่ออะไหล่</th><th className="px-5 py-2">รูป</th><th className="px-5 py-2">สถานะ</th><th className="px-5 py-2"></th>
            </tr></thead>
            <tbody className="divide-y divide-gray-100">
              {catParts.length === 0 ? <tr><td colSpan={5} className="px-5 py-8 text-center text-gray-400 text-sm">ยังไม่มีอะไหล่</td></tr>
                : catParts.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-mono text-xs text-gray-500">{p.part_number || "—"}</td>
                    <td className={`px-5 py-3 ${!p.is_active ? "text-gray-400" : "text-gray-800"}`}>{p.name}</td>
                    <td className="px-5 py-3">
                      {p.image_url
                        ? <span className="text-xs text-green-600">✓ มีรูป</span>
                        : <span className="text-xs text-gray-400">ไม่มีรูป</span>}
                    </td>
                    <td className="px-5 py-3"><ActiveBadge active={p.is_active} /></td>
                    <td className="px-5 py-3">
                      <SoftDeleteBtn active={p.is_active} hasChildren={false}
                        onToggle={() => setParts(prev => prev.map(x => x.id === p.id ? { ...x, is_active: !x.is_active } : x))} />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}

        {subTab === "checklist" && (
          <table className="w-full text-sm">
            <thead><tr className="text-xs text-gray-500 border-b border-gray-100 text-left">
              <th className="px-5 py-2 w-12">ขั้น</th><th className="px-5 py-2">รายละเอียด</th><th className="px-5 py-2">เกณฑ์</th><th className="px-5 py-2">สถานะ</th><th className="px-5 py-2"></th>
            </tr></thead>
            <tbody className="divide-y divide-gray-100">
              {catChecklist.length === 0 ? <tr><td colSpan={5} className="px-5 py-8 text-center text-gray-400 text-sm">ยังไม่มี Checklist</td></tr>
                : catChecklist.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-center text-gray-500 font-mono text-xs">{c.step}</td>
                    <td className={`px-5 py-3 ${!c.is_active ? "text-gray-400" : "text-gray-800"}`}>{c.description}</td>
                    <td className="px-5 py-3 text-xs text-gray-600">{c.criteria}</td>
                    <td className="px-5 py-3"><ActiveBadge active={c.is_active} /></td>
                    <td className="px-5 py-3">
                      <SoftDeleteBtn active={c.is_active} hasChildren={false}
                        onToggle={() => setChecklist(prev => prev.map(x => x.id === c.id ? { ...x, is_active: !x.is_active } : x))} />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Modal — Dynamic form per subTab */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 w-96 shadow-xl">
            <h4 className="font-semibold text-gray-800 mb-4">
              {subTab === "symptoms" ? "เพิ่มอาการ" : subTab === "parts" ? "เพิ่มอะไหล่" : "เพิ่ม Checklist"}
            </h4>
            {subTab === "symptoms" && (<>
              <label className="block text-xs text-gray-500 mb-1">ชื่ออาการ *</label>
              <input value={formSymptom.name} onChange={e => setFormSymptom(f => ({ ...f, name: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:border-admin-primary" placeholder="เช่น ไม่เย็น" />
              <label className="block text-xs text-gray-500 mb-1">ความถี่ (%) — ใช้จัดลำดับ Dropdown</label>
              <input type="number" min="1" max="100" value={formSymptom.frequency} onChange={e => setFormSymptom(f => ({ ...f, frequency: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:border-admin-primary" />
            </>)}
            {subTab === "parts" && (<>
              <label className="block text-xs text-gray-500 mb-1">หมายเลขชิ้นส่วน</label>
              <input value={formPart.part_number} onChange={e => setFormPart(f => ({ ...f, part_number: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:border-admin-primary" placeholder="เช่น 01, 9.1" />
              <label className="block text-xs text-gray-500 mb-1">ชื่ออะไหล่ *</label>
              <input value={formPart.name} onChange={e => setFormPart(f => ({ ...f, name: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:border-admin-primary" placeholder="เช่น Compressor Relay" />
            </>)}
            {subTab === "checklist" && (<>
              <label className="block text-xs text-gray-500 mb-1">ขั้นที่</label>
              <input type="number" value={formCheck.step} onChange={e => setFormCheck(f => ({ ...f, step: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:border-admin-primary" placeholder={`${catChecklist.length + 1}`} />
              <label className="block text-xs text-gray-500 mb-1">รายละเอียด *</label>
              <input value={formCheck.description} onChange={e => setFormCheck(f => ({ ...f, description: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:border-admin-primary" placeholder="เช่น วัดกระแสไฟ" />
              <label className="block text-xs text-gray-500 mb-1">เกณฑ์ผ่าน</label>
              <input value={formCheck.criteria} onChange={e => setFormCheck(f => ({ ...f, criteria: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:border-admin-primary" placeholder="เช่น 220-240V ±5%" />
            </>)}
            <div className="flex gap-2">
              <button onClick={() => setShowAdd(false)} className="flex-1 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">ยกเลิก</button>
              <button onClick={addItem} className="flex-1 py-2 text-sm bg-admin-primary text-white rounded-lg hover:bg-admin-dark">เพิ่ม</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab 3: ราคา (Dynamic Dimensions per-category) ────────────

function Tab3Pricing() {
  const [cats] = useState<ApplianceCategory[]>(INIT_CATS);
  const [selCatId, setSelCatId] = useState<number>(6);
  const [dims, setDims] = useState<PricingDimension[]>(INIT_DIMS);
  const [points, setPoints] = useState<PricePoint[]>(INIT_PRICE_POINTS);

  const [dimTab, setDimTab] = useState<"dims" | "points">("dims");
  const [showAddDim, setShowAddDim] = useState(false);
  const [showAddPoint, setShowAddPoint] = useState(false);

  const [formDim, setFormDim] = useState({ key: "", label: "", dim_type: "select" as "select" | "number" | "text", options: "" });
  const [formPoint, setFormPoint] = useState<Record<string, string>>({ model_name: "", base_price: "" });

  let nextId = 300;

  const catDims = dims.filter(d => d.category_id === selCatId).sort((a, b) => a.sort_order - b.sort_order);
  const catPoints = points.filter(p => p.category_id === selCatId);

  function addDimension() {
    if (!formDim.key.trim() || !formDim.label.trim()) return;
    const newDim: PricingDimension = {
      id: nextId++, category_id: selCatId, key: formDim.key.trim(), label: formDim.label.trim(),
      dim_type: formDim.dim_type,
      options: formDim.dim_type === "select" ? formDim.options.split(",").map(s => s.trim()).filter(Boolean) : [],
      sort_order: catDims.length + 1,
    };
    setDims(prev => [...prev, newDim]);
    setFormDim({ key: "", label: "", dim_type: "select", options: "" });
    setShowAddDim(false);
  }

  function addPricePoint() {
    if (!formPoint.model_name?.trim() || !formPoint.base_price?.trim()) return;
    const dimValues: Record<string, string> = {};
    catDims.forEach(d => { if (formPoint[d.key]) dimValues[d.key] = formPoint[d.key]; });
    const newPoint: PricePoint = {
      id: nextId++, category_id: selCatId, model_name: formPoint.model_name,
      dimensions: dimValues, base_price: parseInt(formPoint.base_price) || 0, is_active: true,
    };
    setPoints(prev => [...prev, newPoint]);
    setFormPoint({ model_name: "", base_price: "" });
    setShowAddPoint(false);
  }

  const selCatName = cats.find(c => c.id === selCatId)?.name_th ?? "";

  return (
    <div className="space-y-4">
      {/* Category selector */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
        <p className="text-xs text-blue-700 mb-2 font-medium">⚙️ มิติราคา dynamic per-category — แต่ละประเภทกำหนดมิติเอง (D-5 Generic-First)</p>
        <div className="flex gap-2 flex-wrap">
          {cats.map(c => (
            <button key={c.id} onClick={() => setSelCatId(c.id)}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                selCatId === c.id ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-500 border-gray-300 hover:text-gray-700"
              }`}>{c.name_th}</button>
          ))}
        </div>
      </div>

      {/* Dim / Price sub-tabs */}
      <div className="flex gap-1 bg-white rounded-xl p-1 border border-gray-200 w-fit">
        <button onClick={() => setDimTab("dims")} className={`px-4 py-1.5 rounded-lg text-xs transition-colors ${dimTab === "dims" ? "bg-admin-surface text-admin-primary" : "text-gray-500 hover:text-gray-900"}`}>
          📐 มิติราคา ({catDims.length})
        </button>
        <button onClick={() => setDimTab("points")} className={`px-4 py-1.5 rounded-lg text-xs transition-colors ${dimTab === "points" ? "bg-admin-surface text-admin-primary" : "text-gray-500 hover:text-gray-900"}`}>
          💰 ราคา ({catPoints.length})
        </button>
      </div>

      {dimTab === "dims" && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
            <span className="text-sm text-gray-500">มิติราคา — {selCatName}</span>
            <button onClick={() => setShowAddDim(true)} className="text-xs px-3 py-1.5 bg-admin-surface text-admin-primary rounded-lg hover:bg-blue-100">+ เพิ่มมิติ</button>
          </div>
          {catDims.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-gray-400">ยังไม่มีมิติราคาสำหรับ {selCatName} — กด &quot;เพิ่มมิติ&quot; เพื่อสร้างจากศูนย์</p>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="text-xs text-gray-500 border-b border-gray-100 text-left">
                <th className="px-5 py-2">ลำดับ</th><th className="px-5 py-2">Key</th><th className="px-5 py-2">Label</th><th className="px-5 py-2">ประเภท</th><th className="px-5 py-2">Options</th><th className="px-5 py-2"></th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {catDims.map(d => (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-gray-500 font-mono text-xs">{d.sort_order}</td>
                    <td className="px-5 py-3 font-mono text-xs text-admin-primary">{d.key}</td>
                    <td className="px-5 py-3 text-gray-800">{d.label}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${d.dim_type === "select" ? "bg-blue-50 text-blue-700" : d.dim_type === "number" ? "bg-orange-50 text-orange-700" : "bg-gray-100 text-gray-600"}`}>
                        {d.dim_type}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {d.options.length > 0
                        ? <span className="text-xs text-gray-500">{d.options.join(" / ")}</span>
                        : <span className="text-xs text-gray-400">free input</span>}
                    </td>
                    <td className="px-5 py-3">
                      <button onClick={() => setDims(prev => prev.filter(x => x.id !== d.id))}
                        className="text-xs px-2 py-1 bg-white text-red-600 border border-red-200 rounded-lg hover:bg-red-50">ลบ</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {dimTab === "points" && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
            <span className="text-sm text-gray-500">ราคา — {selCatName} ({catPoints.length} รายการ)</span>
            <button onClick={() => setShowAddPoint(true)} className="text-xs px-3 py-1.5 bg-admin-surface text-admin-primary rounded-lg hover:bg-blue-100">+ เพิ่มราคา</button>
          </div>
          {catPoints.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-gray-400">ยังไม่มีราคา — กด &quot;เพิ่มราคา&quot;</p>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="text-xs text-gray-500 border-b border-gray-100 text-left">
                <th className="px-5 py-2">รุ่น</th><th className="px-5 py-2">มิติ (Dimensions)</th><th className="px-5 py-2">ราคา</th><th className="px-5 py-2">สถานะ</th><th className="px-5 py-2"></th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {catPoints.map(pp => (
                  <tr key={pp.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-gray-800 text-sm">{pp.model_name}</td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(pp.dimensions).map(([k, v]) => (
                          <span key={k} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{k}: {v}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3 font-mono text-green-700 font-semibold">{pp.base_price.toLocaleString()} ฿</td>
                    <td className="px-5 py-3"><ActiveBadge active={pp.is_active} /></td>
                    <td className="px-5 py-3">
                      <SoftDeleteBtn active={pp.is_active} hasChildren={false}
                        onToggle={() => setPoints(prev => prev.map(x => x.id === pp.id ? { ...x, is_active: !x.is_active } : x))} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Add Dimension Modal */}
      {showAddDim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 w-96 shadow-xl">
            <h4 className="font-semibold text-gray-800 mb-1">เพิ่มมิติราคา</h4>
            <p className="text-xs text-gray-500 mb-4">ประเภท: {selCatName}</p>
            <label className="block text-xs text-gray-500 mb-1">Key (field name) *</label>
            <input value={formDim.key} onChange={e => setFormDim(f => ({ ...f, key: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:border-admin-primary" placeholder="เช่น screen_size, btu" />
            <label className="block text-xs text-gray-500 mb-1">Label (แสดงผู้ใช้) *</label>
            <input value={formDim.label} onChange={e => setFormDim(f => ({ ...f, label: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:border-admin-primary" placeholder="เช่น ขนาดหน้าจอ, BTU" />
            <label className="block text-xs text-gray-500 mb-1">ประเภทข้อมูล</label>
            <select value={formDim.dim_type} onChange={e => setFormDim(f => ({ ...f, dim_type: e.target.value as "select" | "number" | "text" }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:border-admin-primary">
              <option value="select">Select (เลือกจาก options)</option>
              <option value="number">Number (กรอกตัวเลข)</option>
              <option value="text">Text (กรอกข้อความ)</option>
            </select>
            {formDim.dim_type === "select" && (<>
              <label className="block text-xs text-gray-500 mb-1">Options (คั่นด้วย comma)</label>
              <input value={formDim.options} onChange={e => setFormDim(f => ({ ...f, options: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:border-admin-primary" placeholder="เช่น 9000,12000,18000,24000" />
            </>)}
            <div className="flex gap-2 mt-2">
              <button onClick={() => setShowAddDim(false)} className="flex-1 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">ยกเลิก</button>
              <button onClick={addDimension} className="flex-1 py-2 text-sm bg-admin-primary text-white rounded-lg hover:bg-admin-dark">เพิ่มมิติ</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Price Point Modal — Dynamic form based on catDims */}
      {showAddPoint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 w-96 shadow-xl max-h-[80vh] overflow-y-auto">
            <h4 className="font-semibold text-gray-800 mb-1">เพิ่มราคา</h4>
            <p className="text-xs text-gray-500 mb-4">ประเภท: {selCatName}</p>
            <label className="block text-xs text-gray-500 mb-1">ชื่อรุ่น *</label>
            <input value={formPoint.model_name ?? ""} onChange={e => setFormPoint(f => ({ ...f, model_name: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:border-admin-primary" placeholder="เช่น iPhone 15 256GB" />
            {/* Dynamic fields — per catDims */}
            {catDims.length === 0 && (
              <p className="text-xs text-orange-600 mb-3 bg-orange-50 rounded-lg px-3 py-2">⚠️ ยังไม่มีมิติราคาสำหรับประเภทนี้ — กลับไปเพิ่มมิติก่อน</p>
            )}
            {catDims.map(d => (
              <div key={d.key} className="mb-3">
                <label className="block text-xs text-gray-500 mb-1">{d.label}</label>
                {d.dim_type === "select" ? (
                  <select value={formPoint[d.key] ?? ""} onChange={e => setFormPoint(f => ({ ...f, [d.key]: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-admin-primary">
                    <option value="">— เลือก —</option>
                    {d.options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <input type={d.dim_type === "number" ? "number" : "text"}
                    value={formPoint[d.key] ?? ""}
                    onChange={e => setFormPoint(f => ({ ...f, [d.key]: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-admin-primary" />
                )}
              </div>
            ))}
            <label className="block text-xs text-gray-500 mb-1">ราคา (บาท) *</label>
            <input type="number" value={formPoint.base_price ?? ""} onChange={e => setFormPoint(f => ({ ...f, base_price: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:border-admin-primary" placeholder="เช่น 18000" />
            <div className="flex gap-2">
              <button onClick={() => setShowAddPoint(false)} className="flex-1 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">ยกเลิก</button>
              <button onClick={addPricePoint} className="flex-1 py-2 text-sm bg-admin-primary text-white rounded-lg hover:bg-admin-dark">เพิ่มราคา</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab 4: รูปภาพ (asset_images D89) ────────────────────────

function Tab4Images() {
  const [images, setImages] = useState<AssetImage[]>(INIT_IMAGES);
  const [folderTab, setFolderTab] = useState<AssetImage["category"]>("parts");
  const [showAdd, setShowAdd] = useState(false);

  const [formImg, setFormImg] = useState({
    alt_text: "", appliance_category: "",
    linked_entity_type: "", linked_entity_id: "",
    local_path: "", sort_order: "1",
  });

  const FOLDERS: AssetImage["category"][] = ["parts", "symptoms", "checklist", "pricing-samples", "ui"];
  const folderImages = images.filter(img => img.category === folderTab);

  let nextId = 400;

  function addImage() {
    if (!formImg.alt_text.trim() || !formImg.local_path.trim()) return;
    const newImg: AssetImage = {
      id: nextId++, category: folderTab,
      appliance_category: formImg.appliance_category || null,
      local_path: formImg.local_path,
      alt_text: formImg.alt_text,
      linked_entity_type: formImg.linked_entity_type || null,
      linked_entity_id: formImg.linked_entity_id ? parseInt(formImg.linked_entity_id) : null,
      sort_order: parseInt(formImg.sort_order) || folderImages.length + 1,
      is_active: true,
    };
    setImages(prev => [...prev, newImg]);
    setFormImg({ alt_text: "", appliance_category: "", linked_entity_type: "", linked_entity_id: "", local_path: "", sort_order: "1" });
    setShowAdd(false);
  }

  return (
    <div className="space-y-4">
      {/* Folder tabs */}
      <div className="flex gap-1 bg-white rounded-xl p-1 border border-gray-200 w-fit flex-wrap">
        {FOLDERS.map(f => (
          <button key={f} onClick={() => setFolderTab(f)}
            className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${folderTab === f ? "bg-admin-surface text-admin-primary" : "text-gray-500 hover:text-gray-900"}`}>
            📁 {f}
          </button>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700">
        <strong>D89 asset_images schema:</strong> category · appliance_category · local_path · cloud_url (→R2 prod) · alt_text · linked_entity_type + linked_entity_id · sort_order
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            📁 /assets/{folderTab}/ — {folderImages.length} รูป
          </span>
          <button onClick={() => setShowAdd(true)} className="text-xs px-3 py-1.5 bg-admin-surface text-admin-primary rounded-lg hover:bg-blue-100">+ Register รูป</button>
        </div>

        {folderImages.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-gray-400">
            ยังไม่มีรูปใน /assets/{folderTab}/ — กด &quot;Register รูป&quot;
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="text-xs text-gray-500 border-b border-gray-100 text-left">
              <th className="px-5 py-2">Path</th><th className="px-5 py-2">Alt Text</th><th className="px-5 py-2">Appliance</th><th className="px-5 py-2">Linked Entity</th><th className="px-5 py-2">Sort</th><th className="px-5 py-2">สถานะ</th><th className="px-5 py-2"></th>
            </tr></thead>
            <tbody className="divide-y divide-gray-100">
              {folderImages.map(img => (
                <tr key={img.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-mono text-xs text-admin-primary max-w-[200px] truncate" title={img.local_path}>{img.local_path}</td>
                  <td className="px-5 py-3 text-gray-700 text-xs">{img.alt_text}</td>
                  <td className="px-5 py-3 text-xs text-gray-500">{img.appliance_category ?? "—"}</td>
                  <td className="px-5 py-3 text-xs">
                    {img.linked_entity_type
                      ? <span className="bg-orange-50 text-orange-700 px-1.5 py-0.5 rounded">{img.linked_entity_type}#{img.linked_entity_id}</span>
                      : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-5 py-3 text-gray-500 text-xs">{img.sort_order}</td>
                  <td className="px-5 py-3"><ActiveBadge active={img.is_active} /></td>
                  <td className="px-5 py-3">
                    <SoftDeleteBtn active={img.is_active} hasChildren={false}
                      onToggle={() => setImages(prev => prev.map(x => x.id === img.id ? { ...x, is_active: !x.is_active } : x))} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Image Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 w-96 shadow-xl">
            <h4 className="font-semibold text-gray-800 mb-1">Register รูปภาพ</h4>
            <p className="text-xs text-gray-500 mb-4">Folder: /assets/{folderTab}/</p>

            <label className="block text-xs text-gray-500 mb-1">Local Path *</label>
            <input value={formImg.local_path} onChange={e => setFormImg(f => ({ ...f, local_path: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:border-admin-primary"
              placeholder={`/assets/${folderTab}/ac-01-xxx.jpeg`} />

            <label className="block text-xs text-gray-500 mb-1">Alt Text *</label>
            <input value={formImg.alt_text} onChange={e => setFormImg(f => ({ ...f, alt_text: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:border-admin-primary" placeholder="คำอธิบายรูป" />

            <label className="block text-xs text-gray-500 mb-1">Appliance Category</label>
            <input value={formImg.appliance_category} onChange={e => setFormImg(f => ({ ...f, appliance_category: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:border-admin-primary" placeholder="ac / fridge / washer / computer / tv / NULL" />

            <label className="block text-xs text-gray-500 mb-1">Linked Entity Type</label>
            <select value={formImg.linked_entity_type} onChange={e => setFormImg(f => ({ ...f, linked_entity_type: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:border-admin-primary">
              <option value="">— ไม่ผูก —</option>
              <option value="repair_parts">repair_parts</option>
              <option value="repair_symptoms">repair_symptoms</option>
              <option value="checklist_items">checklist_items</option>
              <option value="used_pricing_models">used_pricing_models</option>
            </select>

            {formImg.linked_entity_type && (<>
              <label className="block text-xs text-gray-500 mb-1">Linked Entity ID</label>
              <input type="number" value={formImg.linked_entity_id} onChange={e => setFormImg(f => ({ ...f, linked_entity_id: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:border-admin-primary" />
            </>)}

            <label className="block text-xs text-gray-500 mb-1">Sort Order</label>
            <input type="number" value={formImg.sort_order} onChange={e => setFormImg(f => ({ ...f, sort_order: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:border-admin-primary" />

            <div className="flex gap-2">
              <button onClick={() => setShowAdd(false)} className="flex-1 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">ยกเลิก</button>
              <button onClick={addImage} className="flex-1 py-2 text-sm bg-admin-primary text-white rounded-lg hover:bg-admin-dark">Register</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────

type TabKey = "master" | "symptoms" | "pricing" | "images";

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: "master",   label: "ประเภท / ยี่ห้อ / รุ่น",     icon: "🏗️" },
  { key: "symptoms", label: "อาการ / อะไหล่ / Checklist", icon: "🔩" },
  { key: "pricing",  label: "ราคา (Dynamic Dims)",        icon: "💰" },
  { key: "images",   label: "รูปภาพ (asset_images)",       icon: "🖼️" },
];

export default function ReferenceDataPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>("master");

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login"); }
  }, [router]);

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar />
      <main className="flex-1 p-8 space-y-6 max-w-7xl">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">📥 Reference Data</h1>
          <p className="text-gray-500 text-sm mt-1">
            D-5 Generic-First · D92 Master 3 ชั้น · D89 asset_images · D90 Soft Delete · Dynamic form per-category
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-xl p-1 border border-gray-200 w-fit flex-wrap">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                activeTab === t.key
                  ? "bg-admin-surface text-admin-primary font-medium"
                  : "text-gray-500 hover:text-gray-900"
              }`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "master"   && <Tab1Master />}
        {activeTab === "symptoms" && <Tab2Symptoms />}
        {activeTab === "pricing"  && <Tab3Pricing />}
        {activeTab === "images"   && <Tab4Images />}

      </main>
    </div>
  );
}
