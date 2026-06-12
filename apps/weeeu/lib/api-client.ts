// TODO: REMOVE BEFORE PROD — dev auth bypass integrated
import { createMockFirstApi } from "@app3r/shared/src/mock-runtime";
import { getDevTestToken } from "./dev-auth";

// BUG-3 fix (CMD #115-AK-U · #115-AG): config injection — mockMode REQUIRED
// shared ไม่อ่าน env เอง → app inject inline (deterministic ใน Next.js build)
const MOCK_MODE = process.env.NEXT_PUBLIC_DEV_NAV === "true";

/** api — mock-first factory (RC1: mock mode → BACKEND_UNAVAILABLE ทันที, ไม่ยิง :8000) */
export const api = createMockFirstApi({
  mockMode: MOCK_MODE,
  getToken: () =>
    process.env.NODE_ENV === "development"
      ? getDevTestToken().catch(() => null)
      : typeof window !== "undefined"
        ? localStorage.getItem("access_token")
        : null,
});

/**
 * apiFetch — backward-compat wrapper (ใช้โดยหน้าที่มี catch fallback mock อยู่แล้ว)
 *
 * mock mode: ไม่ยิง backend — throw ทันที → caller .catch() fallback mock ✅
 * หมายเหตุ: ถ้า body เป็น FormData จะไม่ set Content-Type (browser set เองพร้อม boundary)
 */
export async function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  if (MOCK_MODE) {
    throw new Error("BACKEND_UNAVAILABLE");
  }

  // TODO: REMOVE BEFORE PROD — dev auth bypass
  let token: string | null = null;
  if (process.env.NODE_ENV === "development") {
    token = await getDevTestToken().catch(() => null);
  } else {
    token =
      typeof window !== "undefined"
        ? localStorage.getItem("access_token")
        : null;
  }

  const isFormData = options.body instanceof FormData;

  const headers: Record<string, string> = {
    ...(!isFormData && { "Content-Type": "application/json" }),
    ...(token && { Authorization: `Bearer ${token}` }),
    ...(options.headers as Record<string, string>),
  };

  return fetch(path, { ...options, headers });
}
