"use client";
// M3 — ตรวจสภาพก่อนล้าง (NEW · Blueprint WeeeT Maintain ขั้น 2.1)
// M7 — No-show: ลูกค้าไม่อยู่/ไม่รับสาย → settle No-show (delta ขั้น 2.1)
// State machine: arrive → inspect → checklist → complete
// D-Maintain-1: Pre-cleaning inspection + risk reporting (WeeeR+WeeeU joint decision)
// D-Maintain-2: cross-module Maintain→Repair (auto-lock WeeeR เดิม)
// TODO Backend C-4.1b: POST /api/v1/maintain/jobs/:id/risk/ + /convert-to-repair/ + /no-show/
import { use, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const MAX_INSPECT_PHOTOS = 3;
const MAX_RISK_PHOTOS = 3;
const MAX_NOSHOW_PHOTOS = 3; // M7 — หลักฐาน No-show (บังคับ ≥1)
const MAX_FILE_MB = 3;

type PhotoEntry = { file: File; previewUrl: string };
type InspectMode =
  | "normal"
  | "risk_form"
  | "risk_submitted"
  | "noshow_form"    // M7 — กรอกหลักฐาน No-show
  | "noshow_submitted"; // M7 — ส่ง No-show แล้ว รอ settle

export default function MaintainInspectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  const { id } = use(params);
  const { type } = use(searchParams);
  const cleaningType = type ?? "general";
  const router = useRouter();

  const inspectFileRef = useRef<HTMLInputElement>(null);
  const riskFileRef = useRef<HTMLInputElement>(null);
  const noshowFileRef = useRef<HTMLInputElement>(null); // M7

  const [inspectPhotos, setInspectPhotos] = useState<PhotoEntry[]>([]);
  const [inspectNotes, setInspectNotes] = useState("");
  const [mode, setMode] = useState<InspectMode>("normal");

  // D-Maintain-1: risk report
  const [riskDesc, setRiskDesc] = useState("");
  const [riskPhotos, setRiskPhotos] = useState<PhotoEntry[]>([]);
  const [riskSubmitting, setRiskSubmitting] = useState(false);
  const [riskError, setRiskError] = useState<string | null>(null);

  // D-Maintain-2: convert to repair
  const [showRepairConfirm, setShowRepairConfirm] = useState(false);
  const [repairSubmitting, setRepairSubmitting] = useState(false);

  // M7: No-show
  const [noshowPhotos, setNoshowPhotos] = useState<PhotoEntry[]>([]);
  const [noshowNotes, setNoshowNotes] = useState("");
  const [noshowSubmitting, setNoshowSubmitting] = useState(false);
  const [noshowError, setNoshowError] = useState<string | null>(null);

  function addPhotos(
    files: FileList | null,
    current: PhotoEntry[],
    setter: React.Dispatch<React.SetStateAction<PhotoEntry[]>>,
    max: number,
  ) {
    if (!files) return;
    const toAdd: PhotoEntry[] = [];
    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_MB * 1024 * 1024) continue;
      if (current.length + toAdd.length >= max) break;
      toAdd.push({ file, previewUrl: URL.createObjectURL(file) });
    }
    setter((prev) => [...prev, ...toAdd]);
  }

  function removePhoto(
    i: number,
    setter: React.Dispatch<React.SetStateAction<PhotoEntry[]>>,
  ) {
    setter((prev) => {
      URL.revokeObjectURL(prev[i].previewUrl);
      return prev.filter((_, idx) => idx !== i);
    });
  }

  function handleProceed() {
    router.replace(`/maintain/${id}/checklist?type=${cleaningType}`);
  }

  async function handleRiskSubmit() {
    if (!riskDesc.trim()) return;
    setRiskSubmitting(true);
    setRiskError(null);
    try {
      // TODO Backend C-4.1b: POST /api/v1/maintain/jobs/:id/risk/
      // const fd = new FormData();
      // fd.append("description", riskDesc.trim());
      // riskPhotos.forEach((p) => fd.append("risk_photos", p.file));
      // await maintainApi.reportRisk(id, fd);
      await new Promise((r) => setTimeout(r, 1200)); // mock — remove after backend ready
      setMode("risk_submitted");
    } catch (e) {
      setRiskError((e as Error).message);
    } finally {
      setRiskSubmitting(false);
    }
  }

  async function handleConvertToRepair() {
    setRepairSubmitting(true);
    try {
      // TODO Backend C-4.1b: POST /api/v1/maintain/jobs/:id/convert-to-repair/
      // auto-lock WeeeR เดิม per D-Maintain-2
      await new Promise((r) => setTimeout(r, 1000)); // mock — remove after backend ready
      router.replace(`/maintain/${id}`);
    } catch {
      setRepairSubmitting(false);
      setShowRepairConfirm(false);
    }
  }

  // M7 — No-show: ลูกค้าไม่อยู่ ถ่ายรูปหลักฐาน → settle
  async function handleNoshowSubmit() {
    if (noshowPhotos.length === 0) return; // ต้องมีหลักฐาน ≥1 รูป
    setNoshowSubmitting(true);
    setNoshowError(null);
    try {
      // TODO Backend C-4.1b: POST /api/v1/maintain/jobs/:id/no-show/
      // const fd = new FormData();
      // noshowPhotos.forEach((p) => fd.append("noshow_photos", p.file));
      // if (noshowNotes.trim()) fd.append("notes", noshowNotes.trim());
      // await maintainApi.noShow(id, fd);
      await new Promise((r) => setTimeout(r, 1200)); // mock — remove after backend ready
      setMode("noshow_submitted");
    } catch (e) {
      setNoshowError((e as Error).message);
    } finally {
      setNoshowSubmitting(false);
    }
  }

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="sticky top-[41px] bg-gray-950/90 backdrop-blur-sm border-b border-gray-800 px-4 py-3 flex items-center gap-3 z-10">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-white text-lg">←</button>
        <div>
          <h1 className="font-bold text-white">M3 — ตรวจสภาพก่อนล้าง</h1>
          <p className="text-xs text-gray-400">ถ่ายรูปก่อนล้าง + ตรวจสอบความเสี่ยง</p>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-5">
        {/* Info banner */}
        <div className="bg-weeet-primary/10 border border-weeet-dark/40 rounded-xl p-3 text-xs text-weeet-primary space-y-1">
          <p className="font-semibold">🔍 ขั้นตอนการตรวจสภาพ</p>
          <p>ถ่ายรูปสภาพเครื่องก่อนล้าง แล้วเลือกดำเนินการด้านล่าง</p>
        </div>

        {/* Before-cleaning photos (optional) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">📸 รูปก่อนล้าง <span className="text-gray-500 font-normal">(ไม่บังคับ)</span></h2>
            <span className="text-xs text-gray-400">{inspectPhotos.length}/{MAX_INSPECT_PHOTOS}</span>
          </div>
          <input
            ref={inspectFileRef}
            type="file"
            accept="image/*"
            multiple
            capture="environment"
            className="hidden"
            onChange={(e) => addPhotos(e.target.files, inspectPhotos, setInspectPhotos, MAX_INSPECT_PHOTOS)}
          />
          <div className="grid grid-cols-3 gap-2">
            {inspectPhotos.map((p, i) => (
              <div key={i} className="relative aspect-square bg-gray-800 rounded-lg overflow-hidden border border-gray-600">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.previewUrl} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => removePhoto(i, setInspectPhotos)}
                  className="absolute top-1 right-1 bg-black/70 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
                >✕</button>
              </div>
            ))}
            {inspectPhotos.length < MAX_INSPECT_PHOTOS && (
              <button
                onClick={() => inspectFileRef.current?.click()}
                className="aspect-square bg-gray-800 border border-dashed border-gray-600 hover:border-weeet-primary rounded-lg flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-weeet-primary transition-colors"
              >
                <span className="text-2xl">📷</span>
                <span className="text-xs">เพิ่มรูป</span>
              </button>
            )}
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-white">📝 บันทึกการตรวจสภาพ <span className="text-gray-500 font-normal">(ไม่บังคับ)</span></label>
          <textarea
            value={inspectNotes}
            onChange={(e) => setInspectNotes(e.target.value)}
            placeholder="สภาพเครื่องโดยรวม สิ่งผิดปกติที่พบ..."
            rows={3}
            className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-weeet-primary resize-none"
          />
        </div>

        {/* === mode: normal === */}
        {mode === "normal" && (
          <div className="space-y-3">
            {/* Primary: proceed to cleaning */}
            <button
              onClick={handleProceed}
              className="w-full bg-weeet-primary hover:bg-weeet-dark text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              🧹 ปกติ — ดำเนินการล้างเครื่อง
            </button>

            <div className="text-center text-xs text-gray-600">หรือถ้าพบปัญหา</div>

            {/* M7 — No-show: ลูกค้าไม่อยู่/ไม่รับสาย */}
            <button
              onClick={() => setMode("noshow_form")}
              className="w-full bg-orange-900/30 hover:bg-orange-900/50 border border-orange-700/50 text-orange-300 font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
            >
              ⚠️ ลูกค้าไม่อยู่/ไม่รับสาย — M7 No-show
            </button>

            {/* D-Maintain-1: report risk */}
            <button
              onClick={() => setMode("risk_form")}
              className="w-full bg-amber-900/30 hover:bg-amber-900/50 border border-amber-700/50 text-amber-300 font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
            >
              ⚠️ แจ้งความเสี่ยง — ต้องการ WeeeR+WeeeU ตัดสิน
            </button>

            {/* D-Maintain-2: convert to repair */}
            <button
              onClick={() => setShowRepairConfirm(true)}
              className="w-full bg-red-900/20 hover:bg-red-900/40 border border-red-800/40 text-red-400 font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
            >
              🔧 เปลี่ยนเป็นงานซ่อม — D-Maintain-2
            </button>
          </div>
        )}

        {/* === mode: noshow_form (M7) === */}
        {mode === "noshow_form" && (
          <div className="space-y-4 bg-orange-950/20 border border-orange-800/40 rounded-xl p-4">
            <div>
              <h3 className="font-semibold text-orange-300 text-sm">⚠️ บันทึก No-show — ลูกค้าไม่อยู่</h3>
              <p className="text-xs text-orange-500 mt-0.5">ถ่ายรูปหลักฐาน ≥1 รูป เพื่อ settle ค่าเสียเที่ยว (ตามแกน No-show ใน offer)</p>
            </div>

            {/* No-show evidence photos — required ≥1 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-orange-300">
                  รูปหลักฐาน <span className="text-red-400">* (ต้องมีอย่างน้อย 1 รูป)</span>
                </label>
                <span className="text-xs text-gray-400">{noshowPhotos.length}/{MAX_NOSHOW_PHOTOS}</span>
              </div>
              <input
                ref={noshowFileRef}
                type="file"
                accept="image/*"
                multiple
                capture="environment"
                className="hidden"
                onChange={(e) => addPhotos(e.target.files, noshowPhotos, setNoshowPhotos, MAX_NOSHOW_PHOTOS)}
              />
              <div className="grid grid-cols-3 gap-2">
                {noshowPhotos.map((p, i) => (
                  <div key={i} className="relative aspect-square bg-gray-800 rounded-lg overflow-hidden border border-gray-600">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.previewUrl} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => removePhoto(i, setNoshowPhotos)}
                      className="absolute top-1 right-1 bg-black/70 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
                    >✕</button>
                  </div>
                ))}
                {noshowPhotos.length < MAX_NOSHOW_PHOTOS && (
                  <button
                    onClick={() => noshowFileRef.current?.click()}
                    className="aspect-square bg-gray-800 border border-dashed border-orange-700/40 hover:border-orange-500 rounded-lg flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-orange-400 transition-colors"
                  >
                    <span className="text-2xl">📷</span>
                    <span className="text-xs">เพิ่มรูป</span>
                  </button>
                )}
              </div>
              {noshowPhotos.length === 0 && (
                <p className="text-xs text-orange-400">⚠️ ต้องถ่ายรูปหน้าประตู/ตู้เครื่อง เป็นหลักฐานว่าไม่มีคนอยู่</p>
              )}
            </div>

            {/* Optional notes */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-orange-300">บันทึกเพิ่มเติม <span className="text-gray-500">(ไม่บังคับ)</span></label>
              <textarea
                value={noshowNotes}
                onChange={(e) => setNoshowNotes(e.target.value)}
                placeholder="รายละเอียดเพิ่มเติม เช่น โทรไม่รับ X ครั้ง รอนาน Y นาที..."
                rows={3}
                className="w-full bg-gray-800 border border-orange-700/50 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 resize-none"
              />
            </div>

            {noshowError && (
              <p className="text-red-400 text-xs bg-red-950/40 border border-red-800 rounded-lg px-3 py-2">{noshowError}</p>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setMode("normal")}
                disabled={noshowSubmitting}
                className="flex-1 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-gray-300 font-medium py-3 rounded-xl transition-colors text-sm"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleNoshowSubmit}
                disabled={noshowPhotos.length === 0 || noshowSubmitting}
                className="flex-1 bg-orange-600 hover:bg-orange-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-1 text-sm"
              >
                {noshowSubmitting ? (
                  <><span className="animate-spin">⏳</span> กำลังส่ง...</>
                ) : (
                  "📤 ส่งรายงาน No-show"
                )}
              </button>
            </div>
          </div>
        )}

        {/* === mode: noshow_submitted (M7) === */}
        {mode === "noshow_submitted" && (
          <div className="space-y-4">
            <div className="bg-orange-950/30 border border-orange-700/50 rounded-xl p-4 space-y-2">
              <p className="text-orange-300 font-semibold text-sm">📤 ส่งรายงาน No-show แล้ว</p>
              <p className="text-xs text-orange-400">ระบบจะ settle ค่าเสียเที่ยวตามแกน No-show ใน offer — WeeeR จะได้รับแจ้ง</p>
            </div>
            <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-4 space-y-1 text-xs text-gray-400">
              <p>• ค่าเสียเที่ยว = ตามเงื่อนไข offer ที่ WeeeU รับแล้ว</p>
              <p>• WeeeR ได้รับแจ้งและ settle อัตโนมัติ</p>
              <p>• ถ้าลูกค้าโต้แย้ง → Admin Dispute (M8)</p>
            </div>
            <button
              onClick={() => router.replace("/maintain")}
              className="w-full bg-weeet-primary hover:bg-weeet-dark text-white font-semibold py-3.5 rounded-xl transition-colors"
            >
              ✅ กลับหน้าหลัก
            </button>
          </div>
        )}

        {/* === mode: risk_form (D-Maintain-1) === */}
        {mode === "risk_form" && (
          <div className="space-y-4 bg-amber-950/20 border border-amber-800/40 rounded-xl p-4">
            <div>
              <h3 className="font-semibold text-amber-300 text-sm">⚠️ รายงานความเสี่ยง</h3>
              <p className="text-xs text-amber-500 mt-0.5">WeeeR + WeeeU จะได้รับแจ้งเพื่อร่วมตัดสินใจ</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-amber-300">รายละเอียดความเสี่ยงที่พบ <span className="text-red-400">*</span></label>
              <textarea
                value={riskDesc}
                onChange={(e) => setRiskDesc(e.target.value)}
                placeholder="อธิบายสภาพเครื่องที่มีความเสี่ยง เช่น สายไฟเสื่อม คอยล์รั่ว ..."
                rows={4}
                className="w-full bg-gray-800 border border-amber-700/50 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 resize-none"
              />
            </div>

            {/* Risk photos */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-amber-300">รูปหลักฐาน <span className="text-gray-500">(ไม่บังคับ)</span></label>
                <span className="text-xs text-gray-400">{riskPhotos.length}/{MAX_RISK_PHOTOS}</span>
              </div>
              <input
                ref={riskFileRef}
                type="file"
                accept="image/*"
                multiple
                capture="environment"
                className="hidden"
                onChange={(e) => addPhotos(e.target.files, riskPhotos, setRiskPhotos, MAX_RISK_PHOTOS)}
              />
              <div className="grid grid-cols-3 gap-2">
                {riskPhotos.map((p, i) => (
                  <div key={i} className="relative aspect-square bg-gray-800 rounded-lg overflow-hidden border border-gray-600">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.previewUrl} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => removePhoto(i, setRiskPhotos)}
                      className="absolute top-1 right-1 bg-black/70 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
                    >✕</button>
                  </div>
                ))}
                {riskPhotos.length < MAX_RISK_PHOTOS && (
                  <button
                    onClick={() => riskFileRef.current?.click()}
                    className="aspect-square bg-gray-800 border border-dashed border-amber-700/40 hover:border-amber-500 rounded-lg flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-amber-400 transition-colors"
                  >
                    <span className="text-2xl">📷</span>
                    <span className="text-xs">เพิ่มรูป</span>
                  </button>
                )}
              </div>
            </div>

            {riskError && (
              <p className="text-red-400 text-xs bg-red-950/40 border border-red-800 rounded-lg px-3 py-2">{riskError}</p>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setMode("normal")}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium py-3 rounded-xl transition-colors text-sm"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleRiskSubmit}
                disabled={!riskDesc.trim() || riskSubmitting}
                className="flex-1 bg-amber-600 hover:bg-amber-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-1 text-sm"
              >
                {riskSubmitting ? (
                  <><span className="animate-spin">⏳</span> กำลังส่ง...</>
                ) : (
                  "📤 ส่งรายงาน"
                )}
              </button>
            </div>
          </div>
        )}

        {/* === mode: risk_submitted === */}
        {mode === "risk_submitted" && (
          <div className="space-y-3">
            <div className="bg-green-950/40 border border-green-700/50 rounded-xl p-4">
              <p className="text-green-300 font-semibold text-sm">✅ ส่งรายงานความเสี่ยงแล้ว</p>
              <p className="text-xs text-green-500 mt-1">WeeeR + WeeeU ได้รับแจ้งแล้ว — รอการตัดสินใจร่วม</p>
            </div>

            <p className="text-xs text-gray-500 text-center">เลือกการดำเนินการต่อ:</p>

            {/* Outcome 1: proceed anyway */}
            <button
              onClick={handleProceed}
              className="w-full bg-weeet-primary/20 hover:bg-weeet-primary/30 border border-weeet-dark/50 text-weeet-primary font-medium py-3 rounded-xl transition-colors text-sm"
            >
              🧹 ดำเนินการล้างตามปกติ (รับทราบแล้ว)
            </button>

            {/* Outcome 2: wait / cancel */}
            <button
              onClick={() => router.replace(`/maintain/${id}`)}
              className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 font-medium py-3 rounded-xl transition-colors text-sm"
            >
              ⏸ รอการตัดสิน — กลับหน้างาน
            </button>

            {/* Outcome 3: convert to repair (D-Maintain-2) */}
            <button
              onClick={() => setShowRepairConfirm(true)}
              className="w-full bg-red-900/20 hover:bg-red-900/40 border border-red-800/40 text-red-400 font-medium py-3 rounded-xl transition-colors text-sm"
            >
              🔧 เปลี่ยนเป็นงานซ่อม — D-Maintain-2
            </button>
          </div>
        )}
      </div>

      {/* D-Maintain-2 confirm modal (bottom sheet) */}
      {showRepairConfirm && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-end">
          <div className="w-full bg-gray-900 border-t border-gray-700 rounded-t-2xl p-5 space-y-4">
            <div>
              <h3 className="font-bold text-white text-base">🔧 เปลี่ยนเป็นงานซ่อม?</h3>
              <p className="text-xs text-gray-400 mt-1">D-Maintain-2: งานบำรุงรักษาจะถูกปิด และสร้างใบงานซ่อมใหม่อัตโนมัติ</p>
            </div>
            <div className="bg-amber-950/30 border border-amber-800/40 rounded-xl p-3 space-y-1 text-xs text-amber-400">
              <p>• WeeeR เดิมจะถูก auto-lock</p>
              <p>• ลูกค้าจะได้รับแจ้งสถานะเปลี่ยน</p>
              <p>• ไม่สามารถย้อนกลับได้หลังยืนยัน</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowRepairConfirm(false)}
                disabled={repairSubmitting}
                className="flex-1 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-gray-300 font-medium py-3 rounded-xl transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConvertToRepair}
                disabled={repairSubmitting}
                className="flex-1 bg-red-600 hover:bg-red-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-1"
              >
                {repairSubmitting ? (
                  <><span className="animate-spin">⏳</span> กำลังดำเนินการ...</>
                ) : (
                  "🔧 ยืนยันเปลี่ยนเป็นงานซ่อม"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
