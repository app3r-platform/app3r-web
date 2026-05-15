// ── parts-api.test.ts — Sub-CMD-8/9 Wave 3 ───────────────────────────────────
// ทดสอบ parts-api.ts: types aligned กับ Backend PartSchema + PartsOrderDto
// Coverage: display helpers, listMyParts, createPart, getPart, updatePart,
//           deletePart, createPartsOrder, getPartsOrderDetail,
//           fulfillPartsOrder, closePartsOrder,
//           listMyOrders, raiseDispute, rateOrder (Sub-CMD-9)

import {
  listMyParts,
  createPart,
  getPart,
  updatePart,
  deletePart,
  getPartsDashboard,
  createPartsOrder,
  getPartsOrderDetail,
  fulfillPartsOrder,
  closePartsOrder,
  listMyOrders,
  raiseDispute,
  rateOrder,
  CONDITION_LABEL,
  CONDITION_COLOR,
  ORDER_STATUS_LABEL,
  ORDER_STATUS_COLOR,
} from "@/lib/parts-api";
import type { Part, PartsOrderDto, PartsOrderDetailDto, PartsOrderListDto, PartsDisputeDto, PartsRatingDto } from "@/lib/parts-api";

// ── Mock api-client ────────────────────────────────────────────────────────────
jest.mock("@/lib/api-client", () => ({
  apiFetch: jest.fn(),
}));

import { apiFetch } from "@/lib/api-client";
const mockApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;

// ── Helpers ────────────────────────────────────────────────────────────────────

function makeResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

// ── Mock data aligned กับ Backend PartSchema ──────────────────────────────────

const MOCK_PART: Part = {
  id: "part-aaaa-bbbb-cccc",
  shopId: "shop-1111",
  name: "คอมเพรสเซอร์แอร์ Daikin 12000 BTU",
  sku: "CMP-DAI-12K",
  category: "compressor",
  unit: "ชิ้น",
  condition: "used",
  stockQty: 3,
  reservedQty: 0,
  unitPrice: 4500,      // number — ตรงกับ Backend PartSchema
  imageUrl: null,
  createdAt: "2026-05-10T08:00:00Z",
  updatedAt: "2026-05-10T08:00:00Z",
};

const MOCK_ORDER: PartsOrderDto = {
  id: "ord-dddd-eeee-ffff",
  partId: "part-aaaa-bbbb-cccc",
  buyerId: "usr-buyer-0001",
  serviceId: null,
  quantity: 2,
  unitPriceThb: "4500.00",  // string — Backend numeric → string
  totalThb: "9000.00",
  status: "pending",
  fulfillmentNote: null,
  trackingNumber: null,
  fulfilledAt: null,
  closedAt: null,
  idempotencyKey: "idem-test-001",
  createdAt: "2026-05-14T09:00:00Z",
  updatedAt: "2026-05-14T09:00:00Z",
};

const MOCK_ORDER_DETAIL: PartsOrderDetailDto = {
  ...MOCK_ORDER,
  events: [
    {
      id: "evt-001",
      orderId: "ord-dddd-eeee-ffff",
      eventType: "created",
      actorId: "usr-buyer-0001",
      oldStatus: null,
      newStatus: "pending",
      detail: null,
      createdAt: "2026-05-14T09:00:00Z",
    },
  ],
  dispute: null,
  rating: null,
};

// ── Display helpers ────────────────────────────────────────────────────────────

describe("CONDITION_LABEL", () => {
  it("มี label ครบ 3 สภาพ: new/used/refurbished", () => {
    expect(CONDITION_LABEL.new).toBe("ใหม่");
    expect(CONDITION_LABEL.used).toBe("มือสอง");
    expect(CONDITION_LABEL.refurbished).toBe("ซ่อมแล้ว");
  });

  it("มีครบ 3 keys เท่านั้น", () => {
    expect(Object.keys(CONDITION_LABEL)).toHaveLength(3);
  });
});

describe("CONDITION_COLOR", () => {
  it("new ใช้ green, used ใช้ gray, refurbished ใช้ blue", () => {
    expect(CONDITION_COLOR.new).toContain("green");
    expect(CONDITION_COLOR.used).toContain("gray");
    expect(CONDITION_COLOR.refurbished).toContain("blue");
  });
});

