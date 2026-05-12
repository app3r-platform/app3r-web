"use client";
// ─── PushSubscribeButton (D88) — Web Push + FCM token register ────────────────

import { useState, useEffect } from "react";
import { getAdapter } from "@/lib/dal";

const SW_PATH = "/sw.js";
const SUB_ID_KEY = "push_subscription_id";

export function PushSubscribeButton() {
  const [status, setStatus] = useState<"unknown" | "granted" | "denied" | "subscribed">("unknown");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem(SUB_ID_KEY);
    if (saved) { setStatus("subscribed"); return; }
    if ("Notification" in window) {
      if (Notification.permission === "granted") setStatus("granted");
      else if (Notification.permission === "denied") setStatus("denied");
    }
  }, []);

  const handleSubscribe = async () => {
    setLoading(true);
    setError("");
    try {
      // Step 1: ขอ permission
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        setError("กรุณาอนุญาต notification ในการตั้งค่า browser");
        return;
      }

      // Step 2: Register Service Worker
      if (!("serviceWorker" in navigator)) throw new Error("Browser ไม่รองรับ Service Worker");
      const reg = await navigator.serviceWorker.register(SW_PATH);
      await navigator.serviceWorker.ready;

      // Step 3: Get FCM-style token (Phase C mock: ใช้ random token)
      // Phase D-2: ใช้ Firebase getToken() จริง
      const mockToken = `weeeu-fcm-${Date.now()}-${Math.random().toString(36).slice(2)}`;

      // Step 4: ส่ง token ไป backend
      const dal = getAdapter();
      const result = await dal.push.subscribe({ token: mockToken, platform: "web" });
      if (!result.ok) throw new Error(result.error);

      // บันทึก subscription ID
      localStorage.setItem(SUB_ID_KEY, result.data.subscriptionId);
      setStatus("subscribed");

    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "เปิดการแจ้งเตือนไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    setLoading(true);
    const subId = localStorage.getItem(SUB_ID_KEY);
    if (subId) {
      const dal = getAdapter();
      await dal.push.unsubscribe(subId).catch(() => {});
      localStorage.removeItem(SUB_ID_KEY);
    }
    setStatus("unknown");
    setLoading(false);
  };

  if (status === "subscribed") {
    return (
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-green-500">🔔</span>
          <span className="text-sm font-medium text-gray-700">เปิดการแจ้งเตือนแล้ว</span>
        </div>
        <button
          onClick={handleUnsubscribe}
          disabled={loading}
          className="text-xs text-gray-400 hover:text-red-500 transition-colors"
        >
          ปิด
        </button>
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-sm text-amber-700">
        🔕 การแจ้งเตือนถูกบล็อก — กรุณาเปิดในการตั้งค่า browser
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleSubscribe}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold py-3 rounded-2xl text-sm transition-colors"
      >
        {loading ? "กำลังเปิด..." : "🔔 เปิดการแจ้งเตือน"}
      </button>
      {error && (
        <p className="text-xs text-red-600 text-center">{error}</p>
      )}
    </div>
  );
}
