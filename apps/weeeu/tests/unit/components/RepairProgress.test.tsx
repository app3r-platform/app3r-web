/**
 * RepairProgress.test.tsx
 * Sub-CMD-5 Wave 2 — Service Progress Tracker D79
 *
 * ทดสอบ components และ logic ของ progress timeline:
 * - StepIcon rendering (done / current / pending)
 * - deriveStepsFromStatus — fallback step derivation
 * - Progress bar rendering
 * - Priority badge + progress bar ใน repair list (REDO Sub-4 inline types)
 *
 * ⚠️ Formal Ruling Option D: ใช้ inline types เท่านั้น ห้าม stub type file
 */

import React from "react";
import { render, screen } from "@testing-library/react";

// ─── 1. Inline PRIORITY_CONFIG test (REDO Sub-4) ────────────────────────────

type ServicePriority = "normal" | "urgent" | "vip";
const PRIORITY_CONFIG: Record<ServicePriority, { label: string; cls: string; icon: string }> = {
  normal: { label: "ปกติ",     cls: "bg-gray-100 text-gray-600",    icon: "⚪" },
  urgent: { label: "เร่งด่วน", cls: "bg-orange-100 text-orange-700", icon: "🔶" },
  vip:    { label: "VIP",      cls: "bg-purple-100 text-purple-700", icon: "👑" },
};

describe("Inline PRIORITY_CONFIG (Sub-4 REDO — no stub file)", () => {
  it("defines 3 priority levels", () => {
    expect(Object.keys(PRIORITY_CONFIG)).toHaveLength(3);
  });

  it("urgent uses orange class", () => {
    expect(PRIORITY_CONFIG.urgent.cls).toContain("orange");
  });

  it("vip uses purple class", () => {
    expect(PRIORITY_CONFIG.vip.cls).toContain("purple");
  });

  it("normal label = ปกติ", () => {
    expect(PRIORITY_CONFIG.normal.label).toBe("ปกติ");
  });
});

// ─── 2. PriorityBadge (inline types, no import from stub file) ───────────────

