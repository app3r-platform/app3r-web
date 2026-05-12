/**
 * fcm.ts — D88: Firebase Cloud Messaging push notification
 *
 * firebase-admin SDK — server-side FCM messaging
 * Credentials: Firebase service account JSON → env FIREBASE_SERVICE_ACCOUNT (base64)
 *
 * APNs (iOS): reserved — Mobile future (Memory #11)
 * Rate limit: 100 msg/min/user (enforce in caller)
 *
 * Note: FCM dev mode uses mock token — manual device test required
 */
import admin from 'firebase-admin'

// ---------------------------------------------------------------------------
// PushNotificationAdapter interface
// ---------------------------------------------------------------------------
export interface PushPayload {
  title: string
  body: string
  data?: Record<string, string>
  imageUrl?: string
}

export interface PushResult {
  messageId: string
  success: boolean
  error?: string
}

export interface PushNotificationAdapter {
  sendToToken(fcmToken: string, payload: PushPayload): Promise<PushResult>
  sendToMultiple(fcmTokens: string[], payload: PushPayload): Promise<PushResult[]>
}

// ---------------------------------------------------------------------------
// Firebase Admin init (lazy — once per process)
// ---------------------------------------------------------------------------
let _initialized = false

function initFirebase(): void {
  if (_initialized || admin.apps.length > 0) return

  const serviceAccountB64 = process.env.FIREBASE_SERVICE_ACCOUNT
  if (!serviceAccountB64) {
    console.warn('[FCM] FIREBASE_SERVICE_ACCOUNT not set — push notifications disabled (dev mode)')
    _initialized = true
    return
  }

  const serviceAccount = JSON.parse(Buffer.from(serviceAccountB64, 'base64').toString('utf-8'))
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
  _initialized = true
}

// ---------------------------------------------------------------------------
// FCM PushNotificationAdapter implementation
// ---------------------------------------------------------------------------
export const fcmAdapter: PushNotificationAdapter = {
  async sendToToken(fcmToken: string, payload: PushPayload): Promise<PushResult> {
    initFirebase()
    if (admin.apps.length === 0) {
      return { messageId: 'mock-dev', success: false, error: 'Firebase not initialized (dev)' }
    }

    try {
      const messageId = await admin.messaging().send({
        token: fcmToken,
        notification: { title: payload.title, body: payload.body, imageUrl: payload.imageUrl },
        data: payload.data,
      })
      return { messageId, success: true }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      return { messageId: '', success: false, error: msg }
    }
  },

  async sendToMultiple(fcmTokens: string[], payload: PushPayload): Promise<PushResult[]> {
    return Promise.all(fcmTokens.map((token) => this.sendToToken(token, payload)))
  },
}
