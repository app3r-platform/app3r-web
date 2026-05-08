// TODO: REMOVE BEFORE PROD — dev auth bypass
// ใช้สำหรับ development เท่านั้น — ขอ test JWT จาก backend _dev endpoint

const _API_BASE = "/api/v1"; // local copy — ไม่ import จาก api.ts เพื่อหลีกเลี่ยง circular dep

let cachedToken: string | null = null;

export async function getDevTestToken(): Promise<string> {
  // Guard: เฉพาะ development mode เท่านั้น
  if (process.env.NODE_ENV !== "development") {
    throw new Error("Dev auth bypass disabled in non-dev environment");
  }

  if (cachedToken) return cachedToken;

  const response = await fetch(`${_API_BASE}/_dev/get-test-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: 1,
      role: "weeet",
      phone: "+66812345678",
      shop_id: 10,
      weeer_id: 10,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to get test token: ${response.status}`);
  }

  const data = await response.json();
  cachedToken = data.token;
  return cachedToken!;
}

export function clearDevToken() {
  cachedToken = null;
}
