/**
 * ServicePhotoUpload.test.tsx
 * Sub-CMD-2 Wave 1 — ทดสอบ F1 fix: key={photo.url} + removePhoto(url)
 *
 * Coverage:
 *  - F1: thumbnails render ด้วย URL เป็น key (ไม่ใช่ index)
 *  - removePhoto ลบรูปถูกต้องตาม URL (ไม่ใช่ index)
 */
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock apiFetch ก่อน import component
jest.mock("@/lib/api-client", () => ({
  apiFetch: jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ url: "https://cdn.example.com/uploaded.jpg" }),
  }),
}));

import ServicePhotoUpload from "@/components/upload/ServicePhotoUpload";

describe("ServicePhotoUpload — F1: key=url + removePhoto(url)", () => {
  const URLS = [
    "https://cdn.example.com/photo-A.jpg",
    "https://cdn.example.com/photo-B.jpg",
    "https://cdn.example.com/photo-C.jpg",
  ];

  it("renders all existing URLs as thumbnails", () => {
    render(<ServicePhotoUpload existingUrls={URLS} />);
    const imgs = screen.getAllByRole("img");
    expect(imgs).toHaveLength(3);
    expect(imgs[0]).toHaveAttribute("src", URLS[0]);
    expect(imgs[1]).toHaveAttribute("src", URLS[1]);
    expect(imgs[2]).toHaveAttribute("src", URLS[2]);
  });

  it("removePhoto(url) ลบรูปแรกโดยไม่กระทบรูปอื่น (F1 fix)", async () => {
    const onUpload = jest.fn();
    render(<ServicePhotoUpload existingUrls={URLS} onUpload={onUpload} />);

    // ก่อนลบ — ต้องมี 3 รูป
    expect(screen.getAllByRole("img")).toHaveLength(3);

    // Click ปุ่ม × ของรูปแรก (photo-A)
    // ปุ่ม × ทั้งหมดอยู่ใน hidden group-hover — ต้องใช้ getByRole แบบ index
    const removeButtons = screen.getAllByRole("button", { name: "×" });
    await userEvent.click(removeButtons[0]);

    // หลังลบ — ต้องเหลือ 2 รูป และรูปแรกที่เหลือต้องเป็น photo-B
    await waitFor(() => {
      const imgs = screen.getAllByRole("img");
      expect(imgs).toHaveLength(2);
      expect(imgs[0]).toHaveAttribute("src", URLS[1]); // photo-B
      expect(imgs[1]).toHaveAttribute("src", URLS[2]); // photo-C
    });

    // onUpload callback ต้องได้รับ URL list ที่ถูกต้อง (ไม่มี photo-A)
    expect(onUpload).toHaveBeenCalledWith([URLS[1], URLS[2]]);
  });

  it("removePhoto ลบรูปกลางโดยไม่กระทบรูปหัวและท้าย", async () => {
    const onUpload = jest.fn();
    render(<ServicePhotoUpload existingUrls={URLS} onUpload={onUpload} />);

    // Click × ของรูปที่ 2 (photo-B, index=1)
    const removeButtons = screen.getAllByRole("button", { name: "×" });
    await userEvent.click(removeButtons[1]);

    await waitFor(() => {
      const imgs = screen.getAllByRole("img");
      expect(imgs).toHaveLength(2);
      expect(imgs[0]).toHaveAttribute("src", URLS[0]); // photo-A ยังอยู่
      expect(imgs[1]).toHaveAttribute("src", URLS[2]); // photo-C ยังอยู่
    });

    expect(onUpload).toHaveBeenCalledWith([URLS[0], URLS[2]]);
  });

  it("แสดง upload zone เมื่อจำนวนรูปต่ำกว่า maxFiles", () => {
    render(<ServicePhotoUpload existingUrls={[URLS[0]]} maxFiles={5} />);
    expect(screen.getByRole("button", { name: /แตะเพื่อเลือกรูป/i })).toBeInTheDocument();
  });

  it("ซ่อน upload zone เมื่อจำนวนรูปเต็ม maxFiles", () => {
    render(<ServicePhotoUpload existingUrls={URLS} maxFiles={3} />);
    expect(screen.queryByRole("button", { name: /แตะเพื่อเลือกรูป/i })).not.toBeInTheDocument();
  });
});
