import type { MetadataRoute } from 'next';
import { repairJobs } from '../lib/mock/repair-jobs';
import { maintainJobs } from '../lib/mock/maintain-jobs';
import { staticPages } from '../lib/content/static-pages';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://app3r.com';

  const staticRoutes = [
    { url: '/',                   priority: 1.0, changeFrequency: 'daily' as const },
    { url: '/listings',           priority: 0.8, changeFrequency: 'daily' as const },
    { url: '/listings/resell',    priority: 0.9, changeFrequency: 'hourly' as const },
    { url: '/listings/scrap',     priority: 0.8, changeFrequency: 'hourly' as const },
    { url: '/listings/repair',    priority: 0.9, changeFrequency: 'hourly' as const },
    { url: '/listings/maintain',  priority: 0.9, changeFrequency: 'hourly' as const },
    { url: '/articles',           priority: 0.8, changeFrequency: 'daily' as const },
    { url: '/products',           priority: 0.7, changeFrequency: 'weekly' as const },
    { url: '/register/weeer',     priority: 0.8, changeFrequency: 'monthly' as const },
    { url: '/contact',            priority: 0.6, changeFrequency: 'monthly' as const },
    { url: '/download',           priority: 0.7, changeFrequency: 'monthly' as const },
    { url: '/about',              priority: 0.7, changeFrequency: 'monthly' as const },
    { url: '/faq',                priority: 0.7, changeFrequency: 'monthly' as const },
  ];

  const legalRoutes = Object.keys(staticPages).map((slug) => ({
    url: `/legal/${slug}`,
    priority: 0.4,
    changeFrequency: 'yearly' as const,
  }));

  const repairRoutes = repairJobs.map((j) => ({
    url: `/listings/repair/${j.id}`,
    priority: 0.7,
    changeFrequency: 'daily' as const,
  }));

  const maintainRoutes = maintainJobs.map((j) => ({
    url: `/listings/maintain/${j.id}`,
    priority: 0.7,
    changeFrequency: 'daily' as const,
  }));

  return [...staticRoutes, ...legalRoutes, ...repairRoutes, ...maintainRoutes].map((route) => ({
    url: `${baseUrl}${route.url}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
