"use client";

/**
 * WeeeT — หน้า Verify ซากหน้างาน + Actions
 * S8: ปุ่ม "ซากไม่ตรงประกาศ" → แนบรูปหลักฐาน + อธิบาย + submit → trigger mismatch flow
 * S9: ปุ่ม "⚠️ ไม่พบลูกค้า/ของ" → confirm → state `no_show`
 * Mobile-first (WeeeT = ช่างใช้มือถือ)
 */

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ── Mock types ────────────────────────────────────────────────────────────────
type JobStatus =
  | "assigned"
  | "traveling"
  | "arrived"
  | "verifying"
  | "mismatch_reported"
  | "pickup_confirmed"
  | "no_show"
  | "completed"
  | "cancelled";

interface ScrapPickupJobDetail {
  id: string;
  scrapItemId: string;
  scrapDescription: string;
  grade: "grade_A" | "grade_B" | "grade_C";
  listingType: "sell" | "dispose";
  offeredPrice: number;
  weeeUName: string;
  weeeUPhone: string;
  weeeUAddress: string;
  weeeUMapLink: string;
  scheduledDate: string;
  photos: string[];  // รูปที่ WeeeU ประกาศ
  workingParts: string[];
  weeerName: string;
  status: JobStatus;
  sourceRepairJobId?: string;
}

// ── Mock data ─────────────────────────────────────────────────────────────────
function getMockJob(id: string): ScrapPickupJobDetail {
  return {
    id,
    scrapItemId: "SCR-002",
    scrapDescription: "แอร์ Mitsubishi 12000 BTU ซ่อมไม่คุ้ม — คอมเพรสเซอร์พัง",
    grade: "grade_C",
    listingType: "sell",
    offeredPrice: 380,
    weeeUName: "สมชาย ใจดี",
    weeeUPhone: "081-234-5678",
    weeeUAddress: "123/4 ถ.สุขุมวิท แขวงคลองตัน กทม.",
    weeeUMapLink: "https://maps.google.com/mock",
    scheduledDate: "2026-05-26 10:00",
    photos: ["/mock/scrap-1.jpg", "/mock/scrap-2.jpg"],
    workingParts: ["พาวเวอร์บอร์ด", "แผงควบคุม"],
    weeerName: "ร้านซากดี จำกัด",
    status: "arrived",   // demo: ช่างถึงแล้ว รอ verify
    sourceRepairJobId: "REP-0042",
  };
}

const GRADE_META: Record<string, { label: string; color: string }> = {
  grade_A: { label: "Grade A", color: "bg-green-100 text-green-700" },
  grade_B: { label: "Grade B", color: "bg-yellow-100 text-yellow-700" },
  grade_C: { label: "Grade C", color: "bg-red-100 text-red-500" },
};

const STATUS_META: Record<JobStatus, { label: string; color: string }> = {
  assigned:          { label: "รับงาน",           color: "bg-blue-100 text-blue-700" },
  traveling:         { label: "กำลังเดินทาง",    color: "bg-indigo-100 text-indigo-700" },
  arrived:           { label: "ถึงที่แล้ว",       color: "bg-teal-100 text-teal-700" },
  verifying:         { label: "กำลังตรวจซาก",    color: "bg-yellow-100 text-yellow-700" },
  mismatch_reported: { label: "รายงานไม่ตรงสเปก", color: "bg-orange-100 text-orange-700" },
  pickup_confirmed:  { label: "รับซากแล้ว",       color: "bg-green-100 text-green-700" },
  no_show:           { label: "🚫 ไม่พบลูกค้า",  color: "bg-red-100 text-red-700" },
  completed:         { label: "เสร็จสิ้น",        color: "bg-gray-100 text-gray-600" },
  cancelled:         { label: "ยกเลิก",           color: "bg-gray-100 text-gray-500" },
};

