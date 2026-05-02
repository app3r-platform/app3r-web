import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/listings/",
          "/articles/",
          "/products/",
          "/contact",
          "/download",
          "/register/weeer",
        ],
        disallow: [
          "/api/",
          "/_next/",
          "/admin",
        ],
      },
    ],
    sitemap: "https://app3r.com/sitemap.xml",
    host: "https://app3r.com",
  };
}
