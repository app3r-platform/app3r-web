"use client";
// ── PushSubscribeButton — D-2 Push Notification Subscribe ─────────────────────
// WeeeR: สมัครรับการแจ้งเตือน (Push Notification) ผ่าน Web Push API
// POST /api/v1/push/subscribe → บันทึก FCM token หรือ VAPID subscription

import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api-client";

type PushStatus = "idle" | "loading" | "subscribed" | "denied" | "error" | "unsupported";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export default function PushSubscribeButton() {
  const [status, setStatus] = useState<PushStatus>("idle");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setStatus("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }
    // ตรวจว่า subscribe แล้วหรือยัง
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => {
        if (sub) setStatus("subscribed");
      })
      .catch(() => {/* ignore */});
  }, []);

  async function handleSubscribe() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      setMessage("เบราว์เซอร์ไม่รองรับการแจ้งเตือน");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      // ขอสิทธิ์
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        setMessage("กรุณาอนุญาตการแจ้งเตือนในเบราว์เซอร์");
        return;
      }

      // ลงทะเบียน Service Worker + Web Push subscription
      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: VAPID_PUBLIC_KEY
          ? (urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource)
          : undefined,
      });

      // บันทึก subscription ไป backend
      const res = await apiFetch("/api/v1/push/subscribe", {
        method: "POST",
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          platform: "web",
          role: "weeer",
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      setStatus("subscribed");
      setMessage("เปิดใช้การแจ้งเตือนสำเร็จ");
    } catch (e) {
      setStatus("error");
      setMessage(e instanceof Error ? e.message : "เกิดข้อผิดพลาด — กรุณาลองอีกครั้ง");
    }
  }

  async function handleUnsubscribe() {
    setStatus("loading");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
        await apiFetch("/api/v1/push/unsubscribe", {
          method: "POST",
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
      }
      setStatus("idle");
      setMessage("ปิดการแจ้งเตือนแล้ว");
    } catch {
      setStatus("error");
      setMessage("ไม่สามารถปิดการแจ้งเตือนได้");
    }
  }

  if (status === "unsupported") {
    return (
      <div className="text-xs text-gray-400 bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
        🔔 เบราว์เซอร์นี้ไม่รองรับการแจ้งเตือน
      </div>
    );
  }

  if (status === "subscribed") {
    return (
      <div className="flex items-center justify-between bg-green-50 rounded-xl px-4 py-3 border border-green-100">
        <div className="flex items-center gap-2">
          <span className="text-green-600 text-lg">🔔</span>
          <span className="text-sm font-medium text-green-800">การแจ้งเตือนเปิดใช้งานอยู่</span>
        </div>
        <button
          onClick={handleUnsubscribe}
          className="text-xs text-red-600 hover:underline"
        >
          ปิด
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleSubscribe}
        disabled={status === "loading" || status === "denied"}
        className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-xl px-4 py-3 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {status === "loading" ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            กำลังตั้งค่า...
          </>
        ) : status === "denied" ? (
          <>🔕 การแจ้งเตือนถูกปฏิเสธ</>
        ) : (
          <>🔔 เปิดใช้งานการแจ้งเตือน</>
        )}
      </button>

      {status === "denied" && (
        <p className="text-xs text-gray-500 text-center">
          กรุณาเปิดสิทธิ์การแจ้งเตือนในการตั้งค่าเบราว์เซอร์
        </p>
      )}

      {message && (
        <p className={`text-xs text-center ${status === "error" ? "text-red-600" : "text-green-600"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
