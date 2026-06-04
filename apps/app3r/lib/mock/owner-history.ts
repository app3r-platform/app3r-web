// ============================================================
// lib/mock/owner-history.ts — Round 2 W-08 / W-23
// รวมประวัติผู้ประกาศ (owner) จาก mock listings ทั้ง resell + scrap แบบ read-only.
// ใช้กับหน้า /owners/[id] (ประวัติผู้ประกาศ / ความน่าเชื่อถือ · เลนส์ #9).
// MOCKUP-ONLY — ไม่มี persist/BE.
// ============================================================
import { mockResellListings } from "./resell";
import { mockScrapListings } from "./scrap";
import type { SellerInfo } from "../types";

export interface OwnerListingSummary {
  id: string;
  type: "resell" | "scrap";
  title: string;
  priceLabel: string;
  href: string;
  image: string;
  postedAt: string;
}

export interface OwnerProfile {
  seller: SellerInfo;
  listings: OwnerListingSummary[];
  /** ปีที่เริ่มเป็นสมาชิก (จาก seller.joinedYear) */
  activeCount: number;
}

/**
 * รวมประกาศของ owner คนเดียวจากทั้ง resell + scrap (deduped by listing id).
 * คืน null ถ้าไม่พบ owner id ใด ๆ → หน้าจะ notFound() (D14 global 404).
 */
export function getOwnerProfile(ownerId: string): OwnerProfile | null {
  const resell: OwnerListingSummary[] = mockResellListings
    .filter((l) => l.seller.id === ownerId)
    .map((l) => ({
      id: l.id,
      type: "resell",
      title: l.title,
      priceLabel: l.priceLabel,
      href: `/listings/resell/${l.id}`,
      image: l.images[0],
      postedAt: l.postedAt,
    }));

  const scrap: OwnerListingSummary[] = mockScrapListings
    .filter((l) => l.seller.id === ownerId)
    .map((l) => ({
      id: l.id,
      type: "scrap",
      title: l.title,
      priceLabel: l.estimatedValueLabel,
      href: `/listings/scrap/${l.id}`,
      image: l.images[0],
      postedAt: l.postedAt,
    }));

  const listings = [...resell, ...scrap];

  // seller info — หยิบจากประกาศแรกที่เจอ
  const seller =
    mockResellListings.find((l) => l.seller.id === ownerId)?.seller ??
    mockScrapListings.find((l) => l.seller.id === ownerId)?.seller ??
    null;

  if (!seller) return null;

  return { seller, listings, activeCount: listings.length };
}
