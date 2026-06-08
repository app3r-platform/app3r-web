const TOKEN_KEY = "app3r_admin_token";
// TODO: REMOVE BEFORE PROD — dev bypass token key (RC-2 · TD-05)
const DEV_BYPASS_KEY = "dev-admin-token";
const DEV_BYPASS_VALUE = "dev-jwt-bypass";

export function saveToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  // TODO: REMOVE BEFORE PROD — dev bypass: NEXT_PUBLIC_DEV_NAV=true seeds this key
  if (
    process.env.NEXT_PUBLIC_DEV_NAV === "true" &&
    localStorage.getItem(DEV_BYPASS_KEY) === DEV_BYPASS_VALUE
  )
    return true;
  return !!getToken();
}

export function isSuperAdmin(): boolean {
  if (typeof window === "undefined") return false;
  // TODO: REMOVE BEFORE PROD — dev bypass → treat as super_admin
  if (
    process.env.NEXT_PUBLIC_DEV_NAV === "true" &&
    localStorage.getItem(DEV_BYPASS_KEY) === DEV_BYPASS_VALUE
  )
    return true;
  const token = getToken();
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.role === "super_admin";
  } catch {
    return false;
  }
}
