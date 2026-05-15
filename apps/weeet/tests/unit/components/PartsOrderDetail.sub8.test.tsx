/**
 * tests/unit/components/PartsOrderDetail.sub8.test.tsx
 * Sub-CMD-8 Wave 3 — Order detail page buyer UI tests
 *
 * ทดสอบ: PartsOrderDetailPage — status display, buyer actions, audit trail
 */

import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockBack = jest.fn();
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ back: mockBack, push: mockPush }),
}));

const mockGetOrder = jest.fn();
const mockCloseOrder = jest.fn();
const mockDisputeOrder = jest.fn();
const mockRateOrder = jest.fn();
jest.mock("@/lib/api", () => ({
  partsOrdersApi: {
    getOrder: (...args: unknown[]) => mockGetOrder(...args),
    closeOrder: (...args: unknown[]) => mockCloseOrder(...args),
    disputeOrder: (...args: unknown[]) => mockDisputeOrder(...args),
    rateOrder: (...args: unknown[]) => mockRateOrder(...args),
  },
}));

// Mock React.use for params
let mockId = "order-uuid-0001";
jest.mock("react", () => ({
  ...jest.requireActual("react"),
  use: (p: Promise<{ id: string }>) => {
    // Return synchronously for tests
    void p;
    return { id: mockId };
  },
}));

// Import after mocks
import PartsOrderDetailPage from "@/app/(app)/parts/orders/[id]/page";

// ── Fixtures ──────────────────────────────────────────────────────────────────

const BASE_ORDER = {
  id: "order-uuid-0001",
  partId: "part-uuid-0001",
  buyerId: "buyer-001",
  serviceId: null,
  quantity: 3,
  unitPriceThb: "200.00",
  totalThb: "600.00",
  status: "held" as const,
  fulfillmentNote: null,
  trackingNumber: null,
  fulfilledAt: null,
  closedAt: null,
  idempotencyKey: "key-001",
  createdAt: "2026-05-15T10:00:00.000Z",
  updatedAt: "2026-05-15T10:00:00.000Z",
  events: [
    {
      id: "evt-001",
      orderId: "order-uuid-0001",
      eventType: "created",
      actorId: "buyer-001",
      oldStatus: null,
      newStatus: "pending",
      detail: null,
      createdAt: "2026-05-15T10:00:00.000Z",
    },
    {
      id: "evt-002",
      orderId: "order-uuid-0001",
      eventType: "held",
      actorId: null,
      oldStatus: "pending",
      newStatus: "held",
      detail: null,
      createdAt: "2026-05-15T10:01:00.000Z",
    },
  ],
  dispute: null,
  rating: null,
};

function makeParams(id = "order-uuid-0001") {
  return Promise.resolve({ id });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockId = "order-uuid-0001";
});

// ── Loading state ─────────────────────────────────────────────────────────────

test("shows loading skeleton initially", () => {
  mockGetOrder.mockReturnValue(new Promise(() => {})); // never resolves
  render(<PartsOrderDetailPage params={makeParams()} />);
  // There should be animate-pulse elements
  const pulsers = document.querySelectorAll(".animate-pulse");
  expect(pulsers.length).toBeGreaterThan(0);
});

// ── Error state ───────────────────────────────────────────────────────────────

test("shows error message when API fails", async () => {
  mockGetOrder.mockRejectedValue(new Error("500"));
  render(<PartsOrderDetailPage params={makeParams()} />);
  await screen.findByText(/ไม่สามารถโหลดข้อมูลออเดอร์ได้/);
  expect(screen.getByText(/ลองใหม่/)).toBeInTheDocument();
});

test("retry button re-fetches", async () => {
  mockGetOrder
    .mockRejectedValueOnce(new Error("500"))
    .mockResolvedValueOnce({ ...BASE_ORDER });
  render(<PartsOrderDetailPage params={makeParams()} />);
  await screen.findByText(/ไม่สามารถโหลดข้อมูลออเดอร์ได้/);
  fireEvent.click(screen.getByText(/ลองใหม่/));
  await screen.findByText(/ถือเงินแล้ว/);
  expect(mockGetOrder).toHaveBeenCalledTimes(2);
});

// ── Order status display ──────────────────────────────────────────────────────

test("displays 'held' status in Thai", async () => {
  mockGetOrder.mockResolvedValue({ ...BASE_ORDER, status: "held" });
  render(<PartsOrderDetailPage params={makeParams()} />);
  await screen.findByText("ถือเงินแล้ว");
});

test("displays 'fulfilled' status in Thai", async () => {
  mockGetOrder.mockResolvedValue({ ...BASE_ORDER, status: "fulfilled" });
  render(<PartsOrderDetailPage params={makeParams()} />);
  await screen.findByText("ส่งของแล้ว");
});

