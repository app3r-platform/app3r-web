"use client";

import { useState } from "react";
import Link from "next/link";
import AddressAutoFill, { AddressData } from "@/components/shared/AddressAutoFill";
import OtpInput from "@/components/shared/OtpInput";

// ─── Mock user data (replace with API: GET /api/v1/users/me) ─────────────────
const MOCK_USER = {
  first_name: "สมชาย",
  last_name: "ใจดี",
  email: "somchai@email.com",
  phone_number: "0812345678",
  birthdate: "1990-04-15",
  gender: "male" as "male" | "female" | "other" | "prefer_not_say",
  address: {
    address_line: "123/45 ถ.สุขุมวิท ซ.21",
    postal_code: "10110",
    subdistrict: "บางรัก",
    district: "บางรัก",
    province: "กรุงเทพมหานคร",
  } as AddressData,
  member_since: "เม.ย. 69",
  silver_points: 1250,
  repair_count: 12,
  appliance_count: 4,
};

const GENDER_MAP: Record<string, string> = {
  male: "ชาย", female: "หญิง", other: "อื่น ๆ", prefer_not_say: "ไม่ระบุ",
};

type Section = "view" | "personal" | "address" | "phone" | "email";

export default function ProfilePage() {
  const [section, setSection] = useState<Section>("view");
  const [user, setUser] = useState(MOCK_USER);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Personal form
  const [personal, setPersonal] = useState({
    first_name: user.first_name, last_name: user.last_name,
    birthdate: user.birthdate, gender: user.gender,
  });
  const [personalErrors, setPersonalErrors] = useState<Record<string, string>>({});

  // Address form
  const [address, setAddress] = useState<AddressData>(user.address);
  const [addressErrors, setAddressErrors] = useState<Partial<Record<keyof AddressData, string>>>({});

  // Phone change
  const [newPhone, setNewPhone] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [phoneStage, setPhoneStage] = useState<"phone" | "otp">("phone");
  const [phoneError, setPhoneError] = useState("");

  // Email change
  const [newEmail, setNewEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  const showSaved = () => { setSaved(true); setTimeout(() => setSaved(false), 2500); };

  const maxDate = (() => {
    const d = new Date(); d.setFullYear(d.getFullYear() - 13);
    return d.toISOString().split("T")[0];
  })();

  const inputCls = (err?: string) =>
    `w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
      err ? "border-red-400 bg-red-50" : "border-gray-200"
    }`;

  // ─── Save personal info ──────────────────────────────────────────────────────
  const savePersonal = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!personal.first_name.trim()) errs.first_name = "กรุณากรอกชื่อ";
    if (!personal.last_name.trim()) errs.last_name = "กรุณากรอกนามสกุล";
    if (!personal.birthdate) errs.birthdate = "กรุณาเลือกวันเกิด";
    if (!personal.gender) errs.gender = "กรุณาเลือกเพศ";
    if (Object.keys(errs).length) { setPersonalErrors(errs); return; }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 700)); // Production: PATCH /api/v1/users/me/profile
    setUser((u) => ({ ...u, ...personal }));
    setSaving(false); setSection("view"); showSaved();
  };

  // ─── Save address ────────────────────────────────────────────────────────────
  const saveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Partial<Record<keyof AddressData, string>> = {};
    if (!address.address_line.trim()) errs.address_line = "กรุณากรอกที่อยู่";
    if (!address.postal_code || address.postal_code.length !== 5) errs.postal_code = "รหัสไปรษณีย์ต้องเป็น 5 หลัก";
    if (!address.subdistrict.trim()) errs.subdistrict = "กรุณากรอกแขวง/ตำบล";
    if (!address.district.trim()) errs.district = "กรุณากรอกเขต/อำเภอ";
    if (!address.province.trim()) errs.province = "กรุณากรอกจังหวัด";
    if (Object.keys(errs).length) { setAddressErrors(errs); return; }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 700)); // Production: PATCH /api/v1/users/me/address
    setUser((u) => ({ ...u, address }));
    setSaving(false); setSection("view"); showSaved();
  };

  // ─── Phone change ────────────────────────────────────────────────────────────
  const sendPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = newPhone.replace(/\D/g, "");
    if (cleaned.length !== 10) { setPhoneError("กรุณากรอกเบอร์โทร 10 หลัก"); return; }
    setPhoneError(""); setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false); setPhoneStage("otp");
  };

  const verifyPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneOtp.replace(/\s/g, "").length < 6) { setPhoneError("กรุณากรอก OTP ให้ครบ 6 หลัก"); return; }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800)); // Production: POST /api/v1/auth/verify-otp
    setUser((u) => ({ ...u, phone_number: newPhone.replace(/\D/g, "") }));
    setSaving(false); setSection("view"); showSaved();
    setPhoneStage("phone"); setNewPhone(""); setPhoneOtp("");
  };

  // ─── Email change ─────────────────────────────────────────────────────────────
  const changeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) { setEmailError("รูปแบบ Email ไม่ถูกต้อง"); return; }
    setEmailError(""); setSaving(true);
    await new Promise((r) => setTimeout(r, 700));
    setSaving(false); setEmailSent(true);
  };

  // ─── VIEW ────────────────────────────────────────────────────────────────────
  if (section === "view") return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">โปรไฟล์ของฉัน</h1>
        {saved && <span className="text-sm text-green-600 font-medium bg-green-50 px-3 py-1 rounded-full">✅ บันทึกแล้ว</span>}
      </div>

      {/* Avatar + stats */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center text-3xl font-bold text-blue-700 select-none">
              {user.first_name.charAt(0)}{user.last_name.charAt(0)}
            </div>
            <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs hover:bg-blue-700">✏️</button>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">{user.first_name} {user.last_name}</h2>
            <p className="text-gray-500 text-sm">{user.phone_number.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3")}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-medium">💎 Silver Member</span>
              <span className="text-xs text-gray-400">สมาชิกตั้งแต่ {user.member_since}</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-gray-100">
          {[
            { label: "เครื่องใช้ไฟฟ้า", value: String(user.appliance_count), icon: "🔌" },
            { label: "รายการซ่อม", value: String(user.repair_count), icon: "🔧" },
            { label: "Silver Point", value: user.silver_points.toLocaleString(), icon: "💎" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-xl">{s.icon}</p>
              <p className="text-lg font-bold text-gray-900 mt-1">{s.value}</p>
              <p className="text-xs text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Personal info */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">ข้อมูลส่วนตัว</p>
          <button onClick={() => setSection("personal")} className="text-xs text-blue-600 hover:text-blue-800 font-medium">แก้ไข</button>
        </div>
        <div className="divide-y divide-gray-50">
          {[
            { label: "ชื่อ-นามสกุล", value: `${user.first_name} ${user.last_name}` },
            { label: "วันเกิด", value: user.birthdate ? new Date(user.birthdate).toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" }) : "-" },
            { label: "เพศ", value: GENDER_MAP[user.gender] ?? "-" },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between px-5 py-4">
              <p className="text-sm text-gray-500">{item.label}</p>
              <p className="text-sm font-medium text-gray-900">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Contact */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">ช่องทางติดต่อ</p>
        </div>
        <div className="divide-y divide-gray-50">
          <div className="flex items-center justify-between px-5 py-4">
            <p className="text-sm text-gray-500">เบอร์โทร</p>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-gray-900">{user.phone_number.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3")}</p>
              <button onClick={() => setSection("phone")} className="text-xs text-blue-500 hover:text-blue-700">เปลี่ยน</button>
            </div>
          </div>
          <div className="flex items-center justify-between px-5 py-4">
            <p className="text-sm text-gray-500">Email</p>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-gray-900 truncate max-w-[160px]">{user.email}</p>
              <button onClick={() => setSection("email")} className="text-xs text-blue-500 hover:text-blue-700">เปลี่ยน</button>
            </div>
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">ที่อยู่</p>
          <button onClick={() => setSection("address")} className="text-xs text-blue-600 hover:text-blue-800 font-medium">แก้ไข</button>
        </div>
        <div className="px-5 py-4 space-y-1">
          <p className="text-sm text-gray-700">{user.address.address_line}</p>
          <p className="text-sm text-gray-500">แขวง{user.address.subdistrict} เขต{user.address.district}</p>
          <p className="text-sm text-gray-500">{user.address.province} {user.address.postal_code}</p>
        </div>
      </div>

      {/* Security */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">ความปลอดภัย</p>
        </div>
        <Link href="/settings/security" className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-3"><span>🔒</span><span className="text-sm font-medium text-gray-700">เปลี่ยนรหัสผ่าน</span></div>
          <span className="text-gray-400">›</span>
        </Link>
      </div>

      {/* Logout */}
      <button className="w-full flex items-center justify-center gap-2 py-4 border border-red-200 rounded-2xl text-red-500 hover:bg-red-50 transition-colors font-medium text-sm">
        🚪 ออกจากระบบ
      </button>
      <button className="w-full text-center text-xs text-gray-400 hover:text-red-400 transition-colors py-2">
        ลบบัญชีผู้ใช้
      </button>
    </div>
  );

  // ─── EDIT PERSONAL ───────────────────────────────────────────────────────────
  if (section === "personal") return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => setSection("view")} className="text-gray-500 hover:text-gray-800 text-xl">‹</button>
        <h1 className="text-xl font-bold text-gray-900">แก้ไขข้อมูลส่วนตัว</h1>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <form onSubmit={savePersonal} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ <span className="text-red-500">*</span></label>
              <input type="text" value={personal.first_name} onChange={(e) => setPersonal((p) => ({ ...p, first_name: e.target.value }))} className={inputCls(personalErrors.first_name)} maxLength={100} />
              {personalErrors.first_name && <p className="text-red-500 text-xs mt-1">{personalErrors.first_name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">นามสกุล <span className="text-red-500">*</span></label>
              <input type="text" value={personal.last_name} onChange={(e) => setPersonal((p) => ({ ...p, last_name: e.target.value }))} className={inputCls(personalErrors.last_name)} maxLength={100} />
              {personalErrors.last_name && <p className="text-red-500 text-xs mt-1">{personalErrors.last_name}</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">วันเกิด <span className="text-red-500">*</span></label>
            <input type="date" value={personal.birthdate} max={maxDate} onChange={(e) => setPersonal((p) => ({ ...p, birthdate: e.target.value }))} className={inputCls(personalErrors.birthdate)} />
            {personalErrors.birthdate && <p className="text-red-500 text-xs mt-1">{personalErrors.birthdate}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">เพศ <span className="text-red-500">*</span></label>
            <div className="grid grid-cols-2 gap-2">
              {[{ value: "male", label: "ชาย" }, { value: "female", label: "หญิง" }, { value: "other", label: "อื่น ๆ" }, { value: "prefer_not_say", label: "ไม่ระบุ" }].map((g) => (
                <button key={g.value} type="button" onClick={() => setPersonal((p) => ({ ...p, gender: g.value as typeof personal.gender }))} className={`py-3 rounded-xl text-sm font-medium border-2 transition-colors ${personal.gender === g.value ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600"}`}>{g.label}</button>
              ))}
            </div>
            {personalErrors.gender && <p className="text-red-500 text-xs mt-1">{personalErrors.gender}</p>}
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setSection("view")} className="flex-1 border border-gray-200 text-gray-600 font-semibold py-3 rounded-2xl text-sm">ยกเลิก</button>
            <button type="submit" disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-2xl text-sm flex items-center justify-center gap-2">
              {saving ? <><span className="animate-spin">⟳</span> บันทึก...</> : "บันทึก"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // ─── EDIT ADDRESS ─────────────────────────────────────────────────────────────
  if (section === "address") return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => setSection("view")} className="text-gray-500 hover:text-gray-800 text-xl">‹</button>
        <h1 className="text-xl font-bold text-gray-900">แก้ไขที่อยู่</h1>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <form onSubmit={saveAddress} className="space-y-2">
          <AddressAutoFill value={address} onChange={setAddress} errors={addressErrors} />
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={() => setSection("view")} className="flex-1 border border-gray-200 text-gray-600 font-semibold py-3 rounded-2xl text-sm">ยกเลิก</button>
            <button type="submit" disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-2xl text-sm flex items-center justify-center gap-2">
              {saving ? <><span className="animate-spin">⟳</span> บันทึก...</> : "บันทึก"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // ─── CHANGE PHONE ─────────────────────────────────────────────────────────────
  if (section === "phone") return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => { setSection("view"); setPhoneStage("phone"); setNewPhone(""); setPhoneOtp(""); setPhoneError(""); }} className="text-gray-500 hover:text-gray-800 text-xl">‹</button>
        <h1 className="text-xl font-bold text-gray-900">เปลี่ยนเบอร์โทร</h1>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
          <p className="text-xs text-amber-700">เบอร์ปัจจุบัน: <strong>{user.phone_number.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3")}</strong></p>
        </div>
        {phoneStage === "phone" ? (
          <form onSubmit={sendPhoneOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">เบอร์โทรใหม่ <span className="text-red-500">*</span></label>
              <input type="tel" inputMode="numeric" placeholder="0812345678" value={newPhone} maxLength={10} onChange={(e) => { setNewPhone(e.target.value.replace(/\D/g, "")); setPhoneError(""); }} className={inputCls(phoneError)} />
              {phoneError && <p className="text-red-500 text-xs mt-1">{phoneError}</p>}
            </div>
            <button type="submit" disabled={saving} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-2xl text-sm flex items-center justify-center gap-2">
              {saving ? <><span className="animate-spin">⟳</span> ส่ง OTP...</> : "ส่ง OTP ยืนยัน"}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyPhoneOtp} className="space-y-6">
            <p className="text-sm text-gray-600 text-center">ส่ง OTP ไปที่ {newPhone.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3")}</p>
            <OtpInput value={phoneOtp} onChange={setPhoneOtp} disabled={saving} />
            {phoneError && <p className="text-red-500 text-xs text-center">{phoneError}</p>}
            <button type="submit" disabled={saving || phoneOtp.replace(/\s/g, "").length < 6} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-2xl text-sm flex items-center justify-center gap-2">
              {saving ? <><span className="animate-spin">⟳</span> กำลังยืนยัน...</> : "ยืนยัน OTP"}
            </button>
            <button type="button" onClick={() => { setPhoneStage("phone"); setPhoneOtp(""); setPhoneError(""); }} className="w-full text-sm text-gray-400 hover:text-gray-600">เปลี่ยนเบอร์</button>
          </form>
        )}
      </div>
    </div>
  );

  // ─── CHANGE EMAIL ─────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => { setSection("view"); setEmailSent(false); setNewEmail(""); setEmailError(""); }} className="text-gray-500 hover:text-gray-800 text-xl">‹</button>
        <h1 className="text-xl font-bold text-gray-900">เปลี่ยน Email</h1>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
          <p className="text-xs text-amber-700">Email ปัจจุบัน: <strong>{user.email}</strong></p>
        </div>
        {emailSent ? (
          <div className="text-center space-y-4 py-4">
            <div className="text-4xl">✉️</div>
            <p className="text-sm font-semibold text-gray-800">ส่งลิงก์ยืนยันแล้ว</p>
            <p className="text-xs text-gray-500">ตรวจสอบ inbox ที่ <strong>{newEmail}</strong> และคลิกลิงก์เพื่อยืนยัน Email ใหม่</p>
            <button onClick={() => { setSection("view"); setEmailSent(false); setNewEmail(""); }} className="text-sm text-blue-600 hover:text-blue-800 font-medium">กลับโปรไฟล์</button>
          </div>
        ) : (
          <form onSubmit={changeEmail} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email ใหม่ <span className="text-red-500">*</span></label>
              <input type="email" placeholder="newemail@example.com" value={newEmail} onChange={(e) => { setNewEmail(e.target.value); setEmailError(""); }} className={inputCls(emailError)} autoComplete="email" />
              {emailError && <p className="text-red-500 text-xs mt-1">{emailError}</p>}
              <p className="text-xs text-gray-400 mt-1">ระบบจะส่งลิงก์ยืนยันไปที่ Email ใหม่</p>
            </div>
            <button type="submit" disabled={saving} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-2xl text-sm flex items-center justify-center gap-2">
              {saving ? <><span className="animate-spin">⟳</span> กำลังดำเนินการ...</> : "ส่งลิงก์ยืนยัน"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