describe("ORDER_STATUS_LABEL", () => {
  it("มี label ครบ 8 statuses ตาม Backend enum", () => {
    expect(ORDER_STATUS_LABEL.pending).toBe("รอชำระ");
    expect(ORDER_STATUS_LABEL.held).toBe("ถือ Escrow");
    expect(ORDER_STATUS_LABEL.fulfilled).toBe("ส่งของแล้ว");
    expect(ORDER_STATUS_LABEL.closed).toBe("รับของแล้ว");
    expect(ORDER_STATUS_LABEL.disputed).toBe("มีข้อพิพาท");
    expect(ORDER_STATUS_LABEL.resolved).toBe("แก้ไขแล้ว");
    expect(ORDER_STATUS_LABEL.refunded).toBe("คืนเงินแล้ว");
    expect(ORDER_STATUS_LABEL.cancelled).toBe("ยกเลิก");
  });

  it("มีครบ 8 statuses (ตรงกับ Backend PartsOrderStatus enum)", () => {
    expect(Object.keys(ORDER_STATUS_LABEL)).toHaveLength(8);
  });
});

describe("ORDER_STATUS_COLOR", () => {
  it("closed ใช้ green, disputed ใช้ red, pending ใช้ yellow", () => {
    expect(ORDER_STATUS_COLOR.closed).toContain("green");
    expect(ORDER_STATUS_COLOR.disputed).toContain("red");
    expect(ORDER_STATUS_COLOR.pending).toContain("yellow");
    expect(ORDER_STATUS_COLOR.held).toContain("blue");
  });
});

// ── Seller: listMyParts ────────────────────────────────────────────────────────

describe("listMyParts", () => {
  beforeEach(() => { mockApiFetch.mockReset(); });

  it("GET /api/v1/parts/ ไม่มี filter — URL ไม่มี query string", async () => {
    mockApiFetch.mockResolvedValue(makeResponse([MOCK_PART]));

    const result = await listMyParts();
    expect(mockApiFetch).toHaveBeenCalledWith("/api/v1/parts/");
    expect(result).toHaveLength(1);
    expect(result[0].unitPrice).toBe(4500); // number ไม่ใช่ string
    expect(result[0].shopId).toBe("shop-1111");
  });

  it("ใส่ category filter ใน query string", async () => {
    mockApiFetch.mockResolvedValue(makeResponse([]));
    await listMyParts({ category: "compressor" });
    const url = mockApiFetch.mock.calls[0][0] as string;
    expect(url).toContain("category=compressor");
  });

  it("ใส่ search filter ใน query string", async () => {
    mockApiFetch.mockResolvedValue(makeResponse([]));
    await listMyParts({ search: "Daikin" });
    const url = mockApiFetch.mock.calls[0][0] as string;
    expect(url).toContain("search=Daikin");
  });

  it("throw error เมื่อ 401", async () => {
    mockApiFetch.mockResolvedValue(makeResponse({ detail: "Authentication credentials were not provided." }, 401));
    await expect(listMyParts()).rejects.toThrow("Authentication credentials were not provided.");
  });

  it("throw fallback error เมื่อไม่มี detail", async () => {
    mockApiFetch.mockResolvedValue(makeResponse({}, 500));
    await expect(listMyParts()).rejects.toThrow(/โหลดรายการอะไหล่ล้มเหลว/);
  });
});

// ── Seller: createPart ─────────────────────────────────────────────────────────

