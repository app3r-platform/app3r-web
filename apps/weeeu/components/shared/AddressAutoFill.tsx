"use client";

import { useState } from "react";

export interface AddressData {
  address_line: string;
  postal_code: string;
  subdistrict: string;
  district: string;
  province: string;
}

interface AddressAutoFillProps {
  value: AddressData;
  onChange: (data: AddressData) => void;
  errors?: Partial<Record<keyof AddressData, string>>;
}

// ─── Mock postal code lookup (replace with real API call) ────────────────────
async function lookupPostalCode(
  code: string
): Promise<{ subdistrict: string; district: string; province: string } | null> {
  // Production: GET /api/v1/utils/postal-code/{code}
  // Mock data สำหรับ development / mockup
  await new Promise((r) => setTimeout(r, 400));
  const mockDB: Record<string, { subdistrict: string; district: string; province: string }> = {
    "10110": { subdistrict: "บางรัก", district: "บางรัก", province: "กรุงเทพมหานคร" },
    "10200": { subdistrict: "ป้อมปราบ", district: "ป้อมปราบศัตรูพ่าย", province: "กรุงเทพมหานคร" },
    "10300": { subdistrict: "สัมพันธวงศ์", district: "สัมพันธวงศ์", province: "กรุงเทพมหานคร" },
    "10400": { subdistrict: "พระนคร", district: "พระนคร", province: "กรุงเทพมหานคร" },
    "10500": { subdistrict: "ดุสิต", district: "ดุสิต", province: "กรุงเทพมหานคร" },
    "10600": { subdistrict: "บางซื่อ", district: "บางซื่อ", province: "กรุงเทพมหานคร" },
    "10700": { subdistrict: "จตุจักร", district: "จตุจักร", province: "กรุงเทพมหานคร" },
    "50000": { subdistrict: "พระสิงห์", district: "เมืองเชียงใหม่", province: "เชียงใหม่" },
    "40000": { subdistrict: "ในเมือง", district: "เมืองขอนแก่น", province: "ขอนแก่น" },
    "80000": { subdistrict: "ปากพูน", district: "เมืองนครศรีธรรมราช", province: "นครศรีธรรมราช" },
    "90000": { subdistrict: "บ่อยาง", district: "เมืองสงขลา", province: "สงขลา" },
    "30000": { subdistrict: "ในเมือง", district: "เมืองนครราชสีมา", province: "นครราชสีมา" },
    "20000": { subdistrict: "บ้านสวน", district: "เมืองชลบุรี", province: "ชลบุรี" },
  };
  return mockDB[code] ?? null;
}
// ─────────────────────────────────────────────────────────────────────────────

export default function AddressAutoFill({ value, onChange, errors = {} }: AddressAutoFillProps) {
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState("");

  const set = (key: keyof AddressData, val: string) =>
    onChange({ ...value, [key]: val });

  const handlePostalCode = async (code: string) => {
    set("postal_code", code);
    setFetchError("");
    if (code.length === 5) {
      setFetching(true);
      try {
        const result = await lookupPostalCode(code);
        if (result) {
          onChange({
            ...value,
            postal_code: code,
            subdistrict: result.subdistrict,
            district: result.district,
            province: result.province,
          });
        } else {
          setFetchError("ไม่พบรหัสไปรษณีย์นี้ — กรุณากรอกข้อมูลเอง");
          onChange({ ...value, postal_code: code, subdistrict: "", district: "", province: "" });
        }
      } catch {
        setFetchError("ไม่สามารถโหลดข้อมูลได้ — กรุณากรอกด้วยตนเอง");
      } finally {
        setFetching(false);
      }
    } else if (code.length < 5) {
      // Clear auto-fill when user edits below 5 digits
      onChange({ ...value, postal_code: code, subdistrict: "", district: "", province: "" });
    }
  };

  const inputCls = (err?: string) =>
    `w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
      err ? "border-red-400 bg-red-50" : "border-gray-200"
    }`;

  return (
    <div className="space-y-4">
      {/* Address line */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          ที่อยู่ <span className="text-red-500">*</span>
        </label>
        <textarea
          placeholder="บ้านเลขที่ / หมู่บ้าน / ถนน / ซอย"
          value={value.address_line}
          onChange={(e) => set("address_line", e.target.value)}
          rows={2}
          maxLength={200}
          className={inputCls(errors.address_line) + " resize-none"}
        />
        {errors.address_line && <p className="text-red-500 text-xs mt-1">{errors.address_line}</p>}
      </div>

      {/* Postal code */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          รหัสไปรษณีย์ <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            type="text"
            inputMode="numeric"
            placeholder="เช่น 10110"
            maxLength={5}
            value={value.postal_code}
            onChange={(e) => handlePostalCode(e.target.value.replace(/\D/g, ""))}
            className={inputCls(errors.postal_code) + " pr-10"}
          />
          {fetching && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 text-sm animate-spin">
              ⟳
            </span>
          )}
        </div>
        {fetchError && <p className="text-amber-600 text-xs mt-1">⚠️ {fetchError}</p>}
        {errors.postal_code && <p className="text-red-500 text-xs mt-1">{errors.postal_code}</p>}
      </div>

      {/* Subdistrict + District */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            แขวง/ตำบล <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="แขวง/ตำบล"
            value={value.subdistrict}
            onChange={(e) => set("subdistrict", e.target.value)}
            className={inputCls(errors.subdistrict)}
          />
          {errors.subdistrict && (
            <p className="text-red-500 text-xs mt-1">{errors.subdistrict}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            เขต/อำเภอ <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="เขต/อำเภอ"
            value={value.district}
            onChange={(e) => set("district", e.target.value)}
            className={inputCls(errors.district)}
          />
          {errors.district && <p className="text-red-500 text-xs mt-1">{errors.district}</p>}
        </div>
      </div>

      {/* Province */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          จังหวัด <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          placeholder="จังหวัด"
          value={value.province}
          onChange={(e) => set("province", e.target.value)}
          className={inputCls(errors.province)}
        />
        {errors.province && <p className="text-red-500 text-xs mt-1">{errors.province}</p>}
      </div>

      {/* Auto-fill hint */}
      {value.subdistrict && !fetching && (
        <p className="text-xs text-green-600 flex items-center gap-1">
          <span>✅</span> กรอกรหัสไปรษณีย์แล้ว — ข้อมูลถูก auto-fill
        </p>
      )}
    </div>
  );
}
