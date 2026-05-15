/**
 * tests/unit/api/partsOrdersApi.test.ts
 * Sub-CMD-8 Wave 3 — Parts B2B Orders API layer tests
 *
 * ทดสอบ: partsOrdersApi (createOrder / getOrder / closeOrder / disputeOrder / rateOrder)
 * Auth: Bearer JWT (mocked)
 */

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock sessionStorage (needed by dev-auth import path)
const sessionStorageMock = {
  getItem: jest.fn().mockReturnValue(null),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, "sessionStorage", { value: sessionStorageMock });

import { partsOrdersApi } from "@/lib/api";

// ── Fixtures ──────────────────────────────────────────────────────────────────

const MOCK_ORDER = {
  id: "order-uuid-0001",
  partId: "part-uuid-0001",
  buyerId: "buyer-uuid-0001",
  serviceId: null,
  quantity: 2,
  unitPriceThb: "150.00",
  totalThb: "300.00",
  status: "pending" as const,
  fulfillmentNote: null,
  trackingNumber: null,
  fulfilledAt: null,
  closedAt: null,
  idempotencyKey: "part-uuid-0001-1700000000000",
  createdAt: "2026-05-15T10:00:00.000Z",
  updatedAt: "2026-05-15T10:00:00.000Z",
};

const MOCK_ORDER_DETAIL = {
  ...MOCK_ORDER,
  events: [
    {
      id: "evt-001",
      orderId: MOCK_ORDER.id,
      eventType: "created",
      actorId: "buyer-uuid-0001",
      oldStatus: null,
      newStatus: "pending",
      detail: null,
      createdAt: "2026-05-15T10:00:00.000Z",
    },
  ],
  dispute: null,
  rating: null,
};

beforeEach(() => {
  jest.clearAllMocks();
  sessionStorageMock.getItem.mockReturnValue(null);
});

// ── createOrder ───────────────────────────────────────────────────────────────

describe("partsOrdersApi.createOrder", () => {
  it("POST /api/v1/parts/orders/ — returns order on 201", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => MOCK_ORDER,
    });

    const result = await partsOrdersApi.createOrder({
      partId: "part-uuid-0001",
      quantity: 2,
      idempotencyKey: "part-uuid-0001-1700000000000",
    });

    expect(result.id).toBe("order-uuid-0001");
    expect(result.status).toBe("pending");
    expect(result.quantity).toBe(2);
    expect(result.totalThb).toBe("300.00");

    const [url, opts] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/v1/parts/orders/");
    expect(opts.method).toBe("POST");
    const body = JSON.parse(opts.body as string);
    expect(body.partId).toBe("part-uuid-0001");
    expect(body.idempotencyKey).toBeDefined();
  });

  it("includes serviceId when provided", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ ...MOCK_ORDER, serviceId: "svc-uuid-001" }),
    });

    await partsOrdersApi.createOrder({
      partId: "part-uuid-0001",
      quantity: 1,
      serviceId: "svc-uuid-001",
      idempotencyKey: "key-001",
    });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
    expect(body.serviceId).toBe("svc-uuid-001");
  });

  it("throws Error on HTTP 400 (insufficient stock / duplicate key)", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ detail: "Part not found or insufficient stock." }),
    });

    await expect(
      partsOrdersApi.createOrder({
        partId: "part-uuid-0001",
        quantity: 999,
        idempotencyKey: "key-dup",
      })
    ).rejects.toThrow("400");
  });

  it("throws Error on HTTP 401 (unauthenticated)", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ detail: "Authentication credentials were not provided." }),
    });

    await expect(
      partsOrdersApi.createOrder({
        partId: "part-uuid-0001",
        quantity: 1,
        idempotencyKey: "key-noauth",
      })
    ).rejects.toThrow("401");
  });
});

// ── getOrder ──────────────────────────────────────────────────────────────────

