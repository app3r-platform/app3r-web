// ============================================================
// lib/config/urls.ts — Cross-app URL registry (single source of truth)
// Round 2 WP-0.1: kill hardcoded `http://localhost:300x` across the Website.
//
// Every cross-app link (WeeeU / WeeeR / WeeeT) MUST resolve through here so
// the real domain is injected from env at build time and never baked into a
// component. NEXT_PUBLIC_* vars are inlined by Next.js → safe in both Server
// and Client Components.
//
// ⚠️ MOCKUP: localhost fallback only. Never commit a real domain literal.
// Canonical auth paths verified against origin/main bf8031c:
//   - WeeeU signup  = /signup/email   (NO /register → was the 404 source)
//   - WeeeU login   = /login
//   - WeeeR register = /register      (exists)
//   - WeeeR login    = /login
//   - WeeeR resell marketplace = /resell  (real page; /buy-offers/new does NOT
//     exist yet → deep-link navigate-only points here until BE builds it)
// ============================================================

const WEEEU_BASE = process.env.NEXT_PUBLIC_WEEEU_URL ?? "http://localhost:3002";
const WEEER_BASE = process.env.NEXT_PUBLIC_WEEER_URL ?? "http://localhost:3001";
const WEEET_BASE = process.env.NEXT_PUBLIC_WEEET_URL ?? "http://localhost:3003";

export const crossAppUrls = {
  weeeu: {
    base: WEEEU_BASE,
    /** สมัครสมาชิก WeeeU (ผู้ใช้ทั่วไป) — canonical /signup/email */
    signup: `${WEEEU_BASE}/signup/email`,
    /** เข้าสู่ระบบ WeeeU */
    login: `${WEEEU_BASE}/login`,
    /** หน้าซื้อ/ดูประกาศมือสองฝั่ง WeeeU */
    listings: `${WEEEU_BASE}/listings`,
    /** หน้าจัดการประกาศของเจ้าของ (owner) */
    job: (id: string) => `${WEEEU_BASE}/jobs/${id}`,
  },
  weeer: {
    base: WEEER_BASE,
    /** สมัครร้าน WeeeR ผ่านแอป WeeeR โดยตรง */
    register: `${WEEER_BASE}/register`,
    /** เข้าสู่ระบบ WeeeR */
    login: `${WEEER_BASE}/login`,
    /** หน้าตลาดมือสองฝั่ง WeeeR (ยื่นข้อเสนอซื้อ) — navigate-only mockup */
    resell: `${WEEER_BASE}/resell`,
  },
  weeet: {
    base: WEEET_BASE,
    /** เข้าสู่ระบบ WeeeT (แอปช่าง) */
    login: `${WEEET_BASE}/login`,
  },
} as const;

export type CrossAppUrls = typeof crossAppUrls;
