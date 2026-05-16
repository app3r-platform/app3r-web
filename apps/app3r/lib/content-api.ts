// ============================================================
// lib/content-api.ts — API client สำหรับ Dynamic Content (CMS)
// Phase D-4 Sub-3 — ISR revalidate:60 + fallback to static content
// ============================================================
import { heroContent } from './content/hero';
import { aboutContent } from './content/about';
import { faqItems } from './content/faq';
import type { HeroContent, AboutContent, FAQItem } from './content/types';
import type { ContentPageDetailDto, ContentPreviewTokenDto } from './types/content.types';

/** revalidate (วินาที) สำหรับ ISR (Incremental Static Regeneration) */
const REVALIDATE = 60;

// ============================================================
// Internal fetch helpers
// ============================================================

/**
 * ดึง ContentPageDetailDto จาก API
 * คืน null เมื่อ API ไม่ตอบสนองหรือ status != 2xx
 */
async function fetchContentPage(
  type: string,
  slug?: string,
): Promise<ContentPageDetailDto | null> {
  try {
    const path = slug
      ? `/api/content/${type}/${slug}`
      : `/api/content/${type}`;
    // ใช้ relative URL → Next.js rewrite proxy จัดการส่งต่อไป backend (localhost:8000)
    const res = await fetch(`http://localhost:8000${path}`, {
      next: { revalidate: REVALIDATE },
    });
    if (!res.ok) return null;
    // คาดว่า API คืน array สำหรับ /type หรือ single object สำหรับ /type/slug
    const data: unknown = await res.json();
    if (Array.isArray(data)) {
      // เลือกรายการแรกที่ published
      const published = (data as ContentPageDetailDto[]).find(
        (p) => p.status === 'published',
      );
      return published ?? null;
    }
    return data as ContentPageDetailDto;
  } catch {
    return null;
  }
}

// ============================================================
// Hero content (type='hero')
// ============================================================

/**
 * ดึง HeroContent จาก CMS — fallback → heroContent (static)
 * API body คาดหวัง: { headline, subheadline, ctaPrimary, ctaSecondary, updatedAt }
 */
export async function getHeroContent(): Promise<HeroContent> {
  const page = await fetchContentPage('hero');
  if (page?.body) {
    const b = page.body as Partial<HeroContent>;
    if (
      typeof b.headline === 'string' &&
      typeof b.subheadline === 'string' &&
      b.ctaPrimary &&
      b.ctaSecondary
    ) {
      return {
        headline: b.headline,
        subheadline: b.subheadline,
        ctaPrimary: b.ctaPrimary,
        ctaSecondary: b.ctaSecondary,
        updatedAt: typeof b.updatedAt === 'string' ? b.updatedAt : page.updatedAt,
      };
    }
  }
  // fallback → static
  return heroContent;
}

// ============================================================
// About content (type='about')
// ============================================================

/**
 * ดึง AboutContent จาก CMS — fallback → aboutContent (static)
 * API body คาดหวัง: { title, subtitle, sections: [...], updatedAt }
 */
export async function getAboutContent(): Promise<AboutContent> {
  const page = await fetchContentPage('about');
  if (page?.body) {
    const b = page.body as Partial<AboutContent>;
    if (
      typeof b.title === 'string' &&
      typeof b.subtitle === 'string' &&
      Array.isArray(b.sections)
    ) {
      return {
        title: b.title,
        subtitle: b.subtitle,
        sections: b.sections,
        updatedAt: typeof b.updatedAt === 'string' ? b.updatedAt : page.updatedAt,
      };
    }
  }
  // fallback → static
  return aboutContent;
}

// ============================================================
// FAQ items (type='faq')
// ============================================================

/**
 * ดึง FAQItem[] จาก CMS — fallback → faqItems (static)
 * API body คาดหวัง: { items: FAQItem[] }
 */
export async function getFaqItems(): Promise<FAQItem[]> {
  const page = await fetchContentPage('faq');
  if (page?.body) {
    const b = page.body as { items?: FAQItem[] };
    if (Array.isArray(b.items) && b.items.length > 0) {
      return b.items;
    }
  }
  // fallback → static
  return faqItems;
}

// ============================================================
// CMS static pages (type='static', slug=any)
// ============================================================

/**
 * ดึง CMS page โดย slug — คืน null ถ้าไม่พบหรือ API ล้มเหลว
 * ใช้สำหรับ app/[slug]/page.tsx
 */
export async function getCmsPage(slug: string): Promise<ContentPageDetailDto | null> {
  return fetchContentPage('static', slug);
}

// ============================================================
// Preview token (GET /api/content/preview/:token)
// ============================================================

/**
 * ดึง ContentPageDetailDto ผ่าน preview token — ไม่ cache (revalidate:0)
 * ใช้สำหรับ app/preview/[token]/page.tsx
 */
export async function getPreviewPage(
  token: string,
): Promise<ContentPageDetailDto | null> {
  try {
    const res = await fetch(
      `http://localhost:8000/api/content/preview/${token}`,
      { cache: 'no-store' }, // ห้าม cache — preview ต้องสดทุกครั้ง
    );
    if (!res.ok) return null;
    // API คืน { token, contentPageId, expiresAt } พร้อม page embedded
    // หรือ redirect → ContentPageDetailDto โดยตรง — รองรับทั้งสองรูปแบบ
    const data: unknown = await res.json();
    if (data && typeof data === 'object') {
      // ถ้า API คืน { page: ContentPageDetailDto }
      if ('page' in data) {
        return (data as { page: ContentPageDetailDto }).page;
      }
      // ถ้า API คืน ContentPageDetailDto โดยตรง (มี slug + type)
      if ('slug' in data && 'type' in data) {
        return data as ContentPageDetailDto;
      }
    }
    return null;
  } catch {
    return null;
  }
}

/** ตรวจสอบว่า preview token ยัง valid หรือหมดอายุแล้ว */
export function isPreviewTokenExpired(expiresAt: string): boolean {
  return new Date(expiresAt).getTime() < Date.now();
}
