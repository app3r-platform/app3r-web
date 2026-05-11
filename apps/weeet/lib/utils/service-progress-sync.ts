"use client";
// Phase C-5 — In-app localStorage sync + BroadcastChannel (same-origin port 3003 only)
// Phase 2 limitation: no cross-app real-time sync (different ports = different origins)
// Phase D migration: swap localStorage → REST API + WebSocket

import { useEffect, useState, useCallback, useRef } from "react";
import type { ServiceProgress, ProgressStep } from "../types/service-progress";

const STORAGE_KEY = "app3r-service-progress";
const CHANNEL_NAME = "app3r-service-progress-sync";
const POLL_INTERVAL_MS = 5000;

function isClient(): boolean {
  return typeof window !== "undefined";
}

export function loadProgress(): ServiceProgress[] {
  if (!isClient()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ServiceProgress[]) : [];
  } catch {
    return [];
  }
}

export function saveProgress(jobs: ServiceProgress[]): void {
  if (!isClient()) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
    // Broadcast to other tabs (same-origin only)
    try {
      const bc = new BroadcastChannel(CHANNEL_NAME);
      bc.postMessage({ type: "update", timestamp: Date.now() });
      bc.close();
    } catch {
      // BroadcastChannel not supported
    }
  } catch {
    // localStorage full or unavailable
  }
}

export function advanceSubStage(
  jobId: string,
  nextSubStage: string,
  step: ProgressStep,
  nextMainStage?: "completed"
): void {
  const jobs = loadProgress();
  const updated = jobs.map((j) => {
    if (j.jobId !== jobId) return j;
    return {
      ...j,
      currentStage: nextMainStage ?? j.currentStage,
      currentSubStage: nextMainStage ? undefined : nextSubStage,
      steps: [...j.steps, step],
      updatedAt: new Date().toISOString(),
    };
  });
  saveProgress(updated);
}

export function useServiceProgress(filterByTechId?: string): {
  jobs: ServiceProgress[];
  refresh: () => void;
  advanceStep: (jobId: string, nextSubStage: string, step: ProgressStep, markComplete?: boolean) => void;
} {
  const [jobs, setJobs] = useState<ServiceProgress[]>([]);
  const bcRef = useRef<BroadcastChannel | null>(null);

  const refresh = useCallback(() => {
    const all = loadProgress();
    setJobs(filterByTechId ? all.filter((j) => j.technicianId === filterByTechId) : all);
  }, [filterByTechId]);

  const advanceStep = useCallback(
    (jobId: string, nextSubStage: string, step: ProgressStep, markComplete = false) => {
      advanceSubStage(jobId, nextSubStage, step, markComplete ? "completed" : undefined);
      refresh();
    },
    [refresh]
  );

  useEffect(() => {
    if (!isClient()) return;
    refresh();

    // BroadcastChannel for same-origin multi-tab sync
    try {
      bcRef.current = new BroadcastChannel(CHANNEL_NAME);
      bcRef.current.onmessage = () => refresh();
    } catch {
      // not supported
    }

    // Polling fallback (visibility-aware)
    let interval: ReturnType<typeof setInterval> | null = null;

    function startPolling() {
      interval = setInterval(() => {
        if (document.visibilityState !== "hidden") refresh();
      }, POLL_INTERVAL_MS);
    }
    function stopPolling() {
      if (interval) clearInterval(interval);
    }
    function onVisibility() {
      if (document.visibilityState === "hidden") stopPolling();
      else { startPolling(); refresh(); }
    }

    startPolling();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", onVisibility);
      bcRef.current?.close();
    };
  }, [refresh]);

  return { jobs, refresh, advanceStep };
}
