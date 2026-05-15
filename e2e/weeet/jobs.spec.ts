/**
 * e2e/weeet/jobs.spec.ts — Jobs API E2E Tests
 * Sub-CMD-9 Wave 3 — WeeeT
 *
 * ทดสอบ backend API endpoints สำหรับ WeeeT jobs module
 * ใช้ Playwright APIRequestContext (no browser)
 *
 * Tests (Page Object: JobsPage):
 * 1. GET /repair/jobs/weeet/ without token → 401
 * 2. GET /repair/jobs/weeet/ with auth → 200 array
 * 3. GET /repair/jobs/weeet/?service_type=on_site filter
 * 4. GET /repair/jobs/:id/ non-existent → 404
 * 5. GET /maintain/jobs/weeet/ with auth → 200 array
 *
 * W5: retry max 2
 */

import { test, expect, type APIRequestContext } from "@playwright/test";

const API = "/api/v1";

// ── Page Object: JobsPage ─────────────────────────────────────────────────────

class JobsPage {
  constructor(private request: APIRequestContext) {}

  listRepairJobs(token?: string, serviceType?: string) {
    const qs = serviceType ? `?service_type=${serviceType}` : "";
    return this.request.get(`${API}/repair/jobs/weeet/${qs}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }

  getRepairJob(id: string, token?: string) {
    return this.request.get(`${API}/repair/jobs/${id}/`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }

  listMaintainJobs(token?: string) {
    return this.request.get(`${API}/maintain/jobs/weeet/`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }
}

// ── Helper: get dev token ─────────────────────────────────────────────────────

async function getTestToken(request: APIRequestContext): Promise<string | null> {
  try {
    const email = `tech-jobs-e2e-${Date.now()}@weeet.test`;
    const reg = await request.post(`${API}/auth/register/`, {
      data: {
        email,
        password: "JobsPass123!",
        name: "ช่างงาน อี2อี",
        phone: "0812300001",
      },
    });
    if (!reg.ok()) return null;
    const body = await reg.json();
    return body.token ?? body.access ?? null;
  } catch {
    return null;
  }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe("Repair Jobs API", () => {
  test("GET /repair/jobs/weeet/ without token → 401", async ({ request }) => {
    const page = new JobsPage(request);
    const res = await page.listRepairJobs();
    expect(res.status()).toBe(401);
  });

  test("GET /repair/jobs/weeet/ with auth → 200 array", async ({ request }) => {
    const token = await getTestToken(request);
    if (!token) {
      test.skip();
      return;
    }
    const page = new JobsPage(request);
    const res = await page.listRepairJobs(token);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test("GET /repair/jobs/weeet/?service_type=on_site → 200 filtered array", async ({
    request,
  }) => {
    const token = await getTestToken(request);
    if (!token) {
      test.skip();
      return;
    }
    const page = new JobsPage(request);
    const res = await page.listRepairJobs(token, "on_site");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    // Every job in result should be on_site (if any exist)
    body.forEach((job: { service_type?: string }) => {
      if (job.service_type) {
        expect(job.service_type).toBe("on_site");
      }
    });
  });

  test("GET /repair/jobs/:id/ with non-existent ID → 404", async ({ request }) => {
    const token = await getTestToken(request);
    if (!token) {
      test.skip();
      return;
    }
    const page = new JobsPage(request);
    const res = await page.getRepairJob("00000000-0000-0000-0000-000000000000", token);
    expect(res.status()).toBe(404);
  });
});

test.describe("Maintain Jobs API", () => {
  test("GET /maintain/jobs/weeet/ with auth → 200 array", async ({ request }) => {
    const token = await getTestToken(request);
    if (!token) {
      test.skip();
      return;
    }
    const page = new JobsPage(request);
    const res = await page.listMaintainJobs(token);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });
});
