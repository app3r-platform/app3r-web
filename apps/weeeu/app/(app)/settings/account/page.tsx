"use client";
// ─── U-66: หน้าจัดการข้อมูลผู้ใช้ — WP-2 ("ผิดร้ายแรง") ──────────────────────────
// แก้ไข: อีเมล · ที่อยู่ (cascade จว/เขต/ตำบล) + พิกัด/map · บัญชีธนาคาร · (รหัสผ่าน→U-49)
// เข้าหน้านี้ต้องยืนยัน OTP (mock 123456 · ผิด 3 ครั้ง→ระงับ+แจ้ง admin+ลิงก์ปลดล็อก)
// provider OTP จริง = BE

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import OtpInput from "@/components/shared/OtpInput";
import { LocationPicker, type CascadeLocation } from "@/components/location/LocationPicker";

const MOCK_OTP = "123456";
const MAX_OTP_ATTEMPTS = 3;

type Stage = "otp" | "form" | "saved";

export default function AccountSettingsPage() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("otp");

  // OTP gate
  const [otp, setOtp] = useState("");
  const [otpAttempts, setOtpAttempts] = useState(0);
  const [otpError, setOtpError] = useState("");

  // form fields (mock prefilled — ดึงจากฐานข้อมูลตอนสมัคร)
  const [email, setEmail] = useState("somchai@example.com");
  const [loc, setLoc] = useState<CascadeLocation | null>(null);
  const [addressLine, setAddressLine] = useState("123/45 หมู่ 6");
  const [postcode, setPostcode] = useState("34000");
  const [coords, setCoords] = useState("15.2287, 104.8564");
  // U-ADDRESS-MAP: preferred service time slots (2 windows)
  const [timeSlotMorning, setTimeSlotMorning] = useState(true);
  const [timeSlotAfternoon, setTimeSlotAfternoon] = useState(false);
  const [bankName, setBankName] = useState("ธนาคารกสิกรไทย (KBank)");
  const [bankAccount, setBankAccount] = useState("123-4-56789-0");
  const [accountHolder, setAccountHolder] = useState("สมชาย ใจดี");

  const handleVerifyOtp = () => {
    setOtpError("");
    if (otp === MOCK_OTP) { setStage("form"); return; }
    const n = otpAttempts + 1;
    setOtpAttempts(n);
    setOtp("");
    if (n >= MAX_OTP_ATTEMPTS) {
      router.push("/suspended?reason=otp&from=จัดการข้อมูลผู้ใช้");
    } else {
      setOtpError(`รหัส OTP ไม่ถูกต้อง — เหลือโอกาสอีก ${MAX_OTP_ATTEMPTS - n} ครั้ง`);
    }
  };

  // ─── OTP gate ───────────────────────────────────────────────────────────────
  if (stage === "otp") {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <Link href="/profile" className="text-gray-400 hover:text-gray-600 text-xl leading-none">←</Link>
          <h1 className="text-xl font-bold text-gray-900">ยืนยันตัวตนด้วย OTP</h1>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4 shadow-sm text-center">
          <p className="text-3xl">🔐</p>
          <p className="text-sm text-gray-600">
            การจัดการข้อมูลส่วนตัวต้องยืนยันตัวตน — กรุณากรอกรหัส OTP 6 หลักที่ส่งไปยังเบอร์โทรศัพท์ที่ลงทะเบียนไว้
          </p>
          <p className="text-xs text-gray-400">(Mockup — ใช้รหัส <span className="font-bold text-weeeu-primary">123456</span> · ผู้ให้บริการ OTP จริง = BE)</p>
          <OtpInput value={otp} onChange={setOtp} />
          {otpError && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">{otpError}</p>}
          <p className="text-xs text-gray-400">กรอกได้ {MAX_OTP_ATTEMPTS} ครั้ง — หากผิดครบจะถูกระงับและต้องติดต่อผู้ดูแลระบบ</p>
          <button
            onClick={handleVerifyOtp}
            disabled={otp.length < 6}
            className="w-full bg-weeeu-primary hover:bg-weeeu-dark disabled:opacity-50 text-white font-semibold py-3.5 rounded-2xl text-sm transition-colors"
          >
            ยืนยัน OTP
          </button>
        </div>
      </div>
    );
  }

  // ─── Saved confirmation ───────────────────────────────────────────────────────
  if (stage === "saved") {
    return (
      <div className="space-y-5">
        <div className="bg-green-50 border border-green-100 rounded-2xl p-8 text-center space-y-3">
          <p className="text-4xl">✅</p>
          <h1 className="text-lg font-bold text-green-800">บันทึกข้อมูลเรียบร้อย</h1>
          <p className="text-sm text-green-600">ข้อมูลผู้ใช้ของคุณถูกอัปเดตแล้ว</p>
        </div>
        <div className="flex gap-3">
          <Link href="/profile" className="flex-1 text-center bg-weeeu-primary hover:bg-weeeu-dark text-white py-3 rounded-2xl text-sm font-semibold transition-colors">กลับโปรไฟล์</Link>
          <Link href="/dashboard" className="flex-1 text-center bg-gray-100 text-gray-700 py-3 rounded-2xl text-sm font-semibold">หน้าหลัก</Link>
        </div>
        <p className="text-xs text-center text-gray-400">* Mockup — ไม่บันทึกข้อมูลจริง</p>
      </div>
    );
  }

  // ─── Management form ──────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/profile" className="text-gray-400 hover:text-gray-600 text-xl leading-none">←</Link>
        <h1 className="text-xl font-bold text-gray-900">จัดการข้อมูลผู้ใช้</h1>
      </div>

      {/* อีเมล */}
      <section className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-800">📧 อีเมล</h2>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-weeeu-primary/30"
        />
      </section>

      {/* ที่อยู่ cascade + พิกัด + map */}
      <section className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-800">📍 ที่อยู่</h2>
        <input
          type="text"
          value={addressLine}
          onChange={(e) => setAddressLine(e.target.value)}
          placeholder="บ้านเลขที่ / หมู่ / ซอย / ถนน"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-weeeu-primary/30"
        />
        {/* cascade จังหวัด → อำเภอ/เขต → ตำบล/แขวง */}
        <LocationPicker onSelected={setLoc} />
        {loc && (
          <p className="text-xs text-weeeu-primary">เลือก: {loc.subdistrict} · {loc.district} · {loc.province}</p>
        )}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">รหัสไปรษณีย์</label>
          <input
            type="text"
            value={postcode}
            onChange={(e) => setPostcode(e.target.value)}
            inputMode="numeric"
            maxLength={5}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-weeeu-primary/30"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">พิกัด (ละติจูด, ลองจิจูด)</label>
          <input
            type="text"
            value={coords}
            onChange={(e) => setCoords(e.target.value)}
            placeholder="เช่น 15.2287, 104.8564"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-weeeu-primary/30"
          />
          {/* GPS accuracy warning */}
          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
            ⚠️ พิกัด GPS อาจคลาดเคลื่อน 10–50 เมตร — กรุณาตรวจสอบก่อนบันทึก
          </p>
          {/* Google Map placeholder — Phase D-2 (พิกัดจริง = BE) */}
          <div className="mt-2 h-32 bg-gray-50 border border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400">
            <span className="text-2xl">🗺️</span>
            {/* PHASE-4: Phase D-2 */}
            <span className="text-xs mt-1">แผนที่ (Google Map) — เร็วๆ นี้</span>
          </div>
        </div>

        {/* U-ADDRESS-MAP: ช่วงเวลาที่สะดวกรับบริการ (2 windows) */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-2">⏰ ช่วงเวลาที่สะดวกรับบริการ (ช่างเข้าบ้าน)</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTimeSlotMorning(v => !v)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-colors ${timeSlotMorning ? "border-weeeu-primary bg-weeeu-surface text-weeeu-primary" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}
            >
              🌅 ช่วงเช้า<br /><span className="text-xs font-normal">08:00–12:00</span>
            </button>
            <button
              type="button"
              onClick={() => setTimeSlotAfternoon(v => !v)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-colors ${timeSlotAfternoon ? "border-weeeu-primary bg-weeeu-surface text-weeeu-primary" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}
            >
              ☀️ ช่วงบ่าย<br /><span className="text-xs font-normal">13:00–17:00</span>
            </button>
          </div>
          {!timeSlotMorning && !timeSlotAfternoon && (
            <p className="text-xs text-red-500 mt-1">กรุณาเลือกช่วงเวลาอย่างน้อย 1 ช่วง</p>
          )}
        </div>
      </section>

      {/* บัญชีธนาคาร */}
      <section className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-800">🏦 บัญชีธนาคาร (สำหรับรับเงินถอนพอยต์ทอง)</h2>
        <input
          type="text"
          value={bankName}
          onChange={(e) => setBankName(e.target.value)}
          placeholder="ธนาคาร"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-weeeu-primary/30"
        />
        <input
          type="text"
          value={bankAccount}
          onChange={(e) => setBankAccount(e.target.value)}
          placeholder="เลขบัญชี"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-weeeu-primary/30"
        />
        <input
          type="text"
          value={accountHolder}
          onChange={(e) => setAccountHolder(e.target.value)}
          placeholder="ชื่อเจ้าของบัญชี"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-weeeu-primary/30"
        />
      </section>

      {/* รหัสผ่าน → U-49 */}
      <Link
        href="/settings/security"
        className="flex items-center justify-between bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:border-weeeu-primary/40 transition-colors"
      >
        <span className="text-sm font-semibold text-gray-800">🔑 เปลี่ยนรหัสผ่าน / ความปลอดภัย</span>
        <span className="text-gray-400">→</span>
      </Link>

      <button
        onClick={() => setStage("saved")}
        className="w-full bg-weeeu-primary hover:bg-weeeu-dark text-white font-semibold py-3.5 rounded-2xl text-sm transition-colors"
      >
        💾 บันทึกข้อมูล (Mockup)
      </button>
      <p className="text-xs text-center text-gray-400">* Mockup — ไม่บันทึกข้อมูลจริง</p>
    </div>
  );
}
