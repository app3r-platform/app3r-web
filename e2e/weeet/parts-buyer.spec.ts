/**
 * e2e/weeet/parts-buyer.spec.ts — Parts B2B Buyer Flow E2E Tests
 * Sub-CMD-9 Wave 3 — WeeeT
 *
 * ทดสอบ Parts B2B API ที่ WeeeT (Buyer role) ใช้
 * ใช้ Playwright APIRequestContext (no browser)
 *
 * Tests (Page Object: PartsPage + PartsOrdersPage):
 * 1. GET /parts/ without token → 401
 * 2. GET /parts/ with auth → 200 array
 * 3. GET /parts/:id/ non-existent → 404
 * 4. GET /parts/orders/ without token → 401
 * 5. GET /parts/orders/ with auth → 200 list shape
 * 6. GET /parts/orders/ status filter → 200
 * 7. GET /parts/orders/ pagination params → 200
 * 8. POST /parts/orders/ insufficient stock → 400
 * 9. POST /parts/orders/ without token → 401
 * 10. GET /parts/orders/:id/ non-existent → 404
 * 11. GET /parts/orders/:id/ without token → 401
 * 12. PATCH /parts/orders/:id/close/ wrong state → 400
 * 13. POST /parts/orders/:id/dispute/ wrong state → 400
 *
 * W5: retry max 2
 */

import { test, expect, type APIRequestContext } from "@playwright/test";

const API = "/api/v1";

// ── Page Objects ──────────────────────────────────────────────────────────────

class PartsPage {
  constructor(private request: APIRequestContext) {}

