"use client";

/**
 * B6 Used Pricing Wizard — WeeeR
 * Path: /resell/buy/wizard
 *
 * 5-step Generic-First wizard สำหรับตีราคารับซื้อมือสอง (U→R)
 *
 * Mock data โครง 8 ตารางจาก repair-pricing.ts:
 *   categories → models → dimensions → dimension_values
 *   price_points (simplified: baseMarketPrice × isPriceAxis dim multipliers)
 *   deductions (applies_when conditional filter)
 *   reject_rules (auto-reject + ยุติ wizard)
 *
 * Generic-First: เพิ่มประเภทใหม่ = เพิ่ม mock data เท่านั้น — ไม่แก้ wizard logic
 *
 * Pattern A: iPhone  (capacity/condition/screen + deduction: แบตต่ำ/รอยขีด/จอแตก)
 * Pattern B: Notebook (cpu_tier/ram/condition + deduction: คีย์บอร์ดพัง/แบตต่ำ/จอเสีย)
 */

import { useState, useMemo } from "react";
import Link from "next/link";

// ─── Types (mirror repair-pricing.ts schema) ──────────────────────────────────

interface MockCategory {
  id: string;
  code: string;
  labelTh: string;
  icon: string;
}

interface MockModel {
  id: string;
  categoryId: string;
  code: string;
  labelTh: string;
  brand: string;
  specAttributes: Record<string, string | number | boolean>;
  baseMarketPrice: number; // THB — ราคาตลาดอ้างอิง
}

interface MockDimension {
  id: string;
  categoryId: string;
  code: string;
  labelTh: string;
  kind: "ENUM" | "NUMERIC" | "BOOLEAN";
  isPriceAxis: boolean; // true = dimension นี้ใช้คำนวณราคา
  sortOrder: number;
}

interface MockDimensionValue {
  id: string;
  dimensionId: string;
  code: string;
  labelTh: string;
  numericValue?: number; // multiplier สำหรับ isPriceAxis (0-2)
  sortOrder: number;
}

// applies_when / triggers_when rule expression (ตาม repair-pricing.ts schema)
type RuleExpr =
  | { dimension: string; value: string }
  | { and: RuleExpr[] }
  | { or: RuleExpr[] }
  | null;

interface MockDeduction {
  id: string;
  categoryId: string;
  modelId?: string;            // null = ใช้กับทุก model ใน category
  kind: "CONDITION" | "MISSING_ACCESSORY" | "PROBLEM" | "AGE" | "OTHER";
  deductionType: "FIXED" | "PERCENT" | "RANGE";
  labelTh: string;
  fixedAmount?: number;
  percentAmount?: number;
  rangeMin?: number;
  rangeMax?: number;
  sortOrder: number;
  appliesWhen: RuleExpr;       // null = แสดงเสมอ
}

interface MockRejectRule {
  id: string;
  categoryId: string;
  labelTh: string;
  triggersWhen: RuleExpr;      // rule ที่ทำให้ wizard ปฏิเสธรับซื้อ
}

// ─── Mock Data — Pattern A: iPhone ───────────────────────────────────────────

const MOCK_CATEGORIES: MockCategory[] = [
  { id: "cat-iphone",   code: "iphone",   labelTh: "iPhone",   icon: "📱" },
  { id: "cat-notebook", code: "notebook", labelTh: "โน้ตบุ๊ก", icon: "💻" },
];

