"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SignupSteps } from "../page";

const MOCK_POSTAL: Record<string, { subdistrict: string; district: string; province: string }> = {
  "10110": { subdistrict: "คลองเตย", district: "คลองเตย", province: "กรุงเทพมหานคร" },
  "10200": { subdistrict: "พระบรมมหาราชวัง", district: "พระนคร", province: "กรุงเทพมหานคร" },
  "10900": { subdistrict: "บางบัวทอง", district: "บางบัวทอง", province: "นนทบุรี" },
};

export default function ShopLocationPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    shop_address_line: "",
    shop_postal_code: "",
    shop_subdistrict: "",
    shop_district: "",
    shop_province: "",
    shop_latitude: "",
    shop_longitude: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [postalLoading, setPostalLoading] = useState(false);
  const [mapPinned, setMapPinned] = useState(false);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  function handlePostalCode(v: string) {
    const code = v.replace(/\D/g, "").slice(0, 5);
    set("shop_postal_code", code);
    if (code.length === 5) {
      setPostalLoading(true);
      setTimeout(() => {
        const data = MOCK_POSTAL[code];
        if (data) {
          setForm((f) => ({ ...f, shop_postal_code: code, ...data }));
        } else {
          setForm((f) => ({ ...f, shop_postal_code: code, shop_subdistrict: "", shop_district: "", shop_province: "" }));
        }
        setPostalLoading(false);
      }, 400);
    }
  }

  function handleMapPin() {
    // Mock GPS — actual จะ integrate Google Maps API (ต้องการ API key จาก อ.PP)
    setForm((f) => ({ ...f, shop_latitude: "13.7563", shop_longitude: "100.5018" }));
    setMapPinned(true);
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.shop_address_line.trim()) e.shop_address_line = "กรุณากรอกที่อยู่";
    if (form.shop_postal_code.length !== 5) e.shop_postal_code = "รหัสไปรษณีย์ 5 หลัก";
    if (!form.shop_subdistrict) e.shop_postal_code = "ไม่พบรหัสไปรษณีย์นี้";
    if (!form.shop_latitude) e.map = "กรุณาปักหมุดบนแผนที่";
    return e;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    router.push("/signup/bank-account");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-start justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">♻️</div>
          <h1 className="text-2xl font-bold text-green-800">ที่อยู่ร้าน</h1>
          <p className="text-sm text-gray-500 mt-1">สถานที่ตั้งจริงของร้าน/บริษัท</p>
        </div>

        <SignupSteps current={5} />

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          {/* Address line */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">บ้านเลขที่ / ถนน / ซอย <span className="text-red-500">*</span></label>
            <textarea
              rows={2}
              value={form.shop_address_line}
              onChange={(e) => set("shop_address_line", e.target.value)}
              placeholder="123/4 ถนนสุขุมวิท ซอย 11"
              maxLength={200}
              className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none ${errors.shop_address_line ? "border-red-400" : "border-gray-200"}`}
            />
            {errors.shop_address_line && <p className="text-xs text-red-500 mt-1">{errors.shop_address_line}</p>}
          </div>

          {/* Postal code + auto-fill */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">รหัสไปรษณีย์ <span className="text-red-500">*</span></label>
            <div className="relative">
              <input
                type="text"
                value={form.shop_postal_code}
                onChange={(e) => handlePostalCode(e.target.value)}
                placeholder="10110"
                maxLength={5}
                className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 ${errors.shop_postal_code ? "border-red-400" : "border-gray-200"}`}
              />
              {postalLoading && <span className="absolute right-3 top-2.5 text-xs text-gray-400">ค้นหา…</span>}
            </div>
            {errors.shop_postal_code && <p className="text-xs text-red-500 mt-1">{errors.shop_postal_code}</p>}
          </div>

          {/* Auto-filled fields */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { k: "shop_subdistrict", l: "แขวง/ตำบล" },
              { k: "shop_district", l: "เขต/อำเภอ" },
              { k: "shop_province", l: "จังหวัด" },
            ].map(({ k, l }) => (
              <div key={k}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{l}</label>
                <input
                  type="text"
                  readOnly
                  value={(form as Record<string, string>)[k]}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 text-gray-600"
                  placeholder="(อัตโนมัติ)"
                />
              </div>
            ))}
          </div>

          {/* GPS Map */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              พิกัด GPS <span className="text-red-500">*</span>
              <span className="text-xs text-gray-400 ml-1">(ต้องการ Google Maps API key)</span>
            </label>
            <div className={`w-full h-40 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${mapPinned ? "border-green-400 bg-green-50" : "border-gray-200 hover:border-green-300 bg-gray-50"}`}
              onClick={handleMapPin}>
              {mapPinned ? (
                <div className="text-center">
                  <div className="text-3xl">📍</div>
                  <div className="text-sm font-medium text-green-700">ปักหมุดแล้ว</div>
                  <div className="text-xs text-gray-500">{form.shop_latitude}, {form.shop_longitude}</div>
                </div>
              ) : (
                <div className="text-center text-gray-400">
                  <div className="text-3xl">🗺️</div>
                  <div className="text-sm">คลิกเพื่อปักหมุดตำแหน่ง</div>
                  <div className="text-xs">(Mock — Google Maps API required)</div>
                </div>
              )}
            </div>
            {errors.map && <p className="text-xs text-red-500 mt-1">{errors.map}</p>}
          </div>

          <button type="submit" className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-3 rounded-xl transition-colors">
            ถัดไป → บัญชีธนาคาร
          </button>
        </form>
      </div>
    </div>
  );
}
