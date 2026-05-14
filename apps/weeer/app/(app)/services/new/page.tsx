"use client";
// ── Service Intake Form — Sub-CMD-4 Wave 2 ────────────────────────────────────
// สร้าง service record ใหม่ด้วย fields ใหม่: title, description, pointAmount, deadline
// POST /api/v1/services/

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createService } from "../../../../lib/services-api";
import type { ServiceType } from "../../../../lib/services-api";

const SERVICE_TYPE_OPTIONS: { value: ServiceType; label: string; icon: string; description: string }[] = [
  { value: "repair",   label: "ซ่อมอุปกรณ์",    icon: "🔧", description: "ซ่อมเครื่องใช้ไฟฟ้า, อุปกรณ์ต่างๆ" },
  { value: "maintain", label: "ล้าง/บำรุงรักษา", icon: "🧹", description: "ล้างแอร์, ดูแลบำรุงรักษาเชิงป้องกัน" },
  { value: "resell",   label: "ขายต่อ",           icon: "🔄", description: "รับซื้อและขายต่ออุปกรณ์มือสอง" },
  { value: "scrap",    label: "ซากเครื่อง",       icon: "♻️", description: "รับซื้อซาก/แยกชิ้นส่วน" },
];

interface FormState {
  serviceType: ServiceType;
  title: string;
  description: string;
  pointAmount: string;
  deadline: string;
}

interface FormErrors {
  serviceType?: string;
  title?: string;
  description?: string;
  pointAmount?: string;
  deadline?: string;
}

export default function NewServicePage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    serviceType: "repair",
    title: "",
    description: "",
    pointAmount: "",
    deadline: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validate(): FormErrors {
    const e: FormErrors = {};
    if (!form.title.trim()) e.title = "กรุณาระบุชื่อบริการ";
    if (form.title.trim().length > 200) e.title = "ชื่อบริการต้องไม่เกิน 200 ตัวอักษร";
    if (form.description.trim().length > 2000) e.description = "รายละเอียดต้องไม่เกิน 2,000 ตัวอักษร";
    if (form.pointAmount) {
      const n = Number(form.pointAmount);
      if (isNaN(n) || n <= 0) e.pointAmount = "ราคาต้องเป็นตัวเลขที่มากกว่า 0";
    }
    if (form.deadline) {
      const d = new Date(form.deadline);
      if (isNaN(d.getTime())) e.deadline = "กำหนดวันไม่ถูกต้อง";
      else if (d <= new Date()) e.deadline = "กำหนดวันต้องเป็นอนาคต";
    }
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSubmitting(true);
    setApiError(null);

    try {
      await createService({
        serviceType: form.serviceType,
        title: form.title.trim() || undefined,
        description: form.description.trim() || undefined,
        pointAmount: form.pointAmount ? Number(form.pointAmount) : undefined,
        deadline: form.deadline ? new Date(form.deadline).toISOString() : undefined,
      });
      router.push("/services");
    } catch (err) {
      setApiError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5 max-w-xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/services" className="text-gray-400 hover:text-gray-600">←</Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">เพิ่มบริการใหม่</h1>
          <p className="text-xs text-gray-500 mt-0.5">สร้าง service record (บันทึกเป็น draft ก่อน)</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">

        {/* Service type selector */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            ประเภทบริการ <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {SERVICE_TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setField("serviceType", opt.value)}
                className={`text-left p-3 rounded-xl border transition-colors
                  ${form.serviceType === opt.value
                    ? "border-green-400 bg-green-50"
                    : "border-gray-100 bg-gray-50 hover:border-gray-200"}`}
              >
                <div className="text-xl mb-0.5">{opt.icon}</div>
                <div className="text-xs font-semibold text-gray-800">{opt.label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{opt.description}</div>
              </button>
            ))}
          </div>
          {errors.serviceType && <p className="text-xs text-red-500 mt-1">{errors.serviceType}</p>}
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            ชื่อบริการ <span className="text-red-500">*</span>
            <span className="text-xs text-gray-400 font-normal ml-2">({form.title.length}/200)</span>
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setField("title", e.target.value)}
            maxLength={200}
            placeholder="เช่น ล้างแอร์ทั่วไป 1 เครื่อง, ซ่อมเครื่องซักผ้า"
            className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400
              ${errors.title ? "border-red-400" : "border-gray-200"}`}
          />
          {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            รายละเอียด
            <span className="text-xs text-gray-400 font-normal ml-2">({form.description.length}/2,000)</span>
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setField("description", e.target.value)}
            maxLength={2000}
            rows={4}
            placeholder="อธิบายรายละเอียดบริการ เงื่อนไข ขอบเขตงาน"
            className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none
              ${errors.description ? "border-red-400" : "border-gray-200"}`}
          />
          {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
        </div>

        {/* Point amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            มูลค่างาน (Points)
          </label>
          <div className="relative">
            <input
              type="number"
              min="1"
              step="1"
              value={form.pointAmount}
              onChange={(e) => setField("pointAmount", e.target.value)}
              placeholder="เช่น 500"
              className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400
                ${errors.pointAmount ? "border-red-400" : "border-gray-200"}`}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400">pts</span>
          </div>
          {errors.pointAmount
            ? <p className="text-xs text-red-500 mt-1">{errors.pointAmount}</p>
            : <p className="text-xs text-gray-400 mt-1">ใช้สำหรับ Sub-5 Progress Tracker + billing</p>
          }
        </div>

        {/* Deadline */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            กำหนดเสร็จงาน
          </label>
          <input
            type="datetime-local"
            value={form.deadline}
            onChange={(e) => setField("deadline", e.target.value)}
            className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400
              ${errors.deadline ? "border-red-400" : "border-gray-200"}`}
          />
          {errors.deadline
            ? <p className="text-xs text-red-500 mt-1">{errors.deadline}</p>
            : <p className="text-xs text-gray-400 mt-1">Sub-5 จะใช้ deadline นี้สำหรับ alert ติดตามงาน</p>
          }
        </div>

        {/* API error */}
        {apiError && (
          <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
            ⚠️ {apiError}
          </div>
        )}

        {/* Info note */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
          <p className="text-xs text-blue-700">
            💡 บันทึกเป็น <strong>draft</strong> ก่อน — กลับมาเผยแพร่ได้ที่หน้า "บริการของฉัน"
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-1">
          <Link
            href="/services"
            className="flex-1 text-center border border-gray-200 rounded-xl py-3 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            ยกเลิก
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 bg-green-700 hover:bg-green-800 text-white font-semibold rounded-xl py-3 text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? "กำลังบันทึก…" : "💾 บันทึก Draft"}
          </button>
        </div>
      </form>
    </div>
  );
}
