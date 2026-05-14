/**
 * websocket.ts — D88: WebSocket server state + connection registry
 *
 * Pattern: user-id room model (1 user = 1 room)
 * Auth: JWT verify ก่อน upgrade connection (D83)
 * Event types: notification.new | service.update | location.update
 *
 * Multi-instance scaling: Redis Pub/Sub (Phase D-5 เพิ่ม)
 * Fallback: SSE เมื่อ WebSocket ปิด (corporate firewall) — D-5
 *
 * PDPA: ห้าม log message body (rate limit: 100 msg/min/user)
 */
import type { WSContext } from 'hono/ws'

// ---------------------------------------------------------------------------
// WS event types
// ---------------------------------------------------------------------------
export type WsEventType =
  | 'notification.new'
  | 'service.update'
  | 'location.update'
  | 'progress:updated'   // Sub-CMD-5: Service Progress Tracker real-time event
  | 'ping'
  | 'pong'

export interface WsEvent<T = unknown> {
  type: WsEventType
  data: T
  timestamp: string
}

// ---------------------------------------------------------------------------
// Connection registry (in-memory — Phase D-5: Redis Pub/Sub)
// ---------------------------------------------------------------------------
const connections = new Map<string, Set<WSContext>>()

export const wsRegistry = {
  add(userId: string, ws: WSContext): void {
    if (!connections.has(userId)) {
      connections.set(userId, new Set())
    }
    connections.get(userId)!.add(ws)
  },

  remove(userId: string, ws: WSContext): void {
    connections.get(userId)?.delete(ws)
    if (connections.get(userId)?.size === 0) {
      connections.delete(userId)
    }
  },

  emit<T>(userId: string, event: WsEvent<T>): void {
    const userConns = connections.get(userId)
    if (!userConns) return
    const payload = JSON.stringify(event)
    for (const ws of userConns) {
      try {
        ws.send(payload)
      } catch {
        // stale connection — clean up on next close event
      }
    }
  },

  broadcast<T>(userIds: string[], event: WsEvent<T>): void {
    for (const userId of userIds) {
      this.emit(userId, event)
    }
  },

  connectionCount(): number {
    let total = 0
    for (const conns of connections.values()) total += conns.size
    return total
  },
}

// ---------------------------------------------------------------------------
// Helper: create typed WS event
// ---------------------------------------------------------------------------
export function createWsEvent<T>(type: WsEventType, data: T): WsEvent<T> {
  return { type, data, timestamp: new Date().toISOString() }
}
