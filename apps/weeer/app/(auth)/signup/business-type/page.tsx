"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SignupSteps } from "../_components/SignupSteps";

type BusinessType = "individual" | "company";

const OPTIONS: { value: BusinessType; icon: string; label: string; desc: string }[] = [
  {
    value: "individual",
    icon: "🪪",
    label: "บุคคลธรรมดา",
    desc: "ร้านค้าส่วนตัว ช่างอิสระ หรือกิจการเจ้าของคนเดียว — ใช้บัตรประชาชน",
  },
  {
    value: "company",
    icon: "🏢",
    label: "นิติบุคคล",
    desc: "บริษัท ห้างหุ้นส่วน หรือกิจการจดทะเบียน — ใช้ทะเบียนพาณิชย์",
  },
];

export default function BusinessTypePage() {
  const router = useRouter();
  const [selected, setSelected] = useState<BusinessType | null>(null);

  function handleNext() {
    if (!selected) return;
    // Store business_type in sessionStorage for next step
    sessionStorage.setItem("weeer_business_type", selected);
    router.push("/signup/business-info");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">♻️</div>
          <h1 className="text-2xl font-bold text-green-800">ประเภทผู้ประกอบการ</h1>
          <p className="text-sm text-gray-500 mt-1">เลือกประเภทที่ตรงกับธุรกิจของคุณ</p>
        </div>

        <SignupSteps current={3} />

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <p className="text-sm text-gray-600 font-medium">เลือก 1 ประเภท <span className="text-red-500">*</span></p>

          {OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSelected(opt.value)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                selected === opt.value
                  ? "border-green-600 bg-green-50"
                  : "border-gray-200 hover:border-green-300"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-3xl">{opt.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-800">{opt.label}</span>
                    {selected === opt.value && (
                      <span className="text-green-600 font-bold">✓</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{opt.desc}</p>
                </div>
              </div>
            </button>
          ))}

          <div className="pt-2">
            <button
              onClick={handleNext}
              disabled={!selected}
              className="w-full bg-green-700 hover:bg-green-800 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              ถัดไป →
            </button>
          </div>

          <p className="text-xs text-gray-400 text-center">
            ไม่สามารถเปลี่ยนประเภทภายหลังได้ — เลือกให้ถูกต้อง
          </p>
        </div>
      </div>
    </div>
  );
}