const MOCK_MODELS: MockModel[] = [
  // ── iPhone ──────────────────────────────────────────────────────────────────
  { id: "m-ip16pm",  categoryId: "cat-iphone",   code: "iphone-16-pro-max",    labelTh: "iPhone 16 Pro Max",       brand: "Apple",  specAttributes: { year: 2024, series: "Pro" },      baseMarketPrice: 42000 },
  { id: "m-ip15p",   categoryId: "cat-iphone",   code: "iphone-15-pro",        labelTh: "iPhone 15 Pro",           brand: "Apple",  specAttributes: { year: 2023, series: "Pro" },      baseMarketPrice: 28000 },
  { id: "m-ip15",    categoryId: "cat-iphone",   code: "iphone-15",            labelTh: "iPhone 15",               brand: "Apple",  specAttributes: { year: 2023, series: "Standard" }, baseMarketPrice: 22000 },
  { id: "m-ip14",    categoryId: "cat-iphone",   code: "iphone-14",            labelTh: "iPhone 14",               brand: "Apple",  specAttributes: { year: 2022, series: "Standard" }, baseMarketPrice: 18000 },
  { id: "m-ip13",    categoryId: "cat-iphone",   code: "iphone-13",            labelTh: "iPhone 13",               brand: "Apple",  specAttributes: { year: 2021, series: "Standard" }, baseMarketPrice: 12000 },
  { id: "m-ipse3",   categoryId: "cat-iphone",   code: "iphone-se-3",          labelTh: "iPhone SE (2022)",        brand: "Apple",  specAttributes: { year: 2022, series: "SE" },       baseMarketPrice: 7000  },
  // ── Notebook ─────────────────────────────────────────────────────────────────
  { id: "m-mbpm3",   categoryId: "cat-notebook", code: "macbook-pro-m3-14",    labelTh: "MacBook Pro M3 14\"",     brand: "Apple",  specAttributes: { year: 2023, chip: "M3" },         baseMarketPrice: 55000 },
  { id: "m-mbam2",   categoryId: "cat-notebook", code: "macbook-air-m2",       labelTh: "MacBook Air M2",          brand: "Apple",  specAttributes: { year: 2022, chip: "M2" },         baseMarketPrice: 32000 },
  { id: "m-mbam1",   categoryId: "cat-notebook", code: "macbook-air-m1",       labelTh: "MacBook Air M1",          brand: "Apple",  specAttributes: { year: 2020, chip: "M1" },         baseMarketPrice: 22000 },
  { id: "m-dellxps", categoryId: "cat-notebook", code: "dell-xps-15-2023",     labelTh: "Dell XPS 15 (2023)",      brand: "Dell",   specAttributes: { year: 2023 },                     baseMarketPrice: 35000 },
  { id: "m-lvtp",    categoryId: "cat-notebook", code: "lenovo-thinkpad-x1",   labelTh: "Lenovo ThinkPad X1 Carbon", brand: "Lenovo", specAttributes: { year: 2023 },                   baseMarketPrice: 24000 },
];

const MOCK_DIMENSIONS: MockDimension[] = [
  // ── iPhone dimensions ────────────────────────────────────────────────────────
  { id: "d-ip-cap",  categoryId: "cat-iphone",   code: "capacity",  labelTh: "ความจุ (Storage)",   kind: "ENUM", isPriceAxis: true,  sortOrder: 1 },
  { id: "d-ip-cond", categoryId: "cat-iphone",   code: "condition", labelTh: "สภาพตัวเครื่อง",    kind: "ENUM", isPriceAxis: true,  sortOrder: 2 },
  { id: "d-ip-scr",  categoryId: "cat-iphone",   code: "screen",    labelTh: "สภาพหน้าจอ",        kind: "ENUM", isPriceAxis: false, sortOrder: 3 },
  // ── Notebook dimensions ──────────────────────────────────────────────────────
  { id: "d-nb-cpu",  categoryId: "cat-notebook", code: "cpu_tier",  labelTh: "ระดับ CPU",          kind: "ENUM", isPriceAxis: true,  sortOrder: 1 },
  { id: "d-nb-ram",  categoryId: "cat-notebook", code: "ram",       labelTh: "RAM",                kind: "ENUM", isPriceAxis: true,  sortOrder: 2 },
  { id: "d-nb-cond", categoryId: "cat-notebook", code: "condition", labelTh: "สภาพโดยรวม",        kind: "ENUM", isPriceAxis: true,  sortOrder: 3 },
];

