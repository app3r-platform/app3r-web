"use client";
import { use, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { loadProgress, saveProgress, advanceSubStage } from "@/lib/utils/service-progress-sync";
import { WEEET_SEED_PROGRESS } from "@/lib/mock-data/service-progress";
import type { ServiceProgress, ProgressStep } from "@/lib/types/service-progress";
import { ServiceProgressTimeline } from "@/components/service-progress/ServiceProgressTimeline";
import { StepUpdateWizard } from "@/components/service-progress/StepUpdateWizard";
// Sub-5 Wave 2: API-based progress update form
import { ProgressUpdateForm } from "@/components/service-progress/ProgressUpdateForm";
import type { ServiceProgressRecord } from "@/lib/dal/types";

const TECH_ID = "tech-001";
const MAX_EVIDENCE_PHOTOS = 8;

type MediaEntry = { file: File; previewUrl: string };

const STATUS_LABEL: Record<string, string> = {
  pending: "รอดำเนินการ",
  accepted: "รับงานแล้ว",
  in_progress: "กำลังดำเนินการ",
  paused: "หยุดชั่วคราว",
  completed: "เสร็จสิ้น",
  cancelled: "ยกเลิก",
};

export default function JobProgressPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [job, setJob] = useState<ServiceProgress | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  // Sub-5 Wave 2: API-based progress state
  const [apiEntries, setApiEntries] = useState<ServiceProgressRecord[]>([]);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ServiceProgressRecord | undefined>();

  // ส่งหลักฐานให้ร้าน (Dispute C9 — ช่างส่งรูป+GPS+timeline ให้ร้านดึงไปใช้)
  const evidencePhotoRef = useRef<HTMLInputElement>(null);
  const [evidencePhotos, setEvidencePhotos] = useState<MediaEntry[]>([]);
  const [evidenceNote, setEvidenceNote] = useState("");
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locatingGps, setLocatingGps] = useState(false);
  const [sendingEvidence, setSendingEvidence] = useState(false);
  const [evidenceSent, setEvidenceSent] = useState(false);

  // C7 — รับแจ้งหยุดงาน (mock: false = ไม่มีคำขอหยุดงาน; จริงๆ รับจาก API push notification)
  const [c7StopRequested] = useState(false);
  const c7Reason = "ลูกค้าขอพักงานชั่วคราว รอยืนยันอีกครั้ง";
  const c7Timestamp = "10:32 น.";

  useEffect(() => {
    let all = loadProgress();
    if (all.length === 0) {
      saveProgress(WEEET_SEED_PROGRESS);
      all = WEEET_SEED_PROGRESS;
    }
    const found = all.find((j) => j.jobId === id);
    setJob(found ?? null);
  }, [id, refreshKey]);

  function handleAdvance(
    jobId: string,
    nextSubStage: string,
    step: ProgressStep,
    markComplete?: boolean
  ) {
    advanceSubStage(jobId, nextSubStage, step, markComplete ? "completed" : undefined);
    setRefreshKey((k) => k + 1);
  }

  const getGps = () => {
    setLocatingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocatingGps(false);
      },
      () => setLocatingGps(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleAddEvidencePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const toAdd: MediaEntry[] = [];
    for (const file of Array.from(files)) {
      if (evidencePhotos.length + toAdd.length >= MAX_EVIDENCE_PHOTOS) break;
      toAdd.push({ file, previewUrl: URL.createObjectURL(file) });
    }
    setEvidencePhotos((prev) => [...prev, ...toAdd]);
  };

  const removeEvidencePhoto = (i: number) => {
    setEvidencePhotos((prev) => {
      URL.revokeObjectURL(prev[i].previewUrl);
      return prev.filter((_, idx) => idx !== i);
    });
  };

  const handleSendEvidence = async () => {
    if (evidencePhotos.length === 0) return;
    setSendingEvidence(true);
    // Mock — จริงๆ จะ POST /api/jobs/{id}/evidence พร้อม FormData
    await new Promise((r) => setTimeout(r, 1000));
    setSendingEvidence(false);
    setEvidenceSent(true);
  };

  if (!job) {
    return (
      <div className="px-4 pt-5">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-white mb-4">
          {"←"} กลับ
        </button>
        <div className="bg-gray-800 rounded-xl p-8 text-center border border-gray-700">
          <p className="text-gray-400 text-sm">ไม่พบงานนี้ใน Progress Tracker</p>
          <p className="text-xs text-gray-600 mt-1">(ID: {id})</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-5 pb-6 space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-white text-lg">
          {"←"}
        </button>
        <div>
          <p className="text-xs text-gray-500 font-mono">{job.jobNo}</p>
          <h1 className="text-white font-bold text-lg">{job.customerName ?? "ลูกค้า"}</h1>
          <p className="text-gray-400 text-xs">{job.applianceName}</p>
        </div>
      </div>

      {/* C7 — รับแจ้งหยุดงาน */}
      {job.currentStage === "in_progress" && c7StopRequested && (
        <div className="bg-amber-950/60 border border-amber-700 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">🛑</span>
            <div>
              <p className="text-amber-300 font-semibold text-sm">ลูกค้าขอหยุดงาน (C7)</p>
              <p className="text-amber-400 text-xs">กรุณาหยุดงานและรอการประสานจากร้าน</p>
            </div>
          </div>
          <p className="text-xs text-amber-200 bg-amber-900/30 rounded-lg px-3 py-2">{c7Reason}</p>
          <p className="text-xs text-gray-500">แจ้งโดย: WeeeR (ร้าน) · {c7Timestamp}</p>
        </div>
      )}

      {job.currentStage === "in_progress" && !c7StopRequested && (
        <div className="bg-gray-800/40 border border-gray-700/40 rounded-xl px-3 py-2 flex items-center gap-2">
          <span className="text-xs">🟢</span>
          <p className="text-xs text-gray-500">งานดำเนินต่อเนื่อง — ไม่มีคำขอหยุดงาน (C7)</p>
        </div>
      )}

      <div className="space-y-2">
        <p className="text-sm font-semibold text-gray-300">Timeline</p>
        <ServiceProgressTimeline job={job} />
      </div>

      {job.currentStage === "in_progress" && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-gray-300">อัปเดตขั้นตอน</p>
          <StepUpdateWizard
            job={job}
            technicianId={TECH_ID}
            onAdvance={handleAdvance}
          />
        </div>
      )}

      {/* ส่งหลักฐานให้ร้าน (Dispute C9) */}
      {job.currentStage === "in_progress" && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-300">📋 ส่งหลักฐานให้ร้าน</p>
          <div className="bg-gray-800 border border-weeet-dark/30 rounded-xl p-4 space-y-4">
            <p className="text-xs text-weeet-primary bg-weeet-surface/10 border border-weeet-dark/20 rounded-lg px-3 py-2">
              ช่างส่งรูป + GPS + timeline ให้ร้านดึงไปยืนยันกับลูกค้าในกรณีข้อพิพาท
            </p>

            {/* รูปหลักฐาน */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-gray-400 font-medium">📷 รูปหลักฐาน</label>
                <span className="text-xs text-gray-600">{evidencePhotos.length}/{MAX_EVIDENCE_PHOTOS}</span>
              </div>
              <input
                ref={evidencePhotoRef}
                type="file"
                accept="image/*"
                multiple
                capture="environment"
                className="hidden"
                onChange={handleAddEvidencePhoto}
              />
              <div className="grid grid-cols-4 gap-2">
                {evidencePhotos.map((p, i) => (
                  <div
                    key={i}
                    className="relative aspect-square bg-gray-700 rounded-lg overflow-hidden border border-gray-600"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.previewUrl} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeEvidencePhoto(i)}
                      className="absolute top-0.5 right-0.5 bg-black/70 text-white rounded-full w-4 h-4 text-[10px] flex items-center justify-center"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {evidencePhotos.length < MAX_EVIDENCE_PHOTOS && (
                  <button
                    onClick={() => evidencePhotoRef.current?.click()}
                    className="aspect-square bg-gray-700 border border-dashed border-gray-600 hover:border-weeet-primary rounded-lg flex items-center justify-center text-gray-500 hover:text-weeet-primary transition-colors"
                  >
                    <span className="text-lg">📷</span>
                  </button>
                )}
              </div>
            </div>

            {/* GPS Check-in */}
            {gpsCoords ? (
              <div className="bg-green-950/30 border border-green-800/50 rounded-lg px-3 py-2">
                <p className="text-green-300 text-xs font-medium">
                  📍 GPS: {gpsCoords.lat.toFixed(6)}, {gpsCoords.lng.toFixed(6)}
                </p>
              </div>
            ) : (
              <button
                onClick={getGps}
                disabled={locatingGps}
                className="w-full bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-gray-300 text-xs py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {locatingGps ? (
                  <><span className="animate-spin">⏳</span> กำลังระบุ...</>
                ) : (
                  "📍 บันทึก GPS Check-in"
                )}
              </button>
            )}

            {/* หมายเหตุ */}
            <textarea
              value={evidenceNote}
              onChange={(e) => setEvidenceNote(e.target.value)}
              placeholder="สรุปงานที่ทำ หรือหมายเหตุสำหรับร้าน..."
              rows={2}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-weeet-primary resize-none"
            />

            {evidenceSent ? (
              <div className="bg-green-950/40 border border-green-700 rounded-lg px-3 py-2.5 text-center">
                <p className="text-green-300 text-xs font-semibold">✅ ส่งหลักฐานให้ร้านแล้ว</p>
              </div>
            ) : (
              <button
                onClick={handleSendEvidence}
                disabled={evidencePhotos.length === 0 || sendingEvidence}
                className="w-full bg-weeet-primary hover:bg-weeet-dark disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
              >
                {sendingEvidence ? (
                  <><span className="animate-spin">⏳</span> กำลังส่ง...</>
                ) : (
                  "📤 ส่งหลักฐานให้ร้าน"
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {job.currentStage === "completed" && (
        <div className="bg-green-950/40 border border-green-800 rounded-xl p-4 text-center space-y-1">
          <p className="text-green-300 font-semibold text-sm">{"✅"} งานเสร็จสิ้นแล้ว</p>
          {job.serviceFeeRounded != null && (
            <p className="text-xs text-green-400">
              ค่าบริการ: {job.serviceFeeRounded.toLocaleString()} บาท
            </p>
          )}
          <p className="text-xs text-gray-500">รอลูกค้า review (WeeeU — Phase D)</p>
        </div>
      )}

      {/* Sub-5 Wave 2: API-based Progress Update (D79) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-300">📡 อัพเดต Progress (D79 API)</p>
          {!showUpdateForm && (
            <button
              onClick={() => { setEditingEntry(undefined); setShowUpdateForm(true); }}
              className="text-xs bg-weeet-primary hover:bg-weeet-dark text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
            >
              + บันทึก Progress ใหม่
            </button>
          )}
        </div>

        {showUpdateForm && (
          <div className="bg-gray-800 rounded-xl p-4 border border-weeet-dark/40">
            <p className="text-xs text-gray-500 mb-3">
              {editingEntry ? `แก้ไข entry: ${editingEntry.id.slice(0, 8)}...` : "สร้าง progress entry ใหม่"}
            </p>
            <ProgressUpdateForm
              serviceId={id}
              existingEntry={editingEntry}
              onSuccess={(record) => {
                setApiEntries((prev) =>
                  editingEntry
                    ? prev.map((e) => (e.id === record.id ? record : e))
                    : [record, ...prev]
                );
                setShowUpdateForm(false);
                setEditingEntry(undefined);
              }}
              onCancel={() => { setShowUpdateForm(false); setEditingEntry(undefined); }}
            />
          </div>
        )}

        {/* รายการ entries ที่บันทึกแล้ว */}
        {apiEntries.length > 0 && !showUpdateForm && (
          <div className="space-y-2">
            {apiEntries.map((entry) => (
              <div
                key={entry.id}
                className="bg-gray-800/60 border border-gray-700/60 rounded-xl p-3 space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-weeet-primary font-medium">
                    {STATUS_LABEL[entry.status] ?? entry.status}
                    <span className="ml-2 text-xs text-gray-500">{entry.progressPercent}%</span>
                  </span>
                  <button
                    onClick={() => { setEditingEntry(entry); setShowUpdateForm(true); }}
                    className="text-xs text-gray-500 hover:text-gray-300 underline"
                  >
                    แก้ไข
                  </button>
                </div>
                {entry.note && (
                  <p className="text-xs text-gray-400">{entry.note}</p>
                )}
                {entry.photoR2Key && (
                  <p className="text-xs text-gray-600 font-mono truncate">📷 {entry.photoR2Key}</p>
                )}
                <p className="text-xs text-gray-600">
                  {new Date(entry.createdAt).toLocaleString("th-TH", {
                    month: "short", day: "numeric",
                    hour: "2-digit", minute: "2-digit",
                  })}
                </p>
              </div>
            ))}
          </div>
        )}

        {apiEntries.length === 0 && !showUpdateForm && (
          <p className="text-xs text-gray-600 text-center py-2">
            ยังไม่มี progress entries — กด "+ บันทึก Progress ใหม่" เพื่อเริ่ม
          </p>
        )}
      </div>

      {job.shopName && (
        <div className="bg-gray-800/60 rounded-xl px-4 py-2.5 border border-gray-700/60">
          <p className="text-xs text-gray-500">
            ร้าน: <span className="text-gray-300">{job.shopName}</span>
            <span className="text-gray-600 ml-2">(D60 — text ref only)</span>
          </p>
        </div>
      )}
    </div>
  );
}