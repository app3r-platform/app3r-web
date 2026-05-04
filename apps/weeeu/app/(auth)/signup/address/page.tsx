"use client";

import { useState } from "react";
import Link from "next/link";
import AddressAutoFill, { AddressData } from "@/components/shared/AddressAutoFill";

function validate(addr: AddressData): Partial<Record<keyof AddressData, string>> {
  const e: Partial<Record<keyof AddressData, string>> = {};
  if (!addr.address_line.trim()) e.address_line = "กรุณากรอกที่อยู่";
  else if (addr.address_line.trim().length > 200) e.address_line = "ที่อยู่ต้องไม่เกิน 200 ตัวอักษร";
  if (!addr.postal_code || addr.postal_code.length !== 5) e.postal_code = "รหัสไปรษณีย์ต้องเป็น 5 หลัก";
  if (!addr.subdistrict.trim()) e.subdistrict = "กรุณากรอกแขวง/ตำบล";
  if (!addr.district.trim()) e.district = "กรุณากรอกเขต/อำเภอ";
  if (!addr.province.trim()) e.province = "กรุณากรอกจังหวัด";
  return e;
}

export default function SignupAddressPage() {
  const [address, setAddress] = useState<AddressData>({
    address_line: "",
    postal_code: "",
    subdistrict: "",
    district: "",
    province: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof AddressData, string>>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(address);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    // Production: PATCH /api/v1/users/me/address
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    setSuccess(true);
  };

  if (success) {
    return (
      <div className="text-center space-y-6 py-4">
        <div className="w-24 h-24 bg-green-50 rounded-3xl flex items-center justify-center text-5xl mx-auto">
          🎉
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">สมัครสมาชิกสำเร็จ!</h2>
          <p className="text-gray-500 text-sm mt-2">
            ยินดีต้อนรับสู่ WeeeU<br />
            คุณพร้อมใช้งานแล้ว
          </p>
        </div>
        <div className="space-y-3">
          <Link
            href="/dashboard"
            className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-2xl text-center transition-colors text-sm"
          >
            เริ่มใช้งาน WeeeU →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5, 6, 7].map((s) => (
          <div key={s} className={`h-1.5 flex-1 rounded-full ${s <= 6 ? "bg-blue-600" : "bg-gray-200"}`} />
        ))}
      </div>
      <p className="text-xs text-gray-400 -mt-3">ขั้นตอนที่ 6 จาก 7</p>

      <div>
        <h2 className="text-xl font-bold text-gray-900">ที่อยู่ของคุณ</h2>
        <p className="text-gray-500 text-sm mt-1">
          ใช้สำหรับนัดช่าง / รับสินค้า — แก้ไขได้ภายหลัง
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-2" noValidate>
        <AddressAutoFill value={address} onChange={setAddress} errors={errors} />

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3.5 rounded-2xl transition-colors text-sm flex items-center justify-center gap-2"
          >
            {loading ? <><span className="animate-spin">⟳</span> กำลังบันทึก...</> : "เสร็จสิ้น ✓"}
          </button>
        </div>
      </form>

      <div className="flex justify-center">
        <Link href="/signup/personal" className="text-sm text-gray-400 hover:text-gray-600">
          ‹ กลับ
        </Link>
      </div>
    </div>
  );
}
