"use client";
import { useState } from "react";
import Link from "next/link";
import { useMockRole } from "@/lib/auth/useMockRole";
import { crossAppUrls } from "@/lib/config/urls";
import { MockAnnoOrigin, MockAnnoXapp } from "@/components/common";
import { HelpTip } from "@app3r/ui";
import { LocationCascade } from "@/components/listings/LocationCascade";

type Step = 1 | 2 | 3 | 4;

interface FormData {
  // Step 1: Business Info
  businessName: string;
  businessType: string;
  taxId: string;
  registrationNumber: string;
  // Step 2: Contact
  ownerName: string;
  email: string;
  phone: string;
  lineId: string;
  password: string;
  confirmPassword: string;
  // Step 3: Address & Services
  address: string;
  subDistrict: string;
  district: string;
  province: string;
  postalCode: string;
  serviceTypes: string[];
  serviceArea: string;
  // Step 4: Documents
  idCardFile: string;
  businessLicenseFile: string;
  vatCertFile: string;
  profilePhotoFile: string;
  agreeTerms: boolean;
  agreePrivacy: boolean;
}

const stepLabels = [
  "ข้อมูลธุรกิจ",
  "ข้อมูลติดต่อ",
  "ที่อยู่ & บริการ",
  "เอกสาร & ยืนยัน",
];

const serviceTypeOptions = [
  "ซ่อมแอร์",
  "ล้างแอร์",
  "ซ่อมตู้เย็น",
  "ซ่อมเครื่องซักผ้า",
  "ล้างเครื่องซักผ้า",
  "ซ่อมทีวี",
  "ซ่อมเครื่องดูดฝุ่น",
  "ซ่อมไมโครเวฟ",
  "รับซื้อเครื่องใช้ไฟฟ้ามือสอง",
  "รับซื้อซากเครื่องใช้ไฟฟ้า",
];

// Round 2: ใช้ crossAppUrls (เดิมใช้ env var ผิดชื่อ NEXT_PUBLIC_WEEER_APP_URL)
const WEEER_APP_URL = crossAppUrls.weeer.base;

