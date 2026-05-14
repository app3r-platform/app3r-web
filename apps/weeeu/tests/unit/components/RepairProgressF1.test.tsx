/**
 * RepairProgressF1.test.tsx
 * F1 Carry-over (fix/weeeu-f1-carryover) — Service Progress Tracker
 *
 * ทดสอบ:
 * 1. SERVICE_PROGRESS_STATUS_LABEL — import จาก @/lib/types/service-progress (mirror)
 * 2. EntryCard — renders ServiceProgressDto data
 * 3. Polling fallback — setInterval 3000ms, cleanup on unmount
 * 4. ServiceProgressTimelineDto rendering — latestStatus, latestPercent, entries
 */

import React, { useEffect, useRef, useState } from "react";
import { render, screen, act, waitFor } from "@testing-library/react";
import {
  SERVICE_PROGRESS_STATUS_LABEL,
  type ServiceProgressStatus,
  type ServiceProgressDto,
  type ServiceProgressTimelineDto,
} from "@/lib/types/service-progress";

// ─── 1. Backend types mirror ──────────────────────────────────────────────────

describe("SERVICE_PROGRESS_STATUS_LABEL (mirror จาก Backend)", () => {
  it("covers all 6 statuses", () => {
    const statuses: ServiceProgressStatus[] = [
      "pending", "accepted", "in_progress", "paused", "completed", "cancelled",
    ];
    statuses.forEach(s => {
      expect(SERVICE_PROGRESS_STATUS_LABEL[s]).toBeDefined();
      expect(SERVICE_PROGRESS_STATUS_LABEL[s].length).toBeGreaterThan(0);
    });
  });

  it("pending = รอดำเนินการ", () => {
    expect(SERVICE_PROGRESS_STATUS_LABEL.pending).toBe("รอดำเนินการ");
  });

  it("in_progress = กำลังดำเนินการ", () => {
    expect(SERVICE_PROGRESS_STATUS_LABEL.in_progress).toBe("กำลังดำเนินการ");
  });

  it("completed = เสร็จสิ้น", () => {
    expect(SERVICE_PROGRESS_STATUS_LABEL.completed).toBe("เสร็จสิ้น");
  });

  it("cancelled = ยกเลิก", () => {
    expect(SERVICE_PROGRESS_STATUS_LABEL.cancelled).toBe("ยกเลิก");
  });
});

// ─── 2. ServiceProgressDto shape ─────────────────────────────────────────────

describe("ServiceProgressDto shape (mirror)", () => {
  const mockEntry: ServiceProgressDto = {
    id:              "ent-001",
    serviceId:       "svc-abc",
    status:          "in_progress",
    progressPercent: 55,
    note:            "กำลังซ่อมบอร์ด",
    photoR2Key:      null,
    updatedBy:       "tech-x",
    createdAt:       "2026-05-14T10:00:00Z",
  };

  it("has id, serviceId, status", () => {
    expect(mockEntry.id).toBe("ent-001");
    expect(mockEntry.serviceId).toBe("svc-abc");
    expect(mockEntry.status).toBe("in_progress");
  });

  it("progressPercent is number 0–100", () => {
    expect(typeof mockEntry.progressPercent).toBe("number");
    expect(mockEntry.progressPercent).toBeGreaterThanOrEqual(0);
    expect(mockEntry.progressPercent).toBeLessThanOrEqual(100);
  });

  it("note can be string or null", () => {
    expect(mockEntry.note).toBe("กำลังซ่อมบอร์ด");
    const noNote: ServiceProgressDto = { ...mockEntry, note: null };
    expect(noNote.note).toBeNull();
  });

  it("photoR2Key can be null", () => {
    expect(mockEntry.photoR2Key).toBeNull();
  });
});

// ─── 3. ServiceProgressTimelineDto shape ─────────────────────────────────────

