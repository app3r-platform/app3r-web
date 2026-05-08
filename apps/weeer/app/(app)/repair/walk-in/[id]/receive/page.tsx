"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { repairApi } from "../../../_lib/api";

export default function WalkInReceivePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{ receipt_code: string } | null>(null);

  const [form, setForm] = useState({
    customer_name: "",
    customer_phone: "",
    appliance_name: "",
    problem_description: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!form.customer_name.trim()) e.customer_name = "กรุณาระบุชื่อลูกค้า";
    if (!form.customer_phone.trim()) e.customer_phone = "กรุณาระบุเบอร์โทร";
    if (!form.appliance_name.trim()) e.appliance_name = "กรุณาระบุชื่ออุปกรณ์";
    if (!form.problem_description.trim()) e.problem_description = "กรุณาระบุอาการ";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setSubmitting(true);
    setError("");
    try {
      const job = await repairApi.receiveWalkIn(id, {
        customer_name: form.customer_name,
        customer_phone: form.customer_phone,
        appliance_name: form.appliance_name,
        problem_description: form.problem_description,
      });
      setSuccess({ receipt_code: job.receipt_code });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (success) return (
    <div className="max-w-xl space-y-5">
      <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center space-y-3">
        <span className="text-4xl">🧾</span>
        <p className="text-lg font-bold text-green-800">รับเครื่องสำเร็จ</p>
        <div className="bg-white rounded-xl px-6 py-4 border border-green-200">
          <p className="text-xs text-gray-400 mb-1">Receipt Code — แจ้งลูกค้าเก็บไว้</p>
          <p className="text-3xl font-mono font-bold text-gray-900 tracking-widest">{success.receipt_code}</p>
        </div>
        <p className="text-xs text-gray-500">ลูกค้าใช้โค้ดนี้ตรวจสอบสถานะงานได้</p>
      </div>
      <div className="flex gap-3">
        <Link href={`/repair/walk-in/${id}/inspect`}
          className="flex-1 bg-green-700 hover:bg-green-800 text-white font-semibold py-3 rounded-xl text-center transition-colors text-sm">
          ตรวจสภาพต่อเลย →
        </Link>
        <Link href="/repair/walk-in/queue"
          className="flex-1 bg-white border border-gray-200 text-gray-700 font-medium py-3 rounded-xl text-center transition-colors text-sm hover:bg-gray-50">
          กลับ Queue
        </Link>
      </div>
    </div>
  );

  return (
    <div className="space-y-5 max-w-xl">
      <div className="flex items-center gap-3">
        <Link href="/repair/walk-in/queue" className="text-gray-400 hover:text-gray-600">←</Link>
        <h1 className="text-xl font-bold text-gray-900">รับเครื่อง Walk-in</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 bg-white border border-gray-100 rounded-2xl p-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ชื่อลูกค้า <span className="text-red-500">*</span>
            </label>
            <input type="text" value={form.customer_name}
              onChange={(e) => setForm(f => ({ ...f, customer_name: e.target.value }))}
              placeholder="ชื่อ-นามสกุล"
              className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 ${formErrors.customer_name ? "border-red-400" : "border-gray-200"}`} />
            {formErrors.customer_name && <p className="text-xs text-red-500 mt-1">{formErrors.customer_name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              เบอร์โทร <span className="text-red-500">*</span>
            </label>
            <input type="tel" value={form.customer_phone}
              onChange={(e) => setForm(f => ({ ...f, customer_phone: e.target.value }))}
              placeholder="08x-xxx-xxxx"
              className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 ${formErrors.customer_phone ? "border-red-400" : "border-gray-200"}`} />
            {formErrors.customer_phone && <p className="text-xs text-red-500 mt-1">{formErrors.customer_phone}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ชื่ออุปกรณ์ <span className="text-red-500">*</span>
          </label>
          <input type="text" value={form.appliance_name}
            onChange={(e) => setForm(f => ({ ...f, appliance_name: e.target.value }))}
            placeholder="เช่น แอร์ Samsung 12000 BTU, ตู้เย็น LG 2 ประตู"
            className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 ${formErrors.appliance_name ? "border-red-400" : "border-gray-200"}`} />
          {formErrors.appliance_name && <p className="text-xs text-red-500 mt-1">{formErrors.appliance_name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            อาการ / ปัญหา <span className="text-red-500">*</span>
          </label>
          <textarea value={form.problem_description}
            onChange={(e) => setForm(f => ({ ...f, problem_description: e.target.value }))}
            placeholder="อธิบายอาการที่ลูกค้าแจ้ง"
            rows={3}
            className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none ${formErrors.problem_description ? "border-red-400" : "border-gray-200"}`} />
          {formErrors.problem_description && <p className="text-xs text-red-500 mt-1">{formErrors.problem_description}</p>}
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
          <p className="text-xs font-medium text-blue-700">📸 การถ่ายรูปอุปกรณ์ (R-01.5)</p>
          <p className="text-xs text-blue-600 mt-0.5">ถ่ายรูปสภาพเครื่องก่อนรับ ผ่านกล้องในขั้นตอนต่อไป</p>
        </div>

        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

        <button type="submit" disabled={submitting}
          className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60">
          {submitting ? "กำลังบันทึก…" : "🧾 รับเครื่อง + ออก Receipt Code"}
        </button>
      </form>
    </div>
  );
}
