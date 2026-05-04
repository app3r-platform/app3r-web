"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SignupSteps } from "../page";

const THAI_BANKS = [
  "ธนาคารกรุงเทพ (BBL)",
  "ธนาคารกสิกรไทย (KBank)",
  "ธนาคารไทยพาณิชย์ (SCB)",
  "ธนาคารกรุงไทย (KTB)",
  "ธนาคารกรุงศรีอยุธยา (BAY)",
  "ธนาคารทหารไทยธนชาต (TTB)",
  "ธนาคารออมสิน",
  "ธนาคารเพื่อการเกษตรและสหกรณ์ (ธกส.)",
  "ธนาคารอาคารสงเคราะห์ (ธอส.)",
  "ธนาคารซีไอเอ็มบี (CIMB)",
  "ธนาคารยูโอบี (UOB)",
  "ธนาคารแลนด์แอนด์เฮ้าส์ (LH Bank)",
  "ธนาคารทิสโก้ (TISCO)",
  "ธนาคารซิตี้แบงก์ (Citi)",
  "ธนาคารอื่นๆ",
];

function FileUpload({ label, required, hint }: { label: string; required?: boolean; hint?: string }) {
  const [file, setFile] = useState<File | null>(null);
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <label className={`block w-full border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${file ? "border-green-400 bg-green-50" : "border-gray-200 hover:border-green-400"}`}>
        <input type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        {file ? (
          <div className="text-sm text-green-700">
            <div className="text-lg">✅</div>
            <div className="font-medium truncate">{file.name}</div>
          </div>
        ) : (
          <div className="text-sm text-gray-400">
            <div className="text-2xl mb-1">🏦</div>
            <div>อัปโหลดสมุดบัญชีหน้าแรก</div>
            {hint && <div className="text-xs mt-0.5">{hint}</div>}
          </div>
        )}
      </label>
    </div>
  );
}

export default function BankAccountPage() {
  const router = useRouter();
  const [form, setForm] = useState({ bank_name: "", bank_account_number: "", bank_account_name: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  function validate() {
    const e: Record<string, string> = {};
    if (!form.bank_name) e.bank_name = "กรุณาเลือกธนาคาร";
    if (!form.bank_account_number.match(/^\d{10,14}$/)) e.bank_account_number = "เลขบัญชี 10-14 หลัก";
    if (!form.bank_account_name.trim()) e.bank_account_name = "กรุณากรอกชื่อบัญชี";
    return e;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    router.push("/signup/kyc-upload");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-start justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">♻️</div>
          <h1 className="text-2xl font-bold text-green-800">บัญชีธนาคาร</h1>
          <p className="text-sm text-gray-500 mt-1">สำหรับรับเงินถอน Gold (ตาม D17)</p>
        </div>

        <SignupSteps current={6} />

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700">
            ⚠️ ชื่อบัญชีต้องตรงกับชื่อเจ้าของร้าน / นิติบุคคลที่ลงทะเบียน
          </div>

          {/* Bank name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ธนาคาร <span className="text-red-500">*</span></label>
            <select
              value={form.bank_name}
              onChange={(e) => set("bank_name", e.target.value)}
              className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white ${errors.bank_name ? "border-red-400" : "border-gray-200"}`}
            >
              <option value="">-- เลือกธนาคาร --</option>
              {THAI_BANKS.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
            {errors.bank_name && <p className="text-xs text-red-500 mt-1">{errors.bank_name}</p>}
          </div>

          {/* Account number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">เลขที่บัญชี <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={form.bank_account_number}
              onChange={(e) => set("bank_account_number", e.target.value.replace(/\D/g, ""))}
              placeholder="0123456789"
              maxLength={14}
              className={`w-full border rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-400 ${errors.bank_account_number ? "border-red-400" : "border-gray-200"}`}
            />
            {errors.bank_account_number && <p className="text-xs text-red-500 mt-1">{errors.bank_account_number}</p>}
          </div>

          {/* Account name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อบัญชี <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={form.bank_account_name}
              onChange={(e) => set("bank_account_name", e.target.value)}
              placeholder="นาย สมชาย ใจดี / บริษัท ซ่อมเก่ง จำกัด"
              maxLength={200}
              className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 ${errors.bank_account_name ? "border-red-400" : "border-gray-200"}`}
            />
            {errors.bank_account_name && <p className="text-xs text-red-500 mt-1">{errors.bank_account_name}</p>}
          </div>

          {/* Bank book image */}
          <FileUpload label="รูปสมุดบัญชีหน้าแรก" required hint="JPG/PNG ขนาดไม่เกิน 5MB" />

          <button type="submit" className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-3 rounded-xl transition-colors">
            ถัดไป → อัปโหลดเอกสาร KYC
          </button>
        </form>
      </div>
    </div>
  );
}
