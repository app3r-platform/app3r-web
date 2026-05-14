/**
 * tests/unit/utils/live-location.test.ts
 * Sub-CMD-2 Wave 1 — F3 fix verification
 *
 * ทดสอบ: emitCurrentLocation error handler
 * → ต้องเรียก stopInterval() โดยตรง (ไม่ใช่ stale stopSharing)
 * → activeRef.current ต้องเป็น false หลัง geolocation error
 */
import { renderHook, act, waitFor } from "@testing-library/react";
import { useLiveLocation } from "@/lib/utils/live-location";

// Mock getAdapter + DAL
const mockGetConsentStatus = jest.fn();
const mockEmitLocation = jest.fn();
const mockSaveConsentStatus = jest.fn();

jest.mock("@/lib/dal", () => ({
  getAdapter: jest.fn(() => ({
    liveLocation: {
      getConsentStatus: mockGetConsentStatus,
      emitLocation: mockEmitLocation,
      saveConsentStatus: mockSaveConsentStatus,
    },
  })),
}));

// Mock Geolocation API
const mockGetCurrentPosition = jest.fn();
const mockGeolocation = { getCurrentPosition: mockGetCurrentPosition };

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  // Default: consent granted
  mockGetConsentStatus.mockResolvedValue({ ok: true, data: true });
  mockEmitLocation.mockResolvedValue({ ok: true, data: undefined });
  mockSaveConsentStatus.mockResolvedValue({ ok: true, data: undefined });

  Object.defineProperty(navigator, "geolocation", {
    value: mockGeolocation,
    writable: true,
    configurable: true,
  });
});

afterEach(() => {
  jest.useRealTimers();
});

describe("useLiveLocation — F3 fix: geolocation error handler", () => {
  it("starts in idle state", async () => {
    const { result } = renderHook(() =>
      useLiveLocation({ serviceId: "svc-001", technicianId: "tech-001" })
    );
    expect(result.current.state).toBe("idle");
  });

  it("loads consent status on mount", async () => {
    renderHook(() =>
      useLiveLocation({ serviceId: "svc-001", technicianId: "tech-001" })
    );
    await waitFor(() => {
      expect(mockGetConsentStatus).toHaveBeenCalledWith("tech-001");
    });
  });

  it("F3 fix: geolocation error in emitCurrentLocation sets state to error and stops interval", async () => {
    // Setup: consent granted, position request in startSharing succeeds first
    let emitPositionSuccessCallback: PositionCallback | null = null;
    let emitPositionErrorCallback: PositionErrorCallback | null = null;

    mockGetCurrentPosition.mockImplementation(
      (success: PositionCallback, error: PositionErrorCallback) => {
        emitPositionSuccessCallback = success;
        emitPositionErrorCallback = error;
      }
    );

    const { result } = renderHook(() =>
      useLiveLocation({ serviceId: "svc-001", technicianId: "tech-001" })
    );

    // Wait for consent to load
    await waitFor(() => expect(result.current.hasConsent).toBe(true));

    // Start sharing — triggers requesting state + geolocation permission check
    act(() => {
      result.current.startSharing();
    });

    expect(result.current.state).toBe("requesting");

    // Simulate permission granted → state becomes active
    act(() => {
      emitPositionSuccessCallback!({
        coords: { latitude: 13.75, longitude: 100.5, accuracy: 5 },
      } as GeolocationPosition);
    });

    await waitFor(() => expect(result.current.state).toBe("active"));

    // Now simulate geolocation error during emission
    // Reset mock to capture next emitCurrentLocation call
    mockGetCurrentPosition.mockImplementation(
      (_success: PositionCallback, error: PositionErrorCallback) => {
        error({ message: "Geolocation unavailable", code: 2 } as GeolocationPositionError);
      }
    );

    // Advance timer to trigger interval emit
    act(() => {
      jest.advanceTimersByTime(5_000);
    });

    await waitFor(() => {
      expect(result.current.state).toBe("error");
    });

    expect(result.current.error).toContain("Geolocation error");
  });

  it("grantConsent saves consent and sets hasConsent true", async () => {
    mockGetConsentStatus.mockResolvedValue({ ok: true, data: false });

    const { result } = renderHook(() =>
      useLiveLocation({ serviceId: "svc-001", technicianId: "tech-001" })
    );

    await waitFor(() => expect(result.current.hasConsent).toBe(false));

    await act(async () => {
      await result.current.grantConsent();
    });

    expect(mockSaveConsentStatus).toHaveBeenCalledWith("tech-001", true);
    expect(result.current.hasConsent).toBe(true);
  });

  it("revokeConsent saves consent false and stops sharing", async () => {
    const { result } = renderHook(() =>
      useLiveLocation({ serviceId: "svc-001", technicianId: "tech-001" })
    );

    await waitFor(() => expect(result.current.hasConsent).toBe(true));

    await act(async () => {
      await result.current.revokeConsent();
    });

    expect(mockSaveConsentStatus).toHaveBeenCalledWith("tech-001", false);
    expect(result.current.hasConsent).toBe(false);
    expect(result.current.state).toBe("idle");
  });
});
