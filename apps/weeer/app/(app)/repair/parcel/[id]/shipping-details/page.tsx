"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { repairApi } from "../../../_lib/api";
import { MOCK_PARCEL_QUEUE } from "../../../_lib/mock";
import type { ParcelJob } from "../../../_lib/types";

// 3.2 — cascade address data (mock, forward: จังหวัด→อำเภอ→ตำบล→postcode auto)
type SubdistrictEntry = { name: string; postcode: string };
type DistrictEntry = { name: string; subdistricts: SubdistrictEntry[] };
type ProvinceEntry = { name: string; districts: DistrictEntry[] };

const THAILAND_ADDRESSES: ProvinceEntry[] = [
  {
    name: "กรุงเทพมหานคร",
    districts: [
      { name: "บางรัก", subdistricts: [{ name: "บางรัก", postcode: "10500" }, { name: "สี่พระยา", postcode: "10500" }, { name: "สุริยวงศ์", postcode: "10500" }] },
      { name: "คลองเตย", subdistricts: [{ name: "คลองเตย", postcode: "10110" }, { name: "คลองตัน", postcode: "10110" }, { name: "พระโขนง", postcode: "10110" }] },
      { name: "พระนคร", subdistricts: [{ name: "พระบรมมหาราชวัง", postcode: "10200" }, { name: "วังบูรพาภิรมย์", postcode: "10200" }] },
    ],
  },
  {
    name: "เชียงใหม่",
    districts: [
      { name: "เมืองเชียงใหม่", subdistricts: [{ name: "ศรีภูมิ", postcode: "50200" }, { name: "พระสิงห์", postcode: "50200" }, { name: "หายยา", postcode: "50100" }] },
      { name: "สันทราย", subdistricts: [{ name: "สันทรายหลวง", postcode: "50210" }, { name: "หนองจ๊อม", postcode: "50210" }] },
    ],
  },
  {
    name: "นครราชสีมา",
    districts: [
      { name: "เมืองนครราชสีมา", subdistricts: [{ name: "ในเมือง", postcode: "30000" }, { name: "โพธิ์กลาง", postcode: "30000" }] },
      { name: "ปักธงชัย", subdistricts: [{ name: "เมืองปัก", postcode: "30150" }, { name: "ตะขบ", postcode: "30150" }] },
    ],
  },
  {
    name: "ขอนแก่น",
    districts: [
      { name: "เมืองขอนแก่น", subdistricts: [{ name: "ในเมือง", postcode: "40000" }, { name: "สาวะถี", postcode: "40000" }] },
      { name: "บ้านฝาง", subdistricts: [{ name: "บ้านฝาง", postcode: "40270" }, { name: "ป่าหวายนั่ง", postcode: "40270" }] },
    ],
  },
  {
    name: "ชลบุรี",
    districts: [
      { name: "เมืองชลบุรี", subdistricts: [{ name: "บางปลาสร้อย", postcode: "20000" }, { name: "มะขามหย่ง", postcode: "20000" }] },
      { name: "พัทยา", subdistricts: [{ name: "หนองปรือ", postcode: "20150" }, { name: "นาเกลือ", postcode: "20150" }] },
    ],
  },
];

const COURIER_OPTIONS = ["Kerry Express", "Flash Express", "J&T Express", "Thailand Post", "DHL", "Ninja Van", "อื่นๆ"];
const COST_SPLIT_OPTIONS: { value: "customer" | "shop" | "split"; label: string; desc: string }[] = [
  { value: "customer", label: "ลูกค้าออกทั้งหมด",   desc: "ลูกค้าชำระค่าส่งทั้งขาไปและขากลับ" },
  { value: "shop",     label: "ร้านออกทั้งหมด",     desc: "ร้านรับผิดชอบค่าส่งทุกขา" },
  { value: "split",    label: "แบ่งกัน (50/50)",     desc: "ลูกค้าออกขาไป ร้านออกขากลับ" },
];