describe("createPart", () => {
  beforeEach(() => { mockApiFetch.mockReset(); });

  it("POST /api/v1/parts/ พร้อม payload ครบ", async () => {
    mockApiFetch.mockResolvedValue(makeResponse(MOCK_PART, 201));

    const result = await createPart({
      name: "คอมเพรสเซอร์แอร์ Daikin 12000 BTU",
      sku: "CMP-DAI-12K",
      unitPrice: 4500,
      stockQty: 3,
      category: "compressor",
      condition: "used",
    });

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/api/v1/parts/",
      expect.objectContaining({ method: "POST" })
    );

    const body = JSON.parse((mockApiFetch.mock.calls[0][1]?.body) as string);
    expect(body.name).toBe("คอมเพรสเซอร์แอร์ Daikin 12000 BTU");
    expect(body.unitPrice).toBe(4500);
    expect(body.condition).toBe("used");

    expect(result.id).toBe("part-aaaa-bbbb-cccc");
    expect(result.unitPrice).toBe(4500); // number
  });

  it("throw error เมื่อ 400 (validation fail)", async () => {
    mockApiFetch.mockResolvedValue(makeResponse({ detail: "ราคาต้องมากกว่า 0" }, 400));
    await expect(
      createPart({ name: "Test", unitPrice: -1 })
    ).rejects.toThrow("ราคาต้องมากกว่า 0");
  });
});

// ── Seller: getPart ────────────────────────────────────────────────────────────

describe("getPart", () => {
  beforeEach(() => { mockApiFetch.mockReset(); });

  it("GET /api/v1/parts/:id/ คืน Part พร้อม trailing slash", async () => {
    mockApiFetch.mockResolvedValue(makeResponse(MOCK_PART));
    const result = await getPart("part-aaaa-bbbb-cccc");
    expect(mockApiFetch).toHaveBeenCalledWith("/api/v1/parts/part-aaaa-bbbb-cccc/");
    expect(result.name).toBe("คอมเพรสเซอร์แอร์ Daikin 12000 BTU");
  });

  it("throw error เมื่อ 404", async () => {
    mockApiFetch.mockResolvedValue(makeResponse({ detail: "Not found." }, 404));
    await expect(getPart("xxx")).rejects.toThrow("Not found.");
  });

  it("URL encode id อักขระพิเศษ", async () => {
    mockApiFetch.mockResolvedValue(makeResponse(MOCK_PART));
    await getPart("part/test+id");
    expect(mockApiFetch).toHaveBeenCalledWith("/api/v1/parts/part%2Ftest%2Bid/");
  });
});

// ── Seller: updatePart ────────────────────────────────────────────────────────

describe("updatePart", () => {
  beforeEach(() => { mockApiFetch.mockReset(); });

  it("PATCH /api/v1/parts/:id/ ด้วย partial payload", async () => {
    const updated = { ...MOCK_PART, unitPrice: 5000 };
    mockApiFetch.mockResolvedValue(makeResponse(updated));

    const result = await updatePart("part-aaaa-bbbb-cccc", { unitPrice: 5000 });

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/api/v1/parts/part-aaaa-bbbb-cccc/",
      expect.objectContaining({ method: "PATCH" })
    );
    expect(result.unitPrice).toBe(5000);
  });
});

// ── Seller: deletePart ────────────────────────────────────────────────────────

