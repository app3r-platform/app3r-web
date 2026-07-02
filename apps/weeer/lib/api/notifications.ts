import { apiFetch } from "@/lib/api-client";

// WeeeR notifications API — real push notifications (self-scoped via JWT Bearer).
// GET /api/v1/push/notifications → { items: [...] }
export type PushNotification = {
  id: string;
  type: string;
  title: string;
  body: string;
  channel: string;
  sentAt: string;
  readAt: string | null;
};

export const notificationsApi = {
  list: () =>
    apiFetch("/api/v1/push/notifications").then(async (r) => {
      if (!r.ok) throw new Error("notifications-fetch-failed");
      return (await r.json()) as { items: PushNotification[] };
    }),
};