export default function WeeeTScrapJobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [job, setJob] = useState(() => getMockJob(id));
  const [submitting, setSubmitting] = useState(false);

  // ── GPS depart/arrive state ─────────────────────────────────────
  const [gpsCheckedIn, setGpsCheckedIn] = useState(false);

  // ── S8 — Mismatch report state ──────────────────────────────────
  const [showMismatchForm, setShowMismatchForm] = useState(false);
  const [mismatchReason, setMismatchReason]     = useState("");
  const [mismatchPrice, setMismatchPrice]       = useState(String(job.offeredPrice));
  const [mismatchPhotos, setMismatchPhotos]     = useState<string[]>([]);
  const [photoCount, setPhotoCount]             = useState(0);  // mock photo count

  // ── S9 — No-show confirm state ──────────────────────────────────
  const [showNoShowConfirm, setShowNoShowConfirm] = useState(false);
  const [noShowNotes, setNoShowNotes]             = useState("");

  const gm = GRADE_META[job.grade];
  const sm = STATUS_META[job.status];

  // GPS check-in
  function handleGpsCheckIn() {
    setGpsCheckedIn(true);
    setJob(prev => ({ ...prev, status: "arrived" as const }));
  }

  // Start verify
  function handleStartVerify() {
    setJob(prev => ({ ...prev, status: "verifying" as const }));
  }

  // S8 — Submit mismatch
  function handleMismatchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!mismatchReason.trim()) return;
    setSubmitting(true);
    setTimeout(() => {
      setJob(prev => ({ ...prev, status: "mismatch_reported" as const }));
      setShowMismatchForm(false);
      setSubmitting(false);
      alert("✅ ส่งรายงานไม่ตรงสเปกแล้ว — รอลูกค้ายืนยัน/โต้แย้ง");
    }, 800);
  }

  // S9 — Confirm no-show
  function handleNoShowConfirm() {
    if (!noShowNotes.trim()) return;
    setSubmitting(true);
    setTimeout(() => {
      setJob(prev => ({ ...prev, status: "no_show" as const }));
      setShowNoShowConfirm(false);
      setSubmitting(false);
      alert("✅ บันทึก No-show แล้ว — ลูกค้าจะได้รับแจ้ง");
    }, 800);
  }

  // Confirm pickup
  function handlePickupConfirm() {
    setSubmitting(true);
    setTimeout(() => {
      setJob(prev => ({ ...prev, status: "pickup_confirmed" as const }));
      setSubmitting(false);
    }, 700);
  }

  // Mock add photo
  function handleAddPhoto() {
    setPhotoCount(c => c + 1);
    setMismatchPhotos(prev => [...prev, `/mock/mismatch-evidence-${photoCount + 1}.jpg`]);
  }

  return (
    <div className="space-y-5 max-w-sm mx-auto">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/scrap" className="text-gray-400 hover:text-gray-700 text-xl">‹</Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-bold text-gray-900">รับซาก</h1>
            <span className={`text-xs px-2 py-0.5 rounded-full ${sm.color}`}>{sm.label}</span>
            {job.sourceRepairJobId && (
              <span className="text-xs bg-orange-50 text-orange-600 border border-orange-200 px-1.5 py-0.5 rounded-full">
                🔧 Repair
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">#{job.id}</p>
        </div>
      </div>

      {/* ── COMPLETED / NO-SHOW states ── */}
      {job.status === "pickup_confirmed" && (
        <div className="bg-green-50 border-2 border-green-300 rounded-2xl p-4 text-center space-y-2">
          <p className="text-4xl">✅</p>
          <p className="text-base font-bold text-green-700">รับซากเรียบร้อยแล้ว</p>
          <p className="text-xs text-green-600">รายงานไปยังร้าน {job.weeerName} แล้ว</p>
          <Link href="/scrap" className="text-xs text-green-600 hover:underline">← กลับรายการงาน</Link>
        </div>
      )}

      {job.status === "no_show" && (
        <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-4 text-center space-y-2">
          <p className="text-4xl">🚫</p>
          <p className="text-base font-bold text-red-700">บันทึก No-show แล้ว</p>
          <p className="text-xs text-red-600">ลูกค้าได้รับแจ้งแล้ว — รอลูกค้าตอบกลับ (นัดใหม่/ยกเลิก)</p>
          <Link href="/scrap" className="text-xs text-red-600 hover:underline">← กลับรายการงาน</Link>
        </div>
      )}

      {job.status === "mismatch_reported" && (
        <div className="bg-orange-50 border-2 border-orange-300 rounded-2xl p-4 text-center space-y-2">
          <p className="text-4xl">⚠️</p>
          <p className="text-base font-bold text-orange-700">ส่งรายงานไม่ตรงสเปกแล้ว</p>
          <p className="text-xs text-orange-600">รอลูกค้ายืนยัน / โต้แย้ง</p>
          <Link href="/scrap" className="text-xs text-orange-600 hover:underline">← กลับรายการงาน</Link>
        </div>
      )}

      {/* ── ACTIVE states (assigned / traveling / arrived / verifying) ── */}
      {["assigned", "traveling", "arrived", "verifying"].includes(job.status) && (
        <>
          {/* Customer info */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">ข้อมูลลูกค้า</h2>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-400 w-16 shrink-0">ชื่อ</span>
                <span className="font-medium text-gray-800">{job.weeeUName}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 w-16 shrink-0">โทร</span>
                <a href={`tel:${job.weeeUPhone}`}
                  className="text-[#1696F9] font-medium">{job.weeeUPhone}</a>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-gray-400 w-16 shrink-0 pt-0.5">ที่อยู่</span>
                <span className="text-gray-700">{job.weeeUAddress}</span>
              </div>
              <a
                href={job.weeeUMapLink}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-[#1696F9] text-sm font-medium px-3 py-2 rounded-xl transition-colors"
              >
                🗺️ เปิด Maps
              </a>
            </div>
          </div>

          {/* Scrap info */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">รายละเอียดซาก (ตามประกาศ)</h2>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs px-2 py-0.5 rounded-full ${gm.color}`}>{gm.label}</span>
              {job.sourceRepairJobId && (
                <span className="text-xs bg-orange-50 text-orange-600 border border-orange-200 px-2 py-0.5 rounded-full">
                  🔧 จากงานซ่อม #{job.sourceRepairJobId}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-700">{job.scrapDescription}</p>
            {job.workingParts.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 mb-1">Part ที่ใช้ได้</p>
                <div className="flex gap-2 flex-wrap">
                  {job.workingParts.map((part, i) => (
                    <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                      {part}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {/* รูปจากประกาศ */}
            <div className="flex gap-2 flex-wrap">
              {job.photos.map((_, i) => (
                <div key={i} className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                  📷 {i + 1}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">ราคา offer</span>
              <span className="font-mono font-bold text-green-600">{job.offeredPrice} Gold</span>
            </div>
          </div>

          {/* GPS Check-in */}
          {!gpsCheckedIn && job.status === "traveling" && (
            <button
              onClick={handleGpsCheckIn}
              className="w-full py-4 bg-[#1696F9] hover:bg-blue-600 text-white font-bold rounded-2xl text-base transition-colors shadow-sm"
            >
              📍 GPS Check-in — ถึงแล้ว
            </button>
          )}

          {/* Start verify */}
          {job.status === "arrived" && (
            <button
              onClick={handleStartVerify}
              className="w-full py-4 bg-[#1696F9] hover:bg-blue-600 text-white font-bold rounded-2xl text-base transition-colors shadow-sm"
            >
              🔍 เริ่มตรวจซาก
            </button>
          )}

          {/* ── VERIFY screen ── */}
          {job.status === "verifying" && !showMismatchForm && (
            <div className="space-y-3">
              <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 text-sm text-yellow-800">
                <p className="font-semibold mb-1">🔍 กำลังตรวจซาก</p>
                <p className="text-xs">เปรียบเทียบซากจริงกับรูปและรายละเอียดที่ประกาศ</p>
              </div>

              {/* Confirm pickup (ตรงตาม spec) */}
              <button
                onClick={handlePickupConfirm}
                disabled={submitting}
                className="w-full py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-2xl text-base transition-colors disabled:opacity-50"
              >
                {submitting ? "กำลังยืนยัน..." : "✅ ซากตรงตามประกาศ — รับซาก"}
              </button>

              {/* S8 — ของไม่ตรงสเปก */}
              <button
                onClick={() => setShowMismatchForm(true)}
                className="w-full py-4 bg-white hover:bg-orange-50 text-orange-600 border-2 border-orange-300 font-bold rounded-2xl text-base transition-colors"
              >
                ⚠️ ซากไม่ตรงประกาศ
              </button>

              {/* S9 — ไม่พบลูกค้า */}
              <button
                onClick={() => setShowNoShowConfirm(true)}
                className="w-full py-3 bg-white hover:bg-red-50 text-red-600 border border-red-200 font-medium rounded-2xl text-sm transition-colors"
              >
                🚫 ไม่พบลูกค้า / ของหาย
              </button>
            </div>
          )}

          {/* S8 — Mismatch form */}
          {showMismatchForm && (
            <form onSubmit={handleMismatchSubmit} className="bg-white rounded-2xl border-2 border-orange-300 shadow-sm p-4 space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-orange-500 text-xl">⚠️</span>
                <h2 className="text-base font-bold text-orange-800">รายงาน: ซากไม่ตรงประกาศ</h2>
              </div>

              {/* ถ่ายรูปหลักฐาน */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  รูปหลักฐาน <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2 flex-wrap">
                  {mismatchPhotos.map((_, i) => (
                    <div key={i} className="w-16 h-16 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-400 text-xs">
                      📷 {i + 1}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddPhoto}
                    className="w-16 h-16 rounded-xl bg-gray-50 border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-xl hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>
                {mismatchPhotos.length === 0 && (
                  <p className="text-xs text-red-500 mt-1">กรุณาถ่ายรูปหลักฐานอย่างน้อย 1 รูป</p>
                )}
              </div>

              {/* อธิบายปัญหา */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  อธิบายสภาพจริง <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={mismatchReason}
                  onChange={e => setMismatchReason(e.target.value)}
                  rows={3}
                  placeholder="เช่น มีสนิมเพิ่มเติมที่แผงวงจร, จำนวน part ที่ใช้ได้น้อยกว่าที่ระบุ..."
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400 resize-none"
                  required
                />
              </div>

              {/* เสนอราคาใหม่ */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  ราคาที่เสนอใหม่ (Gold)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={mismatchPrice}
                    onChange={e => setMismatchPrice(e.target.value)}
                    min={0}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400 pr-16"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">Gold</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  ราคาเดิม: {job.offeredPrice} Gold
                  {Number(mismatchPrice) !== job.offeredPrice && (
                    <span className="ml-2 text-orange-600">
                      (ลด {job.offeredPrice - Number(mismatchPrice)} Gold)
                    </span>
                  )}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting || !mismatchReason.trim() || mismatchPhotos.length === 0}
                  className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl disabled:opacity-50 transition-colors"
                >
                  {submitting ? "กำลังส่ง..." : "📨 ส่งรายงาน"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowMismatchForm(false)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl"
                >
                  ยกเลิก
                </button>
              </div>
            </form>
          )}
        </>
      )}

      {/* S9 — No-show confirm dialog */}
      {showNoShowConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900">🚫 ยืนยัน: ไม่พบลูกค้า</h3>
            <p className="text-sm text-gray-600">
              กรณีไม่พบลูกค้า/ของ ระบบจะแจ้งลูกค้าทันที และบันทึก No-show ลงในงาน
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                หมายเหตุ <span className="text-red-500">*</span>
              </label>
              <textarea
                value={noShowNotes}
                onChange={e => setNoShowNotes(e.target.value)}
                rows={3}
                placeholder="เช่น โทรไม่ติด 3 ครั้ง, ไม่มีคนอยู่บ้าน, ประตูล็อก..."
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-red-400 resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleNoShowConfirm}
                disabled={submitting || !noShowNotes.trim()}
                className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl disabled:opacity-50"
              >
                {submitting ? "กำลังบันทึก..." : "ยืนยัน No-show"}
              </button>
              <button
                onClick={() => setShowNoShowConfirm(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