const MOCK_DIMENSION_VALUES: MockDimensionValue[] = [
  // ── iPhone capacity (isPriceAxis → numericValue = multiplier) ────────────────
  { id: "dv-ip-cap-64",   dimensionId: "d-ip-cap",  code: "64gb",          labelTh: "64 GB",                    numericValue: 0.60, sortOrder: 1 },
  { id: "dv-ip-cap-128",  dimensionId: "d-ip-cap",  code: "128gb",         labelTh: "128 GB",                   numericValue: 0.75, sortOrder: 2 },
  { id: "dv-ip-cap-256",  dimensionId: "d-ip-cap",  code: "256gb",         labelTh: "256 GB",                   numericValue: 1.00, sortOrder: 3 },
  { id: "dv-ip-cap-512",  dimensionId: "d-ip-cap",  code: "512gb",         labelTh: "512 GB",                   numericValue: 1.20, sortOrder: 4 },
  // ── iPhone condition (isPriceAxis) ────────────────────────────────────────────
  { id: "dv-ip-cond-g",   dimensionId: "d-ip-cond", code: "great",         labelTh: "ดีมาก (90%+)",             numericValue: 1.00, sortOrder: 1 },
  { id: "dv-ip-cond-ok",  dimensionId: "d-ip-cond", code: "good",          labelTh: "ดี (75-89%)",              numericValue: 0.82, sortOrder: 2 },
  { id: "dv-ip-cond-f",   dimensionId: "d-ip-cond", code: "fair",          labelTh: "พอใช้ (50-74%)",           numericValue: 0.65, sortOrder: 3 },
  { id: "dv-ip-cond-d",   dimensionId: "d-ip-cond", code: "damaged",       labelTh: "มีรอยมาก (<50%)",          numericValue: 0.40, sortOrder: 4 },
  { id: "dv-ip-cond-br",  dimensionId: "d-ip-cond", code: "beyond_repair", labelTh: "เสียใช้ไม่ได้",            numericValue: 0,    sortOrder: 5 },
  // ── iPhone screen (not isPriceAxis — ข้อมูลเพิ่มเติม) ─────────────────────────
  { id: "dv-ip-scr-ok",   dimensionId: "d-ip-scr",  code: "perfect",       labelTh: "สมบูรณ์ ไม่มีรอย",        sortOrder: 1 },
  { id: "dv-ip-scr-mn",   dimensionId: "d-ip-scr",  code: "minor_scratch", labelTh: "มีรอยเล็กน้อย",           sortOrder: 2 },
  { id: "dv-ip-scr-cr",   dimensionId: "d-ip-scr",  code: "cracked",       labelTh: "หน้าจอแตก",               sortOrder: 3 },
  // ── Notebook CPU tier (isPriceAxis) ──────────────────────────────────────────
  { id: "dv-nb-cpu-i5",   dimensionId: "d-nb-cpu",  code: "i5_m1",         labelTh: "Core i5 / M1 / Ryzen 5",  numericValue: 0.75, sortOrder: 1 },
  { id: "dv-nb-cpu-i7",   dimensionId: "d-nb-cpu",  code: "i7_m2",         labelTh: "Core i7 / M2 / Ryzen 7",  numericValue: 1.00, sortOrder: 2 },
  { id: "dv-nb-cpu-i9",   dimensionId: "d-nb-cpu",  code: "i9_m3",         labelTh: "Core i9 / M3 Pro / Ryzen 9", numericValue: 1.25, sortOrder: 3 },
  // ── Notebook RAM (isPriceAxis) ────────────────────────────────────────────────
  { id: "dv-nb-ram-8",    dimensionId: "d-nb-ram",  code: "8gb",           labelTh: "8 GB",                     numericValue: 0.75, sortOrder: 1 },
  { id: "dv-nb-ram-16",   dimensionId: "d-nb-ram",  code: "16gb",          labelTh: "16 GB",                    numericValue: 1.00, sortOrder: 2 },
  { id: "dv-nb-ram-32",   dimensionId: "d-nb-ram",  code: "32gb",          labelTh: "32 GB",                    numericValue: 1.20, sortOrder: 3 },
  // ── Notebook condition (isPriceAxis) ─────────────────────────────────────────
  { id: "dv-nb-cond-g",   dimensionId: "d-nb-cond", code: "great",         labelTh: "ดีมาก (สภาพดีเยี่ยม)",    numericValue: 1.00, sortOrder: 1 },
  { id: "dv-nb-cond-ok",  dimensionId: "d-nb-cond", code: "good",          labelTh: "ดี (มีรอยน้อย)",           numericValue: 0.80, sortOrder: 2 },
  { id: "dv-nb-cond-f",   dimensionId: "d-nb-cond", code: "fair",          labelTh: "พอใช้ (มีรอยชัด)",         numericValue: 0.60, sortOrder: 3 },
  { id: "dv-nb-cond-br",  dimensionId: "d-nb-cond", code: "broken",        labelTh: "เสียหาย/ต้องซ่อมใหญ่",    numericValue: 0,    sortOrder: 4 },
];