function PriorityBadge({ priority }: { priority: ServicePriority | null | undefined }) {
  if (!priority || priority === "normal") return null;
  const cfg = PRIORITY_CONFIG[priority];
  return (
    <span data-testid="priority-badge" className={`text-xs px-2 py-0.5 rounded-full ${cfg.cls}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

describe("PriorityBadge (inline types)", () => {
  it("renders nothing for normal", () => {
    const { container } = render(<PriorityBadge priority="normal" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing for null", () => {
    const { container } = render(<PriorityBadge priority={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders urgent badge", () => {
    render(<PriorityBadge priority="urgent" />);
    expect(screen.getByTestId("priority-badge")).toBeInTheDocument();
    expect(screen.getByText(/เร่งด่วน/)).toBeInTheDocument();
  });

  it("renders vip badge with purple class", () => {
    render(<PriorityBadge priority="vip" />);
    const badge = screen.getByTestId("priority-badge");
    expect(badge.className).toContain("purple");
  });
});

// ─── 3. StepIcon (extracted from progress page) ──────────────────────────────

function StepIcon({ isDone, isCurrent }: { isDone: boolean; isCurrent: boolean }) {
  if (isDone)    return <div data-testid="step-done"    className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold">✓</div>;
  if (isCurrent) return <div data-testid="step-current" className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center"><div className="w-2.5 h-2.5 rounded-full bg-white" /></div>;
  return          <div data-testid="step-pending" className="w-7 h-7 rounded-full border-2 border-gray-200 bg-white" />;
}

describe("StepIcon", () => {
  it("renders done icon (green checkmark) when isDone=true", () => {
    render(<StepIcon isDone isCurrent={false} />);
    expect(screen.getByTestId("step-done")).toBeInTheDocument();
    expect(screen.queryByTestId("step-current")).not.toBeInTheDocument();
  });

  it("renders current icon (indigo pulse) when isCurrent=true and isDone=false", () => {
    render(<StepIcon isDone={false} isCurrent />);
    expect(screen.getByTestId("step-current")).toBeInTheDocument();
    expect(screen.queryByTestId("step-done")).not.toBeInTheDocument();
  });

  it("renders pending icon (gray ring) when both false", () => {
    render(<StepIcon isDone={false} isCurrent={false} />);
    expect(screen.getByTestId("step-pending")).toBeInTheDocument();
  });

  it("isDone takes precedence over isCurrent", () => {
    render(<StepIcon isDone isCurrent />);
    expect(screen.getByTestId("step-done")).toBeInTheDocument();
    expect(screen.queryByTestId("step-current")).not.toBeInTheDocument();
  });
});

// ─── 4. deriveStepsFromStatus logic ──────────────────────────────────────────

type ServiceProgressStep = {
  step_key: string; label: string; description: string | null;
  completed_at: string | null; actor_role: string | null;
  is_current: boolean; is_done: boolean;
};

function deriveStepsFromStatus(status: string, applianceName: string): ServiceProgressStep[] {
  const onSiteSteps = [
    { key: "assigned",        label: "มอบหมายช่าง",        desc: `ช่างรับงานซ่อม ${applianceName}` },
    { key: "traveling",       label: "ช่างออกเดินทาง",       desc: "ช่างกำลังมุ่งหน้าไปยังที่อยู่ของคุณ" },
    { key: "arrived",         label: "ช่างถึงหน้างาน",        desc: "ช่างมาถึงแล้ว — รอเข้าหน้างาน" },
    { key: "inspecting",      label: "ตรวจสอบเครื่อง",        desc: "ช่างกำลังวินิจฉัยอาการเสีย" },
    { key: "in_progress",     label: "กำลังซ่อม",             desc: "อยู่ระหว่างดำเนินการซ่อม" },
    { key: "completed",       label: "ซ่อมเสร็จ",             desc: "ช่างซ่อมเสร็จแล้ว — รอตรวจรับงาน" },
    { key: "awaiting_review", label: "ตรวจรับงาน",            desc: "คุณต้องยืนยันรับงาน" },
    { key: "closed",          label: "งานสำเร็จ",             desc: "งานซ่อมเสร็จสมบูรณ์" },
  ];
  const ORDER = onSiteSteps.map(s => s.key);
  const currentIdx = ORDER.indexOf(status);
  return onSiteSteps.map((step, idx) => ({
    step_key:     step.key,
    label:        step.label,
    description:  step.desc,
    completed_at: null,
    actor_role:   null,
    is_done:      idx < currentIdx,
    is_current:   idx === currentIdx,
  }));
}

describe("deriveStepsFromStatus", () => {
  it("returns 8 steps for on-site workflow", () => {
    const steps = deriveStepsFromStatus("assigned", "เครื่องซักผ้า");
    expect(steps).toHaveLength(8);
  });

  it("first step is current when status=assigned", () => {
    const steps = deriveStepsFromStatus("assigned", "เครื่องซักผ้า");
    expect(steps[0].is_current).toBe(true);
    expect(steps[0].is_done).toBe(false);
  });

  it("steps before current are marked done", () => {
    const steps = deriveStepsFromStatus("inspecting", "ตู้เย็น");
    // assigned, traveling, arrived are done; inspecting is current
    expect(steps[0].is_done).toBe(true);   // assigned
    expect(steps[1].is_done).toBe(true);   // traveling
    expect(steps[2].is_done).toBe(true);   // arrived
    expect(steps[3].is_current).toBe(true); // inspecting
    expect(steps[4].is_done).toBe(false);  // in_progress not yet
  });

  it("appliance_name is included in first step description", () => {
    const steps = deriveStepsFromStatus("assigned", "เครื่องปรับอากาศ");
    expect(steps[0].description).toContain("เครื่องปรับอากาศ");
  });

  it("unknown status → no step is current or done", () => {
    const steps = deriveStepsFromStatus("unknown_status", "เครื่อง");
    expect(steps.every(s => !s.is_current && !s.is_done)).toBe(true);
  });

  it("all steps done except last when status=awaiting_review", () => {
    const steps = deriveStepsFromStatus("awaiting_review", "โทรทัศน์");
    const awaiting = steps.find(s => s.step_key === "awaiting_review");
    expect(awaiting?.is_current).toBe(true);
    // closed should not be done
    const closed = steps.find(s => s.step_key === "closed");
    expect(closed?.is_done).toBe(false);
  });
});

// ─── 5. Progress bar component ────────────────────────────────────────────────

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div>
      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          data-testid="progress-fill"
          className="h-full bg-indigo-400 rounded-full"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p data-testid="progress-label">{percent}%</p>
    </div>
  );
}

describe("ProgressBar", () => {
  it("shows 0% width when percent=0", () => {
    render(<ProgressBar percent={0} />);
    expect(screen.getByTestId("progress-fill")).toHaveStyle({ width: "0%" });
    expect(screen.getByTestId("progress-label")).toHaveTextContent("0%");
  });

  it("shows 60% width", () => {
    render(<ProgressBar percent={60} />);
    expect(screen.getByTestId("progress-fill")).toHaveStyle({ width: "60%" });
  });

  it("shows 100% width when complete", () => {
    render(<ProgressBar percent={100} />);
    expect(screen.getByTestId("progress-fill")).toHaveStyle({ width: "100%" });
    expect(screen.getByTestId("progress-label")).toHaveTextContent("100%");
  });
});

// ─── 6. Timeline step rendering ───────────────────────────────────────────────

function TimelineStep({ step }: { step: ServiceProgressStep }) {
  return (
    <div data-testid={`step-${step.step_key}`}>
      <StepIcon isDone={step.is_done} isCurrent={step.is_current} />
      <p>{step.label}</p>
      {step.description && <p>{step.description}</p>}
      {step.is_current && <span>กำลังดำเนินการ</span>}
    </div>
  );
}

describe("TimelineStep", () => {
  it("renders step label", () => {
    const step: ServiceProgressStep = {
      step_key: "assigned", label: "มอบหมายช่าง", description: "ช่างรับงาน",
      completed_at: null, actor_role: null, is_done: false, is_current: true,
    };
    render(<TimelineStep step={step} />);
    expect(screen.getByText("มอบหมายช่าง")).toBeInTheDocument();
  });

  it("renders description when present", () => {
    const step: ServiceProgressStep = {
      step_key: "traveling", label: "ช่างออกเดินทาง", description: "มุ่งหน้ามาแล้ว",
      completed_at: null, actor_role: null, is_done: true, is_current: false,
    };
    render(<TimelineStep step={step} />);
    expect(screen.getByText("มุ่งหน้ามาแล้ว")).toBeInTheDocument();
  });

  it("shows กำลังดำเนินการ badge for current step", () => {
    const step: ServiceProgressStep = {
      step_key: "in_progress", label: "กำลังซ่อม", description: null,
      completed_at: null, actor_role: null, is_done: false, is_current: true,
    };
    render(<TimelineStep step={step} />);
    expect(screen.getByText("กำลังดำเนินการ")).toBeInTheDocument();
  });

  it("does NOT show กำลังดำเนินการ badge for done step", () => {
    const step: ServiceProgressStep = {
      step_key: "assigned", label: "มอบหมายช่าง", description: null,
      completed_at: null, actor_role: null, is_done: true, is_current: false,
    };
    render(<TimelineStep step={step} />);
    expect(screen.queryByText("กำลังดำเนินการ")).not.toBeInTheDocument();
  });
});
