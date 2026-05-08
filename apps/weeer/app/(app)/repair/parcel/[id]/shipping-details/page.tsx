"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { repairApi } from "../../../_lib/api";
import type { ParcelJob } from "../../../_lib/types";

const COURIER_OPTIONS = ["Kerry Express", "Flash Express", "J&T Express", "Thailand Post", "DHL", "Ninja Van", "อื่นๆ"];
const COST_SPLIT_OPTIONS: { value: "customer" | "shop" | "split"; label: string; desc: string }[] = [
  { value: "customer", label: "ลูกค้าออกทั้งหมด",   desc: "ลูกค้าชำระค่าส่งทั้งขาไปและขากลับ" },
  { value: "shop",     label: "ร้านออกทั้งหมด",     desc: "ร้านรับผิดชอบค่าส่งทุกขา" },
  { value: "split",    label: "แบ่งกัน (50/50)",     desc: "ลูกค้าออกขาไป ร้านออกขากลับ" },
];

export default function ParcelShippingDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [job, setJob] = useState<ParcelJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [shopAddress, setShopAddress] = useState("");
  const [courier, setCourier] = useState("");
  const [costSplit, setCostSplit] = useState<"customer" | "shop" | "split">("customer");
  const [notes, setNotes] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    repairApi.getParcelJob(id)
      .then((j) => {
        setJob(j as ParcelJob);
        if (j.shop_address) setShopAddress(j.shop_address as string);
        if (j.courier) setCourier(j.courier as string);
        if (j.cost_split) setCostSplit(j.cost_split as "customer" | "shop" | "split");
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  function validate() {
    const e: Record<string, string> = {};
    if (!shopAddress.trim()) e.address = "กรุณากรอกที่อยู่ร้าน";
    if (!courier.trim()) e.courier = "กรุณาเลือกขนส่ง";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setSubmitting(true);
    setError("");
    try {
      await repairApi.confirmShippingDetails(id, {
        shop_address: shopAddress.trim(),
        courier: courier.trim(),
        cost_split: costSplit,
        notes: notes.trim() || undefined,
      });
      setSuccess(true);
      setTimeout(() => router.push(`/repair/parcel/queue`), 1500);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="flex items-center justify-center h-48 text-gray-400">กำลังโหลด…</div>;
  if (error && !job) return <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">{error}</div>;
  if (success) return (
    <div className="flex flex-col items-center justify-center h-48 text-center">
      <span className="text-4xl mb-3">📦</span>
      <p className="text-sm font-semibold text-green-700">ยืนยัน Shipping Details สำเร็จ</p>
      <p className="text-xs text-gray-400 mt-1">ลูกค้าจะได้รับที่อยู่ส่งของ</p>
    </div>
  );
  if (!job) return null;

  return (
    <div className="space-y-5 max-w-xl">
      <div className="flex items-center gap-3">
        <Link href="/repair/parcel/queue" className="text-gray-400 hover:text-gray-600">←</Link>
        <h1 className="text-xl font-bold text-gray-900">ตกลง Shipping Details</h1>
      </div>

      {/* Job summary */}
      <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 space-y-1">
        <p className="text-sm font-semibold text-orange-800">{job.appliance_name}</p>
        <p className="text-xs text-orange-600">{job.problem_description}</p>
        <p className="text-xs text-orange-500">👤 {job.customer_name} · 📞 {job.customer_phone}</p>
        <p className="text-xs text-orange-500">📍 ที่อยู่ลูกค้า: {job.customer_address}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 bg-white border border-gray-100 rounded-2xl p-5">
        {/* Shop address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ที่อยู่ร้าน (สำหรับลูกค้าส่งของมา) <span className="text-red-500">*</span>
          </label>
          <textarea
            value={shopAddress}
            onChange={(e) => { setShopAddress(e.target.value); setFormErrors(f => ({ ...f, address: "" })); }}
            placeholder="เลขที่ ถนน แขวง/ตำบล เขต/อำเภอ จังหวัด รหัสไปรษณีย์"
            rows={3}
            className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none ${formErrors.address ? "border-red-400" : "border-gray-200"}`}
          />
          {formErrors.address && <p className="text-xs text-red-500 mt-1">{formErrors.address}</p>}
        </div>

        {/* Courier */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">
            บริษัทขนส่ง <span className="text-red-500">*</span>
            {formErrors.courier && <span className="text-xs text-red-500 ml-2">{formErrors.courier}</span>}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {COURIER_OPTIONS.map((c) => (
              <label key={c}
                className={`flex items-center gap-2 p-2.5 rounded-xl border-2 cursor-pointer transition-all
                  ${courier === c ? "border-green-300 bg-green-50" : "border-gray-100 hover:border-gray-200"}`}>
                <input type="radio" name="courier" value={c}
                  checked={courier === c}
                  onChange={() => { setCourier(c); setFormErrors(f => ({ ...f, courier: "" })); }}
                  className="text-green-600" />
                <span className="text-sm text-gray-700">{c}</span>
              </label>
            ))}
          </div>
          {courier === "อื่นๆ" && (
            <input
              type="text"
              placeholder="ระบุชื่อขนส่ง"
              className="mt-2 w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              onChange={(e) => setCourier(e.target.value)}
            />
          )}
        </div>

        {/* Cost split */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">ผู้รับผิดชอบค่าขนส่ง</p>
          <div className="space-y-2">
            {COST_SPLIT_OPTIONS.map((opt) => (
              <label key={opt.value}
                className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all
                  ${costSplit === opt.value ? "border-green-300 bg-green-50" : "border-gray-100 hover:border-gray-200"}`}>
                <input type="radio" name="cost_split" value={opt.value}
                  checked={costSplit === opt.value}
                  onChange={() => setCostSplit(opt.value)}
                  className="text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-800">{opt.label}</p>
                  <p className="text-xs text-gray-500">{opt.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุเพิ่มเติม</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="ข้อมูลการแพ็ค, ประกันสินค้า, วันที่ต้องการ ฯลฯ"
            rows={2}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
          />
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-start gap-2">
          <span className="text-base">📋</span>
          <p className="text-xs text-blue-700">เมื่อยืนยัน ลูกค้าจะได้รับที่อยู่ร้านและรายละเอียดการส่งของ สถานะจะเปลี่ยนเป็น <strong>พัสดุกำลังมา</strong></p>
        </div>

        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

        <button type="submit" disabled={submitting}
          className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60">
          {submitting ? "กำลังบันทึก…" : "📦 ยืนยัน Shipping Details"}
        </button>
      </form>
    </div>
  );
}
