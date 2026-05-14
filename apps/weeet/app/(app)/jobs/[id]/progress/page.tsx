"use client";
import { use, useEffect, useState } from "react";
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

      <div className="bg-gray-800/40 border border-gray-700/40 rounded-xl px-3 py-2">
        <p className="text-xs text-gray-600">
          Phase 2: localStorage — multi-tab WeeeT sync BroadcastChannel (port 3003)
        </p>
      </div>

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
              className="text-xs bg-orange-600 hover:bg-orange-500 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
            >
              + บันทึก Progress ใหม่
            </button>
          )}
        </div>

        {showUpdateForm && (
          <div className="bg-gray-800 rounded-xl p-4 border border-orange-800/40">
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
                  <span className="text-sm text-orange-300 font-medium">
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