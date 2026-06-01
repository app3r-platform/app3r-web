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

/**
 * W-3-E-1 fix: CMS backend URL (Hono on :8787 ตั้งแต่ W-3-A)
 * Override ได้ผ่าน env var เมื่อ deploy (เช่น Docker → http://host.docker.internal:8787)
 * Default :8787 = Hono CMS API (ไม่ใช่ Python backend :8000)
 */
const CMS_BACKEND_URL = process.env.CMS_BACKEND_URL ?? 'http://localhost:8787';

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
    // W-3-E-1 fix: เรียก Hono CMS API ตรง (:8787) ไม่ใช่ Python backend (:8000)
    const res = await fetch(`${CMS_BACKEND_URL}${path}`, {
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

// Q9 (Two-eyes C3): getPreviewPage() removed — preview/[token] render mock listing
// แบบ read-only แล้ว (จังหวะ 2 ค่อยทำ CMS content-preview ผ่าน token จริง)

/** ตรวจสอบว่า preview token ยัง valid หรือหมดอายุแล้ว */
export function isPreviewTokenExpired(expiresAt: string): boolean {
  return new Date(expiresAt).getTime() < Date.now();
}

// ============================================================
// W-3-C — Public Read Extensions (Sub-C.1)
// Legal pages / Contact / Social Links — มี fallback เป็น static stub
// Note: Backend Hono (W-3-A) → port 8787; แต่ Docker container ใช้
//       BACKEND_URL ผ่าน Next.js rewrites → fallback ทำงานเสมอเมื่อ unreachable
// ============================================================

import { staticPages } from './content/static-pages';
import { contactInfo } from './content/contact-info';
import { footerContent } from './content/footer';
import type { StaticPage } from './content/types';
import type { ContactInfo } from './types/contact';

// ── Sub-C.1.a — Legal pages ─────────────────────────────────
export type LegalSlug = 'terms' | 'privacy' | 'cookies' | 'refund';

// map: CMD slug "refund" ↔ static stub key "refund-policy"
const STATIC_SLUG_MAP: Record<LegalSlug, string> = {
  terms: 'terms',
  privacy: 'privacy',
  cookies: 'cookies',
  refund: 'refund-policy',
};

export interface LegalPageData {
  slug: LegalSlug;
  title: string;
  body: string;          // markdown
  lastModified?: string;
  effectiveDate?: string;
  source: 'cms' | 'static';
}

/**
 * ดึง legal page จาก CMS — fallback → static stub (lib/content/static-pages.ts)
 * Backend response: { id, slug, type:'legal', title, body:{markdown?:string}, ... }
 */
export async function getLegalPage(slug: LegalSlug): Promise<LegalPageData | null> {
  // 1. Try CMS
  const page = await fetchContentPage('legal', slug);
  if (page && page.title) {
    const body = page.body as { markdown?: string } | undefined;
    const markdown = body?.markdown;
    if (typeof markdown === 'string' && markdown.length > 0) {
      return {
        slug,
        title: page.title,
        body: markdown,
        lastModified: page.updatedAt?.slice(0, 10),
        effectiveDate: page.publishedAt?.slice(0, 10),
        source: 'cms',
      };
    }
  }
  // 2. Fallback → static stub
  const staticKey = STATIC_SLUG_MAP[slug];
  const stub = staticPages[staticKey];
  if (!stub) return null;
  return {
    slug,
    title: stub.title,
    body: stub.body,
    lastModified: stub.lastModified,
    effectiveDate: stub.effectiveDate,
    source: 'static',
  };
}

// ── Sub-C.1.b — Contact page ────────────────────────────────
export interface ContactPageData {
  title: string;
  info: ContactInfo;
  source: 'cms' | 'static';
}

/**
 * ดึง contact page จาก CMS — fallback → static stub (lib/content/contact-info.ts)
 * Backend response: { title, body: { phone?, email?, address?, lineId?, openingHours?, categories? }, ... }
 */
export async function getContactPage(): Promise<ContactPageData> {
  const page = await fetchContentPage('contact', 'main');
  if (page && page.body && typeof page.body === 'object') {
    const b = page.body as Partial<ContactInfo> & {
      phone?: string;
      email?: string;
      address?: string;
      lineId?: string;
      openingHours?: string;
    };
    // merge: ใช้ CMS data ก่อน, fallback field ที่ไม่มีกับ static
    const merged: ContactInfo = {
      companyName: contactInfo.companyName,
      address: b.address ?? contactInfo.address,
      phones: b.phone ? [b.phone] : contactInfo.phones,
      emails: contactInfo.emails, // emails array — CMS ไม่ได้ extend ใน W-3-C
      businessHours: b.openingHours ?? contactInfo.businessHours,
      lineId: b.lineId ?? contactInfo.lineId,
    };
    // ถ้า CMS มี field อะไรซักอย่างที่ไม่ใช่ defaults → ถือว่าใช้ CMS
    const hasCmsContent = !!(b.phone || b.email || b.address || b.lineId || b.openingHours);
    return {
      title: page.title || 'ติดต่อเรา',
      info: merged,
      source: hasCmsContent ? 'cms' : 'static',
    };
  }
  // Fallback → static
  return {
    title: 'ติดต่อเรา',
    info: contactInfo,
    source: 'static',
  };
}

// ── Sub-C.1.c — Social Links ────────────────────────────────
export interface SocialLink {
  platform: 'facebook' | 'line' | 'instagram' | string;
  url: string;
  label: string;
}

/**
 * ดึง social links จาก CMS — fallback → static (lib/content/footer.ts)
 * Backend response: { body: { facebook, line, instagram } }
 * ⚠️ ซ่อน link ที่ url ว่าง (per CMD)
 */
export async function getSocialLinks(): Promise<SocialLink[]> {
  const page = await fetchContentPage('social_links', 'footer');
  if (page && page.body && typeof page.body === 'object') {
    const b = page.body as Record<string, string>;
    const links: SocialLink[] = [];
    if (typeof b.facebook === 'string' && b.facebook.trim()) {
      links.push({ platform: 'facebook', url: b.facebook, label: 'Facebook' });
    }
    if (typeof b.line === 'string' && b.line.trim()) {
      links.push({ platform: 'line', url: b.line, label: 'LINE Official' });
    }
    if (typeof b.instagram === 'string' && b.instagram.trim()) {
      links.push({ platform: 'instagram', url: b.instagram, label: 'Instagram' });
    }
    if (links.length > 0) return links;
  }
  // Fallback → static (kill empty url entries)
  return footerContent.socialLinks
    .filter((s) => s.url && s.url.trim().length > 0)
    .map((s) => ({ platform: s.platform, url: s.url, label: s.label }));
}

// Re-export type alias for caller
export type { StaticPage };
