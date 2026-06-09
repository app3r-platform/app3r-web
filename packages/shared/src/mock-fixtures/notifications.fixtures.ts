/**
 * notifications.fixtures.ts — Mock notification data
 * Aligned with: d2-openapi.yaml#/components/schemas/NotificationResponse
 */
import type { NotificationResponse, NotificationListResponse } from '../api-client'

export const mockNotificationOffer: NotificationResponse = {
  id: 'notif-001',
  type: 'offer_arrived',
  title: 'มีข้อเสนอใหม่',
  body: 'ร้านซ่อม A1 เสนอราคา 850 บาท สำหรับงานซ่อมแอร์ของคุณ',
  channel: 'websocket',
  sentAt: '2026-06-09T09:30:00Z',
  readAt: null,
}

export const mockNotificationStatusUpdate: NotificationResponse = {
  id: 'notif-002',
  type: 'status_update',
  title: 'งานเริ่มแล้ว',
  body: 'ช่างวิชัยได้รับงานซ่อมเครื่องซักผ้าของคุณแล้ว',
  channel: 'fcm',
  sentAt: '2026-06-09T08:00:00Z',
  readAt: '2026-06-09T08:05:00Z',
}

export const mockNotificationPayment: NotificationResponse = {
  id: 'notif-003',
  type: 'payment_confirm',
  title: 'ชำระเงินสำเร็จ',
  body: 'ได้รับ 1,200 Gold สำหรับงานซ่อมตู้เย็น',
  channel: 'websocket',
  sentAt: '2026-06-01T16:00:00Z',
  readAt: '2026-06-01T16:02:00Z',
}

export const mockNotificationEta: NotificationResponse = {
  id: 'notif-004',
  type: 'eta_update',
  title: 'ช่างกำลังเดินทาง',
  body: 'คาดว่าจะถึงใน 15 นาที',
  channel: 'fcm',
  sentAt: '2026-06-09T13:45:00Z',
  readAt: null,
}

export const mockNotificationList: NotificationListResponse = {
  items: [
    mockNotificationEta,
    mockNotificationOffer,
    mockNotificationStatusUpdate,
    mockNotificationPayment,
  ],
  unreadCount: 2,
}

export const mockNotificationListEmpty: NotificationListResponse = {
  items: [],
  unreadCount: 0,
}