describe("deletePart", () => {
  beforeEach(() => { mockApiFetch.mockReset(); });

  it("DELETE /api/v1/parts/:id/ สำเร็จไม่ throw", async () => {
    mockApiFetch.mockResolvedValue(makeResponse({ success: true }));
    await expect(deletePart("part-aaaa-bbbb-cccc")).resolves.toBeUndefined();
    expect(mockApiFetch).toHaveBeenCalledWith(
      "/api/v1/parts/part-aaaa-bbbb-cccc/",
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("throw error เมื่อ 404", async () => {
    mockApiFetch.mockResolvedValue(makeResponse({ detail: "Not found." }, 404));
    await expect(deletePart("xxx")).rejects.toThrow("Not found.");
  });
});

// ── Seller: getPartsDashboard ─────────────────────────────────────────────────

describe("getPartsDashboard", () => {
  beforeEach(() => { mockApiFetch.mockReset(); });

  it("GET /api/v1/parts/dashboard/ คืน dashboard stats", async () => {
    mockApiFetch.mockResolvedValue(makeResponse({
      total_skus: 5,
      total_stock_value: 22500,
      low_stock: [MOCK_PART],
      recent_movements: [],
    }));

    const result = await getPartsDashboard();
    expect(mockApiFetch).toHaveBeenCalledWith("/api/v1/parts/dashboard/");
    expect(result.total_skus).toBe(5);
    expect(result.total_stock_value).toBe(22500);
    expect(result.low_stock).toHaveLength(1);
  });
});

// ── Buyer: createPartsOrder ────────────────────────────────────────────────────

describe("createPartsOrder", () => {
  beforeEach(() => { mockApiFetch.mockReset(); });

  it("POST /api/v1/parts/orders/ พร้อม payload ตรงกับ Backend CreatePartsOrderInput", async () => {
    mockApiFetch.mockResolvedValue(makeResponse(MOCK_ORDER, 201));

    const result = await createPartsOrder({
      partId: "part-aaaa-bbbb-cccc",
      quantity: 2,
      idempotencyKey: "idem-test-001",
    });

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/api/v1/parts/orders/",
      expect.objectContaining({ method: "POST" })
    );

    const body = JSON.parse((mockApiFetch.mock.calls[0][1]?.body) as string);
    expect(body.partId).toBe("part-aaaa-bbbb-cccc");
    expect(body.quantity).toBe(2);
    expect(body.idempotencyKey).toBe("idem-test-001");

    expect(result.id).toBe("ord-dddd-eeee-ffff");
    expect(result.totalThb).toBe("9000.00"); // string
    expect(result.status).toBe("pending");
  });

  it("รองรับ optional serviceId", async () => {
    mockApiFetch.mockResolvedValue(makeResponse(MOCK_ORDER, 201));
    await createPartsOrder({
      partId: "part-0001",
      quantity: 1,
      serviceId: "svc-aaaa-bbbb-cccc",
      idempotencyKey: "idem-002",
    });
    const body = JSON.parse((mockApiFetch.mock.calls[0][1]?.body) as string);
    expect(body.serviceId).toBe("svc-aaaa-bbbb-cccc");
  });

  it("throw error เมื่อ 400 (insufficient stock)", async () => {
    mockApiFetch.mockResolvedValue(makeResponse({ detail: "Part not found, insufficient stock, or duplicate idempotency key." }, 400));
    await expect(
      createPartsOrder({ partId: "xxx", quantity: 99, idempotencyKey: "idem-003" })
    ).rejects.toThrow(/insufficient stock/);
  });

  it("throw error เมื่อ 409 (duplicate idempotency key)", async () => {
    mockApiFetch.mockResolvedValue(makeResponse({ detail: "Duplicate order key." }, 409));
    await expect(
      createPartsOrder({ partId: "part-0001", quantity: 1, idempotencyKey: "idem-dup" })
    ).rejects.toThrow("Duplicate order key.");
  });

  it("throw fallback error เมื่อไม่มี detail", async () => {
    mockApiFetch.mockResolvedValue(makeResponse({}, 500));
    await expect(
      createPartsOrder({ partId: "part-0001", quantity: 1, idempotencyKey: "idem-005" })
    ).rejects.toThrow(/สั่งซื้ออะไหล่ล้มเหลว/);
  });
});

// ── Buyer: getPartsOrderDetail ─────────────────────────────────────────────────

describe("getPartsOrderDetail", () => {
  beforeEach(() => { mockApiFetch.mockReset(); });

  it("GET /api/v1/parts/orders/:id/ คืน OrderDetailDto (มี events, dispute, rating)", async () => {
    mockApiFetch.mockResolvedValue(makeResponse(MOCK_ORDER_DETAIL));

    const result = await getPartsOrderDetail("ord-dddd-eeee-ffff");
    expect(mockApiFetch).toHaveBeenCalledWith("/api/v1/parts/orders/ord-dddd-eeee-ffff/");
    expect(result.id).toBe("ord-dddd-eeee-ffff");
    expect(Array.isArray(result.events)).toBe(true);
    expect(result.events[0].eventType).toBe("created");
    expect(result.dispute).toBeNull();
    expect(result.rating).toBeNull();
  });

  it("throw error เมื่อ 404", async () => {
    mockApiFetch.mockResolvedValue(makeResponse({ detail: "Order not found." }, 404));
    await expect(getPartsOrderDetail("xxx")).rejects.toThrow("Order not found.");
  });
});

// ── Seller: fulfillPartsOrder ─────────────────────────────────────────────────

describe("fulfillPartsOrder", () => {
  beforeEach(() => { mockApiFetch.mockReset(); });

  it("PATCH /api/v1/parts/orders/:id/fulfill/ พร้อม tracking", async () => {
    const fulfilled = { ...MOCK_ORDER, status: "fulfilled" as const, trackingNumber: "KE123" };
    mockApiFetch.mockResolvedValue(makeResponse(fulfilled));

    const result = await fulfillPartsOrder("ord-dddd-eeee-ffff", {
      trackingNumber: "KE123",
      fulfillmentNote: "ส่ง Kerry",
    });

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/api/v1/parts/orders/ord-dddd-eeee-ffff/fulfill/",
      expect.objectContaining({ method: "PATCH" })
    );
    expect(result.status).toBe("fulfilled");
    expect(result.trackingNumber).toBe("KE123");
  });

  it("throw error เมื่อ 400 (order not in held state)", async () => {
    mockApiFetch.mockResolvedValue(makeResponse({ detail: "Order not found, not in held status, or you are not the seller." }, 400));
    await expect(fulfillPartsOrder("ord-xxx", {})).rejects.toThrow(/not in held status/);
  });
});

// ── Buyer: closePartsOrder ────────────────────────────────────────────────────

describe("closePartsOrder", () => {
  beforeEach(() => { mockApiFetch.mockReset(); });

  it("PATCH /api/v1/parts/orders/:id/close/ ยืนยันรับของ → status closed", async () => {
    const closed = { ...MOCK_ORDER, status: "closed" as const, closedAt: "2026-05-15T10:00:00Z" };
    mockApiFetch.mockResolvedValue(makeResponse(closed));

    const result = await closePartsOrder("ord-dddd-eeee-ffff");

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/api/v1/parts/orders/ord-dddd-eeee-ffff/close/",
      expect.objectContaining({ method: "PATCH" })
    );
    expect(result.status).toBe("closed");
    expect(result.closedAt).toBe("2026-05-15T10:00:00Z");
  });

  it("throw error เมื่อ 400 (order not in fulfilled state)", async () => {
    mockApiFetch.mockResolvedValue(makeResponse({ detail: "Order not found, not in fulfilled status, or you are not the buyer." }, 400));
    await expect(closePartsOrder("ord-xxx")).rejects.toThrow(/not in fulfilled status/);
  });
});

