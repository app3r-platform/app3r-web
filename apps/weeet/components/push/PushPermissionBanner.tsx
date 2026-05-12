"use client";
/**
 * components/push/PushPermissionBanner.tsx
 * Phase D-2 — Web Push subscription UI
 * @needs-backend-sync Backend Sub-CMD-P1: POST /api/v1/notifications/push/subscribe
 */
import { useState, useEffect } from "react";
import { getAdapter } from "@/lib/dal";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U";

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(b64);
  return new Uint8Array([...raw].map((c) => c.charCodeAt(0)));
}

interface Props { technicianId: string; compact?: boolean; }

export function PushPermissionBanner({ technicianId, compact = false }: Props) {
  const [status, setStatus] = useState<"loading"|"unsupported"|"subscribed"|"not_subscribed"|"denied"|"subscribing">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { checkStatus(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function checkStatus() {
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) { setStatus("unsupported"); return; }
    if (Notification.permission === "denied") { setStatus("denied"); return; }
    const dal = getAdapter();
    const res = await dal.push.getSubscriptionStatus();
    setStatus(res.ok && res.data.isSubscribed ? "subscribed" : "not_subscribed");
  }

  async function handleSubscribe() {
    setStatus("subscribing"); setError(null);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as unknown as ArrayBuffer,
      });
      const json = subscription.toJSON();
      const keys = json.keys as { p256dh: string; auth: string } | undefined;
      if (!keys) throw new Error("Push subscription keys ไม่พบ");
      const dal = getAdapter();
      const res = await dal.push.subscribePush({ endpoint: subscription.endpoint, keys, technicianId });
      if (res.ok) setStatus("subscribed"); else throw new Error(res.error);
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); setStatus("not_subscribed"); }
  }

  async function handleUnsubscribe() { await getAdapter().push.unsubscribePush(); setStatus("not_subscribed"); }

  if (status === "loading" || status === "unsupported") return null;

  if (compact) {
    return (
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="text-lg">🔔</span>
          <div><p className="text-sm text-white">การแจ้งเตือน Push</p>{status === "denied" && <p className="text-xs text-red-400">ถูกบล็อกโดยเบราว์เซอร์</p>}</div>
        </div>
        {status === "subscribed" ? <button onClick={handleUnsubscribe} className="text-xs text-orange-400">ปิด</button>
          : status === "not_subscribed" ? <button onClick={handleSubscribe} className="text-xs bg-orange-600 text-white px-3 py-1 rounded-lg">เปิด</button> : null}
      </div>
    );
  }

  return (
    <div className={`rounded-xl border p-4 space-y-3 ${status === "subscribed" ? "bg-green-950/30 border-green-800/60" : status === "denied" ? "bg-red-950/30 border-red-800/60" : "bg-amber-950/30 border-amber-800/60"}`}>
      <div className="flex items-start gap-3">
        <span className="text-xl">🔔</span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">การแจ้งเตือน Push</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {status === "subscribed" ? "เปิดรับการแจ้งเตือนงานใหม่แล้ว ✅" : status === "denied" ? "ถูกปฏิเสธโดยเบราว์เซอร์ — เปิดในการตั้งค่าเบราว์เซอร์" : "รับการแจ้งเตือนเมื่อมีงานใหม่"}
          </p>
        </div>
      </div>
      {error && <p className="text-xs text-red-400 bg-red-950/40 border border-red-800 rounded-lg px-3 py-2">{error}</p>}
      {status === "subscribed" && <button onClick={handleUnsubscribe} className="text-xs text-gray-400 hover:text-red-400">ปิดการแจ้งเตือน</button>}
      {status === "not_subscribed" && (
        <button onClick={handleSubscribe} className="w-full bg-orange-600 hover:bg-orange-500 text-white font-semibold py-2.5 rounded-xl text-sm">🔔 เปิดรับการแจ้งเตือน</button>
      )}
      {status === "subscribing" && <p className="text-xs text-center text-gray-400 flex items-center justify-center gap-1.5"><span className="animate-spin">⏳</span> กำลังสมัคร...</p>}
    </div>
  );
}
