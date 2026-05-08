// TODO: REMOVE BEFORE PROD — dev auth bypass

let cachedToken: string | null = null;

export async function getDevTestToken(): Promise<string> {
  // Guard: เฉพาะ development mode เท่านั้น
  if (process.env.NODE_ENV !== "development") {
    throw new Error("Dev auth bypass disabled in non-dev environment");
  }

  if (cachedToken) return cachedToken;

  const response = await fetch("/api/v1/_dev/get-test-token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: 1,
      role: "weeeu",
      phone: "+66812345678",
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
