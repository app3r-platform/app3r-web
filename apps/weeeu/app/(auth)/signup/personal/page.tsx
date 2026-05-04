"use client";

import { useState } from "react";
import Link from "next/link";

const GENDER_OPTIONS = [
  { value: "male", label: "ชาย" },
  { value: "female", label: "หญิง" },
  { value: "other", label: "อื่น ๆ" },
  { value: "prefer_not_say", label: "ไม่ระบุ" },
];

function validateAge(birthdate: string): boolean {
  if (!birthdate) return false;
  const birth = new Date(birthdate);
  const today = new Date();
  const age = today.getFullYear() - birth.getFullYear() -
    (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate()) ? 1 : 0);
  return age >= 13;
}

export default function SignupPersonalPage() {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    birthdate: "",
    gender: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const set = (key: string, val: string) => {
    setForm((f) => ({ ...f, [key]: val }));
    if (errors[key]) setErrors((e) => { const copy = { ...e }; delete copy[key]; return copy; });
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.first_name.trim()) e.first_name = "กรุณากรอกชื่อ";
    else if (form.first_name.trim().length > 100) e.first_name = "ชื่อต้องไม่เกิน 100 ตัวอักษร";
    if (!form.last_name.trim()) e.last_name = "กรุณากรอกนามสกุล";
    else if (form.last_name.trim().length > 100) e.last_name = "นามสกุลต้องไม่เกิน 100 ตัวอักษร";
    if (!form.birthdate) e.birthdate = "กรุณาเลือกวันเกิด";
    else if (!validateAge(form.birthdate)) e.birthdate = "ต้องมีอายุ 13 ปีขึ้นไปจึงสมัครได้";
    if (!form.gender) e.gender = "กรุณาเลือกเพศ";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    // Production: PATCH /api/v1/users/me/profile
    await new Promise((r) => setTimeout(r, 700));
    setLoading(false);
    window.location.href = "/signup/address";
  };

  const inputCls = (field: string) =>
    `w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
      errors[field] ? "border-red-400 bg-red-50" : "border-gray-200"
    }`;

  // Max birthdate = today - 13 years
  const maxDate = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 13);
    return d.toISOString().split("T")[0];
  })();

  return (
    <div className="space-y-5">
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5, 6, 7].map((s) => (
          <div key={s} className={`h-1.5 flex-1 rounded-full ${s <= 5 ? "bg-blue-600" : "bg-gray-200"}`} />
        ))}
      </div>
      <p className="text-xs text-gray-400 -mt-3">ขั้นตอนที่ 5 จาก 7</p>

      <div>
        <h2 className="text-xl font-bold text-gray-900">ข้อมูลส่วนตัว</h2>
        <p className="text-gray-500 text-sm mt-1">ช่วยให้เราให้บริการได้ดีขึ้น</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Name row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ชื่อ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="ชื่อ"
              value={form.first_name}
              maxLength={100}
              onChange={(e) => set("first_name", e.target.value)}
              className={inputCls("first_name")}
              autoComplete="given-name"
            />
            {errors.first_name && <p className="text-red-500 text-xs mt-1">{errors.first_name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              นามสกุล <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="นามสกุล"
              value={form.last_name}
              maxLength={100}
              onChange={(e) => set("last_name", e.target.value)}
              className={inputCls("last_name")}
              autoComplete="family-name"
            />
            {errors.last_name && <p className="text-red-500 text-xs mt-1">{errors.last_name}</p>}
          </div>
        </div>

        {/* Birthdate */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            วันเกิด <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={form.birthdate}
            max={maxDate}
            onChange={(e) => set("birthdate", e.target.value)}
            className={inputCls("birthdate")}
          />
          {errors.birthdate && <p className="text-red-500 text-xs mt-1">{errors.birthdate}</p>}
          <p className="text-xs text-gray-400 mt-1">ต้องมีอายุ 13 ปีขึ้นไป</p>
        </div>

        {/* Gender */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            เพศ <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {GENDER_OPTIONS.map((g) => (
              <button
                key={g.value}
                type="button"
                onClick={() => set("gender", g.value)}
                className={`py-3 rounded-xl text-sm font-medium border-2 transition-colors ${
                  form.gender === g.value
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-gray-200 text-gray-600 hover:border-blue-300"
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
          {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3.5 rounded-2xl transition-colors text-sm flex items-center justify-center gap-2 mt-2"
        >
          {loading ? <><span className="animate-spin">⟳</span> กำลังบันทึก...</> : "ถัดไป →"}
        </button>
      </form>

      <div className="flex justify-center">
        <Link href="/signup/verify-email" className="text-sm text-gray-400 hover:text-gray-600">
          ‹ กลับ
        </Link>
      </div>
    </div>
  );
}
