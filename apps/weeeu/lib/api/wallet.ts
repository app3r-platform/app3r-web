import { apiFetch } from "@/lib/api-client";

export const walletApi = {
  goldBalance: () =>
    apiFetch("/api/v1/wallet/gold-balance").then(async r => {
      if (!r.ok) throw new Error("balance-fetch-failed");
      return r.json() as Promise<{ balance: number }>;
    }),
};
