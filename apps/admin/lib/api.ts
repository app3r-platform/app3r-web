// CMD #115-Y Phase 3 — converge to shared Mock-First Runtime util
// (reference usage สำหรับ 5 แอพ · กัน divergence · Gen 54 union lesson)
// Behavior/contract เดิมทั้งหมดย้ายไป packages/shared/src/mock-runtime (extract จาก Admin pilot 99bf696)
import { getToken } from "./auth";
// TODO: REMOVE BEFORE PROD — TD-04 dev auth bypass
import { getDevTestToken } from "./dev-auth";
import {
  createMockFirstApi,
  ERR_BACKEND_UNAVAILABLE,
  ERR_UNAUTHORIZED,
} from "@app3r/shared/src/mock-runtime";

// data layer แบบ mock-first — base '/api/v1' (default ของ factory)
// token: dev → dev test token (ไม่ throw) · prod → getToken()
export const api = createMockFirstApi({
  getToken: () =>
    process.env.NODE_ENV === "development"
      ? getDevTestToken().catch(() => null)
      : getToken(),
});

// คง public surface เดิมครบ 3 ตัว (api + error constants ที่หน้าเพจ import ใช้)
export { ERR_BACKEND_UNAVAILABLE, ERR_UNAUTHORIZED };