// ── Sub-CMD-9: listMyOrders ───────────────────────────────────────────────────

const MOCK_ORDER_LIST: PartsOrderListDto = {
  items: [MOCK_ORDER],
  total: 1,
  limit: 50,
  offset: 0,
};

describe("listMyOrders", () => {
  beforeEach(() => { mockApiFetch.mockReset(); });

  it("GET /api/v1/parts/orders/ ไม่มี params → ดึง list ทั้งหมด", async () => {
    mockApiFetch.mockResolvedValue(makeResponse(MOCK_ORDER_LIST));

    const result = await listMyOrders();

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/api/v1/parts/orders/"
    );
    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.limit).toBe(50);
  });

  it("GET /api/v1/parts/orders/?buyerId=xxx — ส่ง query string ถูกต้อง", async () => {
    mockApiFetch.mockResolvedValue(makeResponse(MOCK_ORDER_LIST));

    await listMyOrders({ buyerId: "usr-buyer-0001" });

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/api/v1/parts/orders/?buyerId=usr-buyer-0001"
    );
  });

  it("GET /api/v1/parts/orders/?sellerId=xxx — ส่ง sellerId ถูกต้อง", async () => {
    mockApiFetch.mockResolvedValue(makeResponse(MOCK_ORDER_LIST));

    await listMyOrders({ sellerId: "usr-seller-0001" });

    expect(mockApiFetch).toHaveBeenCalledWith(
      expect.stringContaining("sellerId=usr-seller-0001")
    );
  });

  it("รองรับ status filter", async () => {
    mockApiFetch.mockResolvedValue(makeResponse({ ...MOCK_ORDER_LIST, items: [] }));

    await listMyOrders({ status: "held", limit: 10, offset: 0 });

    const calledUrl = mockApiFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain("status=held");
    expect(calledUrl).toContain("limit=10");
    expect(calledUrl).toContain("offset=0");
  });

  it("throw error เมื่อ API ล้มเหลว", async () => {
    mockApiFetch.mockResolvedValue(makeResponse({}, 401));
    await expect(listMyOrders()).rejects.toThrow(/โหลดคำสั่งซื้อล้มเหลว/);
  });
});

