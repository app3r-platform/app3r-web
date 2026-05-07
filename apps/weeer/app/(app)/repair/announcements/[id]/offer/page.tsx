"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { repairApi } from "../../../_lib/api";
import type { RepairAnnouncement } from "../../../_lib/types";

const DEPOSIT_POLICIES = [
  { value: "free", label: "ฟรี — ไม่มีค่าใช้จ่ายถ้าซ่อมไม่ได้" },
  { value: "forfeit", label: "ยึดมัดจำ — ถ้าซ่อมไม่ได้" },
  { value: "refund", label: "คืนมัดจำ — ถ้าซ่อมไม่ได้" },
];

export default function OfferPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [announcement, setAnnouncement] = useState<RepairAnnouncement | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    price: "",
    includes: "",
    has_deposit: false,
    deposit_amount: "",
    deposit_policy: "free" as "free" | "forfeit" | "refund",
    inspection_fee: "100",
    weeet_id: "",
    notes: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    repairApi.getAnnouncement(id)
      .then(setAnnouncement)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0) e.price = "กรุณาระบุราคา";
    if (!form.includes.trim()) e.includes = "กรุณาระบุสิ่งที่รวมในราคา";
    if (form.has_deposit && (!form.deposit_amount || Number(form.deposit_amount) <= 0)) e.deposit_amount = "กรุณาระบุจำนวนมัดจำ";
    if (!form.weeet_id.trim()) e.weeet_id = "กรุณาระบุ WeeeT ที่จะส่ง";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setSubmitting(true);
    setError("");
    try {
      await repairApi.submitOffer(id, {
        price: Number(form.price),
        includes: form.includes,
        has_deposit: form.has_deposit,
        deposit_amount: form.has_deposit ? Number(form.deposit_amount) : undefined,
        deposit_policy_unrepairable: form.has_deposit ? form.deposit_policy : undefined,
        inspection_fee: Number(form.inspection_fee),
        weeet_id: form.weeet_id,
        notes: form.notes || undefined,
      });
      setSuccess(true);
      setTimeout(() => router.push("/repair/jobs"), 1500);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="flex items-center justify-center h-48 text-gray-400">กำลังโหลด…</div>;
  if (error && !announcement) return <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">{error}</div>;
  if (success) return (
    <div className="flex flex-col items-center justify-center h-48 text-center">
      <span className="text-4xl mb-3">✅</span>
      <p className="text-sm font-semibold text-green-700">ส่งข้อเสนอสำเร็จ</p>
      <p className="text-xs text-gray-400 mt-1">กำลังพาไปหน้างาน…</p>
    </div>
  );

  return (
    <div className="space-y-5 max-w-xl">
      <div className="flex items-center gap-3">
        <Link href="/repair/announcements" className="text-gray-400 hover:text-gray-600">←</Link>
        <h1 className="text-xl font-bold text-gray-900">ยื่นข้อเสนอ</h1>
      </div>

      {announcement && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-1">
          <p className="text-sm font-semibold text-blue-800">{announcement.appliance_name}</p>
          <p className="text-xs text-blue-600">{announcement.problem_description}</p>
          <div className="flex gap-4 mt-1">
            <span className="text-xs text-blue-500">📍 {announcement.address}</span>
            {announcement.budget_max && (
              <span className="text-xs text-blue-500 font-medium">งบ ≤ {announcement.budget_max.toLocaleString()} pts</span>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 bg-white border border-gray-100 rounded-2xl p-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ราคา (Point) <span className="text-red-500">*</span></label>
          <input type="number" min="1" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
            placeholder="เช่น 850"
            className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 ${formErrors.price ? "border-red-400" : "border-gray-200"}`} />
          {formErrors.price && <p className="text-xs text-red-500 mt-1">{formErrors.price}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">สิ่งที่รวมในราคา <span className="text-red-500">*</span></label>
          <textarea value={form.includes} onChange={(e) => setForm((f) => ({ ...f, includes: e.target.value }))}
            placeholder="เช่น ค่าแรง + ค่าน้ำยาล้าง + เติมน้ำยาแอร์ (ถ้าจำเป็น)"
            rows={3}
            className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none ${formErrors.includes ? "border-red-400" : "border-gray-200"}`} />
          {formErrors.includes && <p className="text-xs text-red-500 mt-1">{formErrors.includes}</p>}
        </div>

        <div className="border-t border-gray-100 pt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">ค่าตรวจสภาพ (On-site)</label>
          <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-2.5">
            <span className="text-sm text-gray-600 flex-1">Inspection fee มาตรฐาน</span>
            <span className="text-sm font-semibold text-green-700">100 pts</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">ไม่คืน แม้ซ่อมไม่ได้ — WeeeU รับทราบเมื่อยืนยันข้อเสนอ</p>
        </div>

        <div className="border-t border-gray-100 pt-4 space-y-3">
          <div className="flex items-center gap-3">
            <input type="checkbox" id="has_deposit" checked={form.has_deposit}
              onChange={(e) => setForm((f) => ({ ...f, has_deposit: e.target.checked }))}
              className="w-4 h-4 text-green-600 rounded" />
            <label htmlFor="has_deposit" className="text-sm font-medium text-gray-700">เก็บค่ามัดจำ</label>
          </div>
          {form.has_deposit && (
            <div className="space-y-3 pl-7">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">จำนวนมัดจำ (Point) <span className="text-red-500">*</span></label>
                <input type="number" min="1" value={form.deposit_amount}
                  onChange={(e) => setForm((f) => ({ ...f, deposit_amount: e.target.value }))}
                  placeholder="เช่น 200"
                  className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 ${formErrors.deposit_amount ? "border-red-400" : "border-gray-200"}`} />
                {formErrors.deposit_amount && <p className="text-xs text-red-500 mt-1">{formErrors.deposit_amount}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">นโยบายมัดจำ (ถ้าซ่อมไม่ได้)</label>
                {DEPOSIT_POLICIES.map((p) => (
                  <label key={p.value} className="flex items-center gap-2 py-1.5 cursor-pointer">
                    <input type="radio" name="deposit_policy" value={p.value}
                      checked={form.deposit_policy === p.value}
                      onChange={() => setForm((f) => ({ ...f, deposit_policy: p.value as "free" | "forfeit" | "refund" }))}
                      className="text-green-600" />
                    <span className="text-xs text-gray-700">{p.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 pt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            WeeeT ที่จะส่ง <span className="text-red-500">*</span>
            <Link href="/staff" target="_blank" className="ml-2 text-xs text-green-600 hover:underline font-normal">(ดูรายชื่อ WeeeT →)</Link>
          </label>
          <input type="text" value={form.weeet_id} onChange={(e) => setForm((f) => ({ ...f, weeet_id: e.target.value }))}
            placeholder="WeeeT ID เช่น R001-T01"
            className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 ${formErrors.weeet_id ? "border-red-400" : "border-gray-200"}`} />
          {formErrors.weeet_id && <p className="text-xs text-red-500 mt-1">{formErrors.weeet_id}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุเพิ่มเติม</label>
          <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            placeholder="เงื่อนไขพิเศษ ข้อตกลงอื่นๆ (ถ้ามี)"
            rows={2}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none" />
        </div>

        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

        <button type="submit" disabled={submitting}
          className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60">
          {submitting ? "กำลังส่ง…" : "ส่งข้อเสนอ"}
        </button>
      </form>
    </div>
  );
}
