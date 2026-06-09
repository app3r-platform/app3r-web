// ── WeeeR Auth Shell — Wave1 ───────────────────────────────────────────────────
// login / OTP verify / logout / wallet balance (read-only)
// API endpoints follow d2 contract (apps/backend/docs/wave0/d2-openapi.yaml)
// Mock-fixture fallback: ใช้เมื่อ Backend Wave0 ยังไม่ deploy
// TODO: REMOVE mock fallbacks BEFORE PROD

import { apiGet, apiPost } from "./api-client";
import { MOCK_WEEER_PROFILE } from "./mock-data/weeer-profile";

// ── Response types (d2 contract shapes) ──────────────────────────────────────

export interface LoginResponse {
  access_token: string;
  expires_in: number;
  shop_id: number;
  shop_name: string;
  email: string;
}

export interface OtpVerifyResponse {
  verified: boolean;
  access_token?: string;
}

export interface WalletBalance {
  gold: number;
  silver: number;
}

// ── Mock fallbacks (Wave1 — TODO: remove when Wave0 backend lands) ────────────

const MOCK_WALLET: WalletBalance = { gold: 2055, silver: 350 };

// ── LocalStorage keys ─────────────────────────────────────────────────────────

const TOKEN_KEY = "access_token";
const PROFILE_KEY = "weeer_profile";

// ── Token / profile helpers ───────────────────────────────────────────────────

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

function storeAuth(token: string, shopName: string, email: string): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(PROFILE_KEY, JSON.stringify({ shopName, email }));
}

// ── Auth actions ──────────────────────────────────────────────────────────────

/**
 * loginWithCredentials — POST /api/v1/auth/login
 * On success: stores JWT + profile to localStorage
 * Mock fallback (dev only): ใช้เมื่อ API ยังไม่ deploy
 */
export async function loginWithCredentials(
  email: string,
  password: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const result = await apiPost<LoginResponse>("/api/v1/auth/login", {
    email,
    password,
  });

  if (result.ok) {
    storeAuth(
      result.data.access_token,
      result.data.shop_name,
      result.data.email,
    );
    return { ok: true };
  }

  // TODO: REMOVE before prod — mock fallback เมื่อ API ยังไม่ deploy
  if (
    process.env.NODE_ENV === "development" &&
    (result.error.startsWith("HTTP 404") ||
      result.error.startsWith("HTTP 50") ||
      result.error.startsWith("Network"))
  ) {
    storeAuth(
      "mock-token-wave1",
      MOCK_WEEER_PROFILE.shopName,
      MOCK_WEEER_PROFILE.email,
    );
    return { ok: true };
  }

  return { ok: false, error: result.error };
}

/**
 * verifyOtpCode — POST /api/v1/auth/verify-otp
 * Mock fallback (dev only): pass เสมอเมื่อ API unavailable
 */
export async function verifyOtpCode(
  code: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const result = await apiPost<OtpVerifyResponse>("/api/v1/auth/verify-otp", {
    code,
  });

  if (result.ok) {
    if (!result.data.verified) {
      return { ok: false, error: "OTP ไม่ถูกต้องหรือหมดอายุ — กรุณาลองใหม่" };
    }
    // If backend returns final token at OTP step
    if (result.data.access_token && typeof window !== "undefined") {
      localStorage.setItem(TOKEN_KEY, result.data.access_token);
    }
    return { ok: true };
  }

  // TODO: REMOVE before prod — mock fallback
  if (
    process.env.NODE_ENV === "development" &&
    (result.error.startsWith("HTTP 404") ||
      result.error.startsWith("HTTP 50") ||
      result.error.startsWith("Network"))
  ) {
    return { ok: true };
  }

  return { ok: false, error: result.error };
}

/**
 * logout — clears all auth state from localStorage
 */
export function logout(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(PROFILE_KEY);
}

/**
 * getShellProfile — reads stored shop profile from localStorage
 * Falls back to MOCK_WEEER_PROFILE in dev
 */
export function getShellProfile(): { shopName: string; email: string } {
  if (typeof window !== "undefined") {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) {
      try {
        return JSON.parse(raw) as { shopName: string; email: string };
      } catch {
        // ignore malformed JSON
      }
    }
  }
  return {
    shopName: MOCK_WEEER_PROFILE.shopName,
    email: MOCK_WEEER_PROFILE.email,
  };
}

/**
 * fetchShellWallet — GET /api/v1/weeer/wallet
 * Read-only balance for header display
 * Falls back to MOCK_WALLET when API unavailable
 */
export async function fetchShellWallet(): Promise<WalletBalance> {
  const result = await apiGet<WalletBalance>("/api/v1/weeer/wallet");
  if (result.ok) return result.data;
  // TODO: REMOVE before prod — mock fallback
  return MOCK_WALLET;
}
