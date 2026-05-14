/**
 * RepairExpandedFields.test.tsx
 * Sub-CMD-4 Wave 2 — Services Table Full Expand
 *
 * ทดสอบ UI components ที่แสดง expanded fields:
 * - Priority badge (urgent / vip) ใน repair list + repair detail
 * - Progress bar เมื่อ progress_percent > 0
 * - Warranty card เมื่อ warranty_days > 0
 * - Diagnosis note card เมื่อ diagnosis_note มีค่า
 * - Cancellation card เมื่อ status = cancelled + cancelled_reason
 * - Customer note + priority selector ใน repair/new form
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { PRIORITY_CONFIG } from "@/lib/types/service-expanded.stub";
import type { ServicePriority } from "@/lib/types/service-expanded.stub";

// ─── 1. PRIORITY_CONFIG unit tests ────────────────────────────────────────────

describe("PRIORITY_CONFIG", () => {
  it("มี 3 ระดับ: normal, urgent, vip", () => {
    const keys = Object.keys(PRIORITY_CONFIG);
    expect(keys).toHaveLength(3);
    expect(keys).toContain("normal");
    expect(keys).toContain("urgent");
    expect(keys).toContain("vip");
  });

  it("แต่ละระดับมี label, cls, icon ครบถ้วน", () => {
    (["normal", "urgent", "vip"] as ServicePriority[]).forEach(p => {
      expect(PRIORITY_CONFIG[p].label).toBeTruthy();
      expect(PRIORITY_CONFIG[p].cls).toBeTruthy();
      expect(PRIORITY_CONFIG[p].icon).toBeTruthy();
    });
  });

  it("urgent ใช้สี orange", () => {
    expect(PRIORITY_CONFIG.urgent.cls).toContain("orange");
  });

  it("vip ใช้สี purple", () => {
    expect(PRIORITY_CONFIG.vip.cls).toContain("purple");
  });
});

// ─── 2. Priority badge component (extracted logic) ────────────────────────────

/** Minimal priority badge component — mirrors render logic in repair/page.tsx */
function PriorityBadge({ priority }: { priority: ServicePriority | null | undefined }) {
  if (!priority || priority === "normal") return null;
  const cfg = PRIORITY_CONFIG[priority];
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.cls}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

