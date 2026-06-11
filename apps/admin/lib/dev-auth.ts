// TODO: REMOVE BEFORE PROD — dev auth bypass (TD-04)
// CMD #115-Y Phase 3 — converge to shared Mock-First Runtime util (createDevTokenProvider)
// Behavior เดิม (guard dev-only · mock-mode bypass · fetch fallback · cache) ย้ายไป
// packages/shared/src/mock-runtime/dev-token.ts (extract จาก Admin pilot 99bf696)

import { saveToken, removeToken } from "./auth";
import { createDevTokenProvider } from "@app3r/shared/src/mock-runtime";

const provider = createDevTokenProvider({
  saveToken,
  removeToken,
  payload: { user_id: 1, role: "admin" },
});

/**
 * Fetches a test JWT (dev only) — mock-mode/failure → bypass token. Persists via saveToken.
 */
export const getDevTestToken = provider.getDevTestToken;

/** Clears cached dev token from memory and localStorage. Call on logout in dev mode. */
export const clearDevToken = provider.clearDevToken;