// ── Sub-CMD-9: raiseDispute ───────────────────────────────────────────────────

const MOCK_DISPUTE: PartsDisputeDto = {
  id: "disp-001",
  orderId: "ord-dddd-eeee-ffff",
  raisedBy: "usr-buyer-0001",
  reason: "สินค้าไม่ตรงตามที่สั่ง ขอเปิด dispute",
  status: "open",
  resolution: null,
  resolvedBy: null,
  createdAt: "2026-05-15T10:00:00Z",
  resolvedAt: null,
};

describe("raiseDispute", () => {
  beforeEach(() => { mockApiFetch.mockReset(); });

  it("POST /api/v1/parts/orders/:id/dispute/ — แจ้งปัญหาสำเร็จ", async () => {
    mockApiFetch.mockResolvedValue(makeResponse(MOCK_DISPUTE, 201));

    const result = await raiseDispute("ord-dddd-eeee-ffff", "สินค้าไม่ตรงตามที่สั่ง ขอเปิด dispute");

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/api/v1/parts/orders/ord-dddd-eeee-ffff/dispute/",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ reason: "สินค้าไม่ตรงตามที่สั่ง ขอเปิด dispute" }),
      })
    );
    expect(result.status).toBe("open");
    expect(result.orderId).toBe("ord-dddd-eeee-ffff");
  });

  it("throw error เมื่อ order ไม่ใช่สถานะ held/fulfilled (400)", async () => {
    mockApiFetch.mockResolvedValue(makeResponse({}, 400));
    await expect(raiseDispute("ord-xxx", "reason ยาวพอแล้ว")).rejects.toThrow(/แจ้งปัญหาล้มเหลว/);
  });
});

// ── Sub-CMD-9: rateOrder ──────────────────────────────────────────────────────

const MOCK_RATING: PartsRatingDto = {
  id: "rate-001",
  orderId: "ord-dddd-eeee-ffff",
  ratedBy: "usr-buyer-0001",
  sellerId: "usr-seller-0001",
  score: 5,
  comment: "ส่งเร็ว สินค้าดีมาก",
  createdAt: "2026-05-15T12:00:00Z",
};

describe("rateOrder", () => {
  beforeEach(() => { mockApiFetch.mockReset(); });

  it("POST /api/v1/parts/orders/:id/rate/ — ให้คะแนน 5 ดาว + comment", async () => {
    mockApiFetch.mockResolvedValue(makeResponse(MOCK_RATING, 201));

    const result = await rateOrder("ord-dddd-eeee-ffff", 5, "ส่งเร็ว สินค้าดีมาก");

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/api/v1/parts/orders/ord-dddd-eeee-ffff/rate/",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ score: 5, comment: "ส่งเร็ว สินค้าดีมาก" }),
      })
    );
    expect(result.score).toBe(5);
    expect(result.comment).toBe("ส่งเร็ว สินค้าดีมาก");
  });

  it("POST ไม่มี comment — body ส่งแค่ score", async () => {
    mockApiFetch.mockResolvedValue(makeResponse({ ...MOCK_RATING, comment: null }, 201));

    await rateOrder("ord-dddd-eeee-ffff", 3);

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/api/v1/parts/orders/ord-dddd-eeee-ffff/rate/",
      expect.objectContaining({
        body: JSON.stringify({ score: 3 }),
      })
    );
  });

  it("throw error เมื่อ order ไม่ได้ปิด (400)", async () => {
    mockApiFetch.mockResolvedValue(makeResponse({}, 400));
    await expect(rateOrder("ord-xxx", 4)).rejects.toThrow(/ให้คะแนนล้มเหลว/);
  });
});
