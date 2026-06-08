"use client";

// ── D-6 New Parts Request (WeeeR) ─────────────────────────────────────────────
// Broadcast ขอซื้ออะไหล่จากร้านอื่น — POST /api/v1/parts/requests

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { D6PartsRequest } from "../../_lib/d6-types";
import { URGENCY_LABEL } from "../../_lib/d6-types";
import { MockAnnoOrigin } from "@/components/MockAnno";

type UrgencyType = D6PartsRequest["urgency"];

function getExpiresAt(urgency: UrgencyType): Date {
  const hours = urgency === "emergency" ? 2 : urgency === "urgent" ? 12 : 24;
  return new Date(Date.now() + hours * 3600000);
}

export default function NewPartsRequestPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    applianceBrand: "",
    applianceModel: "",
    partName: "",
    partNumber: "",
    qtyNeeded: 1,
    urgency: "normal" as UrgencyType,
    neededBy: "",
    maxPricePerUnit: "",
    preferredCondition: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.applianceBrand.trim()) e.applianceBrand = "กรุณาระบุยี่ห้อ";
    if (!form.applianceModel.trim()) e.applianceModel = "กรุณาระบุรุ่น";
    if (!form.partName.trim()) e.partName = "กรุณาระบุชื่ออะไหล่";
    if (form.qtyNeeded < 1) e.qtyNeeded = "จำนวนต้องอย่างน้อย 1";
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setSubmitting(true);

    // Mock: save to localStorage
    setTimeout(() => {
      const saved: D6PartsRequest[] = JSON.parse(
        localStorage.getItem("d6_my_requests") ?? "[]"
      ) as D6PartsRequest[];

      const newReq: D6PartsRequest = {
        id: `REQ-${Date.now()}`,
        requesterWeeerUserId: "usr-weeer-me",
        requesterName: "ร้านของฉัน",
        applianceBrand: form.applianceBrand,
        applianceModel: form.applianceModel,
        partName: form.partName,
        partNumber: form.partNumber || undefined,
        qtyNeeded: form.qtyNeeded,
        urgency: form.urgency,
        neededBy: form.neededBy || undefined,
        maxPricePerUnit: form.maxPricePerUnit ? Number(form.maxPricePerUnit) : undefined,
        preferredCondition: form.preferredCondition || undefined,
        broadcastScope: "all",
        status: "open",
        expiresAt: getExpiresAt(form.urgency).toISOString(),
        createdAt: new Date().toISOString(),
        quoteCount: 0,
      };

      saved.push(newReq);
      localStorage.setItem("d6_my_requests", JSON.stringify(saved));
      setDone(true);
      setSubmitting(false);
    }, 800);
  };

  if (done) {
    return (
      <div className="px-4 pt-10 pb-4 text-center space-y-6">
        <p className="text-6xl">📢</p>
        <div>
          <h2 className="text-xl font-bold text-gray-800">ส่ง Broadcast แล้ว!</h2>
          <p className="text-sm text-gray-500 mt-1">ร้านอื่นจะเห็นคำขอของคุณในอีกไม่กี่วินาที</p>
        </div>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => router.push("/parts/requests/my")}
            className="px-5 py-2.5 bg-[#FF663A] text-white rounded-xl text-sm font-medium"
          >
            ดู Request ของฉัน
          </button>
          <button
            onClick={() => router.push("/parts/requests/inbox")}
            className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium"
          >
            ดู Inbox
          </button>
        </div>
      </div>
    );
  }

  const field = (key: keyof typeof form) => ({
    value: String(form[key]),
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setForm((p) => ({ ...p, [key]: key === "qtyNeeded" ? Number(e.target.value) : e.target.value }));
      setErrors((p) => ({ ...p, [key]: "" }));
    },
  });

  return (
    <div className="px-4 pt-5 pb-4 space-y-5">
      <MockAnnoOrigin from="R-62" />
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-500">← กลับ</button>
        <div>
          <h1 className="text-lg font-bold text-gray-800">ขอซื้ออะไหล่</h1>
          <p className="text-xs text-gray-500">Broadcast ไปยังร้านอื่น</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-4">
        <p className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2">ข้อมูลเครื่องใช้ไฟฟ้า</p>

        <div className="grid grid-cols-2 gap-3">
          {/* Brand */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">ยี่ห้อ *</label>
            <input
              {...field("applianceBrand")}
              placeholder="เช่น Daikin"
              className={`w-full bg-gray-50 border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF663A] ${errors.applianceBrand ? "border-red-300" : "border-gray-200"}`}
            />
            {errors.applianceBrand && <p className="text-xs text-red-500 mt-0.5">{errors.applianceBrand}</p>}
          </div>
          {/* Model */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">รุ่น *</label>
            <input
              {...field("applianceModel")}
              placeholder="เช่น FTXS25"
              className={`w-full bg-gray-50 border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF663A] ${errors.applianceModel ? "border-red-300" : "border-gray-200"}`}
            />
            {errors.applianceModel && <p className="text-xs text-red-500 mt-0.5">{errors.applianceModel}</p>}
          </div>
        </div>

        <p className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 pt-1">ข้อมูลอะไหล่</p>

        {/* Part name */}
        <div>
          <label className="text-xs text-gray-500 mb-1 block">ชื่ออะไหล่ *</label>
          <input
            {...field("partName")}
            placeholder="เช่น บอร์ดควบคุม, มอเตอร์พัดลม"
            className={`w-full bg-gray-50 border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF663A] ${errors.partName ? "border-red-300" : "border-gray-200"}`}
          />
          {errors.partName && <p className="text-xs text-red-500 mt-0.5">{errors.partName}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Part number */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Part Number (ถ้ามี)</label>
            <input
              {...field("partNumber")}
              placeholder="เช่น CTR-001"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF663A]"
            />
          </div>
          {/* Qty */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">จำนวนที่ต้องการ *</label>
            <input
              type="number"
              min={1}
              max={50}
              {...field("qtyNeeded")}
              className={`w-full bg-gray-50 border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF663A] ${errors.qtyNeeded ? "border-red-300" : "border-gray-200"}`}
            />
          </div>
        </div>

        {/* Urgency */}
        <div>
          <label className="text-xs text-gray-500 mb-1 block">ความเร่งด่วน</label>
          <select
            {...field("urgency")}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF663A]"
          >
            {(["normal", "urgent", "emergency"] as UrgencyType[]).map((u) => (
              <option key={u} value={u}>{URGENCY_LABEL[u]}</option>
            ))}
          </select>
          <p className="text-xs text-gray-400 mt-1">
            Request จะหมดอายุใน {form.urgency === "emergency" ? "2" : form.urgency === "urgent" ? "12" : "24"} ชั่วโมง
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Max price */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">ราคาสูงสุด/ชิ้น (฿)</label>
            <input
              type="number"
              {...field("maxPricePerUnit")}
              placeholder="ไม่บังคับ"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF663A]"
            />
          </div>
          {/* Needed by */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">ต้องการภายใน</label>
            <input
              type="date"
              {...field("neededBy")}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF663A]"
            />
          </div>
        </div>

        {/* Condition */}
        <div>
          <label className="text-xs text-gray-500 mb-1 block">สภาพที่ต้องการ (ถ้ามี)</label>
          <input
            {...field("preferredCondition")}
            placeholder="เช่น ใหม่เท่านั้น, มือสองได้"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF663A]"
          />
        </div>
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full py-3 bg-[#FF663A] text-white rounded-xl font-medium text-sm hover:bg-[#F04E20] disabled:opacity-60 transition-colors"
      >
        {submitting ? "กำลังส่ง..." : "📢 Broadcast คำขอ"}
      </button>
    </div>
  );
}
