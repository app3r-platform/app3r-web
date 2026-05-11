"use client";
import { useState } from "react";
import { MockMediaUploader } from "./MockMediaUploader";
import type { ProgressStepMedia } from "@/lib/types/service-progress";
import { SUB_STAGE_LABELS } from "@/lib/types/service-progress";

interface Props {
  subStage: string;
  serviceType: string;
  onSubmit: (data: {
    notes: string;
    media: ProgressStepMedia;
    extraFields: Record<string, string>;
  }) => void;
  loading?: boolean;
}

// Sub-stages that require tracking number input
const NEEDS_TRACKING_1 = ["courier_to_pickup"];
const NEEDS_TRACKING_2 = ["courier_to_delivery"];

export function StepUpdateForm({ subStage, onSubmit, loading }: Props) {
  const [notes, setNotes] = useState("");
  const [tracking, setTracking] = useState("");
  const [media, setMedia] = useState<ProgressStepMedia>({ images: [], videos: [] });

  function handleMediaAdded(partial: Partial<ProgressStepMedia>) {
    setMedia((prev) => ({
      images: [...prev.images, ...(partial.images ?? [])],
      videos: [...prev.videos, ...(partial.videos ?? [])],
    }));
  }

  function handleSubmit() {
    const extraFields: Record<string, string> = {};
    if (NEEDS_TRACKING_1.includes(subStage) && tracking) extraFields.tracking1 = tracking;
    if (NEEDS_TRACKING_2.includes(subStage) && tracking) extraFields.tracking2 = tracking;
    onSubmit({ notes, media, extraFields });
  }

  return (
    <div className="space-y-4">
      <div className="bg-orange-950/30 border border-orange-800/40 rounded-xl px-4 py-2">
        <p className="text-xs text-orange-300 font-medium">
          บันทึกขั้นตอน: {SUB_STAGE_LABELS[subStage] ?? subStage}
        </p>
      </div>

      {/* Tracking number for parcel stages */}
      {(NEEDS_TRACKING_1.includes(subStage) || NEEDS_TRACKING_2.includes(subStage)) && (
        <div className="space-y-1">
          <label className="text-xs font-semibold text-white">
            {NEEDS_TRACKING_1.includes(subStage) ? "Tracking Number #1" : "Tracking Number #2"}
          </label>
          <input
            type="text"
            value={tracking}
            onChange={(e) => setTracking(e.target.value)}
            placeholder="เช่น TH123456789"
            className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
          />
        </div>
      )}

      {/* Notes */}
      <div className="space-y-1">
        <label className="text-xs font-semibold text-white">
          หมายเหตุ <span className="text-gray-500 font-normal">(ถ้ามี)</span>
        </label>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="บันทึกรายละเอียดขั้นตอนนี้..."
          className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 resize-none"
        />
      </div>

      {/* Media upload */}
      <MockMediaUploader onMediaAdded={handleMediaAdded} />

      {/* Preview uploaded media */}
      {(media.images.length > 0 || media.videos.length > 0) && (
        <div className="space-y-1">
          <p className="text-xs text-gray-400">สื่อที่แนบ ({media.images.length} รูป, {media.videos.length} วิดีโอ):</p>
          <div className="flex gap-2 flex-wrap">
            {media.images.map((img) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={img.id} src={img.url} alt="preview" className="w-16 h-16 object-cover rounded-lg border border-gray-700" />
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
      >
        {loading ? "กำลังบันทึก..." : "✅ ยืนยันขั้นตอนนี้"}
      </button>
    </div>
  );
}
