"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Local types — Mockup only
type ScrapType = "for_sale" | "free";
type ScrapGrade = "A" | "B" | "C";

const APPLIANCE_TYPES = [
  "ตู้เย็น", "เครื่องซักผ้า", "แอร์", "ทีวี",
  "เตาอบไมโครเวฟ", "หม้อหุงข้าว", "พัดลม", "เครื่องดูดฝุ่น",
  "เครื่องทำน้ำอุ่น", "อื่นๆ",
];

type GradeInfo = { label: string; desc: string; selected: string; normal: string };

const GRADE_INFO: Record<ScrapGrade, GradeInfo> = {
  A: {
    label: "เกรด A",
    desc: "ยังทำงานได้บางส่วน — ชิ้นส่วนดี",
    selected: "border-green-400 bg-green-50",
    normal: "border-gray-200 hover:border-green-200",
  },
  B: {
    label: "เกรด B",
    desc: "เสียหายปานกลาง — ใช้ชิ้นส่วนได้",
    selected: "border-yellow-400 bg-yellow-50",
    normal: "border-gray-200 hover:border-yellow-200",
  },
  C: {
    label: "เกรด C",
    desc: "เสียหายมาก / ซ่อมไม่คุ้ม",
    selected: "border-red-400 bg-red-50",
    normal: "border-gray-200 hover:border-red-200",
  },
};

const GRADE_BADGE: Record<ScrapGrade, string> = {
  A: "text-green-700",
  B: "text-yellow-700",
  C: "text-red-600",
};

