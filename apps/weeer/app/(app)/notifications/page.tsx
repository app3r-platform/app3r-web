"use client";
// ── Notifications — WeeeR (D-2 Push Subscribe) ────────────────────────────────
// Push Notification subscribe UI + แสดงการแจ้งเตือนจริง (wire-real)
// D-FE-NO-FAKE-DISPLAY + D-FE-NO-SWALLOW: no hardcoded notifications;
// loading/error/empty are honest states (never a fake array, never 0-placeholder).

import { useEffect, useState } from "react";
import PushSubscribeButton from "../../../components/push/PushSubscribeButton";
import { MockAnnoOrigin } from "@/components/MockAnno";
import { notificationsApi, type PushNotification } from "@/lib/api/notifications";

// Map a real notification `type` → icon (neutral fallback for unknown types).
function iconForType(type: string): string {
  switch (type) {
    case "payment":
      return "🔓";
    case "parts":
      return "📦";
    case "job":
      return "📥";
    case "staff":
      return "👷";
    case "update":
      return "🔄";
    default:
      return "🔔";
  }
}

export default function NotificationsPage() {
  const [items, setItems] = useState<PushNotification[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    notificationsApi
      .list()
      .then((d) => {
        if (alive) setItems(d.items);
      })
      .catch(() => {
        // D-FE-NO-SWALLOW: surface as a visible error state, never a fake array.
        if (alive) setError(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  const unreadCount =
    items != null ? items.filter((n) => n.readAt == null).length : 0;

  return (
    <div className="space-y-6 max-w-2xl">
      <MockAnnoOrigin from="R-50" />
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">
          แจ้งเตือน{" "}
          {items != null && unreadCount > 0 && (
            <span className="text-red-500 text-base">({unreadCount})</span>
          )}
        </h1>
        <button className="text-sm text-[#D63B12] hover:underline">อ่านทั้งหมด</button>
      </div>

      {/* Push Notification Subscribe Card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
        <div className="text-sm font-medium text-gray-700 mb-3">
          รับการแจ้งเตือนแบบ Real-time
        </div>
        <PushSubscribeButton />
      </div>

      {/* รายการแจ้งเตือน */}
      {error ? (
        <div className="p-4 rounded-2xl border border-gray-100 bg-white text-sm text-gray-500">
          ไม่สามารถโหลดการแจ้งเตือนได้ในขณะนี้
        </div>
      ) : items == null ? (
        // loading — render nothing (no fake data, no placeholder count)
        null
      ) : items.length === 0 ? (
        <div className="p-4 rounded-2xl border border-gray-100 bg-white text-sm text-gray-500">
          ยังไม่มีการแจ้งเตือน
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((n) => {
            const unread = n.readAt == null;
            return (
              <div
                key={n.id}
                className={`p-4 rounded-2xl border transition-colors ${
                  unread ? "bg-[#FFF1ED] border-[#FFE0D6]" : "bg-white border-gray-100"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl shrink-0">{iconForType(n.type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-semibold ${
                          unread ? "text-gray-900" : "text-gray-700"
                        }`}
                      >
                        {n.title}
                      </span>
                      {unread && (
                        <span className="w-2 h-2 bg-[#FF663A] rounded-full shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-0.5">{n.body}</p>
                    <p className="text-xs text-gray-400 mt-1">{n.sentAt}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
