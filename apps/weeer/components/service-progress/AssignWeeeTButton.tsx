"use client";

// ── AssignWeeeTButton — Phase C-5 ────────────────────────────────────────────
// Inline card for assigning a WeeeT to a job that is in "assigned" (repair) or "pending" (maintain) stage

import { useState } from "react";
import { WeeeTAssignDropdown } from "./WeeeTAssignDropdown";
import { serviceProgressSync } from "../../lib/utils/service-progress-sync";

interface AssignWeeeTButtonProps {
  jobId: string;
  service: "repair" | "maintain";
  currentWeeeTId?: string;
  currentWeeeTName?: string;
  onAssigned?: (weeeTId: string, weeeTName: string) => void;
}

export function AssignWeeeTButton({
  jobId,
  service,
  currentWeeeTId = "",
  currentWeeeTName = "",
  onAssigned,
}: AssignWeeeTButtonProps) {
  const [selectedId, setSelectedId] = useState(currentWeeeTId);
  const [selectedName, setSelectedName] = useState(currentWeeeTName);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleAssign = async () => {
    if (!selectedId) return;
    setSaving(true);
    try {
      // Mock API call — real impl would call repairApi/maintainApi
      await new Promise((r) => setTimeout(r, 600));
      setSaved(true);
      serviceProgressSync.emit({
        type: "weeet_assigned",
        jobId,
        service,
        weeeTId: selectedId,
        weeeTName: selectedName,
      });
      onAssigned?.(selectedId, selectedName);
    } finally {
      setSaving(false);
    }
  };

  if (saved) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 flex items-center gap-2">
        <span>✅</span>
        <span>มอบหมายให้ {selectedName} แล้ว</span>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
      <p className="text-xs font-semibold text-blue-700">👷 มอบหมาย WeeeT</p>
      <WeeeTAssignDropdown
        value={selectedId}
        onChange={(id, name) => { setSelectedId(id); setSelectedName(name); }}
        disabled={saving}
      />
      <button
        onClick={handleAssign}
        disabled={!selectedId || saving}
        className="w-full bg-green-700 hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
      >
        {saving ? "กำลังบันทึก…" : "ยืนยันมอบหมาย"}
      </button>
    </div>
  );
}