export default function ParcelShippingDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const mockParcelShippingDet = process.env.NEXT_PUBLIC_DEV_NAV === "true"
    ? (MOCK_PARCEL_QUEUE.items.find(p => p.id === id) ?? MOCK_PARCEL_QUEUE.items[0]) as ParcelJob
    : null;
  const [job, setJob] = useState<ParcelJob | null>(() => mockParcelShippingDet);
  const [loading, setLoading] = useState(() => process.env.NEXT_PUBLIC_DEV_NAV !== "true");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // 3.2: cascade address fields (จังหวัด→อำเภอ→ตำบล→postcode auto)
  const [addressLine, setAddressLine] = useState(() => (mockParcelShippingDet?.shop_address as string | undefined) ?? "");
  const [province, setProvince]       = useState("");
  const [district, setDistrict]       = useState("");
  const [subdistrict, setSubdistrict] = useState("");
  const [postcode, setPostcode]       = useState("");
  const [courier, setCourier] = useState(() => (mockParcelShippingDet?.courier as string | undefined) ?? "");
  const [costSplit, setCostSplit] = useState<"customer" | "shop" | "split">(() =>
    (mockParcelShippingDet?.cost_split as "customer" | "shop" | "split" | undefined) ?? "customer"
  );
  const [notes, setNotes] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_DEV_NAV === "true") return;
    async function load() {
      setLoading(true);
      try {
        const j = await repairApi.getParcelJob(id);
        setJob(j as ParcelJob);
        if (j.shop_address) setAddressLine(j.shop_address as string);
        if (j.courier) setCourier(j.courier as string);
        if (j.cost_split) setCostSplit(j.cost_split as "customer" | "shop" | "split");
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [id]);

  // cascade helpers
  const availableDistricts = THAILAND_ADDRESSES.find(p => p.name === province)?.districts ?? [];
  const availableSubdistricts = availableDistricts.find(d => d.name === district)?.subdistricts ?? [];
  const composedAddress = [addressLine.trim(), subdistrict && `ต.${subdistrict}`, district && `อ.${district}`, province && `จ.${province}`, postcode].filter(Boolean).join(" ");

  function handleProvinceChange(v: string) {
    setProvince(v);
    setDistrict("");
    setSubdistrict("");
    setPostcode("");
  }
  function handleDistrictChange(v: string) {
    setDistrict(v);
    setSubdistrict("");
    setPostcode("");
  }
  function handleSubdistrictChange(v: string) {
    setSubdistrict(v);
    const pc = availableSubdistricts.find(s => s.name === v)?.postcode ?? "";
    setPostcode(pc);
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!addressLine.trim()) e.address = "กรุณากรอกที่อยู่บ้านเลขที่/ถนน";
    if (!province) e.province = "กรุณาเลือกจังหวัด";
    if (!district) e.district = "กรุณาเลือกอำเภอ";
    if (!subdistrict) e.subdistrict = "กรุณาเลือกตำบล";
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
        shop_address: composedAddress,
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
      <p className="text-sm font-semibold text-green-700">ยืนยันรายละเอียดการจัดส่ง (Shipping Details) สำเร็จ</p>
      <p className="text-xs text-gray-400 mt-1">ลูกค้าจะได้รับที่อยู่ส่งของ</p>
    </div>
  );
  if (!job) return null;

  return (
    <div className="space-y-5 max-w-xl">
      <div className="flex items-center gap-3">
        <Link href="/repair/parcel/queue" className="text-gray-400 hover:text-gray-600">←</Link>
        <h1 className="text-xl font-bold text-gray-900">ตกลงรายละเอียดการจัดส่ง (Shipping Details)</h1>
      </div>

      {/* Job summary */}
      <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 space-y-1">
        <p className="text-sm font-semibold text-orange-800">{job.appliance_name}</p>
        <p className="text-xs text-orange-600">{job.problem_description}</p>
        <p className="text-xs text-orange-500">👤 {job.customer_name} · 📞 {job.customer_phone}</p>
        <p className="text-xs text-orange-500">📍 ที่อยู่ลูกค้า: {job.customer_address}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 bg-white border border-gray-100 rounded-2xl p-5">
        {/* Shop address — 3.2 cascade: จังหวัด→อำเภอ→ตำบล→postcode auto */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">
            ที่อยู่ร้าน (สำหรับลูกค้าส่งของมา) <span className="text-red-500">*</span>
          </p>
          {/* บ้านเลขที่ / ถนน */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">บ้านเลขที่ / ถนน / ซอย</label>
            <textarea
              value={addressLine}
              onChange={(e) => { setAddressLine(e.target.value); setFormErrors(f => ({ ...f, address: "" })); }}
              placeholder="123/4 ถนน... ซอย..."
              rows={2}
              className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF663A] resize-none ${formErrors.address ? "border-red-400" : "border-gray-200"}`}
            />
            {formErrors.address && <p className="text-xs text-red-500 mt-1">{formErrors.address}</p>}
          </div>
          {/* จังหวัด */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">จังหวัด</label>
            <select value={province} onChange={e => handleProvinceChange(e.target.value)}
              className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF663A] bg-white ${formErrors.province ? "border-red-400" : "border-gray-200"}`}>
              <option value="">-- เลือกจังหวัด --</option>
              {THAILAND_ADDRESSES.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
            </select>
            {formErrors.province && <p className="text-xs text-red-500 mt-1">{formErrors.province}</p>}
          </div>
          {/* อำเภอ */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">อำเภอ / เขต</label>
              <select value={district} onChange={e => handleDistrictChange(e.target.value)}
                disabled={!province}
                className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF663A] bg-white disabled:bg-gray-50 disabled:text-gray-400 ${formErrors.district ? "border-red-400" : "border-gray-200"}`}>
                <option value="">-- เลือกอำเภอ --</option>
                {availableDistricts.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
              </select>
              {formErrors.district && <p className="text-xs text-red-500 mt-1">{formErrors.district}</p>}
            </div>
            {/* ตำบล */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">ตำบล / แขวง</label>
              <select value={subdistrict} onChange={e => handleSubdistrictChange(e.target.value)}
                disabled={!district}
                className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF663A] bg-white disabled:bg-gray-50 disabled:text-gray-400 ${formErrors.subdistrict ? "border-red-400" : "border-gray-200"}`}>
                <option value="">-- เลือกตำบล --</option>
                {availableSubdistricts.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
              </select>
              {formErrors.subdistrict && <p className="text-xs text-red-500 mt-1">{formErrors.subdistrict}</p>}
            </div>
          </div>
          {/* Postcode auto */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">รหัสไปรษณีย์ (อัตโนมัติ)</label>
            <input type="text" readOnly value={postcode}
              placeholder="(เลือกตำบลเพื่อกรอกอัตโนมัติ)"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 text-gray-600" />
          </div>
          {/* Composed preview */}
          {composedAddress && (
            <div className="bg-[#FFF1ED] border border-[#FFD5C4] rounded-xl px-4 py-2.5 text-xs text-[#4A1B0C]">
              📍 ที่อยู่: {composedAddress}
            </div>
          )}
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
                  ${courier === c ? "border-[#FF8B66] bg-[#FFF1ED]" : "border-gray-100 hover:border-gray-200"}`}>
                <input type="radio" name="courier" value={c}
                  checked={courier === c}
                  onChange={() => { setCourier(c); setFormErrors(f => ({ ...f, courier: "" })); }}
                  className="text-[#F04E20]" />
                <span className="text-sm text-gray-700">{c}</span>
              </label>
            ))}
          </div>
          {courier === "อื่นๆ" && (
            <input
              type="text"
              placeholder="ระบุชื่อขนส่ง"
              className="mt-2 w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF663A]"
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
                  ${costSplit === opt.value ? "border-[#FF8B66] bg-[#FFF1ED]" : "border-gray-100 hover:border-gray-200"}`}>
                <input type="radio" name="cost_split" value={opt.value}
                  checked={costSplit === opt.value}
                  onChange={() => setCostSplit(opt.value)}
                  className="text-[#F04E20] mt-0.5" />
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
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF663A] resize-none"
          />
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-start gap-2">
          <span className="text-base">📋</span>
          <p className="text-xs text-blue-700">เมื่อยืนยัน ลูกค้าจะได้รับที่อยู่ร้านและรายละเอียดการส่งของ สถานะจะเปลี่ยนเป็น <strong>พัสดุกำลังมา</strong></p>
        </div>

        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

        <button type="submit" disabled={submitting}
          className="w-full bg-[#FF663A] hover:bg-[#F04E20] text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60">
          {submitting ? "กำลังบันทึก…" : "📦 ยืนยันรายละเอียดการจัดส่ง"}
        </button>
      </form>
    </div>
  );
}
