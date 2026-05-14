// ─── LocationPicker.test.tsx — Unit tests for LocationPicker (D90) ───────────
// Sub-CMD-2 Wave 1 — ตรวจสอบ: render input, dropdown ตอนพิมพ์ 2+ ตัวอักษร, geocode call

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LocationPicker } from "@/components/location/LocationPicker";

// ─── Mock getAdapter() ────────────────────────────────────────────────────────

const mockGeocode = jest.fn();
const mockSave = jest.fn();

jest.mock("@/lib/dal", () => ({
  getAdapter: () => ({
    location: {
      geocode: mockGeocode,
      save: mockSave,
    },
  }),
}));

beforeEach(() => {
  mockGeocode.mockReset();
  mockSave.mockReset();
  // Default geocode response
  mockGeocode.mockResolvedValue({
    ok: true,
    data: {
      placeId: "place-001",
      formattedAddress: "สยามพารากอน, กรุงเทพมหานคร",
      lat: 13.7465,
      lng: 100.5347,
    },
  });
});

// ─── LocationPicker tests ─────────────────────────────────────────────────────

describe("LocationPicker", () => {
  it("render input ค้นหาสถานที่", () => {
    render(<LocationPicker />);
    expect(screen.getByPlaceholderText("ค้นหาสถานที่...")).toBeInTheDocument();
  });

  it("ใช้ placeholder ที่ส่งมาแทน default", () => {
    render(<LocationPicker placeholder="เลือกที่อยู่จัดส่ง" />);
    expect(screen.getByPlaceholderText("เลือกที่อยู่จัดส่ง")).toBeInTheDocument();
  });

  it("ไม่แสดง dropdown เมื่อพิมพ์ 1 ตัวอักษร", async () => {
    render(<LocationPicker />);
    await userEvent.type(screen.getByRole("textbox"), "ส");
    // dropdown ไม่ควรแสดง
    expect(screen.queryByRole("button", { name: /สยาม/ })).not.toBeInTheDocument();
  });

  it("แสดง dropdown suggestions เมื่อพิมพ์ 2+ ตัวอักษร", async () => {
    render(<LocationPicker />);
    await userEvent.type(screen.getByRole("textbox"), "สย");
    await waitFor(() => {
      expect(screen.getByText(/สยามพารากอน/)).toBeInTheDocument();
    });
  });

  it("แสดง suggestions ที่ตรงกับ query", async () => {
    render(<LocationPicker />);
    await userEvent.type(screen.getByRole("textbox"), "จตุ");
    await waitFor(() => {
      expect(screen.getByText(/จตุจักร/)).toBeInTheDocument();
      // สยามไม่ควรแสดง
      expect(screen.queryByText(/สยามพารากอน/)).not.toBeInTheDocument();
    });
  });

  it("เรียก geocode เมื่อเลือก suggestion", async () => {
    render(<LocationPicker />);
    await userEvent.type(screen.getByRole("textbox"), "สย");

    await waitFor(() => {
      expect(screen.getByText(/สยามพารากอน/)).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText(/สยามพารากอน/));

    await waitFor(() => {
      expect(mockGeocode).toHaveBeenCalledWith("place-001");
    });
  });

  it("แสดงข้อมูลสถานที่ที่เลือก หลัง geocode สำเร็จ", async () => {
    render(<LocationPicker />);
    await userEvent.type(screen.getByRole("textbox"), "สย");

    await waitFor(() => {
      expect(screen.getAllByText(/สยามพารากอน/).length).toBeGreaterThan(0);
    });

    // คลิก suggestion แรกใน dropdown
    const suggestions = screen.getAllByText(/สยามพารากอน/);
    await userEvent.click(suggestions[0]);

    await waitFor(() => {
      // แสดง formattedAddress ในการ์ด (อาจมีหลาย element — ใช้ getAllByText)
      expect(screen.getAllByText(/สยามพารากอน/).length).toBeGreaterThan(0);
      // แสดงพิกัด (อาจมี toFixed(4) และ toFixed(6) ทั้งคู่ — ใช้ getAllByText)
      expect(screen.getAllByText(/13\.74/).length).toBeGreaterThan(0);
    });
  });

  it("เรียก onSelected callback พร้อม geocode result", async () => {
    const onSelected = jest.fn();
    render(<LocationPicker onSelected={onSelected} />);
    await userEvent.type(screen.getByRole("textbox"), "สย");

    await waitFor(() => screen.getByText(/สยามพารากอน/));
    await userEvent.click(screen.getByText(/สยามพารากอน/));

    await waitFor(() => {
      expect(onSelected).toHaveBeenCalledWith(
        expect.objectContaining({ placeId: "place-001", lat: 13.7465 })
      );
    });
  });

  it("แสดง error เมื่อ geocode ล้มเหลว", async () => {
    mockGeocode.mockResolvedValue({
      ok: false,
      error: "Geocode API ไม่พร้อมใช้งาน",
    });

    render(<LocationPicker />);
    await userEvent.type(screen.getByRole("textbox"), "สย");

    await waitFor(() => screen.getByText(/สยามพารากอน/));
    await userEvent.click(screen.getByText(/สยามพารากอน/));

    await waitFor(() => {
      expect(screen.getByText("Geocode API ไม่พร้อมใช้งาน")).toBeInTheDocument();
    });
  });

  it("แสดงปุ่มบันทึกสถานที่ เมื่อ showSave = true (default) และมีสถานที่เลือกแล้ว", async () => {
    render(<LocationPicker />);
    await userEvent.type(screen.getByRole("textbox"), "สย");
    await waitFor(() => screen.getByText(/สยามพารากอน/));
    await userEvent.click(screen.getByText(/สยามพารากอน/));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /บันทึกสถานที่/ })).toBeInTheDocument();
    });
  });

  it("ไม่แสดงปุ่มบันทึก เมื่อ showSave = false", async () => {
    render(<LocationPicker showSave={false} />);
    await userEvent.type(screen.getByRole("textbox"), "สย");
    await waitFor(() => screen.getByText(/สยามพารากอน/));
    await userEvent.click(screen.getByText(/สยามพารากอน/));

    await waitFor(() => {
      expect(screen.queryByRole("button", { name: /บันทึกสถานที่/ })).not.toBeInTheDocument();
    });
  });
});
