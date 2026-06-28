import type { NextConfig } from "next";

// fail-loud: production build ห้ามต่อ localhost silently
if (process.env.NODE_ENV === "production" && !process.env.BACKEND_URL) {
  throw new Error(
    "[weeeu] BACKEND_URL is required in production — set via environment variable"
  );
}

const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${backendUrl}/api/:path*` }];
  },
};

export default nextConfig;
