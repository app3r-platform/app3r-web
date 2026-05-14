/**
 * tests/unit/components/LiveLocationShareControl.test.tsx
 * Sub-CMD-2 Wave 1 — F5 fix verification
 *
 * ทดสอบ: ปุ่ม "ปฏิเสธ" ใน PDPA consent dialog
 * → ต้องมี onClick handler
 * → เมื่อคลิก ต้อง dismiss dialog (ซ่อน consent UI)
 */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { LiveLocationShareControl } from "@/components/live-location/LiveLocationShareControl";

// Mock useLiveLocation hook
const mockGrantConsent = jest.fn();
const mockRevokeConsent = jest.fn();
const mockStartSharing = jest.fn();
const mockStopSharing = jest.fn();

const defaultHookReturn = {
  state: "idle" as const,
  lastLat: null,
  lastLng: null,
  lastUpdated: null,
  error: null,
  hasConsent: false, // Default: no consent → shows consent dialog
  emitCount: 0,
  startSharing: mockStartSharing,
  stopSharing: mockStopSharing,
  grantConsent: mockGrantConsent,
  revokeConsent: mockRevokeConsent,
};

jest.mock("@/lib/utils/live-location", () => ({
  useLiveLocation: jest.fn(() => defaultHookReturn),
}));

import { useLiveLocation } from "@/lib/utils/live-location";
const mockUseLiveLocation = useLiveLocation as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockGrantConsent.mockResolvedValue(undefined);
  mockRevokeConsent.mockResolvedValue(undefined);
});

describe("LiveLocationShareControl — F5 fix: ปุ่ม 'ปฏิเสธ' onClick", () => {
  describe("PDPA consent dialog (hasConsent = false)", () => {
    beforeEach(() => {
      mockUseLiveLocation.mockReturnValue({ ...defaultHookReturn, hasConsent: false });
    });

    it("แสดง consent dialog เมื่อ hasConsent = false", () => {
      render(<LiveLocationShareControl serviceId="svc-001" technicianId="tech-001" />);

      expect(screen.getByText("ยินยอมแชร์ตำแหน่ง (PDPA)")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /ยินยอม/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /ปฏิเสธ/i })).toBeInTheDocument();
    });

    it("F5 fix: ปุ่ม 'ปฏิเสธ' มี onClick — ไม่ใช่ dead button", () => {
      render(<LiveLocationShareControl serviceId="svc-001" technicianId="tech-001" />);

      const declineButton = screen.getByRole("button", { name: /ปฏิเสธ/i });
      expect(declineButton).toBeInTheDocument();

      // ต้องไม่ throw error เมื่อคลิก
      expect(() => fireEvent.click(declineButton)).not.toThrow();
    });

    it("F5 fix: คลิก 'ปฏิเสธ' → consent dialog ซ่อนหายไป (declined state)", () => {
      render(<LiveLocationShareControl serviceId="svc-001" technicianId="tech-001" />);

      expect(screen.getByText("ยินยอมแชร์ตำแหน่ง (PDPA)")).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: /ปฏิเสธ/i }));

      // หลัง decline: consent dialog ต้องหายไป
      expect(screen.queryByText("ยินยอมแชร์ตำแหน่ง (PDPA)")).not.toBeInTheDocument();
    });

    it("คลิก 'ยินยอม' → เรียก grantConsent()", async () => {
      render(<LiveLocationShareControl serviceId="svc-001" technicianId="tech-001" />);

      fireEvent.click(screen.getByRole("button", { name: /ยินยอม/i }));

      await waitFor(() => {
        expect(mockGrantConsent).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("Location share control (hasConsent = true)", () => {
    beforeEach(() => {
      mockUseLiveLocation.mockReturnValue({
        ...defaultHookReturn,
        hasConsent: true,
        state: "idle",
      });
    });

    it("แสดง share control (ไม่แสดง consent dialog) เมื่อ hasConsent = true", () => {
      render(<LiveLocationShareControl serviceId="svc-001" technicianId="tech-001" />);

      expect(screen.queryByText("ยินยอมแชร์ตำแหน่ง (PDPA)")).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: /เริ่มแชร์ตำแหน่ง/i })).toBeInTheDocument();
    });

    it("คลิก 'เริ่มแชร์' → เรียก startSharing()", () => {
      render(<LiveLocationShareControl serviceId="svc-001" technicianId="tech-001" />);

      fireEvent.click(screen.getByRole("button", { name: /เริ่มแชร์ตำแหน่ง/i }));
      expect(mockStartSharing).toHaveBeenCalledTimes(1);
    });

    it("แสดงปุ่ม 'หยุดแชร์' เมื่อ state = active", () => {
      mockUseLiveLocation.mockReturnValue({
        ...defaultHookReturn,
        hasConsent: true,
        state: "active",
        lastLat: 13.75,
        lastLng: 100.5,
        emitCount: 3,
      });

      render(<LiveLocationShareControl serviceId="svc-001" technicianId="tech-001" />);

      expect(screen.getByRole("button", { name: /หยุดแชร์ตำแหน่ง/i })).toBeInTheDocument();
      expect(screen.getByText(/กำลังแชร์ตำแหน่ง/i)).toBeInTheDocument();
    });

    it("คลิก 'หยุดแชร์' → เรียก stopSharing()", () => {
      mockUseLiveLocation.mockReturnValue({
        ...defaultHookReturn,
        hasConsent: true,
        state: "active",
      });

      render(<LiveLocationShareControl serviceId="svc-001" technicianId="tech-001" />);

      fireEvent.click(screen.getByRole("button", { name: /หยุดแชร์ตำแหน่ง/i }));
      expect(mockStopSharing).toHaveBeenCalledTimes(1);
    });

    it("แสดง error message เมื่อ state = error", () => {
      mockUseLiveLocation.mockReturnValue({
        ...defaultHookReturn,
        hasConsent: true,
        state: "error",
        error: "Geolocation error: timeout",
      });

      render(<LiveLocationShareControl serviceId="svc-001" technicianId="tech-001" />);

      expect(screen.getByText(/Geolocation error: timeout/i)).toBeInTheDocument();
    });
  });
});
