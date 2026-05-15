/**
 * tests/unit/api/partsOrdersListApi.test.ts
 * Sub-CMD-9 Wave 3 — partsOrdersApi.listMyOrders() tests
 *
 * ทดสอบ: GET /api/v1/parts/orders/ (buyer order list)
 * - no params → no query string
 * - status filter → query string
 * - limit/offset pagination → query string
 * - combined params
 * - empty list
 * - 401 unauthenticated
 * - 500 server error
 */

const mockFetch = jest.fn();
global.fetch = mockFetch;

const sessionStorageMock = {
  getItem: jest.fn().mockReturnValue(null),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, "sessionStorage", { value: sessionStorageMock });

import { partsOrdersApi } from "@/lib/api";
import type { PartsOrderListDto } from "@/lib/types";

// ── Fixtures ──────────────────────────────────────────────────────────────────

const makeOrder = (id: string) => ({
  id,
  partId: "part-001",
  buyerId: "buyer-001",
  serviceId: null,
  quantity: 1,
  unitPriceThb: "100.00",
  totalThb: "100.00",
  status: "held" as const,
  fulfillmentNote: null,
  trackingNumber: null,
  fulfilledAt: null,
  closedAt: null,
  idempotencyKey: `key-${id}`,
  createdAt: "2026-05-15T10:00:00.000Z",
  updatedAt: "2026-05-15T10:00:00.000Z",
});

const MOCK_LIST: PartsOrderListDto = {
  items: [makeOrder("order-001"), makeOrder("order-002")],
  total: 2,
  limit: 20,
  offset: 0,
};

const EMPTY_LIST: PartsOrderListDto = {
  items: [],
  total: 0,
  limit: 20,
  offset: 0,
};

beforeEach(() => {
  jest.clearAllMocks();
  sessionStorageMock.getItem.mockReturnValue(null);
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("partsOrdersApi.listMyOrders", () => {
  it("no params → calls GET /api/v1/parts/orders/ without query string", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 200, json: async () => MOCK_LIST });

    const result = await partsOrdersApi.listMyOrders();

    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(2);

    const [url, opts] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/v1/parts/orders/");
    expect(opts?.method).toBeUndefined(); // GET (default)
  });

  it("status filter → appends ?status=held to URL", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 200, json: async () => MOCK_LIST });

    await partsOrdersApi.listMyOrders({ status: "held" });

    const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/v1/parts/orders/?status=held");
  });

  it("limit param → appends ?limit=10", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 200, json: async () => MOCK_LIST });

    await partsOrdersApi.listMyOrders({ limit: 10 });

    const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("limit=10");
  });

  it("offset param → appends ?offset=20", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 200, json: async () => MOCK_LIST });

    await partsOrdersApi.listMyOrders({ offset: 20 });

    const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("offset=20");
  });

  it("combined params → all appear in query string", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 200, json: async () => MOCK_LIST });

    await partsOrdersApi.listMyOrders({ status: "fulfilled", limit: 5, offset: 10 });

    const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("status=fulfilled");
    expect(url).toContain("limit=5");
    expect(url).toContain("offset=10");
  });

  it("undefined status → omitted from query string", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 200, json: async () => MOCK_LIST });

    await partsOrdersApi.listMyOrders({ status: undefined, limit: 20, offset: 0 });

    const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).not.toContain("status");
  });

  it("returns empty list when API returns no items", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 200, json: async () => EMPTY_LIST });

    const result = await partsOrdersApi.listMyOrders();

    expect(result.items).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it("throws on 401 unauthenticated", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ detail: "Authentication credentials were not provided." }),
    });

    await expect(partsOrdersApi.listMyOrders()).rejects.toThrow("401");
  });

  it("throws on 500 server error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ detail: "Internal server error." }),
    });

    await expect(partsOrdersApi.listMyOrders()).rejects.toThrow("500");
  });
});
