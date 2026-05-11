// ─── Service Progress Sync Util (D79 — same-origin, port 3002 only) ───────────
// Scope: WeeeU app localStorage only — ห้าม poll WeeeR/WeeeT localStorage
"use client";

import type { ServiceProgress } from "@/lib/types/service-progress";

const STORAGE_KEY = "app3r-service-progress";
const CHANNEL_NAME = "app3r-service-progress-channel";
export const POLL_INTERVAL_MS = 5000;

// ─── Read ──────────────────────────────────────────────────────────────────────
export function getServiceProgress(): ServiceProgress[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ServiceProgress[]) : [];
  } catch {
    return [];
  }
}

export function getJobProgress(jobId: string): ServiceProgress | undefined {
  return getServiceProgress().find((p) => p.jobId === jobId);
}

// ─── Write ─────────────────────────────────────────────────────────────────────
export function setServiceProgress(data: ServiceProgress[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  // Broadcast to same-origin tabs only
  try {
    const bc = new BroadcastChannel(CHANNEL_NAME);
    bc.postMessage({ type: "updated", data });
    bc.close();
  } catch {
    // BroadcastChannel not supported — silent fail
  }
}

export function upsertJobProgress(job: ServiceProgress): void {
  const all = getServiceProgress();
  const idx = all.findIndex((p) => p.jobId === job.jobId);
  if (idx >= 0) {
    all[idx] = { ...job, updatedAt: new Date().toISOString() };
  } else {
    all.push({ ...job, updatedAt: new Date().toISOString() });
  }
  setServiceProgress(all);
}

// ─── Submit review (WeeeU authority: stage = reviewed only) ───────────────────
export function submitReview(
  jobId: string,
  rating: 1 | 2 | 3 | 4 | 5,
  comment: string,
): boolean {
  if (typeof window === "undefined") return false;
  const all = getServiceProgress();
  const idx = all.findIndex((p) => p.jobId === jobId);
  if (idx < 0) return false;
  const job = all[idx];
  if (job.currentStage !== "completed") return false; // can only review after completed
  all[idx] = {
    ...job,
    currentStage: "reviewed",
    review: {
      rating,
      comment,
      submittedAt: new Date().toISOString(),
    },
    updatedAt: new Date().toISOString(),
  };
  setServiceProgress(all);
  return true;
}

// ─── Polling + BroadcastChannel hook (React) ──────────────────────────────────
export function useServiceProgressSync(
  onChange: (data: ServiceProgress[]) => void,
): () => void {
  if (typeof window === "undefined") return () => {};

  // Initial load
  onChange(getServiceProgress());

  // BroadcastChannel listener (same-origin tabs)
  let bc: BroadcastChannel | null = null;
  try {
    bc = new BroadcastChannel(CHANNEL_NAME);
    bc.onmessage = (event) => {
      if (event.data?.type === "updated" && Array.isArray(event.data.data)) {
        onChange(event.data.data as ServiceProgress[]);
      }
    };
  } catch {
    // BroadcastChannel not supported
  }

  // Polling fallback (5 s) — paused when tab is hidden
  let intervalId: ReturnType<typeof setInterval> | null = null;

  const startPolling = () => {
    intervalId = setInterval(() => {
      onChange(getServiceProgress());
    }, POLL_INTERVAL_MS);
  };

  const stopPolling = () => {
    if (intervalId != null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };

  const handleVisibility = () => {
    if (document.visibilityState === "visible") {
      onChange(getServiceProgress()); // immediate refresh on focus
      startPolling();
    } else {
      stopPolling();
    }
  };

  if (document.visibilityState === "visible") {
    startPolling();
  }
  document.addEventListener("visibilitychange", handleVisibility);

  // Cleanup
  return () => {
    stopPolling();
    document.removeEventListener("visibilitychange", handleVisibility);
    if (bc) {
      bc.close();
    }
  };
}
