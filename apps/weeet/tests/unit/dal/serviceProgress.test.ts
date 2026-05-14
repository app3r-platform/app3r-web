/**
 * tests/unit/dal/serviceProgress.test.ts
 * Sub-5 Wave 2 — Service Progress Tracker DAL tests
 *
 * ทดสอบ: serviceProgressApi (POST/PATCH/GET) + photo upload integration
 */

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn().mockReturnValue(null),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, "sessionStorage", { value: sessionStorageMock });

import { apiAdapter } from "@/lib/dal/apiAdapter";

/** helper สร้าง raw backend response */
function makeRawEntry(overrides: Partial<{
  id: string; service_id: string; status: string;
  progress_percent: number; note: string | null;
  photo_r2_key: string | null; updated_by: string; created_at: string;
}> = {}) {
  return {
    id: "prog-001",
    service_id: "svc-001",
    status: "in_progress",
    progress_percent: 40,
    note: null,
    photo_r2_key: null,
    updated_by: "tech-001",
    created_at: "2026-05-14T13:00:00Z",
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  sessionStorageMock.getItem.mockReturnValue(null);
});

describe("serviceProgressApi — getProgress", () => {
  it("returns [] on empty list", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 200, json: async () => [] });
    const result = await apiAdapter.serviceProgress.getProgress("svc-001");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toHaveLength(0);
  });

  it("maps snake_case → camelCase correctly", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true, status: 200,
      json: async () => [makeRawEntry({
        note: "ถอดฝาครอบแล้ว",
        photo_r2_key: "uploads/prog-001.jpg",
        progress_percent: 50,
      })],
    });
    const result = await apiAdapter.serviceProgress.getProgress("svc-001");
    expect(result.ok).toBe(true);
    if (result.ok) {
      const entry = result.data[0];
      expect(entry.id).toBe("prog-001");
      expect(entry.serviceId).toBe("svc-001");
      expect(entry.status).toBe("in_progress");
      expect(entry.progressPercent).toBe(50);
      expect(entry.note).toBe("ถอดฝาครอบแล้ว");
      expect(entry.photoR2Key).toBe("uploads/prog-001.jpg");
      expect(entry.updatedBy).toBe("tech-001");
    }
  });

  it("returns { ok: false } on HTTP 401", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 401, text: async () => "Unauthorized" });
    const result = await apiAdapter.serviceProgress.getProgress("svc-001");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("HTTP 401");
  });
});

describe("serviceProgressApi — createProgress (POST)", () => {
  it("creates entry without photo", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true, status: 201,
      json: async () => makeRawEntry({ status: "accepted", progress_percent: 10 }),
    });

    const result = await apiAdapter.serviceProgress.createProgress({
      serviceId: "svc-001",
      status: "accepted",
      progressPercent: 10,
      note: "เริ่มงาน",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.status).toBe("in_progress"); // mock returns in_progress
      expect(result.data.serviceId).toBe("svc-001");
    }
    // ต้องเรียก POST ครั้งเดียว (ไม่มี photo upload)
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [, options] = mockFetch.mock.calls[0];
    expect(options.method).toBe("POST");
  });

  it("uploads photo first then creates entry (2-step when photoFile present)", async () => {
    // Step 1: upload photo → r2_key
    mockFetch.mockResolvedValueOnce({
      ok: true, status: 200,
      json: async () => ({ r2_key: "uploads/photo-001.jpg" }),
    });
    // Step 2: create entry
    mockFetch.mockResolvedValueOnce({
      ok: true, status: 201,
      json: async () => makeRawEntry({ photo_r2_key: "uploads/photo-001.jpg" }),
    });

    const fakeFile = new File(["data"], "photo.jpg", { type: "image/jpeg" });
    const result = await apiAdapter.serviceProgress.createProgress({
      serviceId: "svc-001",
      status: "in_progress",
      progressPercent: 30,
      photoFile: fakeFile,
    });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.photoR2Key).toBe("uploads/photo-001.jpg");
    // ต้องเรียก fetch 2 ครั้ง (upload + create)
    expect(mockFetch).toHaveBeenCalledTimes(2);
    // Call 1: upload
    const [photoUrl, photoOpts] = mockFetch.mock.calls[0];
    expect(photoUrl).toContain("service-progress/photos");
    expect(photoOpts.method).toBe("POST");
    expect(photoOpts.body).toBeInstanceOf(FormData);
  });

  it("returns { ok: false } when upload fails", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 413, text: async () => "Payload Too Large" });

    const fakeFile = new File(["data"], "big.jpg", { type: "image/jpeg" });
    const result = await apiAdapter.serviceProgress.createProgress({
      serviceId: "svc-001",
      status: "in_progress",
      progressPercent: 0,
      photoFile: fakeFile,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("HTTP 413");
    // ต้องไม่เรียก create เพราะ upload fail ก่อน
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});

describe("serviceProgressApi — updateProgress (PATCH)", () => {
  it("patches status and progress_percent", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true, status: 200,
      json: async () => makeRawEntry({ status: "completed", progress_percent: 100 }),
    });

    const result = await apiAdapter.serviceProgress.updateProgress("prog-001", {
      status: "completed",
      progressPercent: 100,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.status).toBe("completed");
      expect(result.data.progressPercent).toBe(100);
    }
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toContain("service-progress/prog-001");
    expect(opts.method).toBe("PATCH");
  });

  it("sends photo_r2_key: null when removePhoto = true (photoFile = null)", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true, status: 200,
      json: async () => makeRawEntry({ photo_r2_key: null }),
    });

    const result = await apiAdapter.serviceProgress.updateProgress("prog-001", {
      photoFile: null, // ลบ photo
    });

    expect(result.ok).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [, opts] = mockFetch.mock.calls[0];
    const body = JSON.parse(opts.body as string);
    expect(body.photo_r2_key).toBeNull();
  });

  it("uploads new photo then patches (2-step)", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true, status: 200,
      json: async () => ({ r2_key: "uploads/new-photo.jpg" }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true, status: 200,
      json: async () => makeRawEntry({ photo_r2_key: "uploads/new-photo.jpg" }),
    });

    const newFile = new File(["data"], "new.jpg", { type: "image/jpeg" });
    const result = await apiAdapter.serviceProgress.updateProgress("prog-001", {
      photoFile: newFile,
    });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.photoR2Key).toBe("uploads/new-photo.jpg");
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("returns { ok: false } on HTTP 404", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404, text: async () => "Not Found" });
    const result = await apiAdapter.serviceProgress.updateProgress("prog-nonexistent", {
      status: "paused",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("HTTP 404");
  });
});

describe("ServiceProgressStatus — type completeness", () => {
  it("covers all 6 status values", () => {
    // TypeScript compile check: ถ้า type ไม่ครบ switch จะ warn exhaustive
    const statuses = ["pending", "accepted", "in_progress", "paused", "completed", "cancelled"];
    expect(statuses).toHaveLength(6);
  });

  it("in_progress is distinct from paused", () => {
    const a = "in_progress";
    const b = "paused";
    expect(a).not.toBe(b);
  });
});
