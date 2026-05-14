"use client";
// ── Service Edit Form — Sub-CMD-4 Wave 2 ─────────────────────────────────────
// แก้ไข service record: title, description, pointAmount, deadline
// GET /api/v1/services/:id/ → PATCH /api/v1/services/:id/

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getService,
  updateService,
  SERVICE_TYPE_LABEL,
  SERVICE_STATUS_LABEL,
  SERVICE_STATUS_COLOR,
} from "../../../../../lib/services-api";
import type { ServiceRecord } from "../../../../../lib/services-api";

interface FormState {
  title: string;
  description: string;
  pointAmount: string;
  deadline: string; // datetime-local format: "YYYY-MM-DDTHH:mm"
}

function toDatetimeLocal(iso: string | null): string {
  if (!iso) return "";
  // ISO → "YYYY-MM-DDTHH:mm" (datetime-local ต้องการแค่นี้)
  return iso.slice(0, 16);
}

export default function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [service, setService] = useState<ServiceRecord | null>(null);
  const [form, setForm] = useState<FormState>({ title: "", description: "", pointAmount: "", deadline: "" });
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    getService(id)
      .then((svc) => {
        setService(svc);
        setForm({
          title: svc.title ?? "",
          description: svc.description ?? "",
          pointAmount: svc.pointAmount ? String(Number(svc.pointAmount)) : "",
          deadline: toDatetimeLocal(svc.deadline),
        });
      })
      .catch((e: Error) => setLoadError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validate(): Partial<FormState> {
    const e: Partial<FormState> = {};
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
      await updateService(id, {
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

  if (loading) {
    return <div className="flex items-center justify-center h-40 text-gray-400">กำลังโหลด…</div>;
  }
  if (loadError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">
        ⚠️ {loadError}
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/services" className="text-gray-400 hover:text-gray-600">←</Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">แก้ไขบริการ</h1>
          <p className="text-xs text-gray-500 mt-0.5">อัพเดต title, description, ราคา, กำหนดเสร็จ</p>
        </div>
      </div>

      {/* Service meta (read-only) */}
      {service && (
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${SERVICE_STATUS_COLOR[service.status]}`}>
            {SERVICE_STATUS_LABEL[service.status]}
          </span>
          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
            {SERVICE_TYPE_LABEL[service.serviceType]}
          </span>
          <span className="text-xs text-gray-300 font-mono">{service.id.slice(0, 8)}…</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">

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
            placeholder="เช่น ล้างแอร์ทั่วไป 1 เครื่อง"
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
          {errors.pointAmount && <p className="text-xs text-red-500 mt-1">{errors.pointAmount}</p>}
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
          {errors.deadline && <p className="text-xs text-red-500 mt-1">{errors.deadline}</p>}
        </div>

        {/* API error */}
        {apiError && (
          <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
            ⚠️ {apiError}
          </div>
        )}

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
            {submitting ? "กำลังบันทึก…" : "💾 บันทึกการเปลี่ยนแปลง"}
          </button>
        </div>
      </form>
    </div>
  );
}