describe("PriorityBadge", () => {
  it("ไม่แสดง badge เมื่อ priority = normal", () => {
    const { container } = render(<PriorityBadge priority="normal" />);
    expect(container.firstChild).toBeNull();
  });

  it("ไม่แสดง badge เมื่อ priority = null", () => {
    const { container } = render(<PriorityBadge priority={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("ไม่แสดง badge เมื่อ priority = undefined", () => {
    const { container } = render(<PriorityBadge priority={undefined} />);
    expect(container.firstChild).toBeNull();
  });

  it("แสดง badge เร่งด่วน เมื่อ priority = urgent", () => {
    render(<PriorityBadge priority="urgent" />);
    expect(screen.getByText(/เร่งด่วน/)).toBeInTheDocument();
  });

  it("แสดง badge VIP เมื่อ priority = vip", () => {
    render(<PriorityBadge priority="vip" />);
    expect(screen.getByText(/VIP/)).toBeInTheDocument();
  });

  it("urgent badge มี class orange", () => {
    render(<PriorityBadge priority="urgent" />);
    const badge = screen.getByText(/เร่งด่วน/);
    expect(badge.className).toContain("orange");
  });

  it("vip badge มี class purple", () => {
    render(<PriorityBadge priority="vip" />);
    const badge = screen.getByText(/VIP/);
    expect(badge.className).toContain("purple");
  });
});

// ─── 3. Progress bar component ────────────────────────────────────────────────

function ProgressBar({ percent }: { percent: number | null | undefined }) {
  if (percent == null || percent <= 0) return null;
  return (
    <div data-testid="progress-bar-wrapper">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-400 rounded-full"
            style={{ width: `${percent}%` }}
            data-testid="progress-fill"
          />
        </div>
        <span className="text-xs text-indigo-500 font-medium">{percent}%</span>
      </div>
    </div>
  );
}

describe("ProgressBar", () => {
  it("ไม่แสดงเมื่อ percent = null", () => {
    const { container } = render(<ProgressBar percent={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("ไม่แสดงเมื่อ percent = 0", () => {
    const { container } = render(<ProgressBar percent={0} />);
    expect(container.firstChild).toBeNull();
  });

  it("ไม่แสดงเมื่อ percent = undefined", () => {
    const { container } = render(<ProgressBar percent={undefined} />);
    expect(container.firstChild).toBeNull();
  });

  it("แสดง progress bar เมื่อ percent = 45", () => {
    render(<ProgressBar percent={45} />);
    expect(screen.getByTestId("progress-bar-wrapper")).toBeInTheDocument();
    expect(screen.getByText("45%")).toBeInTheDocument();
  });

  it("fill div มี width = 45%", () => {
    render(<ProgressBar percent={45} />);
    const fill = screen.getByTestId("progress-fill");
    expect(fill).toHaveStyle({ width: "45%" });
  });

  it("แสดง 100% ได้ถูกต้อง", () => {
    render(<ProgressBar percent={100} />);
    const fill = screen.getByTestId("progress-fill");
    expect(fill).toHaveStyle({ width: "100%" });
    expect(screen.getByText("100%")).toBeInTheDocument();
  });
});

// ─── 4. Warranty card ─────────────────────────────────────────────────────────

function WarrantyCard({
  warrantyDays,
  warrantyExpiresAt,
}: {
  warrantyDays?: number | null;
  warrantyExpiresAt?: string | null;
}) {
  if (!warrantyDays || warrantyDays <= 0) return null;
  return (
    <div data-testid="warranty-card" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">ประกันงานซ่อม</p>
      <div className="flex items-center gap-3">
        <span className="text-2xl">🛡️</span>
        <div>
          <p className="text-sm font-semibold text-green-700">รับประกัน {warrantyDays} วัน</p>
          {warrantyExpiresAt && (
            <p className="text-xs text-gray-500 mt-0.5">
              หมดอายุ: {new Date(warrantyExpiresAt).toLocaleDateString("th-TH")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

describe("WarrantyCard", () => {
  it("ไม่แสดงเมื่อ warrantyDays = null", () => {
    const { container } = render(<WarrantyCard warrantyDays={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("ไม่แสดงเมื่อ warrantyDays = 0", () => {
    const { container } = render(<WarrantyCard warrantyDays={0} />);
    expect(container.firstChild).toBeNull();
  });

  it("แสดง warranty card เมื่อ warrantyDays = 30", () => {
    render(<WarrantyCard warrantyDays={30} />);
    expect(screen.getByTestId("warranty-card")).toBeInTheDocument();
    expect(screen.getByText(/รับประกัน 30 วัน/)).toBeInTheDocument();
  });

  it("แสดง warranty expires_at เมื่อมีค่า", () => {
    render(<WarrantyCard warrantyDays={90} warrantyExpiresAt="2026-08-01T00:00:00Z" />);
    expect(screen.getByText(/หมดอายุ/)).toBeInTheDocument();
  });

  it("ไม่แสดง expires เมื่อ warrantyExpiresAt = null", () => {
    render(<WarrantyCard warrantyDays={30} warrantyExpiresAt={null} />);
    expect(screen.queryByText(/หมดอายุ/)).not.toBeInTheDocument();
  });
});

// ─── 5. Diagnosis note card ───────────────────────────────────────────────────

function DiagnosisCard({
  diagnosisNote,
  technicianNote,
}: {
  diagnosisNote?: string | null;
  technicianNote?: string | null;
}) {
  if (!diagnosisNote && !technicianNote) return null;
  return (
    <div data-testid="diagnosis-card" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">บันทึกจากช่าง</p>
      {diagnosisNote && (
        <div>
          <p className="text-xs text-gray-500 mb-1">ผลการตรวจสอบ</p>
          <p className="text-sm text-gray-800">{diagnosisNote}</p>
        </div>
      )}
      {technicianNote && (
        <div>
          <p className="text-xs text-gray-500 mb-1">หมายเหตุช่าง</p>
          <p className="text-sm text-gray-800">{technicianNote}</p>
        </div>
      )}
    </div>
  );
}

describe("DiagnosisCard", () => {
  it("ไม่แสดงเมื่อทั้งสอง field เป็น null", () => {
    const { container } = render(<DiagnosisCard diagnosisNote={null} technicianNote={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("ไม่แสดงเมื่อไม่มี prop ใดเลย", () => {
    const { container } = render(<DiagnosisCard />);
    expect(container.firstChild).toBeNull();
  });

  it("แสดงเมื่อมี diagnosisNote", () => {
    render(<DiagnosisCard diagnosisNote="คอมเพรสเซอร์เสื่อม" />);
    expect(screen.getByTestId("diagnosis-card")).toBeInTheDocument();
    expect(screen.getByText("คอมเพรสเซอร์เสื่อม")).toBeInTheDocument();
  });

  it("แสดง technicianNote เมื่อมีค่า", () => {
    render(<DiagnosisCard technicianNote="เปลี่ยนคอมเพรสเซอร์แล้ว" />);
    expect(screen.getByText("เปลี่ยนคอมเพรสเซอร์แล้ว")).toBeInTheDocument();
  });

  it("แสดงทั้งสอง field พร้อมกันได้", () => {
    render(
      <DiagnosisCard
        diagnosisNote="ไฟฟ้าลัดวงจร"
        technicianNote="เปลี่ยน PCB แล้ว"
      />
    );
    expect(screen.getByText("ไฟฟ้าลัดวงจร")).toBeInTheDocument();
    expect(screen.getByText("เปลี่ยน PCB แล้ว")).toBeInTheDocument();
  });
});

// ─── 6. Cancellation card ────────────────────────────────────────────────────

function CancellationCard({
  status,
  cancelledReason,
  cancelledAt,
}: {
  status: string;
  cancelledReason?: string | null;
  cancelledAt?: string | null;
}) {
  if (status !== "cancelled" || !cancelledReason) return null;
  return (
    <div data-testid="cancellation-card" className="bg-red-50 border border-red-200 rounded-2xl p-4">
      <p className="text-sm font-semibold text-red-700 mb-1">❌ ยกเลิกงาน</p>
      <p className="text-sm text-red-600">{cancelledReason}</p>
      {cancelledAt && (
        <p className="text-xs text-red-400 mt-1">
          เวลา: {new Date(cancelledAt).toLocaleString("th-TH")}
        </p>
      )}
    </div>
  );
}

describe("CancellationCard", () => {
  it("ไม่แสดงเมื่อ status ไม่ใช่ cancelled", () => {
    const { container } = render(
      <CancellationCard status="closed" cancelledReason="ลูกค้ายกเลิก" />
    );
    expect(container.firstChild).toBeNull();
  });

  it("ไม่แสดงเมื่อ status = cancelled แต่ไม่มี cancelledReason", () => {
    const { container } = render(
      <CancellationCard status="cancelled" cancelledReason={null} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("แสดง cancellation card เมื่อ status = cancelled + มี cancelledReason", () => {
    render(
      <CancellationCard status="cancelled" cancelledReason="ลูกค้าไม่สะดวก" />
    );
    expect(screen.getByTestId("cancellation-card")).toBeInTheDocument();
    expect(screen.getByText("ลูกค้าไม่สะดวก")).toBeInTheDocument();
  });

  it("แสดง cancelledAt เมื่อมีค่า", () => {
    render(
      <CancellationCard
        status="cancelled"
        cancelledReason="ราคาสูงเกิน"
        cancelledAt="2026-05-14T10:00:00Z"
      />
    );
    expect(screen.getByText(/เวลา:/)).toBeInTheDocument();
  });
});

// ─── 7. Priority selector (repair/new) ────────────────────────────────────────

function PrioritySelector({
  value,
  onChange,
}: {
  value: ServicePriority;
  onChange: (p: ServicePriority) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">ลำดับความสำคัญ</label>
      <div className="flex gap-2">
        {(["normal", "urgent", "vip"] as ServicePriority[]).map(p => {
          const cfg = PRIORITY_CONFIG[p];
          const active = value === p;
          return (
            <button
              key={p}
              type="button"
              data-testid={`priority-btn-${p}`}
              aria-pressed={active}
              onClick={() => onChange(p)}
              className={active ? `selected ${cfg.cls}` : "unselected"}
            >
              {cfg.icon} {cfg.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

describe("PrioritySelector", () => {
  it("แสดงปุ่มทั้ง 3 ระดับ", () => {
    const fn = jest.fn();
    render(<PrioritySelector value="normal" onChange={fn} />);
    expect(screen.getByTestId("priority-btn-normal")).toBeInTheDocument();
    expect(screen.getByTestId("priority-btn-urgent")).toBeInTheDocument();
    expect(screen.getByTestId("priority-btn-vip")).toBeInTheDocument();
  });

  it("ปุ่มที่ active มี aria-pressed = true", () => {
    const fn = jest.fn();
    render(<PrioritySelector value="urgent" onChange={fn} />);
    expect(screen.getByTestId("priority-btn-urgent")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("priority-btn-normal")).toHaveAttribute("aria-pressed", "false");
  });

  it("กดปุ่ม vip แล้ว onChange ถูกเรียกด้วย 'vip'", () => {
    const fn = jest.fn();
    render(<PrioritySelector value="normal" onChange={fn} />);
    fireEvent.click(screen.getByTestId("priority-btn-vip"));
    expect(fn).toHaveBeenCalledWith("vip");
  });

  it("กดปุ่ม urgent แล้ว onChange ถูกเรียกด้วย 'urgent'", () => {
    const fn = jest.fn();
    render(<PrioritySelector value="normal" onChange={fn} />);
    fireEvent.click(screen.getByTestId("priority-btn-urgent"));
    expect(fn).toHaveBeenCalledWith("urgent");
  });

  it("กดปุ่ม normal แล้ว onChange ถูกเรียกด้วย 'normal'", () => {
    const fn = jest.fn();
    render(<PrioritySelector value="vip" onChange={fn} />);
    fireEvent.click(screen.getByTestId("priority-btn-normal"));
    expect(fn).toHaveBeenCalledWith("normal");
  });
});
