// TODO: REMOVE BEFORE PROD — dev auth bypass integrated
import { getDevTestToken } from "./dev-auth";

/**
 * apiFetch — drop-in fetch wrapper ที่แนบ Authorization header อัตโนมัติ
 *
 * Dev mode  : ขอ test JWT จาก backend (TD-04)
 * Prod mode : ใช้ token จาก localStorage (real auth — Phase D)
 *
 * หมายเหตุ: ถ้า body เป็น FormData จะไม่ set Content-Type
 * (browser จะ set เองพร้อม boundary)
 */
export async function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  // TODO: REMOVE BEFORE PROD — dev auth bypass
  let token: string | null = null;
  if (process.env.NODE_ENV === "development") {
    token = await getDevTestToken();
  } else {
    token =
      typeof window !== "undefined"
        ? localStorage.getItem("access_token")
        : null;
  }

  const isFormData = options.body instanceof FormData;

  const headers: Record<string, string> = {
    // ไม่ set Content-Type ถ้าเป็น FormData — browser จัดการเอง
    ...(!isFormData && { "Content-Type": "application/json" }),
    ...(token && { Authorization: `Bearer ${token}` }),
    // caller headers override ทั้งหมดข้างต้น
    ...(options.headers as Record<string, string>),
  };

  return fetch(path, { ...options, headers });
}
