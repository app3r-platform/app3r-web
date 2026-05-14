// ── settlement-api.test.ts — Sub-CMD-6 Wave 2 ─────────────────────────────────
// ทดสอบ settlement-api.ts: types aligned กับ Backend SettlementDto
// Coverage: createSettlement, getSettlement, listSettlements, display helpers

import {
  createSettlement,
  getSettlement,
  listSettlements,
  SETTLEMENT_STATUS_LABEL,
  SETTLEMENT_STATUS_COLOR,
} from "@/lib/settlement-api";
import type { SettlementDetailDto, SettlementDto } from "@/lib/settlement-api";

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

// Mock settlement aligned กับ Backend SettlementDetailDto
const MOCK_SETTLEMENT_DETAIL: SettlementDetailDto = {
  id: "stl-aaaa-bbbb-cccc",
  serviceId: "svc-1111-2222-3333",
  weeerUserId: "usr-4444-5555-6666",
  amountThb: "500.00",         // string — Backend numeric → string
  status: "pending",
  bankAdapter: "mock",
  bankRef: null,
  initiatedBy: "usr-4444-5555-6666",
  createdAt: "2026-05-14T10:00:00Z",
  updatedAt: "2026-05-14T10:00:00Z",
  auditLog: [
    {
      id: "log-001",
      settlementId: "stl-aaaa-bbbb-cccc",
      action: "created",
      actorId: "usr-4444-5555-6666",
      oldStatus: null,
      newStatus: "pending",
      detail: "Settlement created",
      createdAt: "2026-05-14T10:00:00Z",
    },
  ],
};

const MOCK_SETTLEMENT_DTO: SettlementDto = {
  id: "stl-aaaa-bbbb-cccc",
  serviceId: "svc-1111-2222-3333",
  weeerUserId: "usr-4444-5555-6666",
  amountThb: "500.00",
  status: "pending",
  bankAdapter: "mock",
  bankRef: null,
  initiatedBy: "usr-4444-5555-6666",
  createdAt: "2026-05-14T10:00:00Z",
  updatedAt: "2026-05-14T10:00:00Z",
};

// ── Display helpers ────────────────────────────────────────────────────────────

describe("SETTLEMENT_STATUS_LABEL", () => {
  it("มี label ครบทุก status (pending/processing/completed/failed)", () => {
    expect(SETTLEMENT_STATUS_LABEL.pending).toBe("รอตรวจสอบ");
    expect(SETTLEMENT_STATUS_LABEL.processing).toBe("กำลังโอนเงิน");
    expect(SETTLEMENT_STATUS_LABEL.completed).toBe("โอนสำเร็จ");
    expect(SETTLEMENT_STATUS_LABEL.failed).toBe("โอนล้มเหลว");
  });

  it("ไม่มี 'cancelled' (ตรงกับ Backend enum)", () => {
    // Backend SETTLEMENT_STATUSES = ['pending','processing','completed','failed']
    const keys = Object.keys(SETTLEMENT_STATUS_LABEL);
    expect(keys).not.toContain("cancelled");
    expect(keys).toHaveLength(4);
  });
});

describe("SETTLEMENT_STATUS_COLOR", () => {
  it("pending ใช้ yellow, completed ใช้ green, failed ใช้ red, processing ใช้ blue", () => {
    expect(SETTLEMENT_STATUS_COLOR.pending).toContain("yellow");
    expect(SETTLEMENT_STATUS_COLOR.completed).toContain("green");
    expect(SETTLEMENT_STATUS_COLOR.failed).toContain("red");
    expect(SETTLEMENT_STATUS_COLOR.processing).toContain("blue");
  });
});

// ── createSettlement ───────────────────────────────────────────────────────────

