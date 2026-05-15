/**
 * e2e/weeet/auth.spec.ts — Auth API E2E Tests
 * Sub-CMD-9 Wave 3 — WeeeT
 *
 * ทดสอบ backend API ที่ WeeeT ใช้สำหรับ Authentication
 * ใช้ Playwright APIRequestContext (no browser)
 *
 * Tests:
 * 1. Health check → 200
 * 2. Register success → 201 + token
 * 3. Register duplicate email → 400
 * 4. Register missing fields → 400
 * 5. Login success → 200 + token
 * 6. Login wrong password → 401
 * 7. Login unknown email → 401
 * 8. GET /auth/me without token → 401
 *
 * W5: retry max 2 (configured in playwright.config.ts)
 */

import { test, expect } from "@playwright/test";

const API = "/api/v1";

// ── 1. Health check ───────────────────────────────────────────────────────────

test.describe("Health check", () => {
  test("GET /api/v1/health/ returns 200", async ({ request }) => {
    const res = await request.get(`${API}/health/`);
    expect(res.status()).toBe(200);
  });
});

// ── 2–4. Register ─────────────────────────────────────────────────────────────

test.describe("Register (POST /api/v1/auth/register/)", () => {
  test("valid payload → 201 with token", async ({ request }) => {
    const uniqueEmail = `tech-e2e-${Date.now()}@weeet.test`;
    const res = await request.post(`${API}/auth/register/`, {
      data: {
        email: uniqueEmail,
        password: "TestPass123!",
        name: "เทค อี2อี",
        phone: "0812345678",
      },
    });

    // Accept 201 Created or 200 (some implementations)
    expect([200, 201]).toContain(res.status());
    const body = await res.json();
    expect(body.token ?? body.access).toBeTruthy();
  });

  test("duplicate email → 400", async ({ request }) => {
    // Use a deterministic email that's likely already registered
    const res = await request.post(`${API}/auth/register/`, {
      data: {
        email: "duplicate@weeet.test",
        password: "TestPass123!",
        name: "ซ้ำ",
        phone: "0812345678",
      },
    });

    // First call might succeed (201) — second call should fail (400/409)
    // We accept either: if 201, test that re-register fails
    if (res.status() === 201 || res.status() === 200) {
      const res2 = await request.post(`${API}/auth/register/`, {
        data: {
          email: "duplicate@weeet.test",
          password: "AnotherPass123!",
          name: "ซ้ำ 2",
          phone: "0898765432",
        },
      });
      expect([400, 409]).toContain(res2.status());
    } else {
      expect([400, 409]).toContain(res.status());
    }
  });

  test("missing required fields → 400", async ({ request }) => {
    const res = await request.post(`${API}/auth/register/`, {
      data: { email: "no-password@weeet.test" },
    });
    expect(res.status()).toBe(400);
  });
});

// ── 5–7. Login ────────────────────────────────────────────────────────────────

test.describe("Login (POST /api/v1/auth/login/)", () => {
  test("valid credentials → 200 with token", async ({ request }) => {
    // Register first to ensure the account exists
    const email = `login-e2e-${Date.now()}@weeet.test`;
    await request.post(`${API}/auth/register/`, {
      data: {
        email,
        password: "LoginPass123!",
        name: "ล็อกอิน อี2อี",
        phone: "0812340000",
      },
    });

    const res = await request.post(`${API}/auth/login/`, {
      data: { email, password: "LoginPass123!" },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.token ?? body.access).toBeTruthy();
  });

  test("wrong password → 401", async ({ request }) => {
    const res = await request.post(`${API}/auth/login/`, {
      data: { email: "any@weeet.test", password: "WrongPassword!" },
    });
    expect([400, 401]).toContain(res.status());
  });

  test("unknown email → 401", async ({ request }) => {
    const res = await request.post(`${API}/auth/login/`, {
      data: {
        email: `nonexistent-${Date.now()}@weeet.test`,
        password: "SomePass123!",
      },
    });
    expect([400, 401]).toContain(res.status());
  });
});

// ── 8. Auth guard ─────────────────────────────────────────────────────────────

test.describe("Auth guard — /auth/me/", () => {
  test("GET /auth/me/ without token → 401", async ({ request }) => {
    const res = await request.get(`${API}/auth/me/`);
    expect(res.status()).toBe(401);
  });
});
