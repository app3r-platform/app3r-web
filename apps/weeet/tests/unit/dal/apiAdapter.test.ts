/**
 * tests/unit/dal/apiAdapter.test.ts
 * Sub-CMD-2 Wave 1 — F1 fix verification
 *
 * ทดสอบ: apiFetch throw Error เมื่อ HTTP error
 * → apiCall ต้อง return { ok: false, error: "..." } ไม่ใช่ { ok: true, data: {ok:false} }
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

// Import after mocks
import { apiAdapter } from "@/lib/dal/apiAdapter";

beforeEach(() => {
  jest.clearAllMocks();
  sessionStorageMock.getItem.mockReturnValue(null);
});

describe("apiAdapter — F1 fix: HTTP error propagation", () => {
  describe("jobAssign.getAssignedJobs", () => {
    it("returns { ok: false } when API responds with HTTP 404", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => "Not Found",
      });

      const result = await apiAdapter.jobAssign.getAssignedJobs("tech-001");

      // F1 fix: ต้องได้ { ok: false } ไม่ใช่ { ok: true, data: { ok: false } }
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("HTTP 404");
      }
    });

    it("returns { ok: false } when API responds with HTTP 500", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => "Internal Server Error",
      });

      const result = await apiAdapter.jobAssign.getAssignedJobs("tech-001");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("HTTP 500");
      }
    });

    it("returns { ok: true } with mapped data on success", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [
          {
            id: "job-001",
            technician_id: "tech-001",
            status: "assigned",
            scheduled_at: "2026-05-14T09:00:00Z",
            customer_name: "สมชาย",
          },
        ],
      });

      const result = await apiAdapter.jobAssign.getAssignedJobs("tech-001");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toHaveLength(1);
        expect(result.data[0].jobId).toBe("job-001");
        expect(result.data[0].technicianId).toBe("tech-001");
        expect(result.data[0].status).toBe("assigned");
        expect(result.data[0].customerName).toBe("สมชาย");
      }
    });

    it("sends Authorization header when token exists in sessionStorage", async () => {
      sessionStorageMock.getItem.mockReturnValue(
        JSON.stringify({ token: "test-jwt-token" })
      );
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [],
      });

      await apiAdapter.jobAssign.getAssignedJobs("tech-001");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer test-jwt-token",
          }),
        })
      );
    });
  });

  describe("technician.updateProfile", () => {
    it("returns { ok: false } when API responds with HTTP 403", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        text: async () => "Forbidden",
      });

      const result = await apiAdapter.technician.updateProfile("tech-001", { name: "ใหม่" });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("HTTP 403");
      }
    });

    it("returns { ok: true } on success", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      const result = await apiAdapter.technician.updateProfile("tech-001", { name: "ใหม่" });

      expect(result.ok).toBe(true);
    });
  });
});