export default function ScrapNewPage() {
  const router = useRouter();

  const [scrapType, setScrapType] = useState<ScrapType>("for_sale");
  const [grade, setGrade] = useState<ScrapGrade | "">("");
  const [applianceType, setApplianceType] = useState("");
  const [description, setDescription] = useState("");
  const [askingPrice, setAskingPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const canSubmit =
    !!applianceType && !!grade && description.trim().length > 0 &&
    (scrapType === "free" || (scrapType === "for_sale" && !!askingPrice && Number(askingPrice) > 0));

  const handleSubmit = () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setTimeout(() => {
      setSubmitted(true);
      setSubmitting(false);
      setTimeout(() => router.push("/scrap"), 1500);
    }, 1000);
  };

  if (submitted) {
    return (
      <div className="max-w-xl">
        <div className="bg-weeeu-surface border border-weeeu-primary/30 rounded-2xl p-10 text-center space-y-3">
          <p className="text-5xl">✅</p>
          <p className="text-lg font-bold text-weeeu-text">ประกาศซากแล้ว!</p>
          <p className="text-sm text-gray-500">WeeeR จะยื่นข้อเสนอเข้ามา · กำลังกลับหน้าซากของฉัน...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/scrap" className="text-gray-400 hover:text-gray-600 text-xl leading-none">←</Link>
        <h1 className="text-xl font-bold text-gray-900">ประกาศซากใหม่</h1>
      </div>

      {/* No fee notice */}
      <div className="bg-weeeu-surface border border-weeeu-primary/20 rounded-xl p-3 flex items-center gap-2">
        <span className="text-lg">🎉</span>
        <div>
          <p className="text-xs font-semibold text-weeeu-text">ฟรี! ไม่มีค่าธรรมเนียมประกาศซาก</p>
          <p className="text-xs text-weeeu-primary">ต่าง Resell: ไม่หัก Silver · WeeeR จ่าย Gold ให้คุณแทน</p>
        </div>
      </div>

      {/* Toggle: ขาย / ทิ้งฟรี */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">ประเภทซาก *</h2>
        <div className="grid grid-cols-2 gap-3">
          {(["for_sale", "free"] as ScrapType[]).map(type => (
            <button
              key={type}
              onClick={() => setScrapType(type)}
              className={`border-2 rounded-2xl p-4 text-center transition-all ${
                scrapType === type
                  ? "border-weeeu-primary bg-weeeu-surface"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="text-3xl mb-2">{type === "for_sale" ? "💰" : "🎁"}</div>
              <div className="text-sm font-bold text-gray-800">
                {type === "for_sale" ? "ขายซาก" : "ทิ้ง (ให้เปล่า)"}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {type === "for_sale"
                  ? "WeeeR จ่าย Gold ให้คุณ"
                  : "ฟรี · ไม่มี Escrow"}
              </div>
            </button>
          ))}
        </div>

        {/* Escrow direction info */}
        {scrapType === "for_sale" && (
          <div className="bg-yellow-50 rounded-xl p-2.5">
            <p className="text-xs text-yellow-800">
              🥇 <span className="font-semibold">escrow กลับทิศ:</span> WeeeR ล็อก Gold ใน Escrow ให้คุณ —
              ได้รับ Gold เมื่องานเสร็จ (1 Gold = 1 บาท)
            </p>
          </div>
        )}
        {scrapType === "free" && (
          <div className="bg-gray-50 rounded-xl p-2.5">
            <p className="text-xs text-gray-500">
              🎁 ทิ้งฟรี — ไม่มี Escrow · ช่างมารับซากโดยไม่คิดค่าใช้จ่ายจากคุณ
            </p>
          </div>
        )}
      </div>

      {/* Appliance Type */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">ประเภทเครื่อง *</h2>
        <div className="grid grid-cols-2 gap-2">
          {APPLIANCE_TYPES.map(type => (
            <button
              key={type}
              onClick={() => setApplianceType(type)}
              className={`border rounded-xl px-3 py-2 text-sm text-left transition-colors ${
                applianceType === type
                  ? "border-weeeu-primary bg-weeeu-surface text-weeeu-primary font-semibold"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Grade */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">เกรดซาก *</h2>
        <div className="space-y-2">
          {(["A", "B", "C"] as ScrapGrade[]).map(g => (
            <button
              key={g}
              onClick={() => setGrade(g)}
              className={`w-full flex items-center gap-3 border-2 rounded-xl p-3 text-left transition-all ${
                grade === g ? GRADE_INFO[g].selected : GRADE_INFO[g].normal
              }`}
            >
              <div className={`text-xl font-black ${GRADE_BADGE[g]}`}>{g}</div>
              <div>
                <p className={`text-sm font-semibold ${grade === g ? GRADE_BADGE[g] : "text-gray-700"}`}>
                  {GRADE_INFO[g].label}
                </p>
                <p className="text-xs text-gray-500">{GRADE_INFO[g].desc}</p>
              </div>
              {grade === g && <span className="ml-auto text-weeeu-primary">✓</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Price (conditional on scrapType=for_sale) */}
      {scrapType === "for_sale" && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">ราคาขาย (Gold Point) *</h2>
          <div className="flex gap-2">
            <input
              type="number"
              value={askingPrice}
              onChange={e => setAskingPrice(e.target.value)}
              placeholder="ราคาที่ต้องการ (Gold)"
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-weeeu-primary/30"
            />
            <span className="flex items-center text-sm font-medium text-weeeu-primary px-2">Gold</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[200, 500, 1000, 2000].map(amt => (
              <button
                key={amt}
                onClick={() => setAskingPrice(String(amt))}
                className={`border text-xs py-1.5 rounded-xl transition-colors ${
                  askingPrice === String(amt)
                    ? "border-weeeu-primary bg-weeeu-surface text-weeeu-primary font-semibold"
                    : "border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                {amt.toLocaleString()}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400">1 Gold = 1 บาท · WeeeR ล็อก Gold ใน Escrow → คุณได้รับเมื่องานเสร็จ</p>
        </div>
      )}

      {/* Description */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">รายละเอียดซาก *</h2>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="อธิบายสภาพซาก: อาการเสีย, ส่วนที่ยังดี, ขนาด, อายุการใช้งาน..."
          rows={4}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-weeeu-primary/30 resize-none"
        />
        <p className="text-xs text-gray-400">ยิ่งละเอียดยิ่งดี — ช่วยให้ WeeeR ยื่นราคาที่เหมาะสม</p>
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!canSubmit || submitting}
        className="w-full bg-weeeu-primary hover:bg-weeeu-dark disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-colors"
      >
        {submitting ? "⟳ กำลังประกาศ..." : "♻️ ประกาศซากใหม่ (Mockup)"}
      </button>
      <p className="text-xs text-center text-gray-400">* Mockup — ไม่บันทึกข้อมูลจริง · กดเพื่อดู flow</p>
    </div>
  );
}
