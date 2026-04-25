import { getToken } from "./auth";

const BASE = "/api/v1";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "เกิดข้อผิดพลาด" }));
    throw new Error(err.detail ?? "เกิดข้อผิดพลาด");
  }
  return res.json() as Promise<T>;
}

export const api = {
  get:   <T>(path: string)                  => request<T>(path),
  post:  <T>(path: string, body: unknown)   => request<T>(path, { method: "POST",  body: JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown)  => request<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
  put:   <T>(path: string, body: unknown)   => request<T>(path, { method: "PUT",   body: JSON.stringify(body) }),
};
