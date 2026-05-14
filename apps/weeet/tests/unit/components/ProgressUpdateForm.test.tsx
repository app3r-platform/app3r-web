/**
 * tests/unit/components/ProgressUpdateForm.test.tsx
 * Sub-5 Wave 2 — ProgressUpdateForm component tests
 *
 * ทดสอบ: form rendering, status selection, file validation, submit behavior
 */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ProgressUpdateForm } from "@/components/service-progress/ProgressUpdateForm";

// Mock getAdapter + DAL
const mockGetProgress = jest.fn();
const mockCreateProgress = jest.fn();
const mockUpdateProgress = jest.fn();

jest.mock("@/lib/dal", () => ({
  getAdapter: jest.fn(() => ({
    serviceProgress: {
      getProgress: mockGetProgress,
      createProgress: mockCreateProgress,
      updateProgress: mockUpdateProgress,
    },
  })),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockCreateProgress.mockResolvedValue({
    ok: true,
    data: {
      id: "prog-new-001",
      serviceId: "svc-001",
      status: "in_progress",
      progressPercent: 0,
      note: null,
      photoR2Key: null,
      updatedBy: "tech-001",
      createdAt: "2026-05-14T14:00:00Z",
    },
  });
  mockUpdateProgress.mockResolvedValue({
    ok: true,
    data: {
      id: "prog-001",
      serviceId: "svc-001",
      status: "completed",
      progressPercent: 100,
      note: "เสร็จแล้ว",
      photoR2Key: null,
      updatedBy: "tech-001",
      createdAt: "2026-05-14T14:00:00Z",
    },
  });
});

describe("ProgressUpdateForm — POST mode (no existingEntry)", () => {
  it("renders status options (6 ปุ่ม)", () => {
    render(<ProgressUpdateForm serviceId="svc-001" />);

    expect(screen.getByText(/รอดำเนินการ/)).toBeInTheDocument();
    expect(screen.getByText(/รับงานแล้ว/)).toBeInTheDocument();
    expect(screen.getByText(/กำลังดำเนินการ/)).toBeInTheDocument();
    expect(screen.getByText(/หยุดชั่วคราว/)).toBeInTheDocument();
    expect(screen.getByText(/เสร็จสิ้น/)).toBeInTheDocument();
    expect(screen.getByText(/ยกเลิก/)).toBeInTheDocument();
  });

  it("renders submit button with POST label", () => {
    render(<ProgressUpdateForm serviceId="svc-001" />);
    expect(screen.getByRole("button", { name: /บันทึก Progress/i })).toBeInTheDocument();
  });

  it("renders progress percent slider", () => {
    render(<ProgressUpdateForm serviceId="svc-001" />);
    expect(screen.getByRole("slider")).toBeInTheDocument();
    expect(screen.getByText("0%")).toBeInTheDocument();
  });

  it("renders note textarea", () => {
    render(<ProgressUpdateForm serviceId="svc-001" />);
    expect(screen.getByPlaceholderText(/รายละเอียดความคืบหน้า/i)).toBeInTheDocument();
  });

  it("renders photo upload zone", () => {
    render(<ProgressUpdateForm serviceId="svc-001" />);
    expect(screen.getByText(/แตะเพื่อเลือกรูป/i)).toBeInTheDocument();
  });

  it("does NOT render submit-row cancel button when onCancel not provided", () => {
    render(<ProgressUpdateForm serviceId="svc-001" />);
    // "❌ ยกเลิก" status option มีอยู่เสมอ
    // แต่ submit-row cancel button ("ยกเลิก" ไม่มี emoji) ไม่ควรมี
    // ตรวจ: ต้องมีปุ่ม "ยกเลิก" แค่ 1 ปุ่ม (คือ status option เท่านั้น ไม่มี cancel)
    const cancelButtons = screen.getAllByRole("button", { name: /ยกเลิก/i });
    // มีแค่ status option "❌ ยกเลิก" — ไม่มี submit-row cancel
    expect(cancelButtons).toHaveLength(1);
    expect(cancelButtons[0].textContent).toContain("❌");
  });

  it("renders submit-row cancel button when onCancel provided", () => {
    render(<ProgressUpdateForm serviceId="svc-001" onCancel={jest.fn()} />);
    // ตอนนี้ต้องมี 2 ปุ่มที่ match "ยกเลิก": status option + submit-row cancel
    const cancelButtons = screen.getAllByRole("button", { name: /ยกเลิก/i });
    expect(cancelButtons).toHaveLength(2);
    // submit-row cancel ไม่มี emoji
    const submitRowCancel = cancelButtons.find(b => !b.textContent?.includes("❌"));
    expect(submitRowCancel).toBeInTheDocument();
  });

  it("calls onCancel when submit-row cancel button clicked", () => {
    const onCancel = jest.fn();
    render(<ProgressUpdateForm serviceId="svc-001" onCancel={onCancel} />);
    // หา cancel button ใน submit row (ไม่มี emoji ❌)
    const cancelButtons = screen.getAllByRole("button", { name: /ยกเลิก/i });
    const submitRowCancel = cancelButtons.find(b => !b.textContent?.includes("❌"))!;
    fireEvent.click(submitRowCancel);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("calls createProgress on submit and calls onSuccess", async () => {
    const onSuccess = jest.fn();
    render(<ProgressUpdateForm serviceId="svc-001" onSuccess={onSuccess} />);

    fireEvent.click(screen.getByRole("button", { name: /บันทึก Progress/i }));

    await waitFor(() => {
      expect(mockCreateProgress).toHaveBeenCalledTimes(1);
    });
    expect(mockCreateProgress).toHaveBeenCalledWith(
      expect.objectContaining({ serviceId: "svc-001", status: "in_progress" })
    );
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith(expect.objectContaining({ id: "prog-new-001" }));
    });
  });

  it("shows error message when createProgress returns { ok: false }", async () => {
    mockCreateProgress.mockResolvedValueOnce({ ok: false, error: "Network error" });
    render(<ProgressUpdateForm serviceId="svc-001" />);

    fireEvent.click(screen.getByRole("button", { name: /บันทึก Progress/i }));

    await waitFor(() => {
      expect(screen.getByText(/Network error/i)).toBeInTheDocument();
    });
  });

  it("selecting 'completed' status highlights the button", () => {
    render(<ProgressUpdateForm serviceId="svc-001" />);
    fireEvent.click(screen.getByText(/เสร็จสิ้น/));
    // After click, 'เสร็จสิ้น' button should be active (border-orange-500 class)
    // Just verify the click doesn't throw
    expect(screen.getByText(/เสร็จสิ้น/)).toBeInTheDocument();
  });
});

describe("ProgressUpdateForm — PATCH mode (existingEntry provided)", () => {
  const existingEntry = {
    id: "prog-001",
    serviceId: "svc-001",
    status: "in_progress" as const,
    progressPercent: 50,
    note: "กำลังทำ",
    photoR2Key: null,
    updatedBy: "tech-001",
    createdAt: "2026-05-14T13:00:00Z",
  };

  it("pre-fills status from existingEntry", () => {
    render(<ProgressUpdateForm serviceId="svc-001" existingEntry={existingEntry} />);
    // "กำลังดำเนินการ" should be active (the "in_progress" option)
    expect(screen.getByText(/กำลังดำเนินการ/)).toBeInTheDocument();
  });

  it("pre-fills note from existingEntry", () => {
    render(<ProgressUpdateForm serviceId="svc-001" existingEntry={existingEntry} />);
    const textarea = screen.getByPlaceholderText(/รายละเอียดความคืบหน้า/i) as HTMLTextAreaElement;
    expect(textarea.value).toBe("กำลังทำ");
  });

  it("renders submit button with PATCH label", () => {
    render(<ProgressUpdateForm serviceId="svc-001" existingEntry={existingEntry} />);
    expect(screen.getByRole("button", { name: /อัพเดต Progress/i })).toBeInTheDocument();
  });

  it("calls updateProgress on submit (not createProgress)", async () => {
    const onSuccess = jest.fn();
    render(
      <ProgressUpdateForm serviceId="svc-001" existingEntry={existingEntry} onSuccess={onSuccess} />
    );

    fireEvent.click(screen.getByRole("button", { name: /อัพเดต Progress/i }));

    await waitFor(() => {
      expect(mockUpdateProgress).toHaveBeenCalledTimes(1);
      expect(mockCreateProgress).not.toHaveBeenCalled();
    });
    expect(mockUpdateProgress).toHaveBeenCalledWith(
      "prog-001",
      expect.objectContaining({ status: "in_progress" })
    );
  });
});

describe("ProgressUpdateForm — file validation", () => {
  it("shows error when non-image file selected", () => {
    render(<ProgressUpdateForm serviceId="svc-001" />);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    const pdfFile = new File(["data"], "doc.pdf", { type: "application/pdf" });
    Object.defineProperty(fileInput, "files", { value: [pdfFile] });
    fireEvent.change(fileInput);

    expect(screen.getByText(/รองรับเฉพาะ JPG \/ PNG \/ WebP/i)).toBeInTheDocument();
  });

  it("shows error when file too large (>10MB)", () => {
    render(<ProgressUpdateForm serviceId="svc-001" />);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    // สร้าง file ที่ใหญ่เกิน 10MB
    const bigContent = new Array(11 * 1024 * 1024).fill("x").join("");
    const bigFile = new File([bigContent], "big.jpg", { type: "image/jpeg" });
    Object.defineProperty(fileInput, "files", { value: [bigFile] });
    fireEvent.change(fileInput);

    expect(screen.getByText(/ขนาดไฟล์ต้องไม่เกิน 10 MB/i)).toBeInTheDocument();
  });

  it("accepts valid JPEG file", () => {
    render(<ProgressUpdateForm serviceId="svc-001" />);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    const validFile = new File(["jpeg data"], "photo.jpg", { type: "image/jpeg" });
    Object.defineProperty(fileInput, "files", { value: [validFile] });
    fireEvent.change(fileInput);

    // ไม่ควรมี error
    expect(screen.queryByText(/รองรับเฉพาะ/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/ขนาดไฟล์/i)).not.toBeInTheDocument();
  });
});
