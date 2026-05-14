/**
 * LocationPicker.test.tsx
 * Sub-CMD-2 Wave 1 — ทดสอบ F2/F3/F4 fixes
 *
 * Coverage:
 *  - F2: Nominatim fetch ส่ง User-Agent header (OSM ToS)
 *  - F3: บันทึกโดยไม่มี GPS — API payload ไม่รวม lat/lng (ป้องกัน null-island)
 *  - F4: unmount ระหว่าง detect GPS — ไม่เกิด setState error
 */
import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ── Mock apiFetch ─────────────────────────────────────────────────────────────
const mockApiFetch = jest.fn().mockResolvedValue({ ok: true });
jest.mock("@/lib/api-client", () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch(...args),
}));

// ── Mock global fetch (Nominatim) ─────────────────────────────────────────────
const mockFetch = jest.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ display_name: "กรุงเทพมหานคร, ประเทศไทย" }),
});
global.fetch = mockFetch;

import LocationPicker from "@/components/location/LocationPicker";

// ── Geolocation mock helpers ───────────────────────────────────────────────────
type GeoSuccessCb = (pos: GeolocationPosition) => void;
type GeoErrorCb = (err: GeolocationPositionError) => void;

let geoSuccessCb: GeoSuccessCb | null = null;
let geoErrorCb: GeoErrorCb | null = null;

const MOCK_POSITION: GeolocationPosition = {
  coords: {
    latitude: 13.7563,
    longitude: 100.5018,
    accuracy: 10,
    altitude: null,
    altitudeAccuracy: null,
    heading: null,
    speed: null,
  } as GeolocationCoordinates,
  timestamp: Date.now(),
};

beforeEach(() => {
  jest.clearAllMocks();
  geoSuccessCb = null;
  geoErrorCb = null;

  // Mock navigator.geolocation
  Object.defineProperty(navigator, "geolocation", {
    configurable: true,
    value: {
      getCurrentPosition: jest.fn((success: GeoSuccessCb, error: GeoErrorCb) => {
        geoSuccessCb = success;
        geoErrorCb = error;
      }),
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("LocationPicker — F2: Nominatim User-Agent header", () => {
  it("ส่ง User-Agent ถูกต้องไป Nominatim (F2 fix)", async () => {
    render(<LocationPicker />);

    // Click ตรวจจับตำแหน่ง
    await userEvent.click(screen.getByRole("button", { name: /ตรวจจับตำแหน่ง/i }));

    // Fire geolocation success callback
    await act(async () => {
      geoSuccessCb?.(MOCK_POSITION);
      // รอ async fetch ใน callback
      await Promise.resolve();
    });

    // Nominatim ต้องถูกเรียกพร้อม User-Agent header
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("nominatim.openstreetmap.org"),
        expect.objectContaining({
          headers: expect.objectContaining({
            "User-Agent": "App3R-WeeeR/1.0 (contact@app3r.co)",
          }),
        }),
      );
    });
  });

  it("Nominatim URL มี lat/lon จาก GPS", async () => {
    render(<LocationPicker />);
    await userEvent.click(screen.getByRole("button", { name: /ตรวจจับตำแหน่ง/i }));

    await act(async () => {
      geoSuccessCb?.(MOCK_POSITION);
      await Promise.resolve();
    });

    await waitFor(() => {
      const fetchUrl = (mockFetch.mock.calls[0][0] as string);
      expect(fetchUrl).toContain("lat=13.7563");
      expect(fetchUrl).toContain("lon=100.5018");
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("LocationPicker — F3: null-island guard", () => {
  it("บันทึกโดยพิมพ์ที่อยู่เอง (ไม่ detect GPS) — payload ไม่มี lat/lng (F3 fix)", async () => {
    render(<LocationPicker initialLocation={{ address: "", serviceAreaKm: 20 }} />);

    // พิมพ์ที่อยู่เอง (ไม่กด GPS)
    const textarea = screen.getByPlaceholderText(/สุขุมวิท/i);
    await userEvent.clear(textarea);
    await userEvent.type(textarea, "123 ถ.ทดสอบ กรุงเทพฯ");

    // กด บันทึกที่ตั้ง
    const saveBtn = screen.getByRole("button", { name: /บันทึกที่ตั้ง/i });
    await userEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalled();
    });

    // ตรวจ payload — ต้องไม่มี lat/lng (ป้องกัน null-island)
    const call = mockApiFetch.mock.calls[0];
    const body = JSON.parse((call[1] as RequestInit).body as string) as Record<string, unknown>;

    expect(body).not.toHaveProperty("lat");
    expect(body).not.toHaveProperty("lng");
    expect(body).toHaveProperty("address", "123 ถ.ทดสอบ กรุงเทพฯ");
    expect(body).toHaveProperty("serviceAreaKm");
  });

  it("บันทึกหลัง detect GPS — payload มี lat/lng ที่ถูกต้อง", async () => {
    render(<LocationPicker />);

    // Click GPS แล้วยิง success callback
    await userEvent.click(screen.getByRole("button", { name: /ตรวจจับตำแหน่ง/i }));
    await act(async () => {
      geoSuccessCb?.(MOCK_POSITION);
      await Promise.resolve();
    });

    // รอ address input อัปเดตจาก Nominatim
    await waitFor(() => {
      const textarea = screen.getByRole("textbox");
      expect((textarea as HTMLTextAreaElement).value).toBeTruthy();
    });

    // กด บันทึก
    await userEvent.click(screen.getByRole("button", { name: /บันทึกที่ตั้ง/i }));

    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalled();
    });

    const body = JSON.parse(
      (mockApiFetch.mock.calls[0][1] as RequestInit).body as string
    ) as Record<string, unknown>;

    // ถ้ามี GPS — payload ต้องมี lat/lng ที่ถูกต้อง
    expect(body).toHaveProperty("lat", MOCK_POSITION.coords.latitude);
    expect(body).toHaveProperty("lng", MOCK_POSITION.coords.longitude);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("LocationPicker — F4: mounted ref guard (no setState after unmount)", () => {
  it("unmount ระหว่าง detect GPS ไม่ throw error (F4 fix)", async () => {
    // Spy console.error เพื่อตรวจว่าไม่มี React setState warning
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const { unmount } = render(<LocationPicker />);

    // Click detect — geolocation callback ยังไม่ fire
    await userEvent.click(screen.getByRole("button", { name: /ตรวจจับตำแหน่ง/i }));

    // Unmount component ก่อน callback จะ fire
    unmount();

    // ยิง success callback หลัง unmount — mountedRef.current = false
    // ดังนั้น setState จะไม่ถูกเรียก
    await act(async () => {
      geoSuccessCb?.(MOCK_POSITION);
      await Promise.resolve();
    });

    // ไม่ควรมี "Can't perform a React state update on an unmounted component" error
    const stateUpdateWarnings = consoleSpy.mock.calls.filter(
      (call) =>
        typeof call[0] === "string" &&
        call[0].includes("unmounted"),
    );
    expect(stateUpdateWarnings).toHaveLength(0);

    consoleSpy.mockRestore();
  });
});
