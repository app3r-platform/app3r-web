/**
 * tests/unit/components/PartsBuyerOrdersPage.sub9.test.tsx
 * Sub-CMD-9 Wave 3 — BuyerOrdersPage component tests
 *
 * ทดสอบ: app/(app)/parts/orders/page.tsx
 * - Loading skeleton
 * - Empty state + navigate to /parts
 * - Order rows rendering (ID, status label, total)
 * - Status colors
 * - Total count in header
 * - Status filter re-fetch
 * - Pagination controls (prev/next disabled)
 * - localStorage fallback + fallback banner
 */

import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockPush = jest.fn();
const mockBack = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, back: mockBack }),
}));

const mockListMyOrders = jest.fn();
jest.mock("@/lib/api", () => ({
  partsOrdersApi: {
    listMyOrders: (...args: unknown[]) => mockListMyOrders(...args),
  },
}));

import BuyerOrdersPage from "@/app/(app)/parts/orders/page";
import type { PartsOrderDto, PartsOrderListDto } from "@/lib/types";

// ── Fixtures ──────────────────────────────────────────────────────────────────

const makeOrder = (
  id: string,
  status: import("@/lib/types").PartsOrderStatus = "held",
  total = "300.00"
): PartsOrderDto => ({
  id,
  partId: "part-001",
  buyerId: "buyer-001",
  serviceId: null,
  quantity: 2,
  unitPriceThb: "150.00",
  totalThb: total,
  status,
  fulfillmentNote: null,
  trackingNumber: null,
  fulfilledAt: null,
  closedAt: null,
  idempotencyKey: `key-${id}`,
  createdAt: "2026-05-15T10:00:00.000Z",
  updatedAt: "2026-05-15T10:00:00.000Z",
});

const makeList = (orders: PartsOrderDto[], total?: number): PartsOrderListDto => ({
  items: orders,
  total: total ?? orders.length,
  limit: 20,
  offset: 0,
});

