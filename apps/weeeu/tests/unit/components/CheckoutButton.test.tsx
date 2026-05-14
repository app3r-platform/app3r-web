// ─── CheckoutButton.test.tsx — Unit tests for CheckoutButton (D89) ───────────
// Sub-CMD-2 Wave 1 — ตรวจสอบ: mount, PaymentStatusCard fetch on mount
// NOTE-D89-2: WeeeU = customer เท่านั้น

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CheckoutButton, PaymentStatusCard } from "@/components/payment/CheckoutButton";

// ─── Mock getAdapter() ────────────────────────────────────────────────────────

const mockCreateIntent = jest.fn();
const mockGetStatus = jest.fn();

jest.mock("@/lib/dal", () => ({
  getAdapter: () => ({
    payment: {
      createIntent: mockCreateIntent,
      getStatus: mockGetStatus,
    },
  }),
}));

beforeEach(() => {
  mockCreateIntent.mockReset();
  mockGetStatus.mockReset();
  // Default: paid status สำหรับ PaymentStatusCard
  mockGetStatus.mockResolvedValue({
    ok: true,
    data: {
      intentId: "intent-test-001",
      status: "paid",
      paidAt: "2026-05-14T00:00:00Z",
      amount: 1500,
      currency: "THB",
    },
  });
});

// ─── CheckoutButton tests ─────────────────────────────────────────────────────

describe("CheckoutButton", () => {
  const defaultProps = {
    serviceId: "svc-001",
    amount: 1500,
    description: "ค่าซ่อมเครื่องซักผ้า",
  };

  it("แสดงยอดชำระและปุ่ม checkout", () => {
    render(<CheckoutButton {...defaultProps} />);
    // แสดงยอดเงิน (อาจมีหลายที่ — ใช้ getAllByText)
    expect(screen.getAllByText(/1,500/).length).toBeGreaterThan(0);
    // แสดงปุ่มชำระ
    expect(screen.getByRole("button", { name: /ชำระเงิน/ })).toBeInTheDocument();
  });

  it("แสดง description ถ้าส่งมา", () => {
    render(<CheckoutButton {...defaultProps} />);
    expect(screen.getByText("ค่าซ่อมเครื่องซักผ้า")).toBeInTheDocument();
  });

  it("ปุ่มอยู่ในสถานะ enabled ตอน mount", () => {
    render(<CheckoutButton {...defaultProps} />);
    expect(screen.getByRole("button", { name: /ชำระเงิน/ })).not.toBeDisabled();
  });

  it("เรียก createIntent ด้วย params ที่ถูกต้องเมื่อกดปุ่ม", async () => {
    mockCreateIntent.mockResolvedValue({
      ok: false,
      error: "mock-intent-called", // คืน error เพื่อหยุด redirect
    });

    render(<CheckoutButton {...defaultProps} />);
    await userEvent.click(screen.getByRole("button", { name: /ชำระเงิน/ }));

    await waitFor(() => {
      expect(mockCreateIntent).toHaveBeenCalledWith({
        serviceId: "svc-001",
        amount: 1500,
        currency: "THB",
        description: "ค่าซ่อมเครื่องซักผ้า",
      });
    });
  });

  it("แสดง error message เมื่อ createIntent ล้มเหลว", async () => {
    mockCreateIntent.mockResolvedValue({
      ok: false,
      error: "ระบบชำระเงินขัดข้อง",
    });

    render(<CheckoutButton {...defaultProps} />);
    await userEvent.click(screen.getByRole("button", { name: /ชำระเงิน/ }));

    await waitFor(() => {
      expect(screen.getByText("ระบบชำระเงินขัดข้อง")).toBeInTheDocument();
    });
  });
});

// ─── PaymentStatusCard tests ──────────────────────────────────────────────────

describe("PaymentStatusCard", () => {
  it("แสดง loading state ตอน mount ก่อน fetch เสร็จ", () => {
    // Delay ให้ยาวพอที่จะ catch loading state
    mockGetStatus.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({
        ok: true,
        data: { intentId: "i-001", status: "paid", amount: 0, currency: "THB" },
      }), 500))
    );

    render(<PaymentStatusCard intentId="i-001" />);
    expect(screen.getByText(/กำลังตรวจสอบ/)).toBeInTheDocument();
  });

  it("เรียก getStatus ด้วย intentId ที่ส่งมา เมื่อ mount", async () => {
    render(<PaymentStatusCard intentId="intent-test-001" />);
    await waitFor(() => {
      expect(mockGetStatus).toHaveBeenCalledWith("intent-test-001");
    });
  });

  it("แสดง 'ชำระเงินสำเร็จ' เมื่อ status = paid", async () => {
    render(<PaymentStatusCard intentId="intent-test-001" />);
    await waitFor(() => {
      expect(screen.getByText("ชำระเงินสำเร็จ")).toBeInTheDocument();
    });
  });

  it("แสดง 'ชำระเงินไม่สำเร็จ' เมื่อ status = failed", async () => {
    mockGetStatus.mockResolvedValue({
      ok: true,
      data: {
        intentId: "intent-fail",
        status: "failed",
        amount: 0,
        currency: "THB",
      },
    });
    render(<PaymentStatusCard intentId="intent-fail" />);
    await waitFor(() => {
      expect(screen.getByText("ชำระเงินไม่สำเร็จ")).toBeInTheDocument();
    });
  });

  it("map 'cancelled' → แสดง 'ชำระเงินไม่สำเร็จ' (ไม่มี cancelled state ใน UI)", async () => {
    mockGetStatus.mockResolvedValue({
      ok: true,
      data: {
        intentId: "intent-cancel",
        status: "cancelled",
        amount: 0,
        currency: "THB",
      },
    });
    render(<PaymentStatusCard intentId="intent-cancel" />);
    await waitFor(() => {
      expect(screen.getByText("ชำระเงินไม่สำเร็จ")).toBeInTheDocument();
    });
  });

  it("แสดง error จาก getStatus เมื่อ ok = false", async () => {
    mockGetStatus.mockResolvedValue({
      ok: false,
      error: "ไม่พบข้อมูลการชำระเงิน",
    });
    render(<PaymentStatusCard intentId="intent-err" />);
    await waitFor(() => {
      expect(screen.getByText("ไม่พบข้อมูลการชำระเงิน")).toBeInTheDocument();
    });
  });

  it("แสดง intentId ใน card", async () => {
    render(<PaymentStatusCard intentId="intent-test-001" />);
    await waitFor(() => {
      expect(screen.getByText(/intent-test-001/)).toBeInTheDocument();
    });
  });
});