const MOCK_DEDUCTIONS: MockDeduction[] = [
  // ── iPhone deductions ────────────────────────────────────────────────────────
  {
    id: "ded-ip-bat", categoryId: "cat-iphone", kind: "PROBLEM",
    deductionType: "PERCENT", labelTh: "แบตเตอรี่ต่ำกว่า 80%", percentAmount: 10, sortOrder: 1,
    // แสดงเมื่อ condition != "great" (สภาพดีมาก ย่อมมีแบตดี)
    appliesWhen: { or: [
      { dimension: "condition", value: "good" },
      { dimension: "condition", value: "fair" },
      { dimension: "condition", value: "damaged" },
    ]},
  },
  {
    id: "ded-ip-nocharger", categoryId: "cat-iphone", kind: "MISSING_ACCESSORY",
    deductionType: "FIXED", labelTh: "ไม่มีหัวชาร์จ / สายชาร์จ", fixedAmount: 500, sortOrder: 2,
    appliesWhen: null, // แสดงเสมอ
  },
  {
    id: "ded-ip-bodymark", categoryId: "cat-iphone", kind: "CONDITION",
    deductionType: "FIXED", labelTh: "รอยขีดข่วนตัวเครื่องชัดเจน", fixedAmount: 1000, sortOrder: 3,
    appliesWhen: null,
  },
  {
    id: "ded-ip-scr-crack", categoryId: "cat-iphone", kind: "CONDITION",
    deductionType: "RANGE", labelTh: "หน้าจอแตก/ชำรุด", rangeMin: 2000, rangeMax: 5000, sortOrder: 4,
    // แสดงเมื่อสภาพหน้าจอ = cracked
    appliesWhen: { dimension: "screen", value: "cracked" },
  },
  {
    id: "ded-ip-nobox", categoryId: "cat-iphone", kind: "MISSING_ACCESSORY",
    deductionType: "FIXED", labelTh: "ไม่มีกล่อง/เอกสาร", fixedAmount: 300, sortOrder: 5,
    appliesWhen: null,
  },
  // ── Notebook deductions ──────────────────────────────────────────────────────
  {
    id: "ded-nb-keyboard", categoryId: "cat-notebook", kind: "PROBLEM",
    deductionType: "FIXED", labelTh: "คีย์บอร์ดพัง / ตัวหลุด", fixedAmount: 2000, sortOrder: 1,
    appliesWhen: null,
  },
  {
    id: "ded-nb-bat", categoryId: "cat-notebook", kind: "PROBLEM",
    deductionType: "PERCENT", labelTh: "แบตเตอรี่ต่ำกว่า 60%", percentAmount: 8, sortOrder: 2,
    appliesWhen: { or: [
      { dimension: "condition", value: "good" },
      { dimension: "condition", value: "fair" },
    ]},
  },
  {
    id: "ded-nb-noadapter", categoryId: "cat-notebook", kind: "MISSING_ACCESSORY",
    deductionType: "FIXED", labelTh: "ไม่มีอะแดปเตอร์ชาร์จ", fixedAmount: 1500, sortOrder: 3,
    appliesWhen: null,
  },
  {
    id: "ded-nb-screen", categoryId: "cat-notebook", kind: "CONDITION",
    deductionType: "RANGE", labelTh: "จอมีรอย / Dead pixel / เสีย", rangeMin: 3000, rangeMax: 8000, sortOrder: 4,
    appliesWhen: null,
  },
  {
    id: "ded-nb-nobox", categoryId: "cat-notebook", kind: "MISSING_ACCESSORY",
    deductionType: "FIXED", labelTh: "ไม่มีกล่อง / ใบรับประกัน", fixedAmount: 500, sortOrder: 5,
    appliesWhen: null,
  },
];