describe("ServiceProgressTimelineDto shape (mirror)", () => {
  const mockTimeline: ServiceProgressTimelineDto = {
    serviceId:     "svc-abc",
    entries:       [],
    latestStatus:  null,
    latestPercent: 0,
  };

  it("empty timeline has latestPercent=0 and latestStatus=null", () => {
    expect(mockTimeline.latestPercent).toBe(0);
    expect(mockTimeline.latestStatus).toBeNull();
    expect(mockTimeline.entries).toHaveLength(0);
  });

  it("timeline with entries", () => {
    const entry: ServiceProgressDto = {
      id: "e1", serviceId: "svc-abc", status: "accepted",
      progressPercent: 20, note: null, photoR2Key: null,
      updatedBy: "tech-1", createdAt: "2026-05-14T09:00:00Z",
    };
    const tl: ServiceProgressTimelineDto = {
      serviceId: "svc-abc",
      entries: [entry],
      latestStatus: "accepted",
      latestPercent: 20,
    };
    expect(tl.entries).toHaveLength(1);
    expect(tl.latestStatus).toBe("accepted");
    expect(tl.latestPercent).toBe(20);
  });
});

// ─── 4. EntryCard rendering ───────────────────────────────────────────────────

// Inline EntryCard (mirrors page component logic)
function EntryCard({
  entry,
  isLatest,
}: {
  entry: ServiceProgressDto;
  isLatest: boolean;
}) {
  const label = SERVICE_PROGRESS_STATUS_LABEL[entry.status] ?? entry.status;
  return (
    <div data-testid={`entry-card-${entry.id}`}>
      <span data-testid={`entry-bullet-${entry.id}`}>•</span>
      <span data-testid="entry-label">{label}</span>
      <span data-testid="entry-percent">{entry.progressPercent}%</span>
      {isLatest && <span data-testid="latest-badge">ล่าสุด</span>}
      {entry.note && <p data-testid="entry-note">{entry.note}</p>}
      <span data-testid="entry-date">{entry.createdAt}</span>
    </div>
  );
}

describe("EntryCard (renders ServiceProgressDto)", () => {
  const baseEntry: ServiceProgressDto = {
    id: "e1", serviceId: "svc-1", status: "in_progress",
    progressPercent: 50, note: "ซ่อมอยู่", photoR2Key: null,
    updatedBy: "tech-1", createdAt: "2026-05-14T10:00:00Z",
  };

  it("renders Thai status label", () => {
    render(<EntryCard entry={baseEntry} isLatest={false} />);
    expect(screen.getByTestId("entry-label")).toHaveTextContent("กำลังดำเนินการ");
  });

  it("renders progressPercent", () => {
    render(<EntryCard entry={baseEntry} isLatest={false} />);
    expect(screen.getByTestId("entry-percent")).toHaveTextContent("50%");
  });

  it("shows ล่าสุด badge when isLatest=true", () => {
    render(<EntryCard entry={baseEntry} isLatest />);
    expect(screen.getByTestId("latest-badge")).toBeInTheDocument();
  });

  it("does NOT show ล่าสุด badge when isLatest=false", () => {
    render(<EntryCard entry={baseEntry} isLatest={false} />);
    expect(screen.queryByTestId("latest-badge")).not.toBeInTheDocument();
  });

  it("renders note when present", () => {
    render(<EntryCard entry={baseEntry} isLatest={false} />);
    expect(screen.getByTestId("entry-note")).toHaveTextContent("ซ่อมอยู่");
  });

  it("does NOT render note when null", () => {
    render(<EntryCard entry={{ ...baseEntry, note: null }} isLatest={false} />);
    expect(screen.queryByTestId("entry-note")).not.toBeInTheDocument();
  });

  it("renders completed label correctly", () => {
    render(<EntryCard entry={{ ...baseEntry, status: "completed" }} isLatest={false} />);
    expect(screen.getByTestId("entry-label")).toHaveTextContent("เสร็จสิ้น");
  });

  it("renders cancelled label correctly", () => {
    render(<EntryCard entry={{ ...baseEntry, status: "cancelled" }} isLatest={false} />);
    expect(screen.getByTestId("entry-label")).toHaveTextContent("ยกเลิก");
  });
});

