"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SignupSteps } from "../page";

type BizType = "individual" | "company";

function FileUpload({ label, required, accept, hint }: { label: string; required?: boolean; accept?: string; hint?: string }) {
  const [file, setFile] = useState<File | null>(null);
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <label className={`block w-full border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${file ? "border-green-400 bg-green-50" : "border-gray-200 hover:border-green-400"}`}>
        <input
          type="file"
          accept={accept || "image/*,.pdf"}
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        {file ? (
          <div className="text-sm text-green-700">
            <div className="text-lg">✅</div>
            <div className="font-medium truncate">{file.name}</div>
            <div className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
          </div>
        ) : (
          <div className="text-sm text-gray-400">
            <div className="text-2xl mb-1">📎</div>
            <div>คลิกเพื่อเลือกไฟล์</div>
            {hint && <div className="text-xs mt-0.5">{hint}</div>}
          </div>
        )}
      </label>
    </div>
  );
}

// Thai ID / Tax ID checksum validation (mod 11)
function validateThaiId(id: string): boolean {
  if (!/^\d{13}$/.test(id)) return false;
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += parseInt(id[i]) * (13 - i);
  const check = (11 - (sum % 11)) % 10;
  return check === parseInt(id[12]);
}

export default function BusinessInfoPage() {
  const router = useRouter();
  const [bizType, setBizType] = useState<BizType>("individual");
  const [form, setForm] = useState({
    owner_full_name: "", id_card_number: "",
    company_name: "", tax_id: "",
    shop_name: "", shop_phone: "",
    representative_name: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const t = sessionStorage.getItem("weeer_business_type") as BizType;
    if (t) setBizType(t);
  }, []);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  function validate() {
    const e: Record<string, string> = {};
    if (bizType === "individual") {
      if (!form.owner_full_name.trim()) e.owner_full_name = "กรุณากรอกชื่อ-นามสกุล";
      if (!validateThaiId(form.id_card_number)) e.id_card_number = "เลขบัตรประชาชน 13 หลักไม่ถูกต้อง";
    } else {
      if (!form.company_name.trim()) e.company_name = "กรุณากรอกชื่อบริษัท";
      if (!validateThaiId(form.tax_id)) e.tax_id = "เลขนิติบุคคล 13 หลักไม่ถูกต้อง";
    }
    if (!form.shop_name.trim()) e.shop_name = "กรุณากรอกชื่อร้าน";
    if (!form.shop_phone.match(/^0[0-9]{9}$/)) e.shop_phone = "เบอร์โทรร้าน 10 หลัก";
    return e;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    router.push("/signup/shop-location");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-start justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">♻️</div>
          <h1 className="text-2xl font-bold text-green-800">ข้อมูลร้าน/บริษัท</h1>
          <p className="text-sm text-gray-500 mt-1">
            ประเภท: <span className="font-medium text-green-700">{bizType === "individual" ? "บุคคลธรรมดา" : "นิติบุคคล"}</span>
          </p>
        </div>

        <SignupSteps current={4} />

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          {bizType === "individual" ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ-นามสกุล เจ้าของ <span className="text-red-500">*</span></label>
                <input type="text" value={form.owner_full_name} onChange={(e) => set("owner_full_name", e.target.value)}
                  placeholder="นายสมชาย ใจดี" maxLength={200}
                  className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 ${errors.owner_full_name ? "border-red-400" : "border-gray-200"}`} />
                {errors.owner_full_name && <p className="text-xs text-red-500 mt-1">{errors.owner_full_name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">เลขบัตรประชาชน <span className="text-red-500">*</span></label>
                <input type="text" value={form.id_card_number} onChange={(e) => set("id_card_number", e.target.value.replace(/\D/g, ""))}
                  placeholder="1234567890123" maxLength={13}
                  className={`w-full border rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-400 ${errors.id_card_number ? "border-red-400" : "border-gray-200"}`} />
                {errors.id_card_number && <p className="text-xs text-red-500 mt-1">{errors.id_card_number}</p>}
              </div>
              <FileUpload label="รูปบัตรประชาชน" required accept="image/*" hint="JPG/PNG ขนาดไม่เกิน 5MB" />
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อบริษัท/ห้างหุ้นส่วน <span className="text-red-500">*</span></label>
                <input type="text" value={form.company_name} onChange={(e) => set("company_name", e.target.value)}
                  placeholder="บริษัท ซ่อมเก่ง จำกัด" maxLength={200}
                  className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 ${errors.company_name ? "border-red-400" : "border-gray-200"}`} />
                {errors.company_name && <p className="text-xs text-red-500 mt-1">{errors.company_name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">เลขทะเบียนนิติบุคคล (13 หลัก) <span className="text-red-500">*</span></label>
                <input type="text" value={form.tax_id} onChange={(e) => set("tax_id", e.target.value.replace(/\D/g, ""))}
                  placeholder="0105567012345" maxLength={13}
                  className={`w-full border rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-400 ${errors.tax_id ? "border-red-400" : "border-gray-200"}`} />
                {errors.tax_id && <p className="text-xs text-red-500 mt-1">{errors.tax_id}</p>}
              </div>
              <FileUpload label="หนังสือรับรองบริษัท" required accept="image/*,.pdf" hint="PDF/JPG/PNG ขนาดไม่เกิน 5MB" />
              <FileUpload label="บัตรประชาชนผู้มีอำนาจ" required accept="image/*" hint="JPG/PNG ขนาดไม่เกิน 5MB" />
            </>
          )}

          <div className="border-t border-gray-100 pt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อร้าน <span className="text-red-500">*</span></label>
              <input type="text" value={form.shop_name} onChange={(e) => set("shop_name", e.target.value)}
                placeholder="ร้านซ่อมแอร์ ABC" maxLength={200}
                className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 ${errors.shop_name ? "border-red-400" : "border-gray-200"}`} />
              {errors.shop_name && <p className="text-xs text-red-500 mt-1">{errors.shop_name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">เบอร์โทรร้าน <span className="text-red-500">*</span></label>
              <input type="tel" value={form.shop_phone} onChange={(e) => set("shop_phone", e.target.value.replace(/\D/g, ""))}
                placeholder="0212345678" maxLength={10}
                className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 ${errors.shop_phone ? "border-red-400" : "border-gray-200"}`} />
              {errors.shop_phone && <p className="text-xs text-red-500 mt-1">{errors.shop_phone}</p>}
            </div>
          </div>

          <button type="submit" className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-3 rounded-xl transition-colors">
            ถัดไป → ที่อยู่ร้าน
          </button>
        </form>
      </div>
    </div>
  );
}
