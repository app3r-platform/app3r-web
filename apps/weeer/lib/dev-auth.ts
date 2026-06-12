// ── dev-auth.ts — WeeeR dev token provider (RC1 · shared mock-runtime) ────────
// TODO: REMOVE BEFORE PROD — dev auth bypass
// ใช้ createDevTokenProvider จาก @app3r/shared (Admin pilot pattern · CMD #115-Z)
// คง public surface เดิม: getDevTestToken + clearDevToken

import { createDevTokenProvider } from "@app3r/shared/src/mock-runtime";

/** persist access_token ลง localStorage ให้ apiFetch (prod path) + isAuthenticated ใช้ได้ */
function saveToken(token: string): void {
  if (typeof window !== "undefined") localStorage.setItem("access_token", token);
}

function removeToken(): void {
  if (typeof window !== "undefined") localStorage.removeItem("access_token");
}

const provider = createDevTokenProvider({
  // mockMode: inline env ใน app chunk (config injection · CMD #115-AH · กัน BUG-3)
  mockMode: process.env.NEXT_PUBLIC_DEV_NAV === "true",
  saveToken,
  removeToken,
  // payload เดิมของ WeeeR (role weeer · shop_id 10 · phone)
  payload: { user_id: 1, role: "weeer", phone: "+66812345678", shop_id: 10 },
});

export const getDevTestToken = provider.getDevTestToken;
export const clearDevToken = provider.clearDevToken;