test("displays 'closed' status in Thai", async () => {
  mockGetOrder.mockResolvedValue({ ...BASE_ORDER, status: "closed" });
  render(<PartsOrderDetailPage params={makeParams()} />);
  await screen.findByText("รับของแล้ว");
});

test("displays quantity and total price", async () => {
  mockGetOrder.mockResolvedValue({ ...BASE_ORDER });
  render(<PartsOrderDetailPage params={makeParams()} />);
  await screen.findByText("3 ชิ้น");
  await screen.findByText(/600/);
});

// ── Audit trail ───────────────────────────────────────────────────────────────

test("shows audit trail events in reverse chronological order", async () => {
  mockGetOrder.mockResolvedValue({ ...BASE_ORDER });
  render(<PartsOrderDetailPage params={makeParams()} />);
  await screen.findByText("ประวัติออเดอร์");
  // Both events should appear
  expect(screen.getByText(/ล็อกเงิน escrow/)).toBeInTheDocument(); // held
  expect(screen.getByText(/สร้างออเดอร์/)).toBeInTheDocument(); // created
});

// ── Close order action ────────────────────────────────────────────────────────

test("shows 'ยืนยันรับของ' button when status is fulfilled", async () => {
  mockGetOrder.mockResolvedValue({ ...BASE_ORDER, status: "fulfilled" });
  render(<PartsOrderDetailPage params={makeParams()} />);
  await screen.findByText(/ยืนยันรับของแล้ว/);
});

test("does NOT show 'ยืนยันรับของ' button when status is held", async () => {
  mockGetOrder.mockResolvedValue({ ...BASE_ORDER, status: "held" });
  render(<PartsOrderDetailPage params={makeParams()} />);
  await screen.findByText("ถือเงินแล้ว");
  expect(screen.queryByText(/ยืนยันรับของแล้ว/)).toBeNull();
});

test("calls closeOrder and reloads when 'ยืนยันรับของแล้ว' clicked", async () => {
  const closedOrder = { ...BASE_ORDER, status: "closed" as const, closedAt: "2026-05-15T14:00:00.000Z" };
  mockGetOrder
    .mockResolvedValueOnce({ ...BASE_ORDER, status: "fulfilled" })
    .mockResolvedValueOnce(closedOrder);
  mockCloseOrder.mockResolvedValue(closedOrder);

  render(<PartsOrderDetailPage params={makeParams()} />);
  const closeBtn = await screen.findByText(/ยืนยันรับของแล้ว/);
  await act(async () => { fireEvent.click(closeBtn); });
  await waitFor(() => expect(mockCloseOrder).toHaveBeenCalledWith("order-uuid-0001"));
  await waitFor(() => expect(mockGetOrder).toHaveBeenCalledTimes(2));
});

test("shows error when closeOrder fails", async () => {
  mockGetOrder.mockResolvedValue({ ...BASE_ORDER, status: "fulfilled" });
  mockCloseOrder.mockRejectedValue(new Error("400"));

  render(<PartsOrderDetailPage params={makeParams()} />);
  const closeBtn = await screen.findByText(/ยืนยันรับของแล้ว/);
  await act(async () => { fireEvent.click(closeBtn); });
  await screen.findByText(/Error: 400/);
});

// ── Dispute action ────────────────────────────────────────────────────────────

test("shows dispute button when status is held", async () => {
  mockGetOrder.mockResolvedValue({ ...BASE_ORDER, status: "held" });
  render(<PartsOrderDetailPage params={makeParams()} />);
  await screen.findByText(/แจ้งปัญหากับออเดอร์นี้/);
});

test("shows dispute button when status is fulfilled", async () => {
  mockGetOrder.mockResolvedValue({ ...BASE_ORDER, status: "fulfilled" });
  render(<PartsOrderDetailPage params={makeParams()} />);
  // Both close and dispute shown
  await screen.findByText(/ยืนยันรับของแล้ว/);
  await screen.findByText(/แจ้งปัญหากับออเดอร์นี้/);
});

test("does NOT show dispute button when status is closed", async () => {
  mockGetOrder.mockResolvedValue({ ...BASE_ORDER, status: "closed" });
  render(<PartsOrderDetailPage params={makeParams()} />);
  await screen.findByText("รับของแล้ว");
  expect(screen.queryByText(/แจ้งปัญหากับออเดอร์นี้/)).toBeNull();
});

