"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SignupSteps } from "../page";

type DocType = "id_card" | "business_registration" | "tax_certificate" | "other";

const DOC_TYPES: { value: DocType; label: string; desc: string }[] = [
  { value: "id_card", label: "บัตรประชาชน", desc: "สำเนาบัตรประชาชนที่ยังไม่หมดอายุ" },
  { value: "business_registration", label: "หนังสือรับรองบริษัท", desc: "หนังสือรับรองการจดทะเบียนนิติบุคคล" },
  { value: "tax_certificate", label: "ใบทะเบียนภาษีมูลค่าเพิ่ม", desc: "ใบ ภ.พ. 20 (ถ้ามี)" },
  { value: "other", label: "เอกสารอื่นๆ", desc: "เอกสารประกอบเพิ่มเติมตามที่ระบุ" },
];

interface DocFile {
  id: string;
  type: DocType;
  file: File;
}

export default function KycUploadPage() {
  const router = useRouter();
  const [docs, setDocs] = useState<DocFile[]>([]);
  const [selectedType, setSelectedType] = useState<DocType>("id_card");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleFileAdd(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError("ไฟล์ขนาดเกิน 5MB"); return; }
    setError("");
    setDocs((prev) => [...prev, { id: Date.now().toString(), type: selectedType, file }]);
    e.target.value = "";
  }

  function removeDoc(id: string) {
    setDocs((prev) => prev.filter((d) => d.id !== id));
  }

  function handleSubmit() {
    if (docs.length === 0) { setError("กรุณาอัปโหลดเอกสารอย่างน้อย 1 ไฟล์"); return; }
    setLoading(true);
    // POST /api/v1/weeer/kyc-upload
    setTimeout(() => router.push("/signup/pending-review"), 1000);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-start justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">♻️</div>
          <h1 className="text-2xl font-bold text-green-800">อัปโหลดเอกสาร KYC</h1>
          <p className="text-sm text-gray-500 mt-1">Admin จะตรวจสอบเอกสารภายใน 3-5 วันทำการ</p>
        </div>

        <SignupSteps current={7} />

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
          {/* Select doc type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ประเภทเอกสาร <span className="text-red-500">*</span></label>
            <div className="grid grid-cols-2 gap-2">
              {DOC_TYPES.map((dt) => (
                <button
                  key={dt.value}
                  type="button"
                  onClick={() => setSelectedType(dt.value)}
                  className={`text-left p-3 rounded-xl border-2 transition-all text-sm ${selectedType === dt.value ? "border-green-600 bg-green-50" : "border-gray-200 hover:border-green-300"}`}
                >
                  <div className="font-medium text-gray-800">{dt.label}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{dt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Upload area */}
          <div>
            <label className={`block w-full border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors border-gray-200 hover:border-green-400`}>
              <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileAdd} />
              <div className="text-3xl mb-2">📄</div>
              <div className="text-sm font-medium text-gray-600">คลิกเพื่ออัปโหลด</div>
              <div className="text-xs text-gray-400">PDF/JPG/PNG ขนาดไม่เกิน 5MB</div>
            </label>
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>

          {/* File list */}
          {docs.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">เอกสารที่อัปโหลด ({docs.length})</p>
              {docs.map((d) => (
                <div key={d.id} className="flex items-center gap-3 bg-green-50 border border-green-100 rounded-xl px-3 py-2">
                  <span className="text-lg">📎</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-gray-700 truncate">{d.file.name}</div>
                    <div className="text-xs text-gray-400">{DOC_TYPES.find((t) => t.value === d.type)?.label} · {(d.file.size / 1024).toFixed(0)} KB</div>
                  </div>
                  <button onClick={() => removeDoc(d.id)} className="text-red-400 hover:text-red-600 text-sm shrink-0">✕</button>
                </div>
              ))}
            </div>
          )}

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-600">
            📌 หมายเหตุ: โครงสร้าง KYC อยู่ระหว่างรอ HUB confirm (HQ-2) — ประเภทเอกสารอาจปรับได้ในอนาคต
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60"
          >
            {loading ? "กำลังส่งข้อมูล…" : "ส่งข้อมูลเพื่อตรวจสอบ"}
          </button>
        </div>
      </div>
    </div>
  );
}