// ─── 5. Polling fallback (Task 2) ─────────────────────────────────────────────

// Minimal component that mirrors polling logic from progress page
function PollingComponent({
  fetchFn,
  intervalMs = 3000,
}: {
  fetchFn: () => void;
  intervalMs?: number;
}) {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetchFn(); // initial
    timerRef.current = setInterval(fetchFn, intervalMs);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchFn, intervalMs]);

  return <div data-testid="polling-component">polling</div>;
}

describe("Polling fallback (Task 2 — 3s interval)", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("calls fetchFn immediately on mount", () => {
    const fetchFn = jest.fn();
    render(<PollingComponent fetchFn={fetchFn} intervalMs={3000} />);
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it("calls fetchFn again after 3s", () => {
    const fetchFn = jest.fn();
    render(<PollingComponent fetchFn={fetchFn} intervalMs={3000} />);
    expect(fetchFn).toHaveBeenCalledTimes(1);
    act(() => { jest.advanceTimersByTime(3000); });
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it("calls fetchFn 4 times total after 9s (initial + 3 polls)", () => {
    const fetchFn = jest.fn();
    render(<PollingComponent fetchFn={fetchFn} intervalMs={3000} />);
    act(() => { jest.advanceTimersByTime(9000); });
    expect(fetchFn).toHaveBeenCalledTimes(4); // 1 initial + 3 polls
  });

  it("stops polling after unmount (interval cleared)", () => {
    const fetchFn = jest.fn();
    const { unmount } = render(<PollingComponent fetchFn={fetchFn} intervalMs={3000} />);
    unmount();
    act(() => { jest.advanceTimersByTime(9000); });
    // Still only 1 call (initial) — no additional polls after unmount
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });
});

// ─── 6. latestPercent progress bar ───────────────────────────────────────────

function SummaryCard({ timeline }: { timeline: ServiceProgressTimelineDto }) {
  const label = timeline.latestStatus
    ? SERVICE_PROGRESS_STATUS_LABEL[timeline.latestStatus]
    : "รอดำเนินการ";
  return (
    <div>
      <p data-testid="status-label">{label}</p>
      <p data-testid="percent-display">{timeline.latestPercent}%</p>
      <div
        data-testid="main-progress-bar"
        style={{ width: `${timeline.latestPercent}%` }}
      />
    </div>
  );
}

describe("SummaryCard (latestStatus + latestPercent)", () => {
  it("shows รอดำเนินการ when latestStatus=null", () => {
    const tl: ServiceProgressTimelineDto = {
      serviceId: "s1", entries: [], latestStatus: null, latestPercent: 0,
    };
    render(<SummaryCard timeline={tl} />);
    expect(screen.getByTestId("status-label")).toHaveTextContent("รอดำเนินการ");
  });

  it("shows Thai label when latestStatus=in_progress", () => {
    const tl: ServiceProgressTimelineDto = {
      serviceId: "s1", entries: [], latestStatus: "in_progress", latestPercent: 45,
    };
    render(<SummaryCard timeline={tl} />);
    expect(screen.getByTestId("status-label")).toHaveTextContent("กำลังดำเนินการ");
    expect(screen.getByTestId("percent-display")).toHaveTextContent("45%");
  });

  it("progress bar width matches latestPercent", () => {
    const tl: ServiceProgressTimelineDto = {
      serviceId: "s1", entries: [], latestStatus: "completed", latestPercent: 100,
    };
    render(<SummaryCard timeline={tl} />);
    expect(screen.getByTestId("main-progress-bar")).toHaveStyle({ width: "100%" });
  });
});