describe("partsOrdersApi.getOrder", () => {
  it("GET /api/v1/parts/orders/:id/ — returns order detail with events", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => MOCK_ORDER_DETAIL,
    });

    const result = await partsOrdersApi.getOrder("order-uuid-0001");

    expect(result.id).toBe("order-uuid-0001");
    expect(result.events).toHaveLength(1);
    expect(result.events[0].eventType).toBe("created");
    expect(result.dispute).toBeNull();
    expect(result.rating).toBeNull();

    const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/v1/parts/orders/order-uuid-0001/");
  });

  it("throws Error on HTTP 404 (order not found)", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ detail: "Order not found." }),
    });

    await expect(partsOrdersApi.getOrder("order-does-not-exist")).rejects.toThrow("404");
  });

  it("returns dispute object when order is disputed", async () => {
    const withDispute = {
      ...MOCK_ORDER_DETAIL,
      status: "disputed",
      dispute: {
        id: "disp-001",
        orderId: MOCK_ORDER.id,
        raisedBy: "buyer-uuid-0001",
        reason: "ไม่ได้รับของตามที่สั่ง",
        status: "open",
        resolution: null,
        resolvedBy: null,
        createdAt: "2026-05-15T12:00:00.000Z",
        resolvedAt: null,
      },
    };
    mockFetch.mockResolvedValueOnce({ ok: true, status: 200, json: async () => withDispute });

    const result = await partsOrdersApi.getOrder(MOCK_ORDER.id);
    expect(result.dispute).not.toBeNull();
    expect(result.dispute!.reason).toBe("ไม่ได้รับของตามที่สั่ง");
    expect(result.dispute!.status).toBe("open");
  });

  it("returns rating object when order is rated", async () => {
    const withRating = {
      ...MOCK_ORDER_DETAIL,
      status: "closed",
      rating: {
        id: "rate-001",
        orderId: MOCK_ORDER.id,
        ratedBy: "buyer-uuid-0001",
        sellerId: "seller-uuid-0001",
        score: 5,
        comment: "ดีมาก",
        createdAt: "2026-05-15T13:00:00.000Z",
      },
    };
    mockFetch.mockResolvedValueOnce({ ok: true, status: 200, json: async () => withRating });

    const result = await partsOrdersApi.getOrder(MOCK_ORDER.id);
    expect(result.rating).not.toBeNull();
    expect(result.rating!.score).toBe(5);
    expect(result.rating!.comment).toBe("ดีมาก");
  });
});

// ── closeOrder ────────────────────────────────────────────────────────────────

describe("partsOrdersApi.closeOrder", () => {
  it("PATCH /api/v1/parts/orders/:id/close/ — returns updated order", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ ...MOCK_ORDER, status: "closed", closedAt: "2026-05-15T14:00:00.000Z" }),
    });

    const result = await partsOrdersApi.closeOrder("order-uuid-0001");
    expect(result.status).toBe("closed");
    expect(result.closedAt).not.toBeNull();

    const [url, opts] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/v1/parts/orders/order-uuid-0001/close/");
    expect(opts.method).toBe("PATCH");
  });

  it("throws Error on HTTP 400 (order not in fulfilled state)", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ detail: "Order not in fulfilled status." }),
    });

    await expect(partsOrdersApi.closeOrder("order-uuid-0001")).rejects.toThrow("400");
  });
});

// ── disputeOrder ──────────────────────────────────────────────────────────────

describe("partsOrdersApi.disputeOrder", () => {
  it("POST /api/v1/parts/orders/:id/dispute/ — sends reason and returns order", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ ...MOCK_ORDER, status: "disputed" }),
    });

    const result = await partsOrdersApi.disputeOrder(
      "order-uuid-0001",
      "ของที่ได้รับผิดรุ่น ไม่ตรงกับที่สั่ง"
    );
    expect(result.status).toBe("disputed");

    const [url, opts] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/v1/parts/orders/order-uuid-0001/dispute/");
    expect(opts.method).toBe("POST");
    const body = JSON.parse(opts.body as string);
    expect(body.reason).toBe("ของที่ได้รับผิดรุ่น ไม่ตรงกับที่สั่ง");
  });

  it("throws Error on HTTP 400 (order not in disputable state)", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ detail: "Order not in a disputable state." }),
    });

    await expect(
      partsOrdersApi.disputeOrder("order-uuid-0001", "เหตุผลยาวกว่า10ตัวอักษร")
    ).rejects.toThrow("400");
  });
});

// ── rateOrder ─────────────────────────────────────────────────────────────────

describe("partsOrdersApi.rateOrder", () => {
  it("POST /api/v1/parts/orders/:id/rate/ — sends score + optional comment", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ ...MOCK_ORDER, status: "closed" }),
    });

    const result = await partsOrdersApi.rateOrder("order-uuid-0001", 5, "บริการดีมาก");
    expect(result.status).toBe("closed");

    const [url, opts] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/v1/parts/orders/order-uuid-0001/rate/");
    expect(opts.method).toBe("POST");
    const body = JSON.parse(opts.body as string);
    expect(body.score).toBe(5);
    expect(body.comment).toBe("บริการดีมาก");
  });

  it("sends without comment when not provided", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => MOCK_ORDER,
    });

    await partsOrdersApi.rateOrder("order-uuid-0001", 3);
    const body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
    expect(body.score).toBe(3);
    expect(body.comment).toBeUndefined();
  });

  it("throws Error on HTTP 400 (already rated or order not closed)", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ detail: "Order not closed or already rated." }),
    });

    await expect(partsOrdersApi.rateOrder("order-uuid-0001", 4)).rejects.toThrow("400");
  });
});