const MOCK_REJECT_RULES: MockRejectRule[] = [
  {
    id: "rr-ip-beyond-repair", categoryId: "cat-iphone",
    labelTh: "ไม่รับซื้อ: สภาพเครื่องเสีย ใช้งานไม่ได้",
    triggersWhen: { dimension: "condition", value: "beyond_repair" },
  },
  {
    id: "rr-nb-broken", categoryId: "cat-notebook",
    labelTh: "ไม่รับซื้อ: เครื่องเสียหายหนัก ต้องซ่อมใหญ่",
    triggersWhen: { dimension: "condition", value: "broken" },
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * evalRule — ประเมิน applies_when / triggers_when ตาม selectedDims
 * null rule → false (ใช้สำหรับ deduction appliesWhen=null → แสดงเสมอ)
 */
function evalRule(expr: RuleExpr, dims: Record<string, string>): boolean {
  if (!expr) return false;
  if ("dimension" in expr) return dims[expr.dimension] === expr.value;
  if ("and" in expr) return expr.and.every((e) => evalRule(e, dims));
  if ("or" in expr) return expr.or.some((e) => evalRule(e, dims));
  return false;
}

/**
 * computeBasePrice — คำนวณราคาฐาน
 * baseMarketPrice × Π(numericValue ของ isPriceAxis dimensions ที่เลือก)
 */
function computeBasePrice(
  model: MockModel,
  selectedDims: Record<string, string>
): number {
  const axisDims = MOCK_DIMENSIONS.filter(
    (d) => d.categoryId === model.categoryId && d.isPriceAxis
  );
  let price = model.baseMarketPrice;
  for (const dim of axisDims) {
    const selectedCode = selectedDims[dim.code];
    if (!selectedCode) continue;
    const val = MOCK_DIMENSION_VALUES.find(
      (v) => v.dimensionId === dim.id && v.code === selectedCode
    );
    if (val?.numericValue !== undefined) {
      price = price * val.numericValue;
    }
  }
  return Math.round(price / 100) * 100; // round to nearest 100 THB
}

/**
 * computeDeductionAmount — คำนวณยอดหักต่อ deduction
 * RANGE → ใช้ค่ากลาง (midpoint) สำหรับ mockup
 */
function computeDeductionAmount(ded: MockDeduction, basePrice: number): number {
  if (ded.deductionType === "FIXED") return ded.fixedAmount ?? 0;
  if (ded.deductionType === "PERCENT")
    return Math.round((basePrice * (ded.percentAmount ?? 0)) / 100 / 100) * 100;
  if (ded.deductionType === "RANGE")
    return Math.round(((ded.rangeMin ?? 0) + (ded.rangeMax ?? 0)) / 2 / 100) * 100;
  return 0;
}

// ─── Stepper constants ────────────────────────────────────────────────────────

const STEPS = [
  { label: "ประเภท" },
  { label: "รุ่น" },
  { label: "มิติ" },
  { label: "สภาพเพิ่มเติม" },
  { label: "ผลประเมิน" },
] as const;

type Step = 1 | 2 | 3 | 4 | 5;

// ─── KIND label ────────────────────────────────────────────────────────────────

const KIND_LABEL: Record<MockDeduction["kind"], string> = {
  CONDITION: "สภาพ",
  MISSING_ACCESSORY: "อุปกรณ์ขาด",
  PROBLEM: "ปัญหา",
  AGE: "อายุ",
  OTHER: "อื่นๆ",
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function UsedPricingWizardPage() {
  const [step, setStep] = useState<Step>(1);

  // Step 1 — category
  const [categoryId, setCategoryId] = useState<string>("");

  // Step 2 — model
  const [modelId, setModelId]     = useState<string>("");
  const [modelSearch, setModelSearch] = useState<string>("");

  // Step 3 — dimensions: { dimension.code → dimension_value.code }
  const [selectedDims, setSelectedDims] = useState<Record<string, string>>({});

  // Step 4 — deductions (selected IDs) + reject state
  const [selectedDedIds, setSelectedDedIds] = useState<Set<string>>(new Set());
  const [rejectedReasons, setRejectedReasons] = useState<string[]>([]);

  // Step 5 — custom manual adjustment
  const [customAdjust, setCustomAdjust] = useState<number>(0);
  const [submitted, setSubmitted] = useState(false);

  // ── Derived values ─────────────────────────────────────────────────────────

  const category  = useMemo(() => MOCK_CATEGORIES.find((c) => c.id === categoryId), [categoryId]);
  const model     = useMemo(() => MOCK_MODELS.find((m) => m.id === modelId), [modelId]);
  const catDims   = useMemo(() => MOCK_DIMENSIONS.filter((d) => d.categoryId === categoryId).sort((a, b) => a.sortOrder - b.sortOrder), [categoryId]);
  const catModels = useMemo(() => MOCK_MODELS.filter((m) => m.categoryId === categoryId), [categoryId]);

  // Filter models by search
  const filteredModels = useMemo(() =>
    modelSearch.trim()
      ? catModels.filter((m) => m.labelTh.toLowerCase().includes(modelSearch.toLowerCase()) || m.brand.toLowerCase().includes(modelSearch.toLowerCase()))
      : catModels,
    [catModels, modelSearch]
  );

  // Applicable deductions for current category + selectedDims (applies_when filter)
  const applicableDeductions = useMemo(() =>
    MOCK_DEDUCTIONS
      .filter((d) => d.categoryId === categoryId)
      .filter((d) => d.appliesWhen === null || evalRule(d.appliesWhen, selectedDims))
      .sort((a, b) => a.sortOrder - b.sortOrder),
    [categoryId, selectedDims]
  );

  // Base price + deduction amounts
  const basePrice = useMemo(() =>
    model ? computeBasePrice(model, selectedDims) : 0,
    [model, selectedDims]
  );

  const deductionItems = useMemo(() =>
    [...selectedDedIds]
      .map((id) => MOCK_DEDUCTIONS.find((d) => d.id === id))
      .filter((d): d is MockDeduction => !!d)
      .map((d) => ({ ded: d, amount: computeDeductionAmount(d, basePrice) })),
    [selectedDedIds, basePrice]
  );

  const totalDeduction  = deductionItems.reduce((s, i) => s + i.amount, 0);
  const netPrice        = Math.max(0, basePrice - totalDeduction + customAdjust);

  // Reject rules for current dimensions
  const activeRejectRules = useMemo(() =>
    MOCK_REJECT_RULES
      .filter((r) => r.categoryId === categoryId)
      .filter((r) => evalRule(r.triggersWhen, selectedDims)),
    [categoryId, selectedDims]
  );

  // ── Navigation helpers ─────────────────────────────────────────────────────

  function handleNext() {
    if (step === 3) {
      // Check reject rules before advancing to step 4
      const reasons = activeRejectRules.map((r) => r.labelTh);
      if (reasons.length > 0) {
        setRejectedReasons(reasons);
        return; // stop — show rejection banner
      }
      setRejectedReasons([]);
    }
    setStep((s) => Math.min(5, s + 1) as Step);
  }

  function handleBack() {
    setRejectedReasons([]);
    setStep((s) => Math.max(1, s - 1) as Step);
  }

  function resetWizard() {
    setStep(1);
    setCategoryId("");
    setModelId("");
    setModelSearch("");
    setSelectedDims({});
    setSelectedDedIds(new Set());
    setRejectedReasons([]);
    setCustomAdjust(0);
    setSubmitted(false);
  }

  // Validation per step
  const canAdvance =
    (step === 1 && !!categoryId) ||
    (step === 2 && !!modelId) ||
    (step === 3 && catDims.every((d) => !!selectedDims[d.code])) ||
    (step === 4) ||
    (step === 5);

  // ── Submitted state ────────────────────────────────────────────────────────

  if (submitted) {
    return (
      <div className="max-w-xl space-y-5">
        <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center space-y-3">
          <p className="text-5xl">✅</p>
          <p className="font-bold text-green-800 text-lg">ยื่นข้อเสนอรับซื้อแล้ว</p>
          <div className="text-sm text-green-700 space-y-1">
            <p>{model?.labelTh}</p>
            <p className="text-2xl font-bold text-green-700">{netPrice.toLocaleString()} ฿</p>
          </div>
          <p className="text-xs text-green-600 mt-1">ข้อเสนอนี้จะปรากฏใน /resell/offers/new เมื่อ API พร้อม</p>
          <div className="flex gap-3 justify-center mt-4">
            <button onClick={resetWizard}
              className="border border-[#FF8B66] text-[#D63B12] font-medium px-5 py-2 rounded-xl text-sm hover:bg-[#FFE0D6] transition-colors">
              ประเมินชิ้นต่อไป
            </button>
            <Link href="/resell/offers"
              className="bg-[#FF663A] hover:bg-[#F04E20] text-white font-semibold px-5 py-2 rounded-xl text-sm transition-colors">
              ดูข้อเสนอ →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl space-y-5">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <Link href="/resell/buy" className="text-gray-400 hover:text-gray-600 text-lg">←</Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">ประเมินราคารับซื้อ</h1>
          <p className="text-xs text-gray-500 mt-0.5">B6 Used Pricing Wizard</p>
        </div>
      </div>

      {/* ── Stepper ────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1">
        {STEPS.map((s, idx) => {
          const n = (idx + 1) as Step;
          const active  = step === n;
          const done    = step > n;
          return (
            <div key={n} className="flex items-center gap-1 flex-1 min-w-0">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                ${done ? "bg-[#FF663A] text-white" : active ? "bg-[#FF663A] text-white ring-2 ring-[#FF663A]/30" : "bg-gray-100 text-gray-400"}`}>
                {done ? "✓" : n}
              </div>
              <span className={`text-xs truncate ${active ? "text-[#FF663A] font-semibold" : done ? "text-gray-500" : "text-gray-300"}`}>
                {s.label}
              </span>
              {idx < STEPS.length - 1 && <div className="flex-1 h-px bg-gray-200 mx-1" />}
            </div>
          );
        })}
      </div>

      {/* ── Rejection banner (ยุติ wizard) ─────────────────────────────────── */}
      {rejectedReasons.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🚫</span>
            <p className="font-bold text-red-800">ไม่สามารถรับซื้อสินค้านี้ได้</p>
          </div>
          <ul className="space-y-1">
            {rejectedReasons.map((r, i) => (
              <li key={i} className="text-sm text-red-700 flex items-start gap-2">
                <span className="mt-0.5">•</span><span>{r}</span>
              </li>
            ))}
          </ul>
          <button onClick={() => { setRejectedReasons([]); setStep(3); }}
            className="w-full border border-red-300 text-red-700 font-medium py-2.5 rounded-xl text-sm hover:bg-red-100 transition-colors">
            ← ย้อนกลับแก้ไข
          </button>
          <button onClick={resetWizard}
            className="w-full border border-gray-200 text-gray-500 font-medium py-2 rounded-xl text-sm hover:bg-gray-50 transition-colors">
            เริ่มประเมินใหม่
          </button>
        </div>
      )}

      {/* ── Step content ───────────────────────────────────────────────────── */}
      {rejectedReasons.length === 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4">

          {/* ── Step 1: เลือกประเภทสินค้า ─────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm font-semibold text-gray-700">เลือกประเภทสินค้า</p>
              <div className="grid grid-cols-2 gap-3">
                {MOCK_CATEGORIES.map((cat) => (
                  <button key={cat.id} onClick={() => { setCategoryId(cat.id); setModelId(""); setSelectedDims({}); setSelectedDedIds(new Set()); }}
                    className={`p-4 rounded-xl border-2 text-left transition-all
                      ${categoryId === cat.id ? "border-[#FF663A] bg-[#FCEAE3]" : "border-gray-100 hover:border-gray-200"}`}>
                    <p className="text-3xl">{cat.icon}</p>
                    <p className="text-sm font-semibold text-gray-800 mt-2">{cat.labelTh}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{MOCK_MODELS.filter((m) => m.categoryId === cat.id).length} รุ่น</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 2: เลือกรุ่น ──────────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">{category?.icon}</span>
                <p className="text-sm font-semibold text-gray-700">เลือกรุ่น — {category?.labelTh}</p>
              </div>
              <input type="text" value={modelSearch} onChange={(e) => setModelSearch(e.target.value)}
                placeholder="ค้นหารุ่น / ยี่ห้อ…"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF663A]/30" />
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {filteredModels.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">ไม่พบรุ่นที่ค้นหา</p>
                )}
                {filteredModels.map((m) => (
                  <button key={m.id} onClick={() => { setModelId(m.id); setSelectedDims({}); setSelectedDedIds(new Set()); }}
                    className={`w-full text-left p-3 rounded-xl border-2 transition-all
                      ${modelId === m.id ? "border-[#FF663A] bg-[#FCEAE3]" : "border-gray-100 hover:border-gray-200"}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{m.labelTh}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{m.brand}
                          {Object.entries(m.specAttributes).map(([k, v]) => ` · ${k}: ${v}`).join("")}
                        </p>
                      </div>
                      <p className="shrink-0 text-xs font-medium text-gray-500">
                        ~{m.baseMarketPrice.toLocaleString()} ฿
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 3: มิติ / คุณลักษณะ (Generic) ───────────────────── */}
          {step === 3 && (
            <div className="space-y-5">
              <p className="text-sm font-semibold text-gray-700">กรอกคุณลักษณะสินค้า</p>
              {catDims.map((dim) => {
                const dimValues = MOCK_DIMENSION_VALUES
                  .filter((v) => v.dimensionId === dim.id)
                  .sort((a, b) => a.sortOrder - b.sortOrder);
                return (
                  <div key={dim.id} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-700">{dim.labelTh}</p>
                      {dim.isPriceAxis && (
                        <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium">กำหนดราคา</span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {dimValues.map((val) => (
                        <button key={val.id}
                          onClick={() => setSelectedDims((prev) => ({ ...prev, [dim.code]: val.code }))}
                          className={`p-2.5 rounded-xl border-2 text-left transition-all
                            ${selectedDims[dim.code] === val.code ? "border-[#FF663A] bg-[#FCEAE3]" : "border-gray-100 hover:border-gray-200"}`}>
                          <p className="text-xs font-semibold text-gray-800">{val.labelTh}</p>
                          {dim.isPriceAxis && val.numericValue !== undefined && (
                            <p className="text-xs text-gray-400 mt-0.5">×{val.numericValue.toFixed(2)}</p>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
              {/* Live price preview */}
              {model && basePrice > 0 && (
                <div className="bg-gray-50 rounded-xl p-3 text-sm flex items-center justify-between">
                  <span className="text-gray-500">ราคาฐานเบื้องต้น</span>
                  <span className="font-bold text-[#FF663A]">{basePrice.toLocaleString()} ฿</span>
                </div>
              )}
            </div>
          )}

          {/* ── Step 4: Deductions (applies_when filtered) ─────────────── */}
          {step === 4 && (
            <div className="space-y-4">
              <p className="text-sm font-semibold text-gray-700">สภาพ / อุปกรณ์ประกอบ</p>
              <p className="text-xs text-gray-400">ติ๊กรายการที่พบจริง — แต่ละรายการจะหักจากราคาฐาน</p>
              {applicableDeductions.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">ไม่มีรายการหักลดสำหรับสภาพที่เลือก</p>
              )}
              <div className="space-y-2">
                {applicableDeductions.map((ded) => {
                  const checked = selectedDedIds.has(ded.id);
                  const amount  = computeDeductionAmount(ded, basePrice);
                  return (
                    <label key={ded.id}
                      className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all
                        ${checked ? "border-red-300 bg-red-50" : "border-gray-100 hover:border-gray-200"}`}>
                      <input type="checkbox" className="mt-0.5 accent-[#FF663A]" checked={checked}
                        onChange={() => {
                          setSelectedDedIds((prev) => {
                            const s = new Set(prev);
                            checked ? s.delete(ded.id) : s.add(ded.id);
                            return s;
                          });
                        }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800">{ded.labelTh}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{KIND_LABEL[ded.kind]}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-bold text-red-600">−{amount.toLocaleString()} ฿</p>
                        {ded.deductionType === "RANGE" && (
                          <p className="text-xs text-gray-400">(ค่ากลาง)</p>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>

              {/* Running total preview */}
              <div className="bg-gray-50 rounded-xl p-3 space-y-1 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>ราคาฐาน</span><span>{basePrice.toLocaleString()} ฿</span>
                </div>
                <div className="flex justify-between text-red-500">
                  <span>หักลดรวม</span><span>−{totalDeduction.toLocaleString()} ฿</span>
                </div>
                <div className="flex justify-between font-bold text-[#FF663A] border-t border-gray-200 pt-1 mt-1">
                  <span>ราคาประเมิน</span><span>{(basePrice - totalDeduction).toLocaleString()} ฿</span>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 5: ผลประเมินราคา ───────────────────────────────────── */}
          {step === 5 && (
            <div className="space-y-4">
              <p className="text-sm font-semibold text-gray-700">ผลการประเมินราคารับซื้อ</p>

              {/* Model summary */}
              <div className="bg-gray-50 rounded-xl p-3 text-sm space-y-1">
                <div className="flex justify-between text-gray-500">
                  <span>ประเภท</span><span className="font-medium">{category?.icon} {category?.labelTh}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>รุ่น</span><span className="font-medium text-right max-w-[200px] truncate">{model?.labelTh}</span>
                </div>
                {Object.entries(selectedDims).map(([dimCode, valCode]) => {
                  const dim = catDims.find((d) => d.code === dimCode);
                  const val = MOCK_DIMENSION_VALUES.find((v) => v.dimensionId === dim?.id && v.code === valCode);
                  return dim && val ? (
                    <div key={dimCode} className="flex justify-between text-gray-500">
                      <span>{dim.labelTh}</span><span className="font-medium">{val.labelTh}</span>
                    </div>
                  ) : null;
                })}
              </div>

              {/* Price breakdown */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>ราคาฐาน (ตลาด × มิติ)</span>
                  <span className="font-semibold">{basePrice.toLocaleString()} ฿</span>
                </div>

                {deductionItems.map(({ ded, amount }) => (
                  <div key={ded.id} className="flex justify-between text-red-500 text-xs">
                    <span className="truncate mr-2">− {ded.labelTh}</span>
                    <span className="shrink-0 font-medium">−{amount.toLocaleString()} ฿</span>
                  </div>
                ))}

                {totalDeduction > 0 && (
                  <div className="flex justify-between text-red-600 border-t border-dashed border-gray-200 pt-2">
                    <span>รวมส่วนหัก</span>
                    <span className="font-semibold">−{totalDeduction.toLocaleString()} ฿</span>
                  </div>
                )}

                {/* Manual adjust */}
                <div className="flex items-center gap-2 border-t border-gray-100 pt-2">
                  <label className="text-gray-500 shrink-0">ปรับราคาเพิ่มเติม</label>
                  <input type="number" value={customAdjust}
                    onChange={(e) => setCustomAdjust(Number(e.target.value))}
                    className="flex-1 border border-gray-200 rounded-lg px-2 py-1 text-sm text-right focus:outline-none focus:ring-1 focus:ring-[#FF663A]/30" />
                  <span className="text-gray-400 shrink-0">฿</span>
                </div>

                {/* Net */}
                <div className="flex justify-between items-end border-t border-gray-200 pt-2 mt-1">
                  <span className="font-bold text-gray-800 text-base">ราคาสุทธิที่รับซื้อ</span>
                  <span className="text-3xl font-bold text-[#FF663A]">{netPrice.toLocaleString()}</span>
                </div>
                <p className="text-xs text-gray-400 text-right">฿ (บาท)</p>
              </div>

              {/* Actions */}
              <button
                onClick={() => setSubmitted(true)}
                className="w-full bg-[#FF663A] hover:bg-[#D8491F] text-white font-bold py-4 rounded-2xl text-sm transition-colors">
                ยื่นข้อเสนอรับซื้อ {netPrice.toLocaleString()} ฿
              </button>
              <button onClick={() => setStep(3)}
                className="w-full border border-gray-200 text-gray-500 font-medium py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors">
                คำนวณใหม่
              </button>
            </div>
          )}

          {/* ── Navigation buttons ──────────────────────────────────────── */}
          {step < 5 && (
            <div className="flex gap-2 pt-2">
              {step > 1 && (
                <button onClick={handleBack}
                  className="flex-1 border border-gray-200 text-gray-600 font-medium py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors">
                  ← ย้อนกลับ
                </button>
              )}
              <button onClick={handleNext} disabled={!canAdvance}
                className="flex-1 bg-[#FF663A] hover:bg-[#D8491F] disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
                {step === 4 ? "ดูผลประเมิน →" : "ถัดไป →"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
