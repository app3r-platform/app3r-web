// ============================================================
// lib/contact-api.ts — API client สำหรับ Contact Form
// Phase D-4 Sub-4 — POST /api/contact (rate limit: 5 req/IP/15min)
// ============================================================
import type { CreateContactMessageInput } from './types/contact';

/** ข้อมูลติดต่อสำรอง — แสดงเมื่อ API ล้มเหลว */
export const FALLBACK_CONTACT = {
  email: 'support@app3r.co.th',
  phone: '02-XXX-XXXX',
  lineId: '@app3r',
} as const;

export interface ContactApiResult {
  ok: true;
  messageId: string;
}

export interface ContactApiError {
  ok: false;
  /** รหัส error: 'network' | 'rate_limit' | 'validation' | 'server' */
  code: 'network' | 'rate_limit' | 'validation' | 'server';
  message: string;
}

export type ContactApiResponse = ContactApiResult | ContactApiError;

/**
 * ส่งข้อความผ่าน POST /api/contact
 * ไม่ cache — ส่งตรงทุกครั้ง
 */
export async function submitContactForm(
  input: CreateContactMessageInput,
): Promise<ContactApiResponse> {
  try {
    const res = await fetch('http://localhost:8000/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
      cache: 'no-store',
    });

    if (res.status === 429) {
      return {
        ok: false,
        code: 'rate_limit',
        message: 'ส่งข้อความบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่ (จำกัด 5 ครั้งต่อ 15 นาที)',
      };
    }

    if (res.status === 422 || res.status === 400) {
      const body = await res.json().catch(() => ({}));
      const detail =
        typeof body === 'object' && body !== null && 'message' in body
          ? String((body as Record<string, unknown>).message)
          : 'ข้อมูลไม่ถูกต้อง';
      return { ok: false, code: 'validation', message: detail };
    }

    if (!res.ok) {
      return {
        ok: false,
        code: 'server',
        message: 'เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่หรือติดต่อเราทางอีเมล',
      };
    }

    const data = await res.json().catch(() => ({}));
    const messageId =
      typeof data === 'object' && data !== null && 'id' in data
        ? String((data as Record<string, unknown>).id)
        : 'unknown';

    return { ok: true, messageId };
  } catch {
    // network error (backend down, CORS, etc.)
    return {
      ok: false,
      code: 'network',
      message: 'ไม่สามารถเชื่อมต่อได้ขณะนี้ กรุณาลองใหม่หรือติดต่อเราโดยตรง',
    };
  }
}