beforeEach(() => {
  jest.clearAllMocks();
  // Clear localStorage before each test
  window.localStorage.clear();
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("BuyerOrdersPage — loading state", () => {
  it("shows loading skeleton while API is pending", async () => {
    mockListMyOrders.mockReturnValue(new Promise(() => {})); // never resolves
    render(<BuyerOrdersPage />);

    expect(document.querySelector(".animate-pulse")).toBeInTheDocument();
  });
});

describe("BuyerOrdersPage — empty state", () => {
  it("shows empty state when no orders returned", async () => {
    mockListMyOrders.mockResolvedValueOnce(makeList([]));
    render(<BuyerOrdersPage />);

    await waitFor(() => {
      expect(screen.getByText("ยังไม่มีออเดอร์")).toBeInTheDocument();
    });
  });

  it("empty state button navigates to /parts", async () => {
    mockListMyOrders.mockResolvedValueOnce(makeList([]));
    render(<BuyerOrdersPage />);

    await waitFor(() => screen.getByText("เลือกซื้ออะไหล่"));
    fireEvent.click(screen.getByText("เลือกซื้ออะไหล่"));
    expect(mockPush).toHaveBeenCalledWith("/parts");
  });
});

describe("BuyerOrdersPage — order rows", () => {
  it("renders order rows with truncated ID", async () => {
    const orders = [makeOrder("order-uuid-abcdef01"), makeOrder("order-uuid-12345678")];
    mockListMyOrders.mockResolvedValueOnce(makeList(orders));
    render(<BuyerOrdersPage />);

    await waitFor(() => {
      // First 8 chars uppercase + "…"
      // Both orders start with "ORDER-UU" → use getAllByText
      const matches = screen.getAllByText(/ORDER-UU/i);
      expect(matches.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("shows status label 'ถือเงินแล้ว' for held status", async () => {
    mockListMyOrders.mockResolvedValueOnce(makeList([makeOrder("o-001", "held")]));
    render(<BuyerOrdersPage />);

    await waitFor(() => {
      expect(screen.getByText("ถือเงินแล้ว")).toBeInTheDocument();
    });
  });

  it("shows status label 'ส่งของแล้ว' for fulfilled status", async () => {
    mockListMyOrders.mockResolvedValueOnce(makeList([makeOrder("o-001", "fulfilled")]));
    render(<BuyerOrdersPage />);

    await waitFor(() => {
      expect(screen.getByText("ส่งของแล้ว")).toBeInTheDocument();
    });
  });

  it("shows status label 'ปิดออเดอร์' for closed status", async () => {
    mockListMyOrders.mockResolvedValueOnce(makeList([makeOrder("o-001", "closed")]));
    render(<BuyerOrdersPage />);

    await waitFor(() => {
      expect(screen.getByText("ปิดออเดอร์")).toBeInTheDocument();
    });
  });

  it("shows total price in baht", async () => {
    mockListMyOrders.mockResolvedValueOnce(makeList([makeOrder("o-001", "held", "1500.00")]));
    render(<BuyerOrdersPage />);

    await waitFor(() => {
      expect(screen.getByText(/1,500/)).toBeInTheDocument();
    });
  });

  it("clicking order row navigates to /parts/orders/:id", async () => {
    mockListMyOrders.mockResolvedValueOnce(makeList([makeOrder("order-abc123")]));
    render(<BuyerOrdersPage />);

    await waitFor(() => screen.getByText(/ORDER-AB/i));
    const row = screen.getByText(/ORDER-AB/i).closest("button")!;
    fireEvent.click(row);
    expect(mockPush).toHaveBeenCalledWith("/parts/orders/order-abc123");
  });
});

describe("BuyerOrdersPage — header total", () => {
  it("shows total count from API in header", async () => {
    const orders = [makeOrder("o-001"), makeOrder("o-002"), makeOrder("o-003")];
    mockListMyOrders.mockResolvedValueOnce({ ...makeList(orders), total: 42 });
    render(<BuyerOrdersPage />);

    await waitFor(() => {
      expect(screen.getByText("42 รายการ")).toBeInTheDocument();
    });
  });
});

describe("BuyerOrdersPage — status filter", () => {
  it("clicking filter chip re-fetches with status param", async () => {
    mockListMyOrders.mockResolvedValue(makeList([]));
    render(<BuyerOrdersPage />);

    await waitFor(() => expect(mockListMyOrders).toHaveBeenCalledTimes(1));
    // Initial call: no status
    expect(mockListMyOrders).toHaveBeenCalledWith({ status: undefined, limit: 20, offset: 0 });

    await act(async () => {
      fireEvent.click(screen.getByText("ถือเงิน"));
    });

    await waitFor(() => expect(mockListMyOrders).toHaveBeenCalledTimes(2));
    expect(mockListMyOrders).toHaveBeenLastCalledWith({ status: "held", limit: 20, offset: 0 });
  });

  it("selecting 'ทั้งหมด' passes empty status", async () => {
    mockListMyOrders.mockResolvedValue(makeList([]));
    render(<BuyerOrdersPage />);

    await waitFor(() => expect(mockListMyOrders).toHaveBeenCalledTimes(1));

    await act(async () => {
      fireEvent.click(screen.getByText("พิพาท"));
    });
    await waitFor(() => expect(mockListMyOrders).toHaveBeenCalledTimes(2));

    await act(async () => {
      fireEvent.click(screen.getByText("ทั้งหมด"));
    });
    await waitFor(() => expect(mockListMyOrders).toHaveBeenCalledTimes(3));
    expect(mockListMyOrders).toHaveBeenLastCalledWith({ status: undefined, limit: 20, offset: 0 });
  });
});

describe("BuyerOrdersPage — pagination", () => {
  it("prev button disabled on first page", async () => {
    const orders = Array.from({ length: 20 }, (_, i) => makeOrder(`o-${i}`));
    mockListMyOrders.mockResolvedValue({ items: orders, total: 45, limit: 20, offset: 0 });
    render(<BuyerOrdersPage />);

    await waitFor(() => screen.getByText("← ก่อนหน้า"));
    expect(screen.getByText("← ก่อนหน้า")).toBeDisabled();
    expect(screen.getByText("ถัดไป →")).not.toBeDisabled();
  });

  it("clicking next page fetches with offset=20", async () => {
    const orders = Array.from({ length: 20 }, (_, i) => makeOrder(`o-${i}`));
    mockListMyOrders.mockResolvedValue({ items: orders, total: 45, limit: 20, offset: 0 });
    render(<BuyerOrdersPage />);

    await waitFor(() => screen.getByText("ถัดไป →"));

    await act(async () => {
      fireEvent.click(screen.getByText("ถัดไป →"));
    });

    await waitFor(() => expect(mockListMyOrders).toHaveBeenCalledTimes(2));
    expect(mockListMyOrders).toHaveBeenLastCalledWith({
      status: undefined,
      limit: 20,
      offset: 20,
    });
  });

  it("shows page indicator 'หน้า X / Y'", async () => {
    const orders = Array.from({ length: 20 }, (_, i) => makeOrder(`o-${i}`));
    mockListMyOrders.mockResolvedValue({ items: orders, total: 60, limit: 20, offset: 0 });
    render(<BuyerOrdersPage />);

    await waitFor(() => {
      expect(screen.getByText("หน้า 1 / 3")).toBeInTheDocument();
    });
  });
});

describe("BuyerOrdersPage — localStorage fallback", () => {
  it("shows fallback banner when API fails", async () => {
    mockListMyOrders.mockRejectedValueOnce(new Error("Network error"));
    window.localStorage.setItem("weeet_part_order_ids", JSON.stringify(["order-fallback-001"]));

    render(<BuyerOrdersPage />);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByRole("alert")).toHaveTextContent("ไม่สามารถโหลดออเดอร์จาก API ได้");
    });
  });

  it("shows 'ข้อมูลจากอุปกรณ์' in header when using fallback", async () => {
    mockListMyOrders.mockRejectedValueOnce(new Error("Network error"));
    window.localStorage.setItem("weeet_part_order_ids", JSON.stringify(["order-fallback-001"]));

    render(<BuyerOrdersPage />);

    await waitFor(() => {
      expect(screen.getByText("ข้อมูลจากอุปกรณ์")).toBeInTheDocument();
    });
  });

  it("fallback with no localStorage IDs → empty state", async () => {
    mockListMyOrders.mockRejectedValueOnce(new Error("Network error"));
    // No localStorage data

    render(<BuyerOrdersPage />);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
      // Empty state shown since no IDs
      expect(screen.getByText("ยังไม่มีออเดอร์")).toBeInTheDocument();
    });
  });
});
