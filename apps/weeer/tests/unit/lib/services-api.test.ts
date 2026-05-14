// ── services-api.test.ts — Sub-CMD-4 Wave 2 ───────────────────────────────────
// ทดสอบ services-api.ts: types, API calls, error handling
// Coverage: createService, listServices, getService, updateService,
//           updateServiceStatus, deleteService

import {
  createService,
  listServices,
  getService,
  updateService,
  updateServiceStatus,
  deleteService,
  SERVICE_TYPE_LABEL,
  SERVICE_STATUS_LABEL,
  SERVICE_STATUS_COLOR,
} from "@/lib/services-api";
import type { ServiceRecord } from "@/lib/services-api";

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

const MOCK_SERVICE: ServiceRecord = {
  id: "svc-001",
  ownerId: "owner-001",
  serviceType: "repair",
  status: "draft",
  title: "ซ่อมแอร์มิตซูบิชิ",
  description: "ล้าง + ตรวจรั่ว + เติมน้ำยา",
  pointAmount: "850.00",
  deadline: "2026-06-01T10:00:00.000Z",
  createdAt: "2026-05-14T08:00:00.000Z",
  updatedAt: "2026-05-14T08:00:00.000Z",
};

// ── Display helpers ────────────────────────────────────────────────────────────

describe("SERVICE_TYPE_LABEL", () => {
  it("มี label ครบทุก type", () => {
    expect(SERVICE_TYPE_LABEL.repair).toBe("ซ่อมอุปกรณ์");
    expect(SERVICE_TYPE_LABEL.maintain).toBe("ล้างบำรุงรักษา");
    expect(SERVICE_TYPE_LABEL.resell).toBe("ขายต่อ");
    expect(SERVICE_TYPE_LABEL.scrap).toBe("ซากเครื่อง");
  });
});

describe("SERVICE_STATUS_LABEL", () => {
  it("มี label ครบทุก status", () => {
    expect(SERVICE_STATUS_LABEL.draft).toBe("ร่าง");
    expect(SERVICE_STATUS_LABEL.published).toBe("เผยแพร่");
    expect(SERVICE_STATUS_LABEL.in_progress).toBe("กำลังดำเนินการ");
    expect(SERVICE_STATUS_LABEL.completed).toBe("เสร็จสิ้น");
    expect(SERVICE_STATUS_LABEL.cancelled).toBe("ยกเลิก");
  });
});

describe("SERVICE_STATUS_COLOR", () => {
  it("draft ใช้ gray, published ใช้ green", () => {
    expect(SERVICE_STATUS_COLOR.draft).toContain("gray");
    expect(SERVICE_STATUS_COLOR.published).toContain("green");
    expect(SERVICE_STATUS_COLOR.cancelled).toContain("red");
  });
});

// ── createService ──────────────────────────────────────────────────────────────

describe("createService", () => {
  beforeEach(() => { mockApiFetch.mockReset(); });

  it("POST /api/v1/services/ พร้อม body ครบ", async () => {
    mockApiFetch.mockResolvedValue(makeResponse(MOCK_SERVICE, 201));

    const result = await createService({
      serviceType: "repair",
      title: "ซ่อมแอร์มิตซูบิชิ",
      description: "ล้าง + ตรวจรั่ว",
      pointAmount: 850,
      deadline: "2026-06-01T10:00:00.000Z",
    });

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/api/v1/services/",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining('"title":"ซ่อมแอร์มิตซูบิชิ"'),
      }),
    );
    expect(result.id).toBe("svc-001");
    expect(result.status).toBe("draft");
  });

  it("POST ด้วย serviceType เท่านั้น (optional fields ว่าง)", async () => {
    const minimal: ServiceRecord = { ...MOCK_SERVICE, title: null, description: null, pointAmount: null, deadline: null };
    mockApiFetch.mockResolvedValue(makeResponse(minimal, 201));

    const result = await createService({ serviceType: "maintain" });
    expect(result.title).toBeNull();
    expect(result.pointAmount).toBeNull();
  });

  it("throw error เมื่อ API ตอบ 401", async () => {
    mockApiFetch.mockResolvedValue(makeResponse({ detail: "Authentication credentials were not provided." }, 401));
    await expect(createService({ serviceType: "repair" }))
      .rejects.toThrow("Authentication credentials were not provided.");
  });

  it("throw fallback error เมื่อ API ตอบ error ไม่มี detail", async () => {
    mockApiFetch.mockResolvedValue(makeResponse({}, 500));
    await expect(createService({ serviceType: "repair" }))
      .rejects.toThrow(/สร้าง service ล้มเหลว/);
  });
});

