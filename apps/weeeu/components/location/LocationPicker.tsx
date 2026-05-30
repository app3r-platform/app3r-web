"use client";
// ─── LocationPicker (D90 · W-Round-1 Remediate) ──────────────────────────────
// Cascade dropdown จังหวัด → อำเภอ/เขต → ตำบล/แขวง (แทน freetext autocomplete เดิม)
// + ปุ่ม near-me (GPS / โปรไฟล์) — แสดงเฉพาะเมื่อผู้ใช้ล็อกอินเท่านั้น

import { useState } from "react";
import { useAuth } from "@/lib/use-auth";

export interface CascadeLocation {
  province: string;
  district: string;
  subdistrict: string;
}

interface Props {
  onSelected?: (loc: CascadeLocation) => void;
}

// Mock TH geo dataset (Phase C — Phase D-2 จะดึงจาก dataset/API จริง ครบ 77 จังหวัด)
const GEO: Record<string, Record<string, string[]>> = {
  "กรุงเทพมหานคร": {
    "บางรัก": ["สีลม", "สุริยวงศ์", "มหาพฤฒาราม"],
    "จตุจักร": ["ลาดยาว", "จตุจักร", "จอมพล"],
    "ปทุมวัน": ["ลุมพินี", "ปทุมวัน", "รองเมือง"],
  },
  "เชียงใหม่": {
    "เมืองเชียงใหม่": ["ศรีภูมิ", "พระสิงห์", "หายยา"],
    "สันทราย": ["สันทรายหลวง", "หนองหาร", "หนองจ๊อม"],
  },
  "ขอนแก่น": {
    "เมืองขอนแก่น": ["ในเมือง", "ศิลา", "บ้านเป็ด"],
    "ชุมแพ": ["ชุมแพ", "โนนหัน", "หนองไผ่"],
  },
  "ชลบุรี": {
    "เมืองชลบุรี": ["บางปลาสร้อย", "มะขามหย่ง", "บ้านสวน"],
    "ศรีราชา": ["ศรีราชา", "สุรศักดิ์", "หนองขาม"],
  },
  "อุบลราชธานี": {
    "เมืองอุบลราชธานี": ["ในเมือง", "ขามใหญ่", "ปทุม"],
    "วารินชำราบ": ["วารินชำราบ", "ธาตุ", "คำน้ำแซบ"],
  },
};

const PROVINCES = Object.keys(GEO);

export function LocationPicker({ onSelected }: Props) {
  const user = useAuth();
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [subdistrict, setSubdistrict] = useState("");
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState("");

  const districts = province ? Object.keys(GEO[province] ?? {}) : [];
  const subdistricts = province && district ? GEO[province]?.[district] ?? [] : [];

  const emit = (p: string, d: string, s: string) => {
    if (p && d && s) onSelected?.({ province: p, district: d, subdistrict: s });
  };

  const handleProvince = (v: string) => { setProvince(v); setDistrict(""); setSubdistrict(""); };
  const handleDistrict = (v: string) => { setDistrict(v); setSubdistrict(""); };
  const handleSubdistrict = (v: string) => { setSubdistrict(v); emit(province, district, v); };

  const handleNearMe = () => {
    setGeoError("");
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoError("อุปกรณ์ไม่รองรับ GPS");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      () => {
        // Phase C mock: ยังไม่มี reverse-geocode จริง → เลือกตำแหน่งตัวอย่างใกล้เคียง
        const p = PROVINCES[0];
        const d = Object.keys(GEO[p])[0];
        const s = GEO[p][d][0];
        setProvince(p); setDistrict(d); setSubdistrict(s);
        emit(p, d, s);
        setLocating(false);
      },
      () => { setGeoError("ไม่สามารถเข้าถึงตำแหน่งได้ — กรุณาเลือกด้วยตนเอง"); setLocating(false); },
    );
  };

  const selectCls =
    "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-weeeu-primary disabled:bg-gray-50 disabled:text-gray-400";

  return (
    <div className="space-y-3">
      {/* near-me — แสดงเฉพาะผู้ล็อกอิน */}
      {user && (
        <button
          type="button"
          onClick={handleNearMe}
          disabled={locating}
          className="w-full flex items-center justify-center gap-2 rounded-xl border border-weeeu-primary/30 bg-weeeu-surface py-2.5 text-sm font-medium text-weeeu-dark hover:bg-weeeu-surface/70 transition-colors disabled:opacity-60"
        >
          <span>📍</span> {locating ? "กำลังหาตำแหน่ง..." : "ใช้ตำแหน่งใกล้ฉัน (GPS)"}
        </button>
      )}

      {/* จังหวัด */}
      <select
        aria-label="จังหวัด"
        value={province}
        onChange={(e) => handleProvince(e.target.value)}
        className={selectCls}
      >
        <option value="">— เลือกจังหวัด —</option>
        {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
      </select>

      {/* อำเภอ/เขต */}
      <select
        aria-label="อำเภอ"
        value={district}
        onChange={(e) => handleDistrict(e.target.value)}
        disabled={!province}
        className={selectCls}
      >
        <option value="">— เลือกอำเภอ/เขต —</option>
        {districts.map((d) => <option key={d} value={d}>{d}</option>)}
      </select>

      {/* ตำบล/แขวง */}
      <select
        aria-label="ตำบล"
        value={subdistrict}
        onChange={(e) => handleSubdistrict(e.target.value)}
        disabled={!district}
        className={selectCls}
      >
        <option value="">— เลือกตำบล/แขวง —</option>
        {subdistricts.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>

      {geoError && <p className="text-xs text-amber-600">⚠️ {geoError}</p>}

      {province && district && subdistrict && (
        <p className="text-xs text-weeeu-primary flex items-center gap-1">
          <span>✅</span> {subdistrict}, {district}, {province}
        </p>
      )}
    </div>
  );
}
