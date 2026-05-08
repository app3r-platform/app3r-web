// TODO: REMOVE BEFORE PROD — dev auth bypass (TD-04)
// Phase C-1.1.5 Step 2 — test JWT for local backend development only

import { saveToken, removeToken } from "./auth";

let cachedToken: string | null = null;

/**
 * Fetches a test JWT from backend dev endpoint and caches it.
 * Also persists to localStorage so isAuthenticated() works in dev mode.
 * Guard: throws if NODE_ENV !== 'development'.
 */
export async function getDevTestToken(): Promise<string> {
  // TODO: REMOVE BEFORE PROD — guard: dev only
  if (process.env.NODE_ENV !== "development") {
    throw new Error("Dev auth bypass disabled in non-dev environment");
  }

  if (cachedToken) return cachedToken;

  const response = await fetch("/api/v1/_dev/get-test-token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: 1,
      role: "admin",
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to get test token: ${response.status}`);
  }

  const data = await response.json();
  cachedToken = data.token as string;

  // TODO: REMOVE BEFORE PROD — persist to localStorage so isAuthenticated() works
  saveToken(cachedToken);

  return cachedToken;
}

/**
 * Clears cached dev token from memory and localStorage.
 * Call on logout in dev mode.
 */
export function clearDevToken(): void {
  // TODO: REMOVE BEFORE PROD
  cachedToken = null;
  removeToken();
}
