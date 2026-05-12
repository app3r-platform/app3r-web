// ─── Service Worker — WeeeU App (D88 Push Subscribe) ─────────────────────────
// Phase D-2: รับ push notification จาก backend (FCM / Web Push)
// Phase C: skeleton ที่ register ได้ แต่ยังไม่มี real push

const CACHE_NAME = "weeeu-v1";

// ─── Install ───────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  console.log("[SW] Install — WeeeU Service Worker v1");
  self.skipWaiting(); // activate ทันที
});

// ─── Activate ──────────────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  console.log("[SW] Activate");
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ─── Push event (D88 — รับ push notification จาก backend) ───────────────────
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "WeeeU แจ้งเตือน", body: event.data.text() };
  }

  const options = {
    body: payload.body ?? "มีการแจ้งเตือนใหม่",
    icon: "/logo/WeeeU.png",
    badge: "/logo/WeeeU.png",
    data: { url: payload.url ?? "/" },
    tag: payload.tag ?? "weeeu-notification",
    renotify: true,
  };

  event.waitUntil(
    self.registration.showNotification(payload.title ?? "WeeeU", options)
  );
});

// ─── Notification click ────────────────────────────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((cs) => {
      const existing = cs.find((c) => c.url.includes(url));
      if (existing) return existing.focus();
      return clients.openWindow(url);
    })
  );
});

// ─── Fetch (no cache strategy — API calls ผ่าน network ตรง) ──────────────────
self.addEventListener("fetch", (event) => {
  // ไม่ intercept /api/* — ให้ผ่าน network เสมอ
  if (event.request.url.includes("/api/")) return;
});