export default function RegisterWeeeRPage() {
  // W-2-C (D4): default = landing page → CTA redirect ไป WeeeR app
  // กด "ใช้ form ทางลัด" → แสดง 4-step form เดิม (fallback ป้องกัน WeeeR app down)
  const [showLocalForm, setShowLocalForm] = useState(false);
  const [step, setStep] = useState<Step>(1);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState<Partial<FormData>>({
    serviceTypes: [],
    agreeTerms: false,
    agreePrivacy: false,
  });

  // Round 2 — role enforcement สมัคร WeeeR (กฎธุรกิจ §9)
  const { role, mounted } = useMockRole();
  if (mounted && role === "weeet") {
    return <RoleBlockedScreen variant="weeet" />;
  }
  if (mounted && role === "weeer") {
    return <RoleBlockedScreen variant="weeer" />;
  }
  // W-18: WeeeU ต้องออกจากระบบก่อนจึงสมัครเป็น WeeeR ได้ (1 บัญชี 1 บทบาท)
  if (mounted && role === "weeeu") {
    return <RoleBlockedScreen variant="weeeu" />;
  }

  // W-2-C: Landing page (default view)
  if (!showLocalForm && !submitted) {
    return (
      <div className="min-h-screen bg-gray-50 py-10 px-4">
        <div className="max-w-3xl mx-auto">
          {/* §5 mock-anno-origin: มาจากหลายจุด — home CTA + listing detail pages */}
          <MockAnnoOrigin from={["W-01", "W-07", "W-08", "W-09", "W-10", "W-11", "W-12", "W-13", "W-14"]} />
          {/* §8 mock-anno-xapp: WeeeR เริ่มสมัครที่ Website → ถูก redirect ไป WeeeR app จริง */}
          <MockAnnoXapp
            context="สมัคร WeeeR → redirect ไป WeeeR app"
            apps={[
              { app: "WeeeR", screen: "R-register", href: "http://localhost:3001/register", label: "ฟอร์มสมัคร WeeeR" },
            ]}
          />
          {/* Breadcrumb */}
          <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2">
            <Link href="/" className="hover:text-website-brand-500">หน้าหลัก</Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">สมัคร WeeeR</span>
          </nav>

          {/* Hero */}
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-2xl p-8 sm:p-10 mb-6 shadow-lg">
            <div className="text-4xl mb-3">🔧</div>
            <h1 className="text-3xl sm:text-4xl font-extrabold mb-3">สมัครเป็นร้าน WeeeR</h1>
            <p className="text-orange-100 text-base sm:text-lg max-w-2xl">
              ร้านซ่อม / ร้านบำรุงรักษา / ร้านรับซื้อเครื่องใช้ไฟฟ้ามือสองและซาก
              — เข้าร่วมเครือข่าย App3R ทั่วประเทศ
            </p>
          </div>

          {/* What is WeeeR */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">WeeeR คือใคร?</h2>
            <ul className="space-y-3 text-sm text-gray-700">
              <li className="flex gap-3">
                <span className="text-orange-500 text-lg shrink-0">✓</span>
                <span><strong>ร้านซ่อม / ช่างมืออาชีพ</strong> — รับงานซ่อมและบำรุงรักษาจากลูกค้าที่ลงประกาศบน App3R</span>
              </li>
              <li className="flex gap-3">
                <span className="text-orange-500 text-lg shrink-0">✓</span>
                <span><strong>ร้านรับซื้อมือสอง / ซาก</strong> — เห็นประกาศขายมือสอง+ซากจากทั่วประเทศ ยื่นข้อเสนอได้ทันที</span>
              </li>
              <li className="flex gap-3">
                <span className="text-orange-500 text-lg shrink-0">✓</span>
                <span><strong>สิทธิ์เพิ่มเติม</strong> — จัดการช่าง WeeeT ในร้าน · ระบบพักเงินกลาง (Escrow) · รายงานยอดขาย</span>
              </li>
            </ul>
          </div>

          {/* Benefits */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            <div className="bg-website-brand-50 border border-website-brand-200 rounded-xl p-4 text-center">
              <div className="text-2xl mb-1">📊</div>
              <p className="font-semibold text-website-brand-900 text-sm">รายงานยอดขาย</p>
              <p className="text-xs text-website-brand-700 mt-0.5">แดชบอร์ดแบบเรียลไทม์</p>
            </div>
            <div className="bg-website-brand-50 border border-website-brand-200 rounded-xl p-4 text-center">
              <div className="text-2xl mb-1">🛡️</div>
              <p className="font-semibold text-website-brand-900 text-sm flex items-center justify-center gap-1">
                ระบบพักเงินกลาง (Escrow) คุ้มครอง
                <HelpTip
                  content="เงินของคุณจะถูกเก็บไว้ในระบบกลางอย่างปลอดภัย จนกว่างานเสร็จและคุณยืนยัน จึงโอนให้ปลายทาง"
                  ariaLabel="ระบบพักเงินกลางคืออะไร"
                />
              </p>
              <p className="text-xs text-website-brand-700 mt-0.5">รับเงินตรงเวลา</p>
            </div>
            <div className="bg-website-brand-50 border border-website-brand-200 rounded-xl p-4 text-center">
              <div className="text-2xl mb-1">👥</div>
              <p className="font-semibold text-website-brand-900 text-sm">ทีมช่าง WeeeT</p>
              <p className="text-xs text-website-brand-700 mt-0.5">ฟรี 1 บัญชี/ร้าน</p>
            </div>
          </div>

          {/* Primary CTA → WeeeR app */}
          <div className="bg-white border-2 border-orange-300 rounded-2xl p-6 mb-4 text-center">
            <p className="text-sm text-gray-600 mb-3">สมัครรวดเร็ว ปลอดภัย ผ่านแอป WeeeR โดยตรง</p>
            <a
              href={`${WEEER_APP_URL}/register`}
              className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-3.5 rounded-xl text-lg transition shadow-md"
            >
              เริ่มสมัคร →
            </a>
            <p className="text-xs text-gray-400 mt-3">
              คุณจะถูกพาไปยัง WeeeR app — ใช้ฟอร์มทันสมัย ตรวจสอบเอกสารอัตโนมัติ
            </p>
          </div>

          {/* Fallback link */}
          <div className="text-center text-xs text-gray-500">
            WeeeR app ไม่พร้อมใช้งาน?{" "}
            <button
              onClick={() => setShowLocalForm(true)}
              className="text-orange-600 hover:text-orange-700 hover:underline font-semibold"
            >
              ใช้ form ทางลัด →
            </button>
          </div>

          {/* Login link */}
          <p className="text-center text-gray-500 text-sm mt-6">
            มีบัญชี WeeeR แล้ว?{" "}
            <a href={`${WEEER_APP_URL}/login`} className="text-orange-600 hover:underline font-medium">
              เข้าสู่ระบบ
            </a>
          </p>
        </div>
      </div>
    );
  }

  const updateForm = (field: keyof FormData, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleService = (service: string) => {
    const current = form.serviceTypes || [];
    if (current.includes(service)) {
      updateForm("serviceTypes", current.filter((s) => s !== service));
    } else {
      updateForm("serviceTypes", [...current, service]);
    }
  };

  const handleNext = () => {
    if (step < 4) setStep((s) => (s + 1) as Step);
    else setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 max-w-md w-full text-center space-y-5">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-4xl mx-auto">
            ✅
          </div>
          <h2 className="text-2xl font-bold text-gray-900">ส่งใบสมัครแล้ว!</h2>
          <p className="text-gray-600">
            ทีม App3R จะตรวจสอบเอกสารและอนุมัติภายใน <strong>3-5 วันทำการ</strong>
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left space-y-1">
            <p className="text-sm font-semibold text-amber-900">สถานะ: 🟡 รอการอนุมัติ</p>
            <p className="text-xs text-amber-700">
              คุณจะได้รับอีเมลแจ้งผลที่ <strong>{form.email || "อีเมลที่กรอก"}</strong>
            </p>
          </div>
          <div className="space-y-2 text-sm text-gray-600">
            <p>ขณะรอการอนุมัติ คุณสามารถ:</p>
            <ul className="list-disc list-inside space-y-1 text-left">
              <li>ดูประกาศซ่อมในพื้นที่ของคุณ</li>
              <li>อ่านบทความและเตรียมตัว</li>
              <li>ดาวน์โหลดแอป WeeeT ล่วงหน้า</li>
            </ul>
          </div>
          <Link
            href="/"
            className="block bg-website-brand-700 text-white px-6 py-3 rounded-xl font-semibold hover:bg-website-brand-800 transition"
          >
            กลับหน้าหลัก
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2">
          <Link href="/" className="hover:text-website-brand-700">หน้าหลัก</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">สมัคร WeeeR</span>
        </nav>

        <h1 className="text-2xl font-bold text-gray-900 mb-1">สมัครเป็นสมาชิก WeeeR</h1>
        <p className="text-gray-500 text-sm mb-3">
          ร้านซ่อม / บริษัทบริการ / ร้านรับซื้อเครื่องใช้ไฟฟ้า
        </p>

        {/* W-2-C: ปุ่มกลับไป landing (สำหรับใช้ WeeeR app แทน) */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 mb-6 flex items-center justify-between gap-3">
          <span className="text-xs text-amber-800">
            💡 ใช้ form นี้เป็นทางลัด — สมัครแบบครบครันที่ WeeeR app
          </span>
          <button
            onClick={() => setShowLocalForm(false)}
            className="text-xs text-orange-700 hover:text-orange-800 font-semibold whitespace-nowrap"
          >
            ใช้ WeeeR app →
          </button>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-between mb-8">
          {stepLabels.map((label, i) => {
            const s = (i + 1) as Step;
            const isActive = s === step;
            const isDone = s < step;
            return (
              <div key={label} className="flex-1 flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                    isDone
                      ? "bg-green-500 text-white"
                      : isActive
                      ? "bg-website-brand-700 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {isDone ? "✓" : s}
                </div>
                <span className={`text-xs mt-1 hidden sm:block ${isActive ? "text-website-brand-700 font-medium" : "text-gray-400"}`}>
                  {label}
                </span>
                {i < stepLabels.length - 1 && (
                  <div className={`hidden sm:block absolute h-0.5 w-full top-4 left-1/2 ${isDone ? "bg-green-300" : "bg-gray-200"}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Form card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-6">
          {/* Step 1: Business Info */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-900">ข้อมูลธุรกิจ</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อร้าน / ชื่อบริษัท <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.businessName || ""}
                  onChange={(e) => updateForm("businessName", e.target.value)}
                  placeholder="เช่น ร้านซ่อมแอร์สมหมาย, บริษัท XYZ จำกัด"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-website-brand-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ประเภทธุรกิจ <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.businessType || ""}
                  onChange={(e) => updateForm("businessType", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-website-brand-500"
                >
                  <option value="">เลือกประเภท</option>
                  <option>บุคคลธรรมดา (ร้านค้าทั่วไป)</option>
                  <option>ห้างหุ้นส่วนจำกัด</option>
                  <option>บริษัทจำกัด</option>
                  <option>บริษัทมหาชนจำกัด</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  เลขประจำตัวผู้เสียภาษี (13 หลัก)
                  <span className="text-gray-400 text-xs font-normal ml-1">(ถ้ามี)</span>
                </label>
                <input
                  type="text"
                  value={form.taxId || ""}
                  onChange={(e) => updateForm("taxId", e.target.value)}
                  placeholder="0-0000-00000-00-0"
                  maxLength={13}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-website-brand-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  เลขทะเบียนพาณิชย์
                  <span className="text-gray-400 text-xs font-normal ml-1">(ถ้ามี)</span>
                </label>
                <input
                  type="text"
                  value={form.registrationNumber || ""}
                  onChange={(e) => updateForm("registrationNumber", e.target.value)}
                  placeholder="เลขทะเบียนพาณิชย์"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-website-brand-500"
                />
              </div>
            </div>
          )}

          {/* Step 2: Contact */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-900">ข้อมูลติดต่อ</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ชื่อเจ้าของ / ผู้ติดต่อหลัก <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.ownerName || ""}
                    onChange={(e) => updateForm("ownerName", e.target.value)}
                    placeholder="ชื่อ-นามสกุล"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-website-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    อีเมล <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={form.email || ""}
                    onChange={(e) => updateForm("email", e.target.value)}
                    placeholder="email@example.com"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-website-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    เบอร์โทรศัพท์ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={form.phone || ""}
                    onChange={(e) => updateForm("phone", e.target.value)}
                    placeholder="08X-XXX-XXXX"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-website-brand-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    LINE ID (ไอดีไลน์){" "}
                    {/* LINE brand icon — #06C755 */}
                    <span
                      className="inline-flex items-center justify-center w-4 h-4 rounded bg-[#06C755] text-white text-[8px] font-extrabold leading-none ml-0.5 align-middle select-none"
                      aria-hidden="true"
                    >
                      L
                    </span>
                    <span className="text-gray-400 text-xs font-normal ml-1">(ถ้ามี)</span>
                  </label>
                  <input
                    type="text"
                    value={form.lineId || ""}
                    onChange={(e) => updateForm("lineId", e.target.value)}
                    placeholder="@yourlineid"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-website-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    รหัสผ่าน <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={form.password || ""}
                    onChange={(e) => updateForm("password", e.target.value)}
                    placeholder="อย่างน้อย 8 ตัวอักษร"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-website-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ยืนยันรหัสผ่าน <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={form.confirmPassword || ""}
                    onChange={(e) => updateForm("confirmPassword", e.target.value)}
                    placeholder="กรอกรหัสผ่านอีกครั้ง"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-website-brand-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Address & Services */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-gray-900">ที่อยู่ & ประเภทบริการ</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ที่อยู่ <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={form.address || ""}
                  onChange={(e) => updateForm("address", e.target.value)}
                  placeholder="บ้านเลขที่ ถนน ซอย"
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-website-brand-500 resize-none"
                />
              </div>
              {/* 3.2 Cascade Address — จังหวัด → อำเภอ → ตำบล (GR-9) */}
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-700">
                  ที่อยู่ร้าน (จังหวัด / อำเภอ / ตำบล) <span className="text-red-500">*</span>
                </p>
                <LocationCascade
                  onChange={({ provinceId, amphoeId, tambonId }) => {
                    updateForm("province", provinceId !== null ? String(provinceId) : "");
                    updateForm("district", amphoeId !== null ? String(amphoeId) : "");
                    updateForm("subDistrict", tambonId !== null ? String(tambonId) : "");
                  }}
                />
                <p className="text-xs text-gray-400">
                  ระบบจะโหลดข้อมูลจาก Backend — หาก Backend ไม่พร้อม dropdown จะว่างเปล่า
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">รหัสไปรษณีย์ <span className="text-red-500">*</span></label>
                <input type="text" value={form.postalCode || ""} onChange={(e) => updateForm("postalCode", e.target.value)} maxLength={5} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-website-brand-500" placeholder="เช่น 10400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ประเภทบริการ <span className="text-red-500">*</span>
                  <span className="text-gray-400 text-xs font-normal ml-1">(เลือกได้หลายประเภท)</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {serviceTypeOptions.map((service) => (
                    <label key={service} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer p-2 rounded-lg border border-gray-200 hover:border-website-brand-400 transition">
                      <input
                        type="checkbox"
                        checked={(form.serviceTypes || []).includes(service)}
                        onChange={() => toggleService(service)}
                        className="rounded border-gray-300 text-website-brand-600"
                      />
                      {service}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  พื้นที่ให้บริการ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.serviceArea || ""}
                  onChange={(e) => updateForm("serviceArea", e.target.value)}
                  placeholder="เช่น กรุงเทพฯ, นนทบุรี, ปทุมธานี"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-website-brand-500"
                />
              </div>
            </div>
          )}

          {/* Step 4: Documents */}
          {step === 4 && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-gray-900">เอกสารประกอบการสมัคร</h2>

              <div className="bg-website-brand-50 border border-website-brand-200 rounded-xl p-4 text-sm text-website-brand-800">
                <strong>เอกสารจำเป็น:</strong> App3R จะตรวจสอบเอกสารเพื่อยืนยันตัวตนและความน่าเชื่อถือ
                กระบวนการใช้เวลา 3-5 วันทำการ
              </div>

              {[
                { field: "idCardFile", label: "สำเนาบัตรประชาชน", required: true, hint: "ไฟล์ PDF หรือรูปภาพ ขนาดไม่เกิน 5 MB" },
                { field: "businessLicenseFile", label: "ทะเบียนพาณิชย์ / หนังสือรับรองบริษัท", required: false, hint: "ไฟล์ PDF หรือรูปภาพ (ถ้ามี)" },
                { field: "vatCertFile", label: "ใบทะเบียนภาษีมูลค่าเพิ่ม (VAT)", required: false, hint: "ถ้ามี — ช่วยสร้างความน่าเชื่อถือ" },
                { field: "profilePhotoFile", label: "รูปถ่ายหน้าร้าน / โลโก้", required: true, hint: "รูปภาพ JPG/PNG ขนาดไม่เกิน 5 MB" },
              ].map((doc) => (
                <div key={doc.field}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {doc.label}
                    {doc.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-website-brand-400 transition cursor-pointer">
                    <div className="text-3xl mb-1">📁</div>
                    <p className="text-sm text-gray-500">{doc.hint}</p>
                    <p className="text-xs text-gray-400 mt-1">คลิกหรือลากไฟล์มาวาง</p>
                  </div>
                </div>
              ))}

              {/* Terms */}
              <div className="space-y-3 pt-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.agreeTerms || false}
                    onChange={(e) => updateForm("agreeTerms", e.target.checked)}
                    className="mt-0.5 rounded border-gray-300 text-website-brand-600"
                  />
                  <span className="text-sm text-gray-700">
                    ฉันยอมรับ{" "}
                    <Link href="/legal/terms" className="text-website-brand-700 underline">ข้อกำหนดการใช้งาน</Link>{" "}
                    และเข้าใจว่าบัญชี WeeeR ต้องรอการอนุมัติจาก App3R ก่อนเริ่มใช้งานได้
                    <span className="text-red-500 ml-1">*</span>
                  </span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.agreePrivacy || false}
                    onChange={(e) => updateForm("agreePrivacy", e.target.checked)}
                    className="mt-0.5 rounded border-gray-300 text-website-brand-600"
                  />
                  <span className="text-sm text-gray-700">
                    ฉันยินยอมให้ App3R เก็บและใช้ข้อมูลส่วนตัวตาม{" "}
                    <Link href="/legal/privacy" className="text-website-brand-700 underline">นโยบายความเป็นส่วนตัว</Link>
                    <span className="text-red-500 ml-1">*</span>
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <button
              onClick={() => setStep((s) => (s > 1 ? (s - 1) as Step : s))}
              disabled={step === 1}
              className="px-5 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 disabled:opacity-40 hover:border-gray-400 transition"
            >
              ← ย้อนกลับ
            </button>
            <div className="text-xs text-gray-400">
              ขั้นตอน {step} จาก 4
            </div>
            <button
              onClick={handleNext}
              className="px-6 py-2.5 bg-website-brand-700 text-white rounded-lg text-sm font-semibold hover:bg-website-brand-800 transition"
            >
              {step === 4 ? "ส่งใบสมัคร ✓" : "ถัดไป →"}
            </button>
          </div>
        </div>

        <p className="text-center text-gray-500 text-xs mt-5">
          มีบัญชีแล้ว?{" "}
          <a href={crossAppUrls.weeer.login} className="text-website-brand-700 hover:underline font-medium">
            เข้าสู่ระบบ WeeeR
          </a>
        </p>
      </div>
    </div>
  );
}

// Round 2 + Fix-Wave A — role enforcement screens (กฎธุรกิจ §9 · W-18)
//   weeet: ช่างสมัครเองไม่ได้ — ต้องผ่านร้าน WeeeR ที่อนุมัติแล้ว
//   weeer: เข้าสู่ระบบ WeeeR อยู่แล้ว — สมัครซ้ำไม่ได้ (ปลดล็อกอินก่อน)
//   weeeu: เข้าสู่ระบบ WeeeU อยู่ — ต้องออกจากระบบก่อนจึงสมัครเป็น WeeeR ได้
function RoleBlockedScreen({ variant }: { variant: "weeet" | "weeer" | "weeeu" }) {
  const config = {
    weeet: {
      emoji: "👨‍🔧",
      title: "ช่าง (WeeeT) สมัครร้านไม่ได้",
      desc: "บัญชีช่าง (WeeeT) สมัครเป็นร้าน WeeeR เองไม่ได้ — ช่างจะถูกเพิ่มเข้าระบบโดยร้าน WeeeR ที่ผ่านการอนุมัติแล้วเท่านั้น",
      primary: { label: "ดาวน์โหลดแอป WeeeT", href: "/download", external: false },
    },
    weeer: {
      emoji: "🔧",
      title: "คุณเข้าสู่ระบบ WeeeR อยู่แล้ว",
      desc: "บัญชีของคุณเป็นร้าน WeeeR อยู่แล้ว สมัครซ้ำไม่ได้ — หากต้องการสมัครบัญชีใหม่ กรุณาออกจากระบบก่อน",
      primary: { label: "ไปยังแอป WeeeR ของคุณ", href: crossAppUrls.weeer.base, external: true },
    },
    weeeu: {
      emoji: "🛒",
      title: "ต้องออกจากระบบ WeeeU ก่อน",
      desc: "คุณเข้าสู่ระบบในนามผู้ใช้ทั่วไป (WeeeU) อยู่ — 1 บัญชีใช้ได้ 1 บทบาท หากต้องการสมัครเป็นร้าน/บริษัท (WeeeR) กรุณาออกจากระบบ WeeeU ก่อน แล้วสมัครใหม่",
      primary: { label: "ออกจากระบบ WeeeU", href: crossAppUrls.weeeu.login, external: true },
    },
  }[variant];

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="bg-white border border-gray-200 rounded-2xl p-8 max-w-md w-full text-center space-y-5">
        <div className="text-5xl">{config.emoji}</div>
        <h1 className="text-xl font-bold text-gray-900">{config.title}</h1>
        <p className="text-sm text-gray-600 leading-relaxed">{config.desc}</p>
        <div className="space-y-3">
          {config.primary.external ? (
            <a
              href={config.primary.href}
              className="block w-full bg-website-brand-700 text-white py-3 rounded-xl font-semibold hover:bg-website-brand-800 transition"
            >
              {config.primary.label}
            </a>
          ) : (
            <Link
              href={config.primary.href}
              className="block w-full bg-website-brand-700 text-white py-3 rounded-xl font-semibold hover:bg-website-brand-800 transition"
            >
              {config.primary.label}
            </Link>
          )}
          <Link
            href="/"
            className="block w-full border border-gray-300 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 transition text-sm"
          >
            กลับหน้าหลัก
          </Link>
        </div>
        <p className="text-[10px] text-gray-300">
          ทดสอบ flow: สลับ role ได้ที่กล่อง 🧪 DEV มุมขวาล่าง
        </p>
      </div>
    </div>
  );
}
