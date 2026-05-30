// ─── LocationPicker.test.tsx — Unit tests (W-Round-1 Remediate) ──────────────
// Cascade จังหวัด→อำเภอ→ตำบล + near-me (ซ่อนเมื่อไม่ล็อกอิน)

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LocationPicker } from "@/components/location/LocationPicker";

// ─── Mock useAuth() เพื่อคุมสถานะล็อกอิน ────────────────────────────────────
const mockUseAuth = jest.fn();
jest.mock("@/lib/use-auth", () => ({ useAuth: () => mockUseAuth() }));

beforeEach(() => {
  mockUseAuth.mockReset();
});

describe("LocationPicker (cascade)", () => {
  it("render dropdown ครบ 3 ชั้น — จังหวัด/อำเภอ/ตำบล", () => {
    mockUseAuth.mockReturnValue(null);
    render(<LocationPicker />);
    expect(screen.getByLabelText("จังหวัด")).toBeInTheDocument();
    expect(screen.getByLabelText("อำเภอ")).toBeInTheDocument();
    expect(screen.getByLabelText("ตำบล")).toBeInTheDocument();
  });

  it("อำเภอ/ตำบล disable ก่อนเลือกจังหวัด", () => {
    mockUseAuth.mockReturnValue(null);
    render(<LocationPicker />);
    expect(screen.getByLabelText("อำเภอ")).toBeDisabled();
    expect(screen.getByLabelText("ตำบล")).toBeDisabled();
  });

  it("เลือกจังหวัด → อำเภอ populate + enable", async () => {
    mockUseAuth.mockReturnValue(null);
    render(<LocationPicker />);
    await userEvent.selectOptions(screen.getByLabelText("จังหวัด"), "เชียงใหม่");
    expect(screen.getByLabelText("อำเภอ")).toBeEnabled();
    expect(screen.getByRole("option", { name: "สันทราย" })).toBeInTheDocument();
  });

  it("เลือกครบ 3 ชั้น → เรียก onSelected พร้อมค่าที่ถูกต้อง", async () => {
    mockUseAuth.mockReturnValue(null);
    const onSelected = jest.fn();
    render(<LocationPicker onSelected={onSelected} />);
    await userEvent.selectOptions(screen.getByLabelText("จังหวัด"), "ขอนแก่น");
    await userEvent.selectOptions(screen.getByLabelText("อำเภอ"), "ชุมแพ");
    await userEvent.selectOptions(screen.getByLabelText("ตำบล"), "โนนหัน");
    expect(onSelected).toHaveBeenCalledWith({
      province: "ขอนแก่น",
      district: "ชุมแพ",
      subdistrict: "โนนหัน",
    });
  });

  it("เปลี่ยนจังหวัด → reset อำเภอ/ตำบล", async () => {
    mockUseAuth.mockReturnValue(null);
    render(<LocationPicker />);
    await userEvent.selectOptions(screen.getByLabelText("จังหวัด"), "ชลบุรี");
    await userEvent.selectOptions(screen.getByLabelText("อำเภอ"), "ศรีราชา");
    await userEvent.selectOptions(screen.getByLabelText("จังหวัด"), "อุบลราชธานี");
    expect(screen.getByLabelText<HTMLSelectElement>("อำเภอ").value).toBe("");
    expect(screen.getByLabelText("ตำบล")).toBeDisabled();
  });

  it("ปุ่ม near-me ซ่อนเมื่อไม่ล็อกอิน", () => {
    mockUseAuth.mockReturnValue(null);
    render(<LocationPicker />);
    expect(screen.queryByRole("button", { name: /ตำแหน่งใกล้ฉัน/ })).not.toBeInTheDocument();
  });

  it("ปุ่ม near-me แสดงเมื่อล็อกอิน", () => {
    mockUseAuth.mockReturnValue({ id: "u1", name: "U", role: "weeeu" });
    render(<LocationPicker />);
    expect(screen.getByRole("button", { name: /ตำแหน่งใกล้ฉัน/ })).toBeInTheDocument();
  });
});
