import { apiFetch } from "@/lib/api-client";

// WeeeR wallet API — real Gold (cash) balance. Parity with WeeeU.
// GET /api/v1/wallet/gold-balance → { balance } (self-only · JWT Bearer via apiFetch)
export const walletApi = {
  goldBalance: () =>
    apiFetch("/api/v1/wallet/gold-balance").then(async (r) => {
      if (!r.ok) throw new Error("balance-fetch-failed");
      return (await r.json()) as { balance: number };
    }),
};
