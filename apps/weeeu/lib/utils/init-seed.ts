// ─── Initial Seed — runs once on app boot ─────────────────────────────────────
// If localStorage has no service-progress data, seeds from mock-data verbatim
"use client";

import { getServiceProgress, setServiceProgress } from "@/lib/utils/service-progress-sync";
import { serviceProgressSeed } from "@/lib/mock-data/service-progress";

export function initServiceProgressSeed(): void {
  if (typeof window === "undefined") return;
  const existing = getServiceProgress();
  if (existing.length === 0) {
    setServiceProgress(serviceProgressSeed);
  }
}