describe("createSettlement", () => {
  beforeEach(() => { mockApiFetch.mockReset(); });

  it("POST /api/v1/settlements/ พร้อม payload ตรงกับ Backend CreateSettlementDto", async () => {
    mockApiFetch.mockResolvedValue(makeResponse(MOCK_SETTLEMENT_DETAIL, 201));

    const result = await createSettlement({
      serviceId: "svc-1111-2222-3333",
      weeerUserId: "usr-4444-5555-6666",
      amountThb: 500,
      weeerBankAccount: "1234567890",
      weeerBankName: "นายสมชาย ใจดี",
      bankAdapter: "mock",
    });

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/api/v1/settlements/",
      expect.objectContaining({ method: "POST" }),
    );

    // ตรวจ body fields
    const body = JSON.parse(
      (mockApiFetch.mock.calls[0][1]?.body) as string
    );
    expect(body.serviceId).toBe("svc-1111-2222-3333");
    expect(body.weeerBankAccount).toBe("1234567890");
    expect(body.weeerBankName).toBe("นายสมชาย ใจดี");
    expect(body.amountThb).toBe(500);
    expect(body.bankAdapter).toBe("mock");

    // ตรวจ response
    expect(result.id).toBe("stl-aaaa-bbbb-cccc");
    expect(result.status).toBe("pending");
    expect(result.amountThb).toBe("500.00"); // string จาก API
    expect(result.auditLog).toHaveLength(1);
  });

  it("response มี auditLog array (audit trail บังคับ Security Rule #5)", async () => {
    mockApiFetch.mockResolvedValue(makeResponse(MOCK_SETTLEMENT_DETAIL, 201));
    const result = await createSettlement({
      serviceId: "svc-1111-2222-3333",
      weeerUserId: "usr-0000",
      amountThb: 200,
      weeerBankAccount: "0987654321",
      weeerBankName: "นางสาวสมศรี",
    });
    expect(Array.isArray(result.auditLog)).toBe(true);
    expect(result.auditLog[0].action).toBe("created");
  });

  it("throw error เมื่อ API ตอบ 400", async () => {
    mockApiFetch.mockResolvedValue(makeResponse({ detail: "จำนวนเงินไม่ถูกต้อง" }, 400));
    await expect(
      createSettlement({
        serviceId: "svc-0000",
        weeerUserId: "usr-0000",
        amountThb: -100,
        weeerBankAccount: "1234567890",
        weeerBankName: "Test",
      })
    ).rejects.toThrow("จำนวนเงินไม่ถูกต้อง");
  });

  it("throw error เมื่อ 401 (unauthorized)", async () => {
    mockApiFetch.mockResolvedValue(
      makeResponse({ detail: "Authentication credentials were not provided." }, 401)
    );
    await expect(
      createSettlement({
        serviceId: "svc-0000",
        weeerUserId: "usr-0000",
        amountThb: 500,
        weeerBankAccount: "1234567890",
        weeerBankName: "Test",
      })
    ).rejects.toThrow("Authentication credentials were not provided.");
  });

  it("throw fallback error เมื่อไม่มี detail field", async () => {
    mockApiFetch.mockResolvedValue(makeResponse({}, 500));
    await expect(
      createSettlement({
        serviceId: "svc-0000",
        weeerUserId: "usr-0000",
        amountThb: 500,
        weeerBankAccount: "1234567890",
        weeerBankName: "Test",
      })
    ).rejects.toThrow(/สร้าง settlement ล้มเหลว/);
  });
});

// ── getSettlement ──────────────────────────────────────────────────────────────

describe("getSettlement", () => {
  beforeEach(() => { mockApiFetch.mockReset(); });

  it("GET /api/v1/settlements/:id/ คืน SettlementDetailDto (รวม auditLog)", async () => {
    mockApiFetch.mockResolvedValue(makeResponse(MOCK_SETTLEMENT_DETAIL));

    const result = await getSettlement("stl-aaaa-bbbb-cccc");
    expect(mockApiFetch).toHaveBeenCalledWith(
      "/api/v1/settlements/stl-aaaa-bbbb-cccc/"
    );
    expect(result.id).toBe("stl-aaaa-bbbb-cccc");
    expect(result.amountThb).toBe("500.00");
    expect(result.auditLog).toBeDefined();
  });

  it("throw error เมื่อ 404", async () => {
    mockApiFetch.mockResolvedValue(makeResponse({ detail: "Settlement not found." }, 404));
    await expect(getSettlement("xxx")).rejects.toThrow("Settlement not found.");
  });

  it("URL encode id อักขระพิเศษ", async () => {
    mockApiFetch.mockResolvedValue(makeResponse(MOCK_SETTLEMENT_DETAIL));
    await getSettlement("stl/test+id");
    expect(mockApiFetch).toHaveBeenCalledWith("/api/v1/settlements/stl%2Ftest%2Bid/");
  });
});

// ── listSettlements ────────────────────────────────────────────────────────────

describe("listSettlements", () => {
  beforeEach(() => { mockApiFetch.mockReset(); });

  it("GET /api/v1/settlements/ ไม่มี filter — URL ไม่มี query string", async () => {
    mockApiFetch.mockResolvedValue(makeResponse({ items: [MOCK_SETTLEMENT_DTO], total: 1 }));

    const result = await listSettlements();
    expect(mockApiFetch).toHaveBeenCalledWith("/api/v1/settlements/");
    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
    // items เป็น SettlementDto (ไม่มี auditLog)
    expect((result.items[0] as SettlementDetailDto).auditLog).toBeUndefined();
  });

  it("ใส่ status filter ใน query string", async () => {
    mockApiFetch.mockResolvedValue(makeResponse({ items: [], total: 0 }));
    await listSettlements({ status: "completed" });
    const url = mockApiFetch.mock.calls[0][0] as string;
    expect(url).toContain("status=completed");
  });

  it("ใส่ limit + offset ใน query string", async () => {
    mockApiFetch.mockResolvedValue(makeResponse({ items: [], total: 0 }));
    await listSettlements({ limit: 10, offset: 20 });
    const url = mockApiFetch.mock.calls[0][0] as string;
    expect(url).toContain("limit=10");
    expect(url).toContain("offset=20");
  });

  it("throw error เมื่อ API fail (401)", async () => {
    mockApiFetch.mockResolvedValue(makeResponse({ detail: "Unauthorized" }, 401));
    await expect(listSettlements()).rejects.toThrow("Unauthorized");
  });

  it("คืน empty items เมื่อไม่มีรายการ", async () => {
    mockApiFetch.mockResolvedValue(makeResponse({ items: [], total: 0 }));
    const result = await listSettlements({ status: "failed" });
    expect(result.items).toHaveLength(0);
    expect(result.total).toBe(0);
  });
});
