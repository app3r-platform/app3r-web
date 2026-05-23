"use client";
// WeeeT Scrap — รายละเอียดงานรับซาก + GPS + ตรวจซาก + ยืนยัน/รายงาน
// Sub-CMD C ขั้น 2.3 · Mockup คลิกได้
// S1-S4: ปกติ · S8: ซากไม่ตรง · S9: No-show · S12: ลิงก์งาน Repair
import { use, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type ScrapGrade = "A" | "B" | "C";
type JobState =
  | "pending"            // S1: รอ GPS check-in
  | "gps_done"           // S2: GPS check-in แล้ว รอตรวจซาก
  | "inspecting"         // S3: กำลังตรวจ (เปิดตัวเลือก)
  | "confirmed"          // S4: ยืนยันรับซากแล้ว ✅
  | "mismatch_form"      // S8: กรอกของไม่ตรง
  | "mismatch_submitted" // S8: ส่งแจ้งแล้ว รอ R เสนอราคาใหม่
  | "noshow_form"        // S9: กรอก No-show
  | "noshow_submitted";  // S9: แจ้ง No-show แล้ว

type PhotoEntry = { file: File; previewUrl: string };

const MAX_FILE_MB = 3;
const MAX_EVIDENCE_PHOTOS = 4;

// Mock job data — keyed by id
type MockJob = {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  itemType: string;
  itemBrand: string;
  itemSerial: string;
  grade: ScrapGrade;
  offerPrice?: number;
  repairJobId?: string; // S12
  assignedAt: string;
  initialState: JobState;
};

const MOCK_JOBS: Record<string, MockJob> = {
  "scrap-001": {
    id: "scrap-001",
    customerName: "คุณสมชาย ใจดี",
    customerPhone: "081-234-5678",
    customerAddress: "123 ถ.พหลโยธิน แขวงลาดยาว เขตจตุจักร กทม. 10900",
    itemType: "แอร์",
    itemBrand: "Daikin",
    itemSerial: "DTN-2018-XXXXX",
    grade: "B",
    offerPrice: 800,
    assignedAt: "2026-05-23T09:00:00Z",
    initialState: "pending",
  },
  "scrap-002": {
    id: "scrap-002",
    customerName: "คุณสุดา รักสะอาด",
    customerPhone: "089-876-5432",
    customerAddress: "456 ถ.ลาดพร้าว แขวงจอมพล เขตจตุจักร กทม. 10900",
    itemType: "แอร์",
    itemBrand: "Mitsubishi",
    itemSerial: "MSY-2019-YYYYY",
    grade: "C",
    offerPrice: undefined,
    repairJobId: "R-2026-0412", // S12
    assignedAt: "2026-05-23T10:30:00Z",
    initialState: "gps_done",
  },
  "scrap-003": {
    id: "scrap-003",
    customerName: "คุณวิชัย ประสิทธิ์",
    customerPhone: "062-111-2222",
    customerAddress: "789 ซ.รัชดา 18 เขตห้วยขวาง กทม. 10310",
    itemType: "แอร์",
    itemBrand: "Samsung",
    itemSerial: "AR18-2020-ZZZZZ",
    grade: "A",
    offerPrice: 1500,
    assignedAt: "2026-05-22T14:00:00Z",
    initialState: "confirmed",
  },
  "scrap-004": {
    id: "scrap-004",
    customerName: "คุณมาลี สวรรค์",
    customerPhone: "091-333-4444",
    customerAddress: "101 ถ.เพชรบุรี เขตราชเทวี กทม. 10400",
    itemType: "แอร์",
    itemBrand: "LG",
    itemSerial: "LA12-2019-AAAAA",
    grade: "B",
    offerPrice: 700,
    assignedAt: "2026-05-22T11:00:00Z",
    initialState: "mismatch_submitted",
  },
  "scrap-005": {
    id: "scrap-005",
    customerName: "คุณปิยะ หาญกล้า",
    customerPhone: "085-555-6666",
    customerAddress: "202 ถ.อโศก เขตวัฒนา กทม. 10110",
    itemType: "แอร์",
    itemBrand: "Carrier",
    itemSerial: "CA24-2017-BBBBB",
    grade: "C",
    offerPrice: 300,
    assignedAt: "2026-05-21T09:00:00Z",
    initialState: "noshow_submitted",
  },
};

const GRADE_LABEL: Record<ScrapGrade, string> = { A: "เกรด A — สมบูรณ์", B: "เกรด B — มีรอย", C: "เกรด C — เสียหายมาก" };
const GRADE_COLOR: Record<ScrapGrade, string> = {
  A: "text-green-400 border-green-700/40 bg-green-900/20",
  B: "text-yellow-400 border-yellow-700/30 bg-yellow-900/10",
  C: "text-red-400 border-red-700/30 bg-red-900/10",
};

export default function ScrapDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const job = MOCK_JOBS[id];

  const [state, setState] = useState<JobState>(job?.initialState ?? "pending");
  const [gpsLocating, setGpsLocating] = useState(false);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // S8 — ซากไม่ตรง
  const mismatchFileRef = useRef<HTMLInputElement>(null);
  const [mismatchPhotos, setMismatchPhotos] = useState<PhotoEntry[]>([]);
  const [mismatchDesc, setMismatchDesc] = useState("");
  const [mismatchSubmitting, setMismatchSubmitting] = useState(false);

  // S9 — No-show
  const noshowFileRef = useRef<HTMLInputElement>(null);
  const [noshowPhotos, setNoshowPhotos] = useState<PhotoEntry[]>([]);
  const [noshowNotes, setNoshowNotes] = useState("");
  const [noshowSubmitting, setNoshowSubmitting] = useState(false);

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center space-y-3 px-6">
          <p className="text-4xl">🗑️</p>
          <p className="text-white font-semibold">ไม่พบงานรับซาก</p>
          <button onClick={() => router.replace("/scrap")} className="text-weeet-primary text-sm">
            ← กลับรายการ
          </button>
        </div>
      </div>
    );
  }

  function addPhotos(
    files: FileList | null,
    current: PhotoEntry[],
    setter: React.Dispatch<React.SetStateAction<PhotoEntry[]>>,
  ) {
    if (!files) return;
    const toAdd: PhotoEntry[] = [];
    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_MB * 1024 * 1024) continue;
      if (current.length + toAdd.length >= MAX_EVIDENCE_PHOTOS) break;
      toAdd.push({ file, previewUrl: URL.createObjectURL(file) });
    }
    setter((prev) => [...prev, ...toAdd]);
  }

  function removePhoto(i: number, setter: React.Dispatch<React.SetStateAction<PhotoEntry[]>>) {
    setter((prev) => {
      URL.revokeObjectURL(prev[i].previewUrl);
      return prev.filter((_, idx) => idx !== i);
    });
  }

  // S1-S2: GPS check-in
  function handleGpsCheckin() {
    setGpsLocating(true);
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsLocating(false);
        setState("gps_done");
      },
      (err) => {
        setGpsError(`ไม่สามารถระบุพิกัด: ${err.message}`);
        setGpsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  // S3-S4: confirm receipt
  async function handleConfirm() {
    // TODO Backend Scrap Phase 4: POST /api/v1/scrap/jobs/:id/confirm/
    await new Promise((r) => setTimeout(r, 800));
    setState("confirmed");
  }

  // S8: submit mismatch report
  async function handleMismatchSubmit() {
    if (!mismatchDesc.trim()) return;
    setMismatchSubmitting(true);
    // TODO Backend Scrap Phase 4: POST /api/v1/scrap/jobs/:id/mismatch/
    await new Promise((r) => setTimeout(r, 1200));
    setMismatchSubmitting(false);
    setState("mismatch_submitted");
  }

  // S9: submit no-show
  async function handleNoshowSubmit() {
    if (noshowPhotos.length === 0) return;
    setNoshowSubmitting(true);
    // TODO Backend Scrap Phase 4: POST /api/v1/scrap/jobs/:id/no-show/
    await new Promise((r) => setTimeout(r, 1200));
    setNoshowSubmitting(false);
    setState("noshow_submitted");
  }

  const dateLabel = new Date(job.assignedAt).toLocaleDateString("th-TH", {
    weekday: "short", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
  });

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="sticky top-[41px] bg-gray-950/90 backdrop-blur-sm border-b border-gray-800 px-4 py-3 flex items-center gap-3 z-10">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-white text-lg">←</button>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-white truncate">{job.itemBrand} · {job.itemType}</h1>
          <p className="text-xs text-gray-400">งานรับซาก #{job.id}</p>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${GRADE_COLOR[job.grade]}`}>
          {job.grade}
        </span>
      </div>

      <div className="px-4 pt-4 space-y-4">

        {/* S12 — from Repair badge */}
        {job.repairJobId && (
          <div className="bg-purple-950/30 border border-purple-700/40 rounded-xl p-3 flex items-center gap-3">
            <span className="text-lg">🔧</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-purple-300">ซากมาจากงานซ่อม</p>
              <p className="text-xs text-purple-400">เครื่องเดิมที่ซ่อมแล้วนำออก</p>
            </div>
            <button
              onClick={() => router.push(`/jobs/${job.repairJobId}`)}
              className="text-xs text-purple-300 border border-purple-700/50 rounded-lg px-2 py-1 hover:bg-purple-900/30 transition-colors flex-shrink-0"
            >
              ดูงานซ่อม →
            </button>
          </div>
        )}

        {/* Job info card */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">ข้อมูลซาก</span>
            <span className={`text-xs px-2 py-0.5 rounded-lg border ${GRADE_COLOR[job.grade]}`}>
              {GRADE_LABEL[job.grade]}
            </span>
          </div>

          <div className="space-y-2">
            <InfoRow icon="🖥️" label="รุ่น/ยี่ห้อ" value={`${job.itemBrand} ${job.itemType}`} />
            <InfoRow icon="🔢" label="Serial" value={job.itemSerial} mono />
            <InfoRow icon="📅" label="มอบหมาย" value={dateLabel} />
            {job.offerPrice != null ? (
              <InfoRow icon="💰" label="ราคารับซาก" value={`฿${job.offerPrice.toLocaleString()}`} highlight />
            ) : (
              <InfoRow icon="🆓" label="ประเภท" value="ทิ้งฟรี — ไม่มีราคา" />
            )}
          </div>
        </div>

        {/* Customer info */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 space-y-2">
          <span className="text-xs text-gray-500">ข้อมูลลูกค้า</span>
          <InfoRow icon="👤" label="ชื่อ" value={job.customerName} />
          <InfoRow icon="📞" label="โทร" value={job.customerPhone} />
          <div className="flex items-start gap-3 py-1">
            <span className="text-base flex-shrink-0 mt-0.5">📍</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 mb-0.5">ที่อยู่</p>
              <p className="text-sm text-white leading-relaxed">{job.customerAddress}</p>
              <button
                onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(job.customerAddress)}`, "_blank")}
                className="text-xs text-weeet-primary mt-1"
              >
                เปิด Maps →
              </button>
            </div>
          </div>
        </div>

        {/* ===== STATE MACHINE ===== */}

        {/* S1: pending → GPS check-in */}
        {state === "pending" && (
          <div className="space-y-3">
            <div className="bg-weeet-primary/10 border border-weeet-dark/40 rounded-xl p-3 text-xs text-weeet-primary">
              <p className="font-semibold">📍 ขั้นตอนที่ 1 — ยืนยันถึงที่</p>
              <p className="mt-0.5">กด GPS check-in เมื่อถึงบ้านลูกค้า</p>
            </div>

            {gpsError && (
              <p className="text-red-400 text-xs bg-red-950/40 border border-red-800 rounded-lg px-3 py-2">{gpsError}</p>
            )}

            <button
              onClick={handleGpsCheckin}
              disabled={gpsLocating}
              className="w-full bg-weeet-primary hover:bg-weeet-dark disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {gpsLocating ? (
                <><span className="animate-spin">⏳</span> กำลังระบุพิกัด...</>
              ) : (
                "📍 GPS Check-in — ถึงที่แล้ว"
              )}
            </button>

            <div className="text-center text-xs text-gray-600">มีปัญหา?</div>

            {/* S9 — No-show */}
            <button
              onClick={() => setState("noshow_form")}
              className="w-full bg-orange-900/20 hover:bg-orange-900/40 border border-orange-800/40 text-orange-300 font-medium py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
            >
              ⚠️ ลูกค้าไม่อยู่/ไม่รับสาย — S9
            </button>
          </div>
        )}

        {/* S2: gps_done → inspect & choose */}
        {state === "gps_done" && (
          <div className="space-y-3">
            {/* GPS confirmed */}
            {gpsCoords && (
              <div className="bg-green-950/40 border border-green-700/50 rounded-xl p-3">
                <p className="text-green-300 font-semibold text-xs">✅ GPS check-in แล้ว</p>
                <p className="text-green-500 text-xs font-mono mt-0.5">
                  {gpsCoords.lat.toFixed(6)}, {gpsCoords.lng.toFixed(6)}
                </p>
              </div>
            )}

            <div className="bg-weeet-primary/10 border border-weeet-dark/40 rounded-xl p-3 text-xs text-weeet-primary">
              <p className="font-semibold">🔍 ขั้นตอนที่ 2 — ตรวจสอบซาก</p>
              <p className="mt-0.5">ตรวจสภาพซากว่าตรงกับที่ประกาศไหม แล้วเลือกดำเนินการ</p>
            </div>

            <button
              onClick={() => setState("inspecting")}
              className="w-full bg-weeet-primary hover:bg-weeet-dark text-white font-semibold py-3.5 rounded-xl transition-colors"
            >
              🔍 ตรวจซากและดำเนินการ
            </button>
          </div>
        )}

        {/* S3: inspecting → choice */}
        {state === "inspecting" && (
          <div className="space-y-3">
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 space-y-2 text-sm text-gray-300">
              <p className="font-semibold text-white text-xs">🔍 ผลการตรวจซาก</p>
              <p className="text-xs text-gray-400">เลือกผลการตรวจด้านล่าง</p>
            </div>

            {/* S4: confirm receipt */}
            <button
              onClick={handleConfirm}
              className="w-full bg-weeet-primary hover:bg-weeet-dark text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              ✅ ซากตรงตามที่ระบุ — ยืนยันรับ
            </button>

            <div className="text-center text-xs text-gray-600">หรือถ้าพบปัญหา</div>

            {/* S8: mismatch */}
            <button
              onClick={() => setState("mismatch_form")}
              className="w-full bg-amber-900/30 hover:bg-amber-900/50 border border-amber-700/50 text-amber-300 font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
            >
              ⚠️ ซากไม่ตรงที่ระบุ — แจ้ง R ปรับราคา (S8)
            </button>

            {/* S9: no-show (rare here but possible) */}
            <button
              onClick={() => setState("noshow_form")}
              className="w-full bg-orange-900/20 hover:bg-orange-900/40 border border-orange-800/40 text-orange-300 font-medium py-2.5 rounded-xl transition-colors text-sm"
            >
              ⚠️ ลูกค้าไม่อยู่/ออกจากที่ — S9
            </button>
          </div>
        )}

        {/* S4: confirmed ✅ */}
        {state === "confirmed" && (
          <div className="space-y-4">
            <div className="bg-green-950/40 border border-green-700/50 rounded-xl p-5 text-center space-y-2">
              <p className="text-4xl">✅</p>
              <p className="text-green-300 font-bold text-base">รับซากเรียบร้อย</p>
              <p className="text-xs text-green-500">
                {job.offerPrice != null
                  ? `WeeeR จ่าย ฿${job.offerPrice.toLocaleString()} → WeeeU รับ Gold (mock unlock)`
                  : "ทิ้งฟรี — escrow ไม่มี"}
              </p>
            </div>
            <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-3 space-y-1 text-xs text-gray-400">
              <p>• WeeeR เป็นผู้จ่าย Gold → WeeeU ได้รับ (escrow กลับทิศ R→U)</p>
              <p>• ระบบ Point บันทึก transaction อัตโนมัติ</p>
              <p>• E-Waste Certificate จะออกโดย Admin ตาม S4</p>
            </div>
            <button
              onClick={() => router.replace("/scrap")}
              className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 font-medium py-3 rounded-xl transition-colors text-sm"
            >
              ← กลับรายการงาน
            </button>
          </div>
        )}

        {/* S8: mismatch_form */}
        {state === "mismatch_form" && (
          <div className="space-y-4 bg-amber-950/20 border border-amber-800/40 rounded-xl p-4">
            <div>
              <h3 className="font-semibold text-amber-300 text-sm">⚠️ แจ้งซากไม่ตรง — S8</h3>
              <p className="text-xs text-amber-500 mt-0.5">WeeeR จะได้รับแจ้งเพื่อเสนอราคาใหม่หรือยกเลิก</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-amber-300">
                รายละเอียดที่ไม่ตรง <span className="text-red-400">*</span>
              </label>
              <textarea
                value={mismatchDesc}
                onChange={(e) => setMismatchDesc(e.target.value)}
                placeholder="เช่น เกรดจริง C แต่ประกาศ B · มีส่วนประกอบขาดหาย · รุ่นไม่ตรง..."
                rows={4}
                className="w-full bg-gray-800 border border-amber-700/50 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 resize-none"
              />
            </div>

            {/* Evidence photos */}
            <PhotoSection
              label="รูปหลักฐาน"
              required
              photos={mismatchPhotos}
              fileRef={mismatchFileRef}
              maxPhotos={MAX_EVIDENCE_PHOTOS}
              accentClass="border-amber-700/40 hover:border-amber-500 hover:text-amber-400"
              onAdd={(files) => addPhotos(files, mismatchPhotos, setMismatchPhotos)}
              onRemove={(i) => removePhoto(i, setMismatchPhotos)}
            />

            <div className="flex gap-2">
              <button
                onClick={() => setState("inspecting")}
                disabled={mismatchSubmitting}
                className="flex-1 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-gray-300 font-medium py-3 rounded-xl transition-colors text-sm"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleMismatchSubmit}
                disabled={!mismatchDesc.trim() || mismatchSubmitting}
                className="flex-1 bg-amber-600 hover:bg-amber-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-1 text-sm"
              >
                {mismatchSubmitting ? (
                  <><span className="animate-spin">⏳</span> กำลังส่ง...</>
                ) : (
                  "📤 ส่งรายงาน"
                )}
              </button>
            </div>
          </div>
        )}

        {/* S8: mismatch_submitted */}
        {state === "mismatch_submitted" && (
          <div className="space-y-4">
            <div className="bg-amber-950/30 border border-amber-700/50 rounded-xl p-4 space-y-2">
              <p className="text-amber-300 font-semibold text-sm">📤 แจ้งซากไม่ตรงแล้ว</p>
              <p className="text-xs text-amber-500">WeeeR จะเสนอราคาใหม่หรือยกเลิก — รอการตอบกลับ</p>
            </div>
            <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-3 space-y-1 text-xs text-gray-400">
              <p>• WeeeR ได้รับรายงาน + รูปหลักฐานแล้ว</p>
              <p>• WeeeR อาจเสนอราคาใหม่ → WeeeU อนุมัติ/ปฏิเสธ</p>
              <p>• ถ้าไม่ตกลงกัน → Admin Dispute (S11)</p>
            </div>
            <button
              onClick={() => router.replace("/scrap")}
              className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 font-medium py-3 rounded-xl transition-colors text-sm"
            >
              ← กลับรายการงาน
            </button>
          </div>
        )}

        {/* S9: noshow_form */}
        {state === "noshow_form" && (
          <div className="space-y-4 bg-orange-950/20 border border-orange-800/40 rounded-xl p-4">
            <div>
              <h3 className="font-semibold text-orange-300 text-sm">⚠️ ลูกค้าไม่อยู่ — S9 No-show</h3>
              <p className="text-xs text-orange-500 mt-0.5">ถ่ายรูปหลักฐาน ≥1 รูป เพื่อ settle ค่าเสียเที่ยว</p>
            </div>

            <PhotoSection
              label="รูปหลักฐาน (บังคับ ≥1)"
              required
              photos={noshowPhotos}
              fileRef={noshowFileRef}
              maxPhotos={MAX_EVIDENCE_PHOTOS}
              accentClass="border-orange-700/40 hover:border-orange-500 hover:text-orange-400"
              onAdd={(files) => addPhotos(files, noshowPhotos, setNoshowPhotos)}
              onRemove={(i) => removePhoto(i, setNoshowPhotos)}
            />
            {noshowPhotos.length === 0 && (
              <p className="text-xs text-orange-400">⚠️ ถ่ายรูปหน้าประตู/ที่อยู่ เป็นหลักฐาน</p>
            )}

            <div className="space-y-1">
              <label className="text-xs font-medium text-orange-300">บันทึกเพิ่มเติม <span className="text-gray-500">(ไม่บังคับ)</span></label>
              <textarea
                value={noshowNotes}
                onChange={(e) => setNoshowNotes(e.target.value)}
                placeholder="โทรไม่รับ X ครั้ง รอนาน Y นาที..."
                rows={2}
                className="w-full bg-gray-800 border border-orange-700/50 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 resize-none"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setState("pending")}
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

        {/* S9: noshow_submitted */}
        {state === "noshow_submitted" && (
          <div className="space-y-4">
            <div className="bg-orange-950/30 border border-orange-700/50 rounded-xl p-4 space-y-2">
              <p className="text-orange-300 font-semibold text-sm">📤 แจ้ง No-show แล้ว</p>
              <p className="text-xs text-orange-400">ระบบจะ settle ค่าเสียเที่ยวตามเงื่อนไข offer</p>
            </div>
            <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-3 space-y-1 text-xs text-gray-400">
              <p>• WeeeR รับทราบและ settle อัตโนมัติ</p>
              <p>• ถ้าลูกค้าโต้แย้ง → Admin Dispute (S11)</p>
            </div>
            <button
              onClick={() => router.replace("/scrap")}
              className="w-full bg-weeet-primary hover:bg-weeet-dark text-white font-semibold py-3.5 rounded-xl transition-colors"
            >
              ✅ กลับหน้าหลัก
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Reusable sub-components ──────────────────────────────────────

function InfoRow({
  icon,
  label,
  value,
  mono = false,
  highlight = false,
}: {
  icon: string;
  label: string;
  value: string;
  mono?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 py-0.5">
      <span className="text-base flex-shrink-0 mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
        <p className="text-xs text-gray-500 flex-shrink-0">{label}</p>
        <p
          className={`text-sm truncate ${
            highlight ? "text-weeet-primary font-semibold" : mono ? "text-gray-300 font-mono text-xs" : "text-white"
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function PhotoSection({
  label,
  required,
  photos,
  fileRef,
  maxPhotos,
  accentClass,
  onAdd,
  onRemove,
}: {
  label: string;
  required?: boolean;
  photos: PhotoEntry[];
  fileRef: React.RefObject<HTMLInputElement | null>;
  maxPhotos: number;
  accentClass: string;
  onAdd: (files: FileList | null) => void;
  onRemove: (i: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-gray-300">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
        <span className="text-xs text-gray-500">{photos.length}/{maxPhotos}</span>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        capture="environment"
        className="hidden"
        onChange={(e) => onAdd(e.target.files)}
      />
      <div className="grid grid-cols-3 gap-2">
        {photos.map((p, i) => (
          <div key={i} className="relative aspect-square bg-gray-800 rounded-lg overflow-hidden border border-gray-600">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.previewUrl} alt="" className="w-full h-full object-cover" />
            <button
              onClick={() => onRemove(i)}
              className="absolute top-1 right-1 bg-black/70 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
            >✕</button>
          </div>
        ))}
        {photos.length < maxPhotos && (
          <button
            onClick={() => fileRef.current?.click()}
            className={`aspect-square bg-gray-800 border border-dashed rounded-lg flex flex-col items-center justify-center gap-1 text-gray-400 transition-colors ${accentClass}`}
          >
            <span className="text-2xl">📷</span>
            <span className="text-xs">เพิ่มรูป</span>
          </button>
        )}
      </div>
    </div>
  );
}
