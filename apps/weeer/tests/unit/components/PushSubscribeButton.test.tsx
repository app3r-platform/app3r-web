/**
 * PushSubscribeButton.test.tsx
 * Sub-CMD-2 Wave 1 — ทดสอบ F5 fix: type="button" บน unsubscribe button
 *
 * Coverage:
 *  - F5: unsubscribe button มี type="button" (ป้องกัน form submit)
 *  - เพิ่มเติม: subscribe button render ถูกต้องใน idle state
 *  - เพิ่มเติม: "unsupported" state เมื่อ browser ไม่รองรับ
 */
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";

// Mock apiFetch
jest.mock("@/lib/api-client", () => ({
  apiFetch: jest.fn().mockResolvedValue({ ok: true }),
}));

import PushSubscribeButton from "@/components/push/PushSubscribeButton";

// ── Helpers ───────────────────────────────────────────────────────────────────

function mockNotificationSupported() {
  Object.defineProperty(window, "Notification", {
    value: { permission: "default", requestPermission: jest.fn() },
    configurable: true,
    writable: true,
  });
  Object.defineProperty(window, "PushManager", {
    value: class MockPushManager {},
    configurable: true,
    writable: true,
  });
}

function mockServiceWorker(hasExistingSubscription: boolean) {
  const mockSub = hasExistingSubscription
    ? {
        unsubscribe: jest.fn().mockResolvedValue(true),
        endpoint: "https://mock.push.endpoint/abc",
        toJSON: () => ({}),
      }
    : null;

  Object.defineProperty(navigator, "serviceWorker", {
    value: {
      ready: Promise.resolve({
        pushManager: {
          getSubscription: jest.fn().mockResolvedValue(mockSub),
          subscribe: jest.fn().mockResolvedValue({
            toJSON: () => ({}),
            endpoint: "https://mock.push.endpoint/new",
          }),
        },
      }),
      register: jest.fn().mockResolvedValue({}),
    },
    configurable: true,
    writable: true,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────────

describe("PushSubscribeButton — F5: unsubscribe button type=button", () => {
  it("unsubscribe button มี type='button' (F5 fix)", async () => {
    mockNotificationSupported();
    mockServiceWorker(true); // มี subscription อยู่แล้ว → status = subscribed

    render(<PushSubscribeButton />);

    // รอ useEffect ทำงาน — status เปลี่ยนเป็น subscribed
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "ปิด" }),
      ).toBeInTheDocument();
    });

    const unsubBtn = screen.getByRole("button", { name: "ปิด" });
    // F5 fix: ต้องมี type="button" เพื่อป้องกันการ submit form โดยไม่ตั้งใจ
    expect(unsubBtn).toHaveAttribute("type", "button");
  });

  it("แสดง 'การแจ้งเตือนเปิดใช้งานอยู่' เมื่อ status=subscribed", async () => {
    mockNotificationSupported();
    mockServiceWorker(true);

    render(<PushSubscribeButton />);

    await waitFor(() => {
      expect(
        screen.getByText("การแจ้งเตือนเปิดใช้งานอยู่"),
      ).toBeInTheDocument();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("PushSubscribeButton — idle state", () => {
  it("แสดง 'เปิดใช้งานการแจ้งเตือน' ใน idle state", async () => {
    mockNotificationSupported();
    mockServiceWorker(false); // ไม่มี subscription

    render(<PushSubscribeButton />);

    // รอ useEffect
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /เปิดใช้งานการแจ้งเตือน/i }),
      ).toBeInTheDocument();
    });
  });

  it("subscribe button ไม่ disabled ใน idle state", async () => {
    mockNotificationSupported();
    mockServiceWorker(false);

    render(<PushSubscribeButton />);

    await waitFor(() => {
      const btn = screen.getByRole("button", { name: /เปิดใช้งานการแจ้งเตือน/i });
      expect(btn).not.toBeDisabled();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("PushSubscribeButton — unsupported state", () => {
  it("แสดง 'เบราว์เซอร์นี้ไม่รองรับ' เมื่อ Notification API ไม่มี", () => {
    // ลบ Notification API
    const originalNotification = window.Notification;
    // @ts-expect-error — ตั้งใจลบเพื่อ test
    delete window.Notification;

    render(<PushSubscribeButton />);

    expect(
      screen.getByText(/ไม่รองรับการแจ้งเตือน/i),
    ).toBeInTheDocument();

    // restore
    window.Notification = originalNotification;
  });
});
