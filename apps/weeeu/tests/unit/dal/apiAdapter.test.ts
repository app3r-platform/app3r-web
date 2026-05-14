// ─── apiAdapter.test.ts — Unit tests for apiAdapter (D84 Phase D-2) ──────────
// Sub-CMD-2 Wave 1 — ตรวจสอบ: auth sync stubs, NotImplementedError, transferApi
// testEnvironment: jsdom (มี localStorage)

import { apiAdapter, NotImplementedError } from "@/lib/dal/apiAdapter";

// ─── Mock fetch (global) ──────────────────────────────────────────────────────
const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
  localStorage.clear();
  sessionStorage.clear();
});

// ─── Auth sync stubs ──────────────────────────────────────────────────────────

describe("apiAdapter.auth — sync stubs", () => {
  it("getToken() คืน null เมื่อ localStorage ว่าง", () => {
    expect(apiAdapter.auth.getToken()).toBeNull();
  });

  it("setToken() + getToken() เก็บ token ใน localStorage", () => {
    apiAdapter.auth.setToken("test-token-abc");
    expect(apiAdapter.auth.getToken()).toBe("test-token-abc");
  });

  it("clearToken() ลบ token ออกจาก localStorage", () => {
    apiAdapter.auth.setToken("some-token");
    apiAdapter.auth.clearToken();
    expect(apiAdapter.auth.getToken()).toBeNull();
  });

  it("getCurrentUser() คืน USE_ASYNC_ME error เมื่อมี token อยู่", () => {
    apiAdapter.auth.setToken("valid-token");
    const result = apiAdapter.auth.getCurrentUser();
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("USE_ASYNC_ME");
    }
  });

  it("getCurrentUser() คืน UNAUTHENTICATED เมื่อไม่มี token", () => {
    const result = apiAdapter.auth.getCurrentUser();
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("UNAUTHENTICATED");
    }
  });
});

// ─── NotImplementedError ──────────────────────────────────────────────────────

describe("NotImplementedError", () => {
  it("throw + catch ได้ (ไม่มี TDZ error)", () => {
    expect(() => {
      throw new NotImplementedError("testMethod");
    }).toThrow(NotImplementedError);
  });

  it("มี name = 'NotImplementedError'", () => {
    const err = new NotImplementedError("foo");
    expect(err.name).toBe("NotImplementedError");
  });

  it("message มีชื่อ method ที่ส่งมา", () => {
    const err = new NotImplementedError("someMethod");
    expect(err.message).toContain("someMethod");
  });
});

// ─── Transfer API mock fetch ──────────────────────────────────────────────────

describe("apiAdapter.transfer — fetch calls", () => {
  const mockDepositInfo = {
    promptPayId: "0812345678",
    accountName: "บริษัท แอพ3อาร์ จำกัด",
    accountNumber: "123-4-56789-0",
    bankName: "ธนาคารกสิกรไทย",
    pointRate: 1,
  };

  it("getDepositInfo() เรียก GET /api/v1/transfers/deposit-info", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockDepositInfo),
    });
    const result = await apiAdapter.transfer.getDepositInfo();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.promptPayId).toBe("0812345678");
    }
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/transfers/deposit-info"),
      expect.any(Object)
    );
  });

  it("deposit() เรียก POST /api/v1/transfers/deposit", async () => {
    const mockTransfer = {
      id: "dep-001",
      userId: "u-001",
      type: "deposit",
      amount: 500,
      points: 500,
      status: "pending",
      slipFileId: "file-123",
      createdAt: "2026-05-14T00:00:00Z",
      updatedAt: "2026-05-14T00:00:00Z",
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockTransfer),
    });
    const result = await apiAdapter.transfer.deposit({ amount: 500, slipFileId: "file-123" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.type).toBe("deposit");
      expect(result.data.status).toBe("pending");
    }
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/transfers/deposit"),
      expect.objectContaining({ method: "POST" })
    );
  });

  it("history() ส่ง ?type=deposit เมื่อระบุ type", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve([]),
    });
    await apiAdapter.transfer.history({ type: "deposit" });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("?type=deposit"),
      expect.any(Object)
    );
  });

  it("getDepositInfo() คืน error เมื่อ server ตอบ 500", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ message: "Internal Server Error" }),
    });
    const result = await apiAdapter.transfer.getDepositInfo();
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("500");
    }
  });
});
