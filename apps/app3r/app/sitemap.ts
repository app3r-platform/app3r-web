import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://app3r.com";

  const staticRoutes = [
    { url: "/", priority: 1.0, changeFrequency: "daily" as const },
    { url: "/listings", priority: 0.8, changeFrequency: "daily" as const },
    { url: "/listings/resell", priority: 0.9, changeFrequency: "hourly" as const },
    { url: "/listings/scrap", priority: 0.8, changeFrequency: "hourly" as const },
    { url: "/listings/repair", priority: 0.9, changeFrequency: "hourly" as const },
    { url: "/listings/maintain", priority: 0.9, changeFrequency: "hourly" as const },
    { url: "/articles", priority: 0.8, changeFrequency: "daily" as const },
    { url: "/products", priority: 0.7, changeFrequency: "weekly" as const },
    { url: "/register/weeer", priority: 0.8, changeFrequency: "monthly" as const },
    { url: "/contact", priority: 0.6, changeFrequency: "monthly" as const },
    { url: "/download", priority: 0.7, changeFrequency: "monthly" as const },
  ];

  return staticRoutes.map((route) => ({
    url: `${baseUrl}${route.url}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