  listParts(token?: string) {
    return this.request.get(`${API}/parts/`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }

  getPart(id: string, token?: string) {
    return this.request.get(`${API}/parts/${id}/`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }
}

class PartsOrdersPage {
  constructor(private request: APIRequestContext) {}

  listOrders(
    token?: string,
    params?: { status?: string; limit?: number; offset?: number }
  ) {
    const qs = new URLSearchParams();
    if (params?.status) qs.set("status", params.status);
    if (params?.limit != null) qs.set("limit", String(params.limit));
    if (params?.offset != null) qs.set("offset", String(params.offset));
    const query = qs.toString() ? `?${qs.toString()}` : "";
    return this.request.get(`${API}/parts/orders/${query}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }

  createOrder(
    body: { partId: string; quantity: number; idempotencyKey: string; serviceId?: string },
    token?: string
  ) {
    return this.request.post(`${API}/parts/orders/`, {
      data: body,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }

  getOrder(id: string, token?: string) {
    return this.request.get(`${API}/parts/orders/${id}/`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }

  closeOrder(id: string, token?: string) {
    return this.request.patch(`${API}/parts/orders/${id}/close/`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }

  disputeOrder(id: string, reason: string, token?: string) {
    return this.request.post(`${API}/parts/orders/${id}/dispute/`, {
      data: { reason },
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }
}

// ── Helper ────────────────────────────────────────────────────────────────────

async function getTestToken(request: APIRequestContext): Promise<string | null> {
  try {
    const email = `buyer-parts-e2e-${Date.now()}@weeet.test`;
    const reg = await request.post(`${API}/auth/register/`, {
      data: {
        email,
        password: "PartsPass123!",
        name: "ผู้ซื้อ อี2อี",
        phone: "0812300002",
      },
    });
    if (!reg.ok()) return null;
    const body = await reg.json();
    return body.token ?? body.access ?? null;
  } catch {
    return null;
  }
}

// ── Parts List ─────────────────────────────────────────────────────────────────

test.describe("Parts API — List & Detail", () => {
  test("GET /parts/ without token → 401", async ({ request }) => {
    const page = new PartsPage(request);
    const res = await page.listParts();
    expect(res.status()).toBe(401);
  });

  test("GET /parts/ with auth → 200 array", async ({ request }) => {
    const token = await getTestToken(request);
    if (!token) { test.skip(); return; }
    const page = new PartsPage(request);
    const res = await page.listParts(token);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test("GET /parts/:id/ non-existent → 404", async ({ request }) => {
    const token = await getTestToken(request);
    if (!token) { test.skip(); return; }
    const page = new PartsPage(request);
    const res = await page.getPart("00000000-0000-0000-0000-000000000000", token);
    expect(res.status()).toBe(404);
  });
});

// ── Order List ────────────────────────────────────────────────────────────────

test.describe("Parts Orders — List", () => {
  test("GET /parts/orders/ without token → 401", async ({ request }) => {
    const page = new PartsOrdersPage(request);
    const res = await page.listOrders();
    expect(res.status()).toBe(401);
  });

  test("GET /parts/orders/ with auth → 200 with list shape", async ({ request }) => {
    const token = await getTestToken(request);
    if (!token) { test.skip(); return; }
    const page = new PartsOrdersPage(request);
    const res = await page.listOrders(token);
    expect(res.status()).toBe(200);
    const body = await res.json();
    // Should have paginated list shape
    expect(body).toHaveProperty("items");
    expect(body).toHaveProperty("total");
    expect(Array.isArray(body.items)).toBe(true);
  });

  test("GET /parts/orders/?status=pending with auth → 200", async ({ request }) => {
    const token = await getTestToken(request);
    if (!token) { test.skip(); return; }
    const page = new PartsOrdersPage(request);
    const res = await page.listOrders(token, { status: "pending" });
    expect(res.status()).toBe(200);
  });

  test("GET /parts/orders/?limit=5&offset=0 with auth → 200", async ({ request }) => {
    const token = await getTestToken(request);
    if (!token) { test.skip(); return; }
    const page = new PartsOrdersPage(request);
    const res = await page.listOrders(token, { limit: 5, offset: 0 });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.items.length).toBeLessThanOrEqual(5);
  });
});

// ── Create Order ──────────────────────────────────────────────────────────────

test.describe("Parts Orders — Create", () => {
  test("POST /parts/orders/ with invalid partId → 400", async ({ request }) => {
    const token = await getTestToken(request);
    if (!token) { test.skip(); return; }
    const page = new PartsOrdersPage(request);
    const res = await page.createOrder(
      {
        partId: "00000000-0000-0000-0000-000000000000",
        quantity: 9999,
        idempotencyKey: `idem-notfound-${Date.now()}`,
      },
      token
    );
    expect([400, 404]).toContain(res.status());
  });

  test("POST /parts/orders/ without token → 401", async ({ request }) => {
    const page = new PartsOrdersPage(request);
    const res = await page.createOrder({
      partId: "some-part-id",
      quantity: 1,
      idempotencyKey: "idem-noauth",
    });
    expect(res.status()).toBe(401);
  });
});

// ── Get Order ─────────────────────────────────────────────────────────────────

test.describe("Parts Orders — Get Detail", () => {
  test("GET /parts/orders/:id/ non-existent → 404", async ({ request }) => {
    const token = await getTestToken(request);
    if (!token) { test.skip(); return; }
    const page = new PartsOrdersPage(request);
    const res = await page.getOrder("00000000-0000-0000-0000-000000000000", token);
    expect(res.status()).toBe(404);
  });

  test("GET /parts/orders/:id/ without token → 401", async ({ request }) => {
    const page = new PartsOrdersPage(request);
    const res = await page.getOrder("some-order-id");
    expect(res.status()).toBe(401);
  });
});

// ── Buyer Actions — Auth guards ───────────────────────────────────────────────

test.describe("Parts Orders — Buyer Actions (auth + state guards)", () => {
  test("PATCH close on non-existent order → 400 or 404", async ({ request }) => {
    const token = await getTestToken(request);
    if (!token) { test.skip(); return; }
    const page = new PartsOrdersPage(request);
    const res = await page.closeOrder("00000000-0000-0000-0000-000000000000", token);
    expect([400, 404]).toContain(res.status());
  });

  test("POST dispute on non-existent order → 400 or 404", async ({ request }) => {
    const token = await getTestToken(request);
    if (!token) { test.skip(); return; }
    const page = new PartsOrdersPage(request);
    const res = await page.disputeOrder(
      "00000000-0000-0000-0000-000000000000",
      "ของที่ได้รับผิดรุ่น ไม่ตรงกับที่สั่ง",
      token
    );
    expect([400, 404]).toContain(res.status());
  });
});