// ── listServices ───────────────────────────────────────────────────────────────

describe("listServices", () => {
  beforeEach(() => { mockApiFetch.mockReset(); });

  it("GET /api/v1/services/ ไม่มี filter", async () => {
    mockApiFetch.mockResolvedValue(makeResponse({ items: [MOCK_SERVICE], total: 1 }));

    const result = await listServices();
    expect(mockApiFetch).toHaveBeenCalledWith("/api/v1/services/");
    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it("ใส่ query string เมื่อมี filter", async () => {
    mockApiFetch.mockResolvedValue(makeResponse({ items: [], total: 0 }));

    await listServices({ status: "published", type: "repair", limit: 10 });
    const url = mockApiFetch.mock.calls[0][0] as string;
    expect(url).toContain("status=published");
    expect(url).toContain("type=repair");
    expect(url).toContain("limit=10");
  });

  it("throw error เมื่อ API fail", async () => {
    mockApiFetch.mockResolvedValue(makeResponse({ detail: "Unauthorized" }, 401));
    await expect(listServices()).rejects.toThrow("Unauthorized");
  });
});

// ── getService ─────────────────────────────────────────────────────────────────

describe("getService", () => {
  beforeEach(() => { mockApiFetch.mockReset(); });

  it("GET /api/v1/services/:id/ คืน ServiceRecord", async () => {
    mockApiFetch.mockResolvedValue(makeResponse(MOCK_SERVICE));

    const result = await getService("svc-001");
    expect(mockApiFetch).toHaveBeenCalledWith("/api/v1/services/svc-001/");
    expect(result.title).toBe("ซ่อมแอร์มิตซูบิชิ");
  });

  it("throw error เมื่อ 404", async () => {
    mockApiFetch.mockResolvedValue(makeResponse({ detail: "Service not found." }, 404));
    await expect(getService("xxx")).rejects.toThrow("Service not found.");
  });
});

// ── updateService ──────────────────────────────────────────────────────────────

describe("updateService", () => {
  beforeEach(() => { mockApiFetch.mockReset(); });

  it("PATCH /api/v1/services/:id/ พร้อม payload", async () => {
    const updated = { ...MOCK_SERVICE, title: "ซ่อมแอร์ใหม่", pointAmount: "1000.00" };
    mockApiFetch.mockResolvedValue(makeResponse(updated));

    const result = await updateService("svc-001", { title: "ซ่อมแอร์ใหม่", pointAmount: 1000 });

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/api/v1/services/svc-001/",
      expect.objectContaining({
        method: "PATCH",
        body: expect.stringContaining('"title":"ซ่อมแอร์ใหม่"'),
      }),
    );
    expect(result.title).toBe("ซ่อมแอร์ใหม่");
    expect(result.pointAmount).toBe("1000.00");
  });
});

// ── updateServiceStatus ────────────────────────────────────────────────────────

describe("updateServiceStatus", () => {
  beforeEach(() => { mockApiFetch.mockReset(); });

  it("PATCH /api/v1/services/:id/status/ พร้อม status", async () => {
    const published = { ...MOCK_SERVICE, status: "published" as const };
    mockApiFetch.mockResolvedValue(makeResponse(published));

    const result = await updateServiceStatus("svc-001", "published");

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/api/v1/services/svc-001/status/",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ status: "published" }),
      }),
    );
    expect(result.status).toBe("published");
  });
});

// ── deleteService ──────────────────────────────────────────────────────────────

describe("deleteService", () => {
  beforeEach(() => { mockApiFetch.mockReset(); });

  it("DELETE /api/v1/services/:id/ สำเร็จ (204 No Content)", async () => {
    mockApiFetch.mockResolvedValue({ ok: true, status: 204, json: () => Promise.resolve(null) } as unknown as Response);

    await expect(deleteService("svc-001")).resolves.toBeUndefined();
    expect(mockApiFetch).toHaveBeenCalledWith(
      "/api/v1/services/svc-001/",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("throw error เมื่อ 403 (ไม่ใช่ owner)", async () => {
    mockApiFetch.mockResolvedValue(makeResponse({ detail: "Permission denied." }, 403));
    await expect(deleteService("svc-001")).rejects.toThrow("Permission denied.");
  });
});
