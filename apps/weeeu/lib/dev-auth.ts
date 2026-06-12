// TODO: REMOVE BEFORE PROD — dev auth bypass
import { createDevTokenProvider } from "@app3r/shared/src/mock-runtime";

// BUG-3 fix (CMD #115-AK-U · #115-AG): config injection — app injects mockMode,
// shared util ไม่อ่าน env เอง (กัน cross-package env inline failure)
const { getDevTestToken, clearDevToken } = createDevTokenProvider({
  mockMode: process.env.NEXT_PUBLIC_DEV_NAV === "true",
  saveToken: (token) => {
    if (typeof window !== "undefined") localStorage.setItem("access_token", token);
  },
  removeToken: () => {
    if (typeof window !== "undefined") localStorage.removeItem("access_token");
  },
  endpoint: "/api/v1/_dev/get-test-token",
  payload: { user_id: 1, role: "weeeu", phone: "+66812345678" },
  bypassToken: "dev-jwt-bypass",
});

export { getDevTestToken, clearDevToken };
