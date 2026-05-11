// ── Service Progress Sync — D79 (Phase C-5, WeeeR) ───────────────────────────
// SSR-safe BroadcastChannel wrapper — port 3001 only (WeeeR own app)
// Pattern mirrors WeeeU implementation (D66 self-contained, no cross-app imports)

const CHANNEL_NAME = "service-progress-weeer";

export type ProgressSyncEvent =
  | { type: "repair_stage_changed";   jobId: string; stage: string; timestamp: string }
  | { type: "maintain_stage_changed"; jobId: string; stage: string; timestamp: string }
  | { type: "weeet_assigned";         jobId: string; service: "repair" | "maintain"; weeeTId: string; weeeTName: string }
  | { type: "decision_pending";       jobId: string }
  | { type: "refresh_jobs" };

type ProgressSyncListener = (event: ProgressSyncEvent) => void;

/** SSR-safe check — BroadcastChannel only exists in browser */
const isBrowser = typeof window !== "undefined";

class ServiceProgressSync {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<ProgressSyncListener> = new Set();

  private getChannel(): BroadcastChannel | null {
    if (!isBrowser) return null;
    if (!this.channel) {
      try {
        this.channel = new BroadcastChannel(CHANNEL_NAME);
        this.channel.onmessage = (e: MessageEvent<ProgressSyncEvent>) => {
          this.listeners.forEach((fn) => fn(e.data));
        };
      } catch {
        // BroadcastChannel not supported
        return null;
      }
    }
    return this.channel;
  }

  /** Broadcast a sync event to other tabs on the same origin (port 3001) */
  emit(event: ProgressSyncEvent): void {
    this.getChannel()?.postMessage(event);
  }

  /** Subscribe to sync events. Returns an unsubscribe function. */
  subscribe(listener: ProgressSyncListener): () => void {
    this.listeners.add(listener);
    this.getChannel(); // ensure channel is open
    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0) {
        this.channel?.close();
        this.channel = null;
      }
    };
  }
}

export const serviceProgressSync = new ServiceProgressSync();

// ── React hook helper ─────────────────────────────────────────────────────────

import { useEffect } from "react";

/**
 * Subscribe to service progress sync events in a React component.
 * Automatically unsubscribes on unmount.
 * Visibility-aware: re-subscribes when tab becomes visible again.
 */
export function useServiceProgressSync(
  listener: ProgressSyncListener,
  deps: React.DependencyList = [],
): void {
  useEffect(() => {
    const unsub = serviceProgressSync.subscribe(listener);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        // Re-trigger a refresh so stale data is updated when tab regains focus
        listener({ type: "refresh_jobs" });
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      unsub();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