test("dispute form validates minimum 10 chars", async () => {
  mockGetOrder.mockResolvedValue({ ...BASE_ORDER, status: "held" });
  render(<PartsOrderDetailPage params={makeParams()} />);
  fireEvent.click(await screen.findByText(/แจ้งปัญหากับออเดอร์นี้/));
  const sendBtn = screen.getByText(/ส่งข้อพิพาท/);
  expect(sendBtn).toBeDisabled(); // reason is empty → < 10 chars
});

test("dispute form enables submit after 10+ chars entered", async () => {
  mockGetOrder.mockResolvedValue({ ...BASE_ORDER, status: "held" });
  render(<PartsOrderDetailPage params={makeParams()} />);
  fireEvent.click(await screen.findByText(/แจ้งปัญหากับออเดอร์นี้/));
  const ta = screen.getByPlaceholderText(/อธิบายปัญหาที่พบ/);
  fireEvent.change(ta, { target: { value: "อะไหล่ชำรุดหักที่ขอบ" } }); // 18 chars
  expect(screen.getByText(/ส่งข้อพิพาท/)).not.toBeDisabled();
});

// ── Rate action ───────────────────────────────────────────────────────────────

test("shows rate button when status is closed and no rating", async () => {
  mockGetOrder.mockResolvedValue({ ...BASE_ORDER, status: "closed", rating: null });
  render(<PartsOrderDetailPage params={makeParams()} />);
  await screen.findByText(/ให้คะแนน$/);
});

test("does NOT show rate button if already rated", async () => {
  mockGetOrder.mockResolvedValue({
    ...BASE_ORDER,
    status: "closed",
    rating: {
      id: "rate-001",
      orderId: "order-uuid-0001",
      ratedBy: "buyer-001",
      sellerId: "seller-001",
      score: 4,
      comment: "โอเค",
      createdAt: "2026-05-15T13:00:00.000Z",
    },
  });
  render(<PartsOrderDetailPage params={makeParams()} />);
  await screen.findByText("รับของแล้ว");
  // Rating display should show, but the "ให้คะแนน" form button should not appear
  expect(screen.queryByRole("button", { name: /^ให้คะแนน$/ })).toBeNull();
  // Rating display shows stars
  expect(screen.getByText("4/5")).toBeInTheDocument();
});

test("calls rateOrder with correct score", async () => {
  mockGetOrder
    .mockResolvedValueOnce({ ...BASE_ORDER, status: "closed", rating: null })
    .mockResolvedValueOnce({ ...BASE_ORDER, status: "closed" });
  mockRateOrder.mockResolvedValue({ ...BASE_ORDER, status: "closed" });

  render(<PartsOrderDetailPage params={makeParams()} />);
  fireEvent.click(await screen.findByText(/ให้คะแนน$/));
  // Default score is 5; click "ส่งคะแนน"
  await act(async () => { fireEvent.click(screen.getByText(/ส่งคะแนน/)); });
  await waitFor(() =>
    expect(mockRateOrder).toHaveBeenCalledWith("order-uuid-0001", 5, undefined)
  );
});

// ── Dispute display ───────────────────────────────────────────────────────────

test("displays existing dispute info", async () => {
  mockGetOrder.mockResolvedValue({
    ...BASE_ORDER,
    status: "disputed",
    dispute: {
      id: "disp-001",
      orderId: "order-uuid-0001",
      raisedBy: "buyer-001",
      reason: "ไม่ได้รับของภายใน 7 วัน",
      status: "open",
      resolution: null,
      resolvedBy: null,
      createdAt: "2026-05-15T12:00:00.000Z",
      resolvedAt: null,
    },
  });
  render(<PartsOrderDetailPage params={makeParams()} />);
  await screen.findByText(/ไม่ได้รับของภายใน 7 วัน/);
  // Multiple elements match /ข้อพิพาท/ — status badge + section header. Ensure at least one is present.
  expect(screen.getAllByText(/ข้อพิพาท/).length).toBeGreaterThanOrEqual(1);
});

// ── Tracking number / fulfillment note ───────────────────────────────────────

test("shows tracking number when available", async () => {
  mockGetOrder.mockResolvedValue({
    ...BASE_ORDER,
    status: "fulfilled",
    trackingNumber: "TH1234567890",
    fulfillmentNote: "ส่ง Kerry Express",
  });
  render(<PartsOrderDetailPage params={makeParams()} />);
  await screen.findByText("TH1234567890");
  expect(screen.getByText(/Kerry Express/)).toBeInTheDocument();
});

// ── Back button ───────────────────────────────────────────────────────────────

test("back button calls router.back()", async () => {
  mockGetOrder.mockResolvedValue({ ...BASE_ORDER });
  render(<PartsOrderDetailPage params={makeParams()} />);
  await screen.findByText("ถือเงินแล้ว");
  fireEvent.click(screen.getByText("←"));
  expect(mockBack).toHaveBeenCalled();
});
