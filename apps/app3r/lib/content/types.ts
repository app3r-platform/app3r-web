export interface HeroContent {
  headline: string;
  subheadline: string;
  ctaPrimary: { label: string; href: string };
  ctaSecondary: { label: string; href: string };
  updatedAt: string;
}

export interface AboutSection { heading: string; body: string; }
export interface AboutContent {
  title: string;
  subtitle: string;
  sections: AboutSection[];
  updatedAt: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'general' | 'weeeu' | 'weeer' | 'weeet' | 'payment' | 'service';
  order: number;
}

export interface StaticPage {
  slug: 'terms' | 'privacy' | 'cookies' | 'refund-policy';
  title: string;
  body: string;
  lastModified: string;
  effectiveDate: string;
}

export interface FooterContent {
  tagline: string;
  copyrightTemplate: string;
  socialLinks: Array<{ platform: string; url: string; label: string }>;
  legalLinks: Array<{ label: string; href: string }>;
}
